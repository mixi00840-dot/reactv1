const { Wallet, WalletTransaction } = require('../models/Wallet');
const { Transaction } = require('../models/Transaction');
const User = require('../models/User');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class PaymentController {
  // Process payment for an order
  async processPayment(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        orderId,
        paymentMethod,
        amount,
        currency = 'USD',
        paymentDetails = {},
        saveCard = false
      } = req.body;

      // Validate order
      const order = await Order.findById(orderId)
        .populate('customer')
        .session(session);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Verify customer permission
      if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate payment amount
      if (Math.abs(amount - order.totals.finalTotal) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount does not match order total'
        });
      }

      // Check if order is already paid
      if (order.payment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid'
        });
      }

      let paymentResult;

      // Process payment based on method
      switch (paymentMethod) {
        case 'wallet':
          paymentResult = await this.processWalletPayment(order, amount, session);
          break;
        case 'credit_card':
          paymentResult = await this.processCreditCardPayment(order, amount, paymentDetails, session);
          break;
        case 'debit_card':
          paymentResult = await this.processDebitCardPayment(order, amount, paymentDetails, session);
          break;
        case 'bank_transfer':
          paymentResult = await this.processBankTransfer(order, amount, paymentDetails, session);
          break;
        case 'paypal':
          paymentResult = await this.processPayPalPayment(order, amount, paymentDetails, session);
          break;
        case 'apple_pay':
          paymentResult = await this.processApplePayPayment(order, amount, paymentDetails, session);
          break;
        case 'google_pay':
          paymentResult = await this.processGooglePayPayment(order, amount, paymentDetails, session);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // Update order payment information
      order.payment = {
        method: paymentMethod,
        status: 'completed',
        amount: amount,
        currency: currency,
        transactionId: paymentResult.transactionId,
        processedAt: new Date(),
        gatewayResponse: paymentResult.gatewayResponse || {},
        fees: paymentResult.fees || 0
      };

      // Update order status
      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        orderId: order._id,
        userId: order.customer._id,
        storeId: order.storeId,
        type: 'payment',
        amount: amount,
        currency: currency,
        status: 'completed',
        paymentMethod: paymentMethod,
        transactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
        fees: paymentResult.fees,
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber
        }
      });

      await transaction.save({ session });

      // Distribute funds to sellers and platform
      await this.distributeFunds(order, transaction, session);

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          transactionId: paymentResult.transactionId,
          order: order,
          payment: {
            method: paymentMethod,
            amount: amount,
            status: 'completed',
            processedAt: new Date()
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Payment processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Get wallet balance and information
  async getWallet(req, res) {
    try {
      const userId = req.user.role === 'admin' && req.query.userId 
        ? req.query.userId 
        : req.user._id;

      const wallet = await Wallet.findByUser(userId);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Get recent transactions
      const recentTransactions = await WalletTransaction.find({ walletId: wallet._id })
        .sort('-createdAt')
        .limit(10)
        .populate('relatedUserId', 'firstName lastName')
        .lean();

      // Calculate monthly stats
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyStats = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: currentMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          wallet,
          recentTransactions,
          monthlyStats
        }
      });

    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching wallet information',
        error: error.message
      });
    }
  }

  // Add funds to wallet
  async addFunds(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { amount, paymentMethod, paymentDetails = {} } = req.body;

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Get user's wallet
      const wallet = await Wallet.findByUser(req.user._id).session(session);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Process external payment for adding funds
      let paymentResult;
      
      switch (paymentMethod) {
        case 'credit_card':
        case 'debit_card':
          paymentResult = await this.processExternalPayment(amount, paymentMethod, paymentDetails);
          break;
        case 'bank_transfer':
          paymentResult = await this.processBankTransfer(null, amount, paymentDetails, session);
          break;
        default:
          throw new Error('Unsupported payment method for adding funds');
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // Add funds to wallet
      await wallet.credit(amount, 'Funds added via ' + paymentMethod, paymentResult.transactionId, session);

      // Create transaction record
      const transaction = new Transaction({
        userId: req.user._id,
        type: 'wallet_topup',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        paymentMethod: paymentMethod,
        transactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
        metadata: {
          walletTopup: true
        }
      });

      await transaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Funds added successfully',
        data: {
          wallet: await Wallet.findByUser(req.user._id),
          transaction: transaction
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error adding funds:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding funds to wallet',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Transfer funds between wallets
  async transferFunds(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { recipientId, amount, description = 'Wallet transfer' } = req.body;

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Transfer amount must be greater than 0'
        });
      }

      if (recipientId === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot transfer to yourself'
        });
      }

      // Get sender's wallet
      const senderWallet = await Wallet.findByUser(req.user._id).session(session);
      if (!senderWallet) {
        return res.status(404).json({
          success: false,
          message: 'Sender wallet not found'
        });
      }

      // Check available balance
      if (senderWallet.availableBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient funds'
        });
      }

      // Get recipient's wallet
      const recipientWallet = await Wallet.findByUser(recipientId).session(session);
      if (!recipientWallet) {
        return res.status(404).json({
          success: false,
          message: 'Recipient wallet not found'
        });
      }

      // Verify recipient exists
      const recipient = await User.findById(recipientId).session(session);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }

      // Generate transfer ID
      const transferId = `TXN-${Date.now()}`;

      // Debit sender's wallet
      await senderWallet.debit(amount, description, transferId, session);

      // Credit recipient's wallet
      await recipientWallet.credit(amount, description, transferId, session);

      // Create transaction records
      const senderTransaction = new Transaction({
        userId: req.user._id,
        type: 'wallet_transfer_out',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        transactionId: transferId,
        metadata: {
          recipientId: recipientId,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          description: description
        }
      });

      const recipientTransaction = new Transaction({
        userId: recipientId,
        type: 'wallet_transfer_in',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        transactionId: transferId,
        metadata: {
          senderId: req.user._id,
          senderName: `${req.user.firstName} ${req.user.lastName}`,
          description: description
        }
      });

      await senderTransaction.save({ session });
      await recipientTransaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Transfer completed successfully',
        data: {
          transferId: transferId,
          amount: amount,
          recipient: {
            id: recipient._id,
            name: `${recipient.firstName} ${recipient.lastName}`
          },
          senderWallet: await Wallet.findByUser(req.user._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Transfer error:', error);
      res.status(500).json({
        success: false,
        message: 'Transfer failed',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Withdraw funds from wallet
  async withdrawFunds(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { 
        amount, 
        withdrawalMethod, 
        bankDetails = {},
        description = 'Wallet withdrawal'
      } = req.body;

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal amount must be greater than 0'
        });
      }

      // Get user's wallet
      const wallet = await Wallet.findByUser(req.user._id).session(session);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Check available balance
      if (wallet.availableBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient funds for withdrawal'
        });
      }

      // Process withdrawal based on method
      let withdrawalResult;
      const withdrawalId = `WD-${Date.now()}`;

      switch (withdrawalMethod) {
        case 'bank_transfer':
          withdrawalResult = await this.processBankWithdrawal(amount, bankDetails, withdrawalId);
          break;
        case 'paypal':
          withdrawalResult = await this.processPayPalWithdrawal(amount, bankDetails, withdrawalId);
          break;
        default:
          throw new Error('Unsupported withdrawal method');
      }

      if (!withdrawalResult.success) {
        throw new Error(withdrawalResult.error || 'Withdrawal processing failed');
      }

      // Debit wallet
      await wallet.debit(amount, description, withdrawalId, session);

      // Create transaction record
      const transaction = new Transaction({
        userId: req.user._id,
        type: 'wallet_withdrawal',
        amount: amount,
        currency: 'USD',
        status: withdrawalResult.status || 'pending',
        transactionId: withdrawalId,
        metadata: {
          withdrawalMethod: withdrawalMethod,
          bankDetails: bankDetails,
          description: description
        }
      });

      await transaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          withdrawalId: withdrawalId,
          amount: amount,
          method: withdrawalMethod,
          status: withdrawalResult.status || 'pending',
          wallet: await Wallet.findByUser(req.user._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Withdrawal failed',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Get transaction history
  async getTransactionHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
        sort = '-createdAt'
      } = req.query;

      const userId = req.user.role === 'admin' && req.query.userId 
        ? req.query.userId 
        : req.user._id;

      // Build query
      let query = { userId: userId };

      if (type) {
        query.type = type;
      }

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get transactions
      const transactions = await Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('orderId', 'orderNumber status')
        .populate('storeId', 'name')
        .lean();

      // Get total count
      const total = await Transaction.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Calculate summary stats
      const summaryStats = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          },
          summary: summaryStats
        }
      });

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction history',
        error: error.message
      });
    }
  }

  // Get payment methods for a user
  async getPaymentMethods(req, res) {
    try {
      const userId = req.user._id;

      // This would typically fetch saved payment methods from a secure vault
      // For now, return a mock response
      const paymentMethods = [
        {
          id: 'pm_1',
          type: 'credit_card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];

      res.json({
        success: true,
        data: {
          paymentMethods,
          availableMethods: [
            'wallet',
            'credit_card',
            'debit_card',
            'bank_transfer',
            'paypal',
            'apple_pay',
            'google_pay'
          ]
        }
      });

    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment methods',
        error: error.message
      });
    }
  }

  // Helper methods for payment processing

  async processWalletPayment(order, amount, session) {
    const wallet = await Wallet.findByUser(order.customer._id).session(session);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const transactionId = `WAL-${Date.now()}`;
    await wallet.debit(amount, `Payment for order ${order.orderNumber}`, transactionId, session);

    return {
      success: true,
      transactionId: transactionId,
      fees: 0
    };
  }

  async processCreditCardPayment(order, amount, paymentDetails, session) {
    // Simulate credit card processing
    // In production, integrate with Stripe, Square, etc.
    
    const transactionId = `CC-${Date.now()}`;
    const fees = amount * 0.029; // 2.9% processing fee

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      transactionId: transactionId,
      fees: fees,
      gatewayResponse: {
        gateway: 'stripe',
        chargeId: `ch_${transactionId}`,
        status: 'succeeded'
      }
    };
  }

  async processDebitCardPayment(order, amount, paymentDetails, session) {
    // Similar to credit card but with different fees
    const transactionId = `DC-${Date.now()}`;
    const fees = amount * 0.015; // 1.5% processing fee

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      transactionId: transactionId,
      fees: fees,
      gatewayResponse: {
        gateway: 'stripe',
        chargeId: `ch_${transactionId}`,
        status: 'succeeded'
      }
    };
  }

  async processBankTransfer(order, amount, paymentDetails, session) {
    const transactionId = `BT-${Date.now()}`;
    
    return {
      success: true,
      transactionId: transactionId,
      fees: 0,
      status: 'pending' // Bank transfers typically require verification
    };
  }

  async processPayPalPayment(order, amount, paymentDetails, session) {
    const transactionId = `PP-${Date.now()}`;
    const fees = amount * 0.025; // 2.5% PayPal fee

    return {
      success: true,
      transactionId: transactionId,
      fees: fees,
      gatewayResponse: {
        gateway: 'paypal',
        paymentId: `PAY-${transactionId}`,
        status: 'approved'
      }
    };
  }

  async processApplePayPayment(order, amount, paymentDetails, session) {
    const transactionId = `AP-${Date.now()}`;
    const fees = amount * 0.029;

    return {
      success: true,
      transactionId: transactionId,
      fees: fees,
      gatewayResponse: {
        gateway: 'apple_pay',
        transactionId: transactionId,
        status: 'succeeded'
      }
    };
  }

  async processGooglePayPayment(order, amount, paymentDetails, session) {
    const transactionId = `GP-${Date.now()}`;
    const fees = amount * 0.029;

    return {
      success: true,
      transactionId: transactionId,
      fees: fees,
      gatewayResponse: {
        gateway: 'google_pay',
        transactionId: transactionId,
        status: 'succeeded'
      }
    };
  }

  async processExternalPayment(amount, paymentMethod, paymentDetails) {
    // Process external payment for adding funds
    const transactionId = `EXT-${Date.now()}`;
    
    return {
      success: true,
      transactionId: transactionId,
      gatewayResponse: {
        gateway: 'external_processor',
        status: 'succeeded'
      }
    };
  }

  async processBankWithdrawal(amount, bankDetails, withdrawalId) {
    // Process bank withdrawal
    return {
      success: true,
      status: 'pending',
      withdrawalId: withdrawalId
    };
  }

  async processPayPalWithdrawal(amount, paypalDetails, withdrawalId) {
    // Process PayPal withdrawal
    return {
      success: true,
      status: 'pending',
      withdrawalId: withdrawalId
    };
  }

  async distributeFunds(order, transaction, session) {
    // Distribute funds to sellers and platform
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = order.totals.finalTotal * platformFeeRate;
    const sellerAmount = order.totals.finalTotal - platformFee;

    // Find seller's wallet
    const store = await mongoose.model('Store').findById(order.storeId).populate('ownerId').session(session);
    if (store && store.ownerId) {
      const sellerWallet = await Wallet.findByUser(store.ownerId._id).session(session);
      if (sellerWallet) {
        await sellerWallet.credit(
          sellerAmount, 
          `Sale from order ${order.orderNumber}`, 
          `SALE-${transaction.transactionId}`,
          session
        );
      }
    }

    // Platform fee would be credited to platform wallet (admin)
    // This could be implemented based on business requirements
  }

  // Get payment analytics
  async getPaymentAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get transaction statistics
      const [totalRevenue, completedPayments, pendingPayments, failedPayments, refundedAmount] = await Promise.all([
        Transaction.aggregate([
          { $match: { ...dateFilter, status: 'completed', type: 'payment' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.countDocuments({ ...dateFilter, status: 'completed', type: 'payment' }),
        Transaction.countDocuments({ ...dateFilter, status: 'pending', type: 'payment' }),
        Transaction.countDocuments({ ...dateFilter, status: 'failed', type: 'payment' }),
        Transaction.aggregate([
          { $match: { ...dateFilter, status: 'completed', type: 'refund' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      // Get payment method breakdown
      const paymentMethodStats = await Transaction.aggregate([
        { $match: { ...dateFilter, status: 'completed', type: 'payment' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]);

      res.json({
        success: true,
        data: {
          totalRevenue: totalRevenue[0]?.total || 0,
          completedPayments,
          pendingPayments,
          failedPayments,
          refundedAmount: refundedAmount[0]?.total || 0,
          paymentMethodStats
        }
      });
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment analytics',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();
