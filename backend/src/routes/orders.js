const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const orderController = require('../controllers/orderController');
const { 
  authMiddleware, 
  adminMiddleware, 
  sellerMiddleware,
  customerMiddleware,
  rateLimitMiddleware,
  permissionMiddleware
} = require('../middleware/auth');

// Validation rules
const orderIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

const orderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'])
    .withMessage('Invalid order status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('trackingNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5-50 characters'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivery date format')
];

const refundValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('Refund reason must be between 10-500 characters'),
  body('method')
    .optional()
    .isIn(['original', 'wallet', 'store_credit'])
    .withMessage('Invalid refund method'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('items.*.itemId')
    .if(body('items').exists())
    .isMongoId()
    .withMessage('Invalid item ID'),
  body('items.*.quantity')
    .if(body('items').exists())
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

const shippingUpdateValidation = [
  body('trackingNumber')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5-50 characters'),
  body('carrier')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2-50 characters'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivery date format'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object')
];

const bulkUpdateValidation = [
  body('orderIds')
    .isArray({ min: 1 })
    .withMessage('Order IDs array is required'),
  body('orderIds.*')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('updates')
    .isObject()
    .withMessage('Updates object is required'),
  body('updates.status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
];

const cancelOrderValidation = [
  body('reason')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10-500 characters'),
  body('refundMethod')
    .optional()
    .isIn(['original', 'wallet', 'store_credit'])
    .withMessage('Invalid refund method')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  query('sort')
    .optional()
    .isIn([
      'createdAt', '-createdAt', 
      'updatedAt', '-updatedAt',
      'totals.finalTotal', '-totals.finalTotal',
      'status', '-status'
    ])
    .withMessage('Invalid sort parameter'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'])
    .withMessage('Invalid status filter'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid payment status filter'),
  query('shippingStatus')
    .optional()
    .isIn(['pending', 'shipped', 'delivered'])
    .withMessage('Invalid shipping status filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2-100 characters')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Apply rate limiting to all routes
router.use(rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// GET /api/orders - Get orders with filtering and pagination
router.get('/',
  authMiddleware,
  queryValidation,
  handleValidationErrors,
  orderController.getOrders
);

// GET /api/orders/analytics - Get order analytics (seller/admin only)
router.get('/analytics',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('granularity')
      .optional()
      .isIn(['hour', 'day', 'week', 'month'])
      .withMessage('Invalid granularity')
  ],
  handleValidationErrors,
  orderController.getOrderAnalytics
);

// GET /api/orders/:id - Get single order
router.get('/:id',
  authMiddleware,
  orderIdValidation,
  handleValidationErrors,
  orderController.getOrder
);

// PUT /api/orders/:id/status - Update order status (seller/admin only)
router.put('/:id/status',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20 // 20 status updates per 5 minutes
  }),
  orderIdValidation,
  orderStatusValidation,
  handleValidationErrors,
  orderController.updateOrderStatus
);

// PUT /api/orders/:id/shipping - Update shipping information (seller/admin only)
router.put('/:id/shipping',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15 // 15 shipping updates per 5 minutes
  }),
  orderIdValidation,
  shippingUpdateValidation,
  handleValidationErrors,
  orderController.updateShipping
);

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5 // 5 cancellations per 10 minutes
  }),
  orderIdValidation,
  cancelOrderValidation,
  handleValidationErrors,
  orderController.cancelOrder
);

// POST /api/orders/:id/refund - Process refund (seller/admin only)
router.post('/:id/refund',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 refunds per 15 minutes
  }),
  orderIdValidation,
  refundValidation,
  handleValidationErrors,
  orderController.processOrderRefund
);

// PUT /api/orders/bulk - Bulk update orders (admin only)
router.put('/bulk',
  authMiddleware,
  adminMiddleware,
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 bulk operations per 15 minutes
  }),
  bulkUpdateValidation,
  handleValidationErrors,
  orderController.bulkUpdateOrders
);

// Customer-specific routes

// GET /api/orders/customer/history - Get customer's order history
router.get('/customer/history',
  authMiddleware,
  customerMiddleware,
  queryValidation,
  handleValidationErrors,
  orderController.getOrders
);

// POST /api/orders/customer/:id/review - Add order review (customer only)
router.post('/customer/:id/review',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 reviews per hour
  }),
  orderIdValidation,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1-5'),
    body('comment')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10-1000 characters'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
    body('items.*.productId')
      .if(body('items').exists())
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('items.*.rating')
      .if(body('items').exists())
      .isInt({ min: 1, max: 5 })
      .withMessage('Product rating must be between 1-5'),
    body('items.*.comment')
      .if(body('items').exists())
      .optional()
      .isLength({ max: 500 })
      .withMessage('Product comment must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    // This would be implemented to handle order reviews
    res.json({
      success: true,
      message: 'Order review functionality to be implemented'
    });
  }
);

// Seller-specific routes

// GET /api/orders/seller/dashboard - Get seller order dashboard
router.get('/seller/dashboard',
  authMiddleware,
  sellerMiddleware,
  [
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'quarter', 'year'])
      .withMessage('Invalid period')
  ],
  handleValidationErrors,
  async (req, res) => {
    // This would provide seller-specific dashboard data
    res.json({
      success: true,
      message: 'Seller dashboard functionality to be implemented'
    });
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Order routes error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;
