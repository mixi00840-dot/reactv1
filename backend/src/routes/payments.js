const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const walletController = require('../controllers/walletController');
const { 
  authMiddleware, 
  adminMiddleware, 
  customerMiddleware,
  rateLimitMiddleware,
  permissionMiddleware
} = require('../middleware/auth');

// Validation rules
const paymentValidation = [
  body('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('paymentMethod')
    .isIn(['wallet', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'])
    .withMessage('Invalid payment method'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  body('paymentDetails')
    .optional()
    .isObject()
    .withMessage('Payment details must be an object'),
  body('saveCard')
    .optional()
    .isBoolean()
    .withMessage('Save card must be a boolean')
];

const addFundsValidation = [
  body('amount')
    .isFloat({ min: 1.00 })
    .withMessage('Minimum amount is $1.00'),
  body('amount')
    .isFloat({ max: 10000.00 })
    .withMessage('Maximum amount is $10,000.00'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'bank_transfer'])
    .withMessage('Invalid payment method for adding funds'),
  body('paymentDetails')
    .isObject()
    .withMessage('Payment details are required'),
  body('paymentDetails.cardNumber')
    .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
    .matches(/^[0-9]{13,19}$/)
    .withMessage('Invalid card number'),
  body('paymentDetails.expiryMonth')
    .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
    .isInt({ min: 1, max: 12 })
    .withMessage('Invalid expiry month'),
  body('paymentDetails.expiryYear')
    .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
    .isInt({ min: new Date().getFullYear() })
    .withMessage('Invalid expiry year'),
  body('paymentDetails.cvv')
    .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
    .matches(/^[0-9]{3,4}$/)
    .withMessage('Invalid CVV')
];

const transferValidation = [
  body('recipientId')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Transfer amount must be greater than 0'),
  body('amount')
    .isFloat({ max: 5000.00 })
    .withMessage('Maximum transfer amount is $5,000.00'),
  body('description')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Description must be between 3-200 characters')
];

const withdrawalValidation = [
  body('amount')
    .isFloat({ min: 10.00 })
    .withMessage('Minimum withdrawal amount is $10.00'),
  body('amount')
    .isFloat({ max: 50000.00 })
    .withMessage('Maximum withdrawal amount is $50,000.00'),
  body('withdrawalMethod')
    .isIn(['bank_transfer', 'paypal'])
    .withMessage('Invalid withdrawal method'),
  body('bankDetails')
    .isObject()
    .withMessage('Bank details are required'),
  body('bankDetails.accountNumber')
    .if(body('withdrawalMethod').equals('bank_transfer'))
    .matches(/^[0-9]{8,17}$/)
    .withMessage('Invalid account number'),
  body('bankDetails.routingNumber')
    .if(body('withdrawalMethod').equals('bank_transfer'))
    .matches(/^[0-9]{9}$/)
    .withMessage('Invalid routing number'),
  body('bankDetails.accountHolderName')
    .if(body('withdrawalMethod').equals('bank_transfer'))
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name is required'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
];

const holdFundsValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Hold amount must be greater than 0'),
  body('reason')
    .isLength({ min: 10, max: 200 })
    .withMessage('Reason must be between 10-200 characters'),
  body('reference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Reference must be less than 100 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Duration must be between 1-168 hours (1 week)')
];

const releaseFundsValidation = [
  body('holdId')
    .notEmpty()
    .withMessage('Hold ID is required'),
  body('action')
    .isIn(['release', 'capture'])
    .withMessage('Action must be either "release" or "capture"')
];

const adminWalletValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('operation')
    .isIn(['credit', 'debit'])
    .withMessage('Operation must be "credit" or "debit"'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('reason')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5-200 characters'),
  body('reference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Reference must be less than 100 characters')
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
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative')
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

// Apply rate limiting to payment routes
router.use(rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // 50 requests per 15 minutes for payment operations
}));

// ===============================
// PAYMENT PROCESSING ROUTES
// ===============================

// POST /api/payments/process - Process payment for order
router.post('/process',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5 // 5 payment attempts per 5 minutes
  }),
  paymentValidation,
  handleValidationErrors,
  paymentController.processPayment
);

// GET /api/payments - Get all payments (alias for transactions)
router.get('/',
  authMiddleware,
  queryValidation,
  paymentController.getTransactionHistory
);

// GET /api/payments/analytics - Get payment analytics
router.get('/analytics',
  authMiddleware,
  adminMiddleware,
  paymentController.getPaymentAnalytics
);

// GET /api/payments/methods - Get available payment methods
router.get('/methods',
  authMiddleware,
  paymentController.getPaymentMethods
);

// GET /api/payments/transactions - Get transaction history
router.get('/transactions',
  authMiddleware,
  queryValidation,
  [
    query('type')
      .optional()
      .isIn(['payment', 'refund', 'wallet_topup', 'wallet_withdrawal', 'wallet_transfer_in', 'wallet_transfer_out'])
      .withMessage('Invalid transaction type'),
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid transaction status')
  ],
  handleValidationErrors,
  paymentController.getTransactionHistory
);

// ===============================
// WALLET MANAGEMENT ROUTES
// ===============================

// GET /api/payments/wallet - Get wallet details
router.get('/wallet',
  authMiddleware,
  [
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  walletController.getWalletDetails
);

// GET /api/payments/wallet/transactions - Get wallet transaction history
router.get('/wallet/transactions',
  authMiddleware,
  queryValidation,
  [
    query('type')
      .optional()
      .isIn(['credit', 'debit', 'transfer_in', 'transfer_out', 'refund', 'fee', 'bonus', 'cashback', 'reward', 'penalty', 'commission', 'earning', 'hold'])
      .withMessage('Invalid transaction type'),
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid transaction status'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be between 2-100 characters')
  ],
  handleValidationErrors,
  walletController.getTransactionHistory
);

// GET /api/payments/wallet/analytics - Get wallet analytics
router.get('/wallet/analytics',
  authMiddleware,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid period'),
    query('granularity')
      .optional()
      .isIn(['day', 'month'])
      .withMessage('Invalid granularity'),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  walletController.getWalletAnalytics
);

// POST /api/payments/wallet/add-funds - Add funds to wallet
router.post('/wallet/add-funds',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3 // 3 add funds attempts per 10 minutes
  }),
  addFundsValidation,
  handleValidationErrors,
  paymentController.addFunds
);

// POST /api/payments/wallet/transfer - Transfer funds between wallets
router.post('/wallet/transfer',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 transfers per 15 minutes
  }),
  transferValidation,
  handleValidationErrors,
  paymentController.transferFunds
);

// POST /api/payments/wallet/withdraw - Withdraw funds from wallet
router.post('/wallet/withdraw',
  authMiddleware,
  customerMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // 3 withdrawal requests per hour
  }),
  withdrawalValidation,
  handleValidationErrors,
  paymentController.withdrawFunds
);

// POST /api/payments/wallet/hold - Hold/Reserve funds
router.post('/wallet/hold',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']), // Only admins and sellers can hold funds
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20 // 20 hold operations per 15 minutes
  }),
  holdFundsValidation,
  handleValidationErrors,
  walletController.holdFunds
);

// POST /api/payments/wallet/release - Release held funds
router.post('/wallet/release',
  authMiddleware,
  permissionMiddleware(['admin', 'seller']),
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20 // 20 release operations per 15 minutes
  }),
  releaseFundsValidation,
  handleValidationErrors,
  walletController.releaseFunds
);

// ===============================
// ADMIN ROUTES
// ===============================

// GET /api/payments/admin/wallets - Get all wallets (admin only)
router.get('/admin/wallets',
  authMiddleware,
  adminMiddleware,
  queryValidation,
  [
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be between 2-100 characters'),
    query('minBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum balance must be non-negative'),
    query('maxBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum balance must be non-negative'),
    query('hasActivity')
      .optional()
      .isBoolean()
      .withMessage('Has activity must be a boolean')
  ],
  handleValidationErrors,
  walletController.getAllWallets
);

// POST /api/payments/admin/wallet-operation - Admin wallet credit/debit
router.post('/admin/wallet-operation',
  authMiddleware,
  adminMiddleware,
  rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // 50 admin operations per 15 minutes
  }),
  adminWalletValidation,
  handleValidationErrors,
  walletController.adminWalletOperation
);

// ===============================
// UTILITY ROUTES
// ===============================

// GET /api/payments/supported-currencies - Get supported currencies
router.get('/supported-currencies',
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      data: {
        currencies: [
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'GBP', name: 'British Pound', symbol: '£' }
        ],
        default: 'USD'
      }
    });
  }
);

// GET /api/payments/fees - Get payment processing fees
router.get('/fees',
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      data: {
        paymentMethods: {
          wallet: { percentage: 0, fixed: 0 },
          credit_card: { percentage: 2.9, fixed: 0.30 },
          debit_card: { percentage: 1.5, fixed: 0.25 },
          bank_transfer: { percentage: 0, fixed: 0 },
          paypal: { percentage: 2.5, fixed: 0.30 },
          apple_pay: { percentage: 2.9, fixed: 0.30 },
          google_pay: { percentage: 2.9, fixed: 0.30 }
        },
        withdrawalFees: {
          bank_transfer: { percentage: 0, fixed: 0 },
          paypal: { percentage: 1.0, fixed: 0 }
        },
        transferFees: {
          internal: { percentage: 0, fixed: 0 }
        }
      }
    });
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Payment routes error:', error);
  
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
      message: 'Duplicate transaction detected'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Payment processing error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;
