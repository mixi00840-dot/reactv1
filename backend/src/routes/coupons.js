const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const couponController = require('../controllers/couponController');
const promotionController = require('../controllers/promotionController');
const { 
  authMiddleware, 
  adminMiddleware, 
  sellerMiddleware,
  customerMiddleware,
  rateLimitMiddleware,
  permissionMiddleware
} = require('../middleware/auth');

// Validation rules
const couponValidation = [
  body('code')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3-20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon code must contain only uppercase letters and numbers'),
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Coupon name must be between 3-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .isIn(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'bundle_discount'])
    .withMessage('Invalid coupon type'),
  body('discount.value')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be greater than or equal to 0'),
  body('discount.maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be non-negative'),
  body('conditions.minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount must be non-negative'),
  body('conditions.minOrderQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum order quantity must be positive'),
  body('usage.limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be positive'),
  body('usage.perUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Per user limit must be positive'),
  body('validity.startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('validity.endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'expired', 'draft'])
    .withMessage('Invalid status'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const applyCouponValidation = [
  body('code')
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid coupon code'),
  body('cartId')
    .isMongoId()
    .withMessage('Invalid cart ID')
];

const removeCouponValidation = [
  body('code')
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid coupon code'),
  body('cartId')
    .isMongoId()
    .withMessage('Invalid cart ID')
];

const campaignValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Campaign name must be between 3-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('type')
    .isIn(['mass_discount', 'loyalty_program', 'seasonal', 'flash_sale', 'bulk_coupons'])
    .withMessage('Invalid campaign type'),
  body('campaignConfig')
    .isObject()
    .withMessage('Campaign configuration is required'),
  body('targetAudience')
    .optional()
    .isObject()
    .withMessage('Target audience must be an object'),
  body('schedule')
    .optional()
    .isObject()
    .withMessage('Schedule must be an object')
];

const flashSaleValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Flash sale name is required'),
  body('discountPercentage')
    .isFloat({ min: 1, max: 90 })
    .withMessage('Discount percentage must be between 1-90%'),
  body('duration')
    .isInt({ min: 1, max: 168 })
    .withMessage('Duration must be between 1-168 hours'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be non-negative'),
  body('targetProducts')
    .optional()
    .isArray()
    .withMessage('Target products must be an array'),
  body('targetProducts.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('maxUsagePerUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max usage per user must be positive'),
  body('totalUsageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total usage limit must be positive')
];

const loyaltyRewardValidation = [
  body('tierConfigs')
    .isArray({ min: 1 })
    .withMessage('Tier configurations are required'),
  body('tierConfigs.*.tierName')
    .isIn(['bronze', 'silver', 'gold', 'platinum'])
    .withMessage('Invalid tier name'),
  body('tierConfigs.*.discountValue')
    .isFloat({ min: 1 })
    .withMessage('Discount value must be positive'),
  body('rewardType')
    .optional()
    .isIn(['percentage', 'fixed_amount', 'free_shipping'])
    .withMessage('Invalid reward type'),
  body('validityPeriod')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Validity period must be between 1-365 days')
];

const generateCodesValidation = [
  body('count')
    .isInt({ min: 1, max: 100 })
    .withMessage('Count must be between 1-100'),
  body('prefix')
    .optional()
    .isLength({ max: 10 })
    .matches(/^[A-Z0-9]*$/)
    .withMessage('Prefix must contain only uppercase letters and numbers'),
  body('length')
    .optional()
    .isInt({ min: 4, max: 20 })
    .withMessage('Length must be between 4-20 characters'),
  body('pattern')
    .optional()
    .isIn(['ALPHABETIC', 'NUMERIC', 'ALPHANUMERIC'])
    .withMessage('Invalid pattern')
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
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2-100 characters')
];

const notificationValidation = [
  body('couponIds')
    .isArray({ min: 1 })
    .withMessage('Coupon IDs array is required'),
  body('couponIds.*')
    .isMongoId()
    .withMessage('Invalid coupon ID'),
  body('targetAudience')
    .isObject()
    .withMessage('Target audience configuration is required'),
  body('notificationType')
    .optional()
    .isIn(['email', 'sms', 'push', 'all'])
    .withMessage('Invalid notification type'),
  body('customMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom message must be less than 500 characters')
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

// Rate limiting removed - handled by global limiter in app.js

// ===============================
// COUPON MANAGEMENT ROUTES
// ===============================

// GET /api/coupons - Get coupons with filtering
router.get('/',
  authMiddleware,
  queryValidation,
  [
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'expired', 'draft'])
      .withMessage('Invalid status filter'),
    query('type')
      .optional()
      .isIn(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'bundle_discount'])
      .withMessage('Invalid type filter'),
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('includeExpired')
      .optional()
      .isBoolean()
      .withMessage('includeExpired must be a boolean')
  ],
  handleValidationErrors,
  couponController.getCoupons
);

// GET /api/coupons/analytics - Get coupon analytics
router.get('/analytics',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  queryValidation,
  [
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('granularity')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid granularity')
  ],
  handleValidationErrors,
  couponController.getCouponAnalytics
);

// GET /api/coupons/:id - Get single coupon
router.get('/:id',
  authMiddleware,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID')
  ],
  handleValidationErrors,
  couponController.getCoupon
);

// POST /api/coupons - Create new coupon
router.post('/',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // 20 coupon creations per hour
  }),
  couponValidation,
  handleValidationErrors,
  couponController.createCoupon
);

// PUT /api/coupons/:id - Update coupon
router.put('/:id',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30 // 30 updates per 15 minutes
  }),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
    ...couponValidation
  ],
  handleValidationErrors,
  couponController.updateCoupon
);

// DELETE /api/coupons/:id - Delete coupon
router.delete('/:id',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 deletions per 15 minutes
  }),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID')
  ],
  handleValidationErrors,
  couponController.deleteCoupon
);

// ===============================
// COUPON APPLICATION ROUTES
// ===============================

// POST /api/coupons/apply - Apply coupon to cart
router.post('/apply',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10 // 10 coupon applications per 5 minutes
  }),
  applyCouponValidation,
  handleValidationErrors,
  couponController.applyCoupon
);

// POST /api/coupons/remove - Remove coupon from cart
router.post('/remove',
  authMiddleware,
  customerMiddleware,
  removeCouponValidation,
  handleValidationErrors,
  couponController.removeCoupon
);

// GET /api/coupons/validate/:code - Validate coupon
router.get('/validate/:code',
  authMiddleware,
  customerMiddleware,
  [
    param('code')
      .isLength({ min: 3, max: 20 })
      .withMessage('Invalid coupon code'),
    query('cartId')
      .optional()
      .isMongoId()
      .withMessage('Invalid cart ID')
  ],
  handleValidationErrors,
  couponController.validateCoupon
);

// ===============================
// PROMOTION CAMPAIGN ROUTES
// ===============================

// GET /api/coupons/campaigns - Get promotional campaigns
router.get('/campaigns',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  queryValidation,
  [
    query('type')
      .optional()
      .isIn(['mass_discount', 'loyalty_program', 'seasonal', 'flash_sale', 'bulk_coupons'])
      .withMessage('Invalid campaign type'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'scheduled', 'completed'])
      .withMessage('Invalid campaign status')
  ],
  handleValidationErrors,
  promotionController.getCampaigns
);

// POST /api/coupons/campaigns - Create promotional campaign
router.post('/campaigns',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 campaigns per hour
  }),
  campaignValidation,
  handleValidationErrors,
  promotionController.createCampaign
);

// GET /api/coupons/campaigns/analytics - Get promotion analytics
router.get('/campaigns/analytics',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  queryValidation,
  [
    query('type')
      .optional()
      .isIn(['mass_discount', 'loyalty_program', 'seasonal', 'flash_sale', 'bulk_coupons'])
      .withMessage('Invalid campaign type'),
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID')
  ],
  handleValidationErrors,
  promotionController.getPromotionAnalytics
);

// ===============================
// SPECIAL PROMOTION ROUTES
// ===============================

// POST /api/coupons/flash-sale - Create flash sale
router.post('/flash-sale',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3 // 3 flash sales per day
  }),
  flashSaleValidation,
  handleValidationErrors,
  promotionController.createFlashSale
);

// POST /api/coupons/loyalty-rewards - Create loyalty rewards
router.post('/loyalty-rewards',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1 // 1 loyalty reward generation per day
  }),
  loyaltyRewardValidation,
  handleValidationErrors,
  promotionController.createLoyaltyRewards
);

// ===============================
// UTILITY ROUTES
// ===============================

// POST /api/coupons/generate-codes - Generate coupon codes
router.post('/generate-codes',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 code generations per 15 minutes
  }),
  generateCodesValidation,
  handleValidationErrors,
  couponController.generateCouponCodes
);

// POST /api/coupons/send-notifications - Send promotional notifications
router.post('/send-notifications',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 notification campaigns per hour
  }),
  notificationValidation,
  handleValidationErrors,
  promotionController.sendPromotionalNotifications
);

// GET /api/coupons/types - Get available coupon types
router.get('/types',
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      data: {
        types: [
          {
            value: 'percentage',
            label: 'Percentage Discount',
            description: 'Discount as a percentage of order total'
          },
          {
            value: 'fixed_amount',
            label: 'Fixed Amount Discount',
            description: 'Fixed dollar amount discount'
          },
          {
            value: 'free_shipping',
            label: 'Free Shipping',
            description: 'Free shipping on qualifying orders'
          },
          {
            value: 'buy_x_get_y',
            label: 'Buy X Get Y',
            description: 'Buy X items and get Y items free or discounted'
          },
          {
            value: 'bundle_discount',
            label: 'Bundle Discount',
            description: 'Discount on product bundles'
          }
        ]
      }
    });
  }
);

// ===============================
// CUSTOMER ROUTES
// ===============================

// GET /api/coupons/customer/available - Get available coupons for customer
router.get('/customer/available',
  authMiddleware,
  customerMiddleware,
  queryValidation,
  [
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('minOrderAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Invalid minimum order amount')
  ],
  handleValidationErrors,
  async (req, res) => {
    // Filter to show only public, active coupons
    req.query.status = 'active';
    req.query.includeExpired = 'false';
    return couponController.getCoupons(req, res);
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Coupon routes error:', error);
  
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

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code already exists'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Coupon system error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;
