const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');

// Rate limiting for shipping operations
const { rateLimitMiddleware } = require('../middleware/auth');

// Validation schemas
const shippingZoneValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Zone name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('countries')
    .isArray({ min: 1 })
    .withMessage('At least one country is required'),
  
  body('countries.*.code')
    .isLength({ min: 2, max: 3 })
    .withMessage('Country code must be 2-3 characters'),
  
  body('countries.*.name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Country name must be between 2 and 100 characters'),
  
  body('countries.*.regions')
    .optional()
    .isArray()
    .withMessage('Regions must be an array'),
  
  body('countries.*.postalCodes')
    .optional()
    .isArray()
    .withMessage('Postal codes must be an array'),
  
  body('shippingMethods')
    .optional()
    .isArray()
    .withMessage('Shipping methods must be an array'),
  
  body('shippingMethods.*.method')
    .optional()
    .isMongoId()
    .withMessage('Invalid shipping method ID'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('priority')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Priority must be between 0 and 100')
];

const shippingMethodValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Method name must be between 2 and 100 characters'),
  
  body('code')
    .isLength({ min: 2, max: 20 })
    .isAlphanumeric()
    .withMessage('Method code must be 2-20 alphanumeric characters'),
  
  body('type')
    .isIn(['standard', 'express', 'overnight', 'economy', 'pickup', 'digital'])
    .withMessage('Invalid shipping method type'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('carrier.name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  
  body('carrier.service')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Carrier service cannot exceed 100 characters'),
  
  body('carrier.apiKey')
    .optional()
    .isLength({ max: 200 })
    .withMessage('API key cannot exceed 200 characters'),
  
  body('rateCalculation.type')
    .isIn(['flat_rate', 'weight_based', 'price_based', 'dimensional_weight', 'zone_based', 'carrier_api'])
    .withMessage('Invalid rate calculation type'),
  
  body('rates.baseRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base rate must be a positive number'),
  
  body('rates.minCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum cost must be a positive number'),
  
  body('rates.maxCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum cost must be a positive number'),
  
  body('deliveryEstimate.minDays')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Minimum delivery days must be between 0 and 365'),
  
  body('deliveryEstimate.maxDays')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Maximum delivery days must be between 0 and 365'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const shippingCalculationValidation = [
  body('cartId')
    .optional()
    .isMongoId()
    .withMessage('Invalid cart ID'),
  
  body('orderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  
  body('items.*.productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('shippingAddress.country')
    .isLength({ min: 2, max: 3 })
    .withMessage('Country code is required'),
  
  body('shippingAddress.state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('shippingAddress.city')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('shippingAddress.postalCode')
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  
  body('shippingAddress.address1')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  
  body('shippingAddress.address2')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address line 2 cannot exceed 200 characters')
];

const labelGenerationValidation = [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  
  body('shippingMethodId')
    .isMongoId()
    .withMessage('Valid shipping method ID is required'),
  
  body('fromAddress')
    .isObject()
    .withMessage('From address is required'),
  
  body('toAddress')
    .isObject()
    .withMessage('To address is required'),
  
  body('packageDetails.weight')
    .isFloat({ min: 0.1 })
    .withMessage('Package weight must be at least 0.1 kg'),
  
  body('packageDetails.dimensions.length')
    .isFloat({ min: 1 })
    .withMessage('Length must be at least 1 cm'),
  
  body('packageDetails.dimensions.width')
    .isFloat({ min: 1 })
    .withMessage('Width must be at least 1 cm'),
  
  body('packageDetails.dimensions.height')
    .isFloat({ min: 1 })
    .withMessage('Height must be at least 1 cm')
];

const deliveryEstimateValidation = [
  body('fromAddress')
    .isObject()
    .withMessage('From address is required'),
  
  body('toAddress')
    .isObject()
    .withMessage('To address is required'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Weight must be at least 0.1 kg'),
  
  body('dimensions')
    .optional()
    .isObject()
    .withMessage('Dimensions must be an object'),
  
  body('serviceTypes')
    .optional()
    .isArray()
    .withMessage('Service types must be an array')
];

// Query validation schemas
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const trackingValidation = [
  param('trackingNumber')
    .isLength({ min: 5, max: 50 })
    .isAlphanumeric()
    .withMessage('Invalid tracking number format'),
  
  query('carrier')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Carrier name cannot exceed 50 characters')
];

const analyticsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('groupBy must be one of: day, week, month, year')
];

// Routes

// Calculate shipping rates
router.post('/calculate',
  auth.authenticate,
  auth.customerMiddleware,
  rateLimitMiddleware('calculate_shipping', 30, 60000), // 30 per minute
  shippingCalculationValidation,
  shippingController.calculateShipping
);

// Get shipping zones
router.get('/zones',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('get_shipping_zones', 100, 60000),
  paginationValidation,
  shippingController.getShippingZones
);

// Create shipping zone
router.post('/zones',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('create_shipping_zone', 10, 60000),
  shippingZoneValidation,
  shippingController.createShippingZone
);

// Update shipping zone
router.put('/zones/:id',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('update_shipping_zone', 20, 60000),
  [
    param('id').isMongoId().withMessage('Invalid zone ID'),
    ...shippingZoneValidation
  ],
  shippingController.updateShippingZone
);

// Delete shipping zone
router.delete('/zones/:id',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('delete_shipping_zone', 10, 60000),
  param('id').isMongoId().withMessage('Invalid zone ID'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find zone with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const Store = require('../models/Store');
        const store = await Store.findOne({ owner: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      const { ShippingZone } = require('../models/Shipping');
      const zone = await ShippingZone.findOneAndDelete(query);
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Shipping zone not found'
        });
      }

      res.json({
        success: true,
        message: 'Shipping zone deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting shipping zone:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting shipping zone',
        error: error.message
      });
    }
  }
);

// Get shipping methods
router.get('/methods',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('get_shipping_methods', 100, 60000),
  [
    ...paginationValidation,
    query('type')
      .optional()
      .isIn(['standard', 'express', 'overnight', 'economy', 'pickup', 'digital'])
      .withMessage('Invalid shipping method type'),
    query('carrier')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Carrier name cannot exceed 50 characters')
  ],
  shippingController.getShippingMethods
);

// Create shipping method
router.post('/methods',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('create_shipping_method', 10, 60000),
  shippingMethodValidation,
  shippingController.createShippingMethod
);

// Update shipping method
router.put('/methods/:id',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('update_shipping_method', 20, 60000),
  [
    param('id').isMongoId().withMessage('Invalid method ID'),
    ...shippingMethodValidation
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find method with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const Store = require('../models/Store');
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.$or = [
            { storeId: store._id },
            { storeId: null } // Can update global methods if they have permission
          ];
        }
      }

      const { ShippingMethod } = require('../models/Shipping');
      const method = await ShippingMethod.findOne(query);
      
      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
      }

      // Check if updating a global method as seller
      if (req.user.role === 'seller' && !method.storeId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify global shipping method'
        });
      }

      // Update method
      Object.assign(method, updates);
      await method.save();

      // Populate references
      await method.populate('storeId', 'name slug');

      res.json({
        success: true,
        message: 'Shipping method updated successfully',
        data: method
      });

    } catch (error) {
      console.error('Error updating shipping method:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating shipping method',
        error: error.message
      });
    }
  }
);

// Delete shipping method
router.delete('/methods/:id',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('delete_shipping_method', 10, 60000),
  param('id').isMongoId().withMessage('Invalid method ID'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find method with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const Store = require('../models/Store');
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      }

      const { ShippingMethod } = require('../models/Shipping');
      const method = await ShippingMethod.findOneAndDelete(query);
      
      if (!method) {
        return res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
      }

      res.json({
        success: true,
        message: 'Shipping method deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting shipping method:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting shipping method',
        error: error.message
      });
    }
  }
);

// Track shipment
router.get('/track/:trackingNumber',
  auth.authenticate,
  rateLimitMiddleware('track_shipment', 50, 60000),
  trackingValidation,
  shippingController.trackShipment
);

// Get delivery estimates
router.post('/estimates',
  auth.authenticate,
  auth.customerMiddleware,
  rateLimitMiddleware('delivery_estimates', 20, 60000),
  deliveryEstimateValidation,
  shippingController.getDeliveryEstimates
);

// Generate shipping label
router.post('/labels',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('generate_label', 10, 60000),
  labelGenerationValidation,
  shippingController.generateShippingLabel
);

// Get shipping analytics
router.get('/analytics',
  auth.authenticate,
  auth.sellerMiddleware,
  rateLimitMiddleware('shipping_analytics', 30, 60000),
  analyticsValidation,
  shippingController.getShippingAnalytics
);

// Bulk operations for admin

// Get all shipping zones (admin only)
router.get('/admin/zones',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('admin_get_zones', 100, 60000),
  [
    ...paginationValidation,
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID')
  ],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        storeId,
        isActive,
        search
      } = req.query;

      // Build query
      let query = {};

      if (storeId) {
        query.storeId = storeId;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get shipping zones
      const { ShippingZone } = require('../models/Shipping');
      const zones = await ShippingZone.find(query)
        .populate('storeId', 'name slug owner')
        .populate('shippingMethods.method', 'name type carrier')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await ShippingZone.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          zones,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching admin shipping zones:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shipping zones',
        error: error.message
      });
    }
  }
);

// Get all shipping methods (admin only)
router.get('/admin/methods',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('admin_get_methods', 100, 60000),
  [
    ...paginationValidation,
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('type')
      .optional()
      .isIn(['standard', 'express', 'overnight', 'economy', 'pickup', 'digital'])
      .withMessage('Invalid shipping method type'),
    query('carrier')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Carrier name cannot exceed 50 characters')
  ],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        storeId,
        type,
        carrier,
        isActive,
        search
      } = req.query;

      // Build query
      let query = {};

      if (storeId) {
        query.storeId = storeId;
      }

      if (type) {
        query.type = type;
      }

      if (carrier) {
        query['carrier.name'] = new RegExp(carrier, 'i');
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { code: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get methods
      const { ShippingMethod } = require('../models/Shipping');
      const methods = await ShippingMethod.find(query)
        .populate('storeId', 'name slug owner')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await ShippingMethod.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          methods,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching admin shipping methods:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shipping methods',
        error: error.message
      });
    }
  }
);

// Global shipping analytics (admin only)
router.get('/admin/analytics',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('admin_shipping_analytics', 30, 60000),
  analyticsValidation,
  shippingController.getShippingAnalytics
);

// Error handling middleware for shipping routes
router.use((error, req, res, next) => {
  console.error('Shipping routes error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
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
    message: 'Internal server error in shipping operations'
  });
});

module.exports = router;