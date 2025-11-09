const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');

/**
 * Payments Routes - MongoDB Implementation
 * IDEMPOTENT & SECURE payment processing
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payments API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create payment intent (IDEMPOTENT)
 * @access  Private
 */
router.post('/create-intent', verifyJWT, validationRules.walletTopUp(), handleValidationErrors, async (req, res) => {
  try {
    const { amount, currency = 'USD', paymentMethod, orderId, idempotencyKey } = req.body;
    const userId = req.user.id;

    // Check idempotency - prevent duplicate charges
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey });
      if (existingPayment) {
        return res.json({
          success: true,
          data: {
            payment: existingPayment,
            alreadyProcessed: true
          },
          message: 'Payment already processed'
        });
      }
    }

    // Create payment record
    const payment = new Payment({
      userId,
      orderId,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      idempotencyKey: idempotencyKey || `idemp_${Date.now()}_${userId}_${crypto.randomBytes(8).toString('hex')}`,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await payment.save();

    // TODO: Create actual payment intent with Stripe/PayPal
    // For now, return mock intent
    const paymentIntent = {
      id: payment._id,
      clientSecret: `pi_${crypto.randomBytes(16).toString('hex')}`,
      amount,
      currency,
      status: 'requires_payment_method'
    };

    res.json({
      success: true,
      data: {
        payment,
        intent: paymentIntent
      },
      message: 'Payment intent created'
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/payments/webhooks/stripe
 * @desc    Handle Stripe webhook (VERIFY SIGNATURE)
 * @access  Public (but verified)
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    // Verify webhook signature (CRITICAL FOR SECURITY)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Helper: Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOne({ 
      'metadata.stripePaymentIntentId': paymentIntent.id 
    }).session(session);

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id);
      await session.abortTransaction();
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.metadata.stripePaymentIntent = paymentIntent;
    await payment.save({ session });

    // Update order if exists
    if (payment.orderId) {
      await Order.findByIdAndUpdate(
        payment.orderId,
        {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date()
        },
        { session }
      );
    }

    // Update wallet if it's a top-up
    if (payment.type === 'wallet_topup') {
      await Wallet.findOneAndUpdate(
        { userId: payment.userId },
        {
          $inc: { balance: payment.amount }
        },
        { session, upsert: true }
      );
    }

    await session.commitTransaction();
    console.log('✅ Payment processed successfully:', payment._id);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error handling payment success:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

// Helper: Handle payment failure
async function handlePaymentFailure(paymentIntent) {
  try {
    await Payment.findOneAndUpdate(
      { 'metadata.stripePaymentIntentId': paymentIntent.id },
      {
        status: 'failed',
        failedAt: new Date(),
        'metadata.failureReason': paymentIntent.last_payment_error?.message
      }
    );

    console.log('❌ Payment failed:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Helper: Handle refund
async function handleRefund(charge) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOne({
      'metadata.stripeChargeId': charge.id
    }).session(session);

    if (!payment) {
      await session.abortTransaction();
      return;
    }

    // Update payment
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = charge.amount_refunded / 100; // Convert from cents
    await payment.save({ session });

    // Deduct from wallet if it was a top-up
    if (payment.type === 'wallet_topup') {
      await Wallet.findOneAndUpdate(
        { userId: payment.userId },
        {
          $inc: { balance: -payment.refundAmount }
        },
        { session }
      );
    }

    await session.commitTransaction();
    console.log('💰 Refund processed:', payment._id);

  } catch (error) {
    await session.abortTransaction();
    console.error('Error handling refund:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 * @access  Private (owner or admin)
 */
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check ownership or admin
    if (!payment.userId.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
});

/**
 * @route   GET /api/payments
 * @desc    Get user payments
 * @access  Private
 */
router.get('/', verifyJWT, validationRules.pagination(), handleValidationErrors, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
const { requireAdmin: requireAdminMiddleware } = require('../middleware/jwtAuth');

/**
 * @route   GET /api/payments/admin/all
 * @desc    Get all payments (Admin)
 * @access  Admin
 */
router.get('/admin/all', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      status 
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { paymentMethod: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('userId', 'username email avatar')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        transactions: payments, // Alias for backward compatibility
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

/**
 * @route   GET /api/payments/admin/analytics
 * @desc    Get payment analytics (Admin)
 * @access  Admin
 */
router.get('/admin/analytics', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      todayPayments,
      revenueData
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const totalRevenue = revenueData.find(r => r._id === 'completed')?.total || 0;
    const todayRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const successRate = totalPayments > 0 
      ? ((completedPayments / totalPayments) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalTransactions: totalPayments,
        completedTransactions: completedPayments,
        pendingTransactions: pendingPayments,
        failedTransactions: failedPayments,
        successRate: parseFloat(successRate)
      }
    });

  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment analytics'
    });
  }
});

/**
 * @route   GET /api/payments/admin/:id
 * @desc    Get payment details (Admin)
 * @access  Admin
 */
router.get('/admin/:id', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'username email avatar phone')
      .populate('orderId', 'orderNumber items total');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details'
    });
  }
});

module.exports = router;

