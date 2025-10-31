const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const storeController = require('../controllers/storeController');
const { 
  authMiddleware, 
  adminMiddleware,
  sellerMiddleware, 
  storeOwnerMiddleware,
  optionalAuthMiddleware,
  rateLimitMiddleware
} = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// Validation rules
const createStoreValidation = [
  body('name')
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  
  body('businessInfo.businessName')
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Business name must be between 2 and 200 characters'),
  
  body('businessInfo.description')
    .notEmpty()
    .withMessage('Business description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('businessInfo.email')
    .isEmail()
    .withMessage('Valid business email is required'),
  
  body('businessInfo.phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('businessInfo.address.street')
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('businessInfo.address.city')
    .notEmpty()
    .withMessage('City is required'),
  
  body('businessInfo.address.country')
    .notEmpty()
    .withMessage('Country is required'),
  
  body('businessInfo.businessType')
    .isIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'non_profit'])
    .withMessage('Valid business type is required')
];

const updateStoreValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  
  body('businessInfo.description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('businessInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid business email is required'),
  
  body('businessInfo.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required')
];

const storeSettingsValidation = [
  body('section')
    .isIn(['business', 'shipping', 'payment', 'policies', 'branding'])
    .withMessage('Invalid settings section'),
  
  body('data')
    .isObject()
    .withMessage('Settings data must be an object')
];

const verifyStoreValidation = [
  body('status')
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('Invalid verification status'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

// Public routes

// GET /api/stores - Get all active stores with filtering
router.get('/', 
  optionalAuthMiddleware,
  storeController.getStores
);

// GET /api/stores/:id - Get single store by ID or slug
router.get('/:id',
  optionalAuthMiddleware,
  storeController.getStore
);

// Protected routes (authentication required)

// POST /api/stores - Create new store (seller only)
router.post('/',
  authMiddleware,
  uploadMiddleware.storeCreation,
  createStoreValidation,
  rateLimitMiddleware(1, 86400000), // 1 store per day
  storeController.createStore
);

// PUT /api/stores/:id - Update store (store owner/admin only)
router.put('/:id',
  authMiddleware,
  uploadMiddleware.storeUpdate,
  updateStoreValidation,
  storeController.updateStore
);

// PATCH /api/stores/:id/settings - Update store settings (store owner only)
router.patch('/:id/settings',
  authMiddleware,
  storeSettingsValidation,
  storeController.updateStoreSettings
);

// Store dashboard and analytics routes

// GET /api/stores/:id/dashboard - Get store dashboard data (store owner only)
router.get('/:id/dashboard',
  authMiddleware,
  storeController.getStoreDashboard
);

// GET /api/stores/:id/analytics - Get store analytics (store owner/admin only)
router.get('/:id/analytics',
  authMiddleware,
  rateLimitMiddleware(20, 3600000), // 20 requests per hour
  storeController.getStoreAnalytics
);

// Store management routes

// GET /api/stores/my/store - Get current user's store
router.get('/my/store',
  authMiddleware,
  sellerMiddleware,
  async (req, res) => {
    try {
      const store = await Store.findOne({ owner: req.user._id })
        .populate('owner', 'firstName lastName email avatar');
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }
      
      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching store',
        error: error.message
      });
    }
  }
);

// Store products routes

// GET /api/stores/:id/products - Get store products
router.get('/:id/products',
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      req.query.store = req.params.id;
      const productController = require('../controllers/productController');
      return productController.getProducts(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching store products',
        error: error.message
      });
    }
  }
);

// Store orders routes

// GET /api/stores/:id/orders - Get store orders (store owner only)
router.get('/:id/orders',
  authMiddleware,
  async (req, res) => {
    try {
      const store = await Store.findById(req.params.id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      req.query.store = req.params.id;
      const orderController = require('../controllers/orderController');
      return orderController.getOrders(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching store orders',
        error: error.message
      });
    }
  }
);

// Admin-only routes

// GET /api/stores/admin/all - Get all stores including inactive (admin only)
router.get('/admin/all',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      req.query.status = 'all';
      return storeController.getStores(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stores',
        error: error.message
      });
    }
  }
);

// PATCH /api/stores/:id/verify - Verify store (admin only)
router.patch('/:id/verify',
  authMiddleware,
  adminMiddleware,
  verifyStoreValidation,
  storeController.verifyStore
);

// PATCH /api/stores/:id/unverify - Unverify store (admin only)
router.patch('/:id/unverify',
  authMiddleware,
  adminMiddleware,
  storeController.unverifyStore
);

// PATCH /api/stores/:id/status - Update store status (admin only)
router.patch('/:id/status',
  authMiddleware,
  adminMiddleware,
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'banned'])
    .withMessage('Invalid status'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const store = await Store.findByIdAndUpdate(
        id,
        { 
          status,
          statusReason: reason,
          statusChangedAt: new Date(),
          statusChangedBy: req.user._id
        },
        { new: true }
      ).populate('owner', 'firstName lastName email');

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      res.json({
        success: true,
        message: `Store status updated to ${status}`,
        data: store
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating store status',
        error: error.message
      });
    }
  }
);

// Store categories and filtering routes

// GET /api/stores/categories - Get store categories
router.get('/categories/list',
  async (req, res) => {
    try {
      const categories = await Store.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$businessInfo.categories' },
        {
          $group: {
            _id: '$businessInfo.categories',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching store categories',
        error: error.message
      });
    }
  }
);

// GET /api/stores/featured - Get featured stores
router.get('/featured/list',
  optionalAuthMiddleware,
  async (req, res) => {
    try {
      const stores = await Store.find({
        status: 'active',
        isFeatured: true
      })
        .populate('owner', 'firstName lastName avatar')
        .sort('-ratings.average')
        .limit(parseInt(req.query.limit) || 12)
        .lean();

      res.json({
        success: true,
        data: stores
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching featured stores',
        error: error.message
      });
    }
  }
);

module.exports = router;