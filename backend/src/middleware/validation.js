const { body, param, query, validationResult } = require('express-validator');

/**
 * Centralized validation middleware
 * Reusable validation rules for all routes
 */

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  // ID validation
  mongoId: (fieldName = 'id') => 
    param(fieldName)
      .isMongoId()
      .withMessage(`Invalid ${fieldName} format`),

  // Pagination
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // User registration
  userRegistration: () => [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be 8-128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters')
  ],

  // User login
  userLogin: () => [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Username or email required'),
    body('password')
      .notEmpty()
      .withMessage('Password required')
  ],

  // Content creation
  contentCreation: () => [
    body('type')
      .isIn(['video', 'image', 'post'])
      .withMessage('Type must be video, image, or post'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be 1-200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description must be less than 5000 characters'),
    body('videoUrl')
      .isURL()
      .withMessage('Valid video URL required'),
    body('thumbnailUrl')
      .optional()
      .isURL()
      .withMessage('Valid thumbnail URL required'),
    body('duration')
      .optional()
      .isInt({ min: 0, max: 600 })
      .withMessage('Duration must be 0-600 seconds'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be 1-30 characters'),
    body('visibility')
      .optional()
      .isIn(['public', 'private', 'friends'])
      .withMessage('Visibility must be public, private, or friends')
  ],

  // Gift sending
  giftSending: () => [
    body('giftId')
      .isMongoId()
      .withMessage('Valid gift ID required'),
    body('recipientId')
      .isMongoId()
      .withMessage('Valid recipient ID required'),
    body('quantity')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be 1-100'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters'),
    body('livestreamId')
      .optional()
      .isMongoId()
      .withMessage('Valid livestream ID required'),
    body('contentId')
      .optional()
      .isMongoId()
      .withMessage('Valid content ID required')
  ],

  // Wallet operations
  walletTopUp: () => [
    body('amount')
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('Amount must be between 0.01 and 10000'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP'])
      .withMessage('Currency must be USD, EUR, or GBP'),
    body('paymentMethod')
      .isIn(['card', 'paypal', 'stripe'])
      .withMessage('Valid payment method required'),
    body('idempotencyKey')
      .optional()
      .isString()
      .isLength({ min: 10, max: 100 })
      .withMessage('Idempotency key must be 10-100 characters')
  ],

  // Order creation
  orderCreation: () => [
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item required'),
    body('items.*.productId')
      .isMongoId()
      .withMessage('Valid product ID required'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be 1-100'),
    body('shippingAddress')
      .isObject()
      .withMessage('Shipping address required'),
    body('shippingAddress.street')
      .notEmpty()
      .withMessage('Street address required'),
    body('shippingAddress.city')
      .notEmpty()
      .withMessage('City required'),
    body('shippingAddress.country')
      .notEmpty()
      .withMessage('Country required'),
    body('shippingAddress.postalCode')
      .notEmpty()
      .withMessage('Postal code required'),
    body('paymentMethod')
      .isIn(['card', 'paypal', 'wallet'])
      .withMessage('Valid payment method required')
  ],

  // File upload
  fileUpload: () => [
    body('filename')
      .trim()
      .notEmpty()
      .withMessage('Filename required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Filename must be 1-255 characters')
      .matches(/^[a-zA-Z0-9_\-\.]+$/)
      .withMessage('Filename contains invalid characters'),
    body('contentType')
      .isIn([
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ])
      .withMessage('Invalid content type'),
    body('fileSize')
      .optional()
      .isInt({ min: 1, max: 100 * 1024 * 1024 }) // 100MB max
      .withMessage('File size must be 1 byte to 100MB')
  ],

  // Comment creation
  commentCreation: () => [
    body('contentId')
      .isMongoId()
      .withMessage('Valid content ID required'),
    body('text')
      .trim()
      .notEmpty()
      .withMessage('Comment text required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be 1-1000 characters'),
    body('parentId')
      .optional()
      .isMongoId()
      .withMessage('Valid parent comment ID required')
  ],

  // Status update
  statusUpdate: () => [
    body('status')
      .isIn(['active', 'inactive', 'suspended', 'banned', 'pending'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be 10-500 characters')
  ],

  // Search query
  searchQuery: () => [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Query must be 1-100 characters'),
    query('type')
      .optional()
      .isIn(['users', 'content', 'products', 'all'])
      .withMessage('Type must be users, content, products, or all')
  ],

  // Date range
  dateRange: () => [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be ISO 8601 format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be ISO 8601 format')
  ]
};

module.exports = {
  handleValidationErrors,
  validationRules
};

