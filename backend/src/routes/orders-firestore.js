/**
 * Orders Route (Firestore)
 * 
 * Handles e-commerce order processing with atomic transactions
 */

const express = require('express');
const router = express.Router();

const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  updateShipping,
  cancelOrder,
  processRefund,
  getOrderAnalytics,
  updatePaymentStatus
} = require('../utils/orderHelpers');

const { authenticate } = require('../middleware/auth');

// Helper for role authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    next();
  };
};

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      storeId,
      items,
      addresses,
      payment,
      totals,
      couponCode,
      notes
    } = req.body;

    // Validate required fields
    if (!storeId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Store ID and items are required'
      });
    }

    if (!addresses || !addresses.shipping) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!payment || !payment.method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    if (!totals || !totals.finalTotal) {
      return res.status(400).json({
        success: false,
        message: 'Order totals are required'
      });
    }

    const order = await createOrder({
      customerId: req.user.uid,
      storeId,
      items,
      addresses,
      payment,
      totals,
      couponCode,
      notes
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/orders
 * Get orders with filters
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      limit = 20,
      startAfter
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      startAfter,
      status,
      paymentStatus,
      startDate,
      endDate
    };

    // Apply role-based filtering
    if (req.user.role === 'user') {
      filters.customerId = req.user.uid;
    } else if (req.user.role === 'seller') {
      // Get seller's store
      const { firestore } = require('../utils/database');
      const storesSnapshot = await firestore.collection('stores')
        .where('ownerId', '==', req.user.uid)
        .limit(1)
        .get();

      if (!storesSnapshot.empty) {
        filters.storeId = storesSnapshot.docs[0].id;
      } else {
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
    }
    // Admin can see all orders (no additional filters)

    const orders = await getOrders(filters);

    res.json({
      success: true,
      data: orders,
      count: orders.length,
      hasMore: orders.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/orders/analytics
 * Get order analytics (seller/admin only)
 */
router.get('/analytics', authenticate, authorizeRoles('admin', 'seller'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {
      startDate,
      endDate
    };

    // Sellers can only see their store's analytics
    if (req.user.role === 'seller') {
      const { firestore } = require('../utils/database');
      const storesSnapshot = await firestore.collection('stores')
        .where('ownerId', '==', req.user.uid)
        .limit(1)
        .get();

      if (!storesSnapshot.empty) {
        filters.storeId = storesSnapshot.docs[0].id;
      }
    }

    const analytics = await getOrderAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting order analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get single order
 */
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && order.customerId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    if (req.user.role === 'seller') {
      const { firestore } = require('../utils/database');
      const storesSnapshot = await firestore.collection('stores')
        .where('ownerId', '==', req.user.uid)
        .limit(1)
        .get();

      if (storesSnapshot.empty || storesSnapshot.docs[0].id !== order.storeId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order'
        });
      }
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/orders/:orderId/status
 * Update order status (seller/admin only)
 */
router.put('/:orderId/status', authenticate, authorizeRoles('admin', 'seller'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await updateOrderStatus(orderId, status, note, req.user.uid);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/orders/:orderId/shipping
 * Update shipping information (seller/admin only)
 */
router.put('/:orderId/shipping', authenticate, authorizeRoles('admin', 'seller'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier, estimatedDelivery, notes } = req.body;

    const order = await updateShipping(orderId, {
      trackingNumber,
      carrier,
      estimatedDelivery,
      notes
    });

    res.json({
      success: true,
      data: order,
      message: 'Shipping information updated'
    });
  } catch (error) {
    console.error('Error updating shipping:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/orders/:orderId/cancel
 * Cancel order
 */
router.post('/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    // Verify order belongs to user (unless admin/seller)
    if (req.user.role === 'user') {
      const order = await getOrderById(orderId);
      if (!order || order.customerId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this order'
        });
      }
    }

    const order = await cancelOrder(orderId, reason, req.user.uid);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    
    if (error.message.includes('Cannot cancel')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/orders/:orderId/refund
 * Process refund (seller/admin only)
 */
router.post('/:orderId/refund', authenticate, authorizeRoles('admin', 'seller'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason, method, items } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Amount and reason are required'
      });
    }

    const result = await processRefund(orderId, {
      amount,
      reason,
      method,
      items,
      userId: req.user.uid
    });

    res.json({
      success: true,
      data: result,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    
    if (error.message.includes('exceeds')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/orders/:orderId/payment
 * Update payment status (admin only)
 */
router.put('/:orderId/payment', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    // Validate payment status
    if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const order = await updatePaymentStatus(orderId, paymentStatus, transactionId);

    res.json({
      success: true,
      data: order,
      message: 'Payment status updated'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/orders/meta/statuses
 * Get available order and payment statuses
 */
router.get('/meta/statuses', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        orderStatuses: ORDER_STATUS,
        paymentStatuses: PAYMENT_STATUS
      }
    });
  } catch (error) {
    console.error('Error getting statuses:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics
 * Access: Admin
 */
router.get('/stats', async (req, res) => {
  try {
    const db = require('../utils/database');
    const ordersSnapshot = await db.collection('orders').get();
    
    let total = 0;
    let pending = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;
    let totalRevenue = 0;
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      total++;
      if (order.status === 'pending') pending++;
      if (order.status === 'processing') processing++;
      if (order.status === 'shipped') shipped++;
      if (order.status === 'delivered') delivered++;
      if (order.status === 'cancelled') cancelled++;
      if (order.totals?.total) {
        totalRevenue += order.totals.total;
      }
    });
    
    res.json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          processing,
          shipped,
          delivered,
          cancelled,
          totalRevenue: totalRevenue.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
});

module.exports = router;
