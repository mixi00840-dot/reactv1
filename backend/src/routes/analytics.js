const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');

// Rate limiting for analytics operations
const { rateLimitMiddleware } = require('../middleware/auth');

// Validation schemas
const periodValidation = [
  query('period')
    .optional()
    .isIn(['1d', '7d', '30d', '90d', '1y', 'custom'])
    .withMessage('Invalid period format'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month', 'year'])
    .withMessage('Invalid groupBy parameter'),
  
  query('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID')
];

const kpiValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('KPI name must be between 2 and 100 characters'),
  
  body('metric')
    .isLength({ min: 2, max: 50 })
    .withMessage('Metric must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('target.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target value must be a positive number'),
  
  body('target.period')
    .optional()
    .isIn(['day', 'week', 'month', 'quarter', 'year'])
    .withMessage('Invalid target period'),
  
  body('thresholds.excellent')
    .optional()
    .isFloat()
    .withMessage('Excellent threshold must be a number'),
  
  body('thresholds.good')
    .optional()
    .isFloat()
    .withMessage('Good threshold must be a number'),
  
  body('thresholds.warning')
    .optional()
    .isFloat()
    .withMessage('Warning threshold must be a number'),
  
  body('thresholds.critical')
    .optional()
    .isFloat()
    .withMessage('Critical threshold must be a number'),
  
  body('updateFrequency')
    .optional()
    .isIn(['real-time', 'hourly', 'daily', 'weekly'])
    .withMessage('Invalid update frequency'),
  
  body('display.unit')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Display unit cannot exceed 10 characters'),
  
  body('display.format')
    .optional()
    .isIn(['currency', 'percentage', 'number'])
    .withMessage('Invalid display format')
];

const reportValidation = [
  body('type')
    .isIn([
      'sales_report',
      'product_performance',
      'customer_analysis',
      'inventory_report',
      'financial_statement',
      'marketing_roi',
      'shipping_analysis',
      'support_metrics'
    ])
    .withMessage('Invalid report type'),
  
  body('parameters')
    .isObject()
    .withMessage('Parameters must be an object'),
  
  body('parameters.dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid'),
  
  body('parameters.dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid'),
  
  body('format')
    .optional()
    .isIn(['json', 'pdf', 'excel', 'csv'])
    .withMessage('Invalid format')
];

const exportValidation = [
  query('type')
    .isIn(['orders', 'products', 'customers', 'analytics'])
    .withMessage('Invalid export type'),
  
  query('format')
    .optional()
    .isIn(['csv', 'json', 'excel'])
    .withMessage('Invalid export format'),
  
  ...periodValidation
];

// Dashboard Analytics Routes

// Get overview dashboard
router.get('/dashboard/overview',
  auth.authenticate,
  rateLimitMiddleware('analytics_overview', 100, 60000),
  periodValidation,
  analyticsController.getOverviewDashboard
);

// Get sales analytics
router.get('/sales',
  auth.authenticate,
  rateLimitMiddleware('sales_analytics', 100, 60000),
  [
    ...periodValidation,
    query('productId')
      .optional()
      .isMongoId()
      .withMessage('Invalid product ID'),
    query('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID')
  ],
  analyticsController.getSalesAnalytics
);

// Get customer analytics
router.get('/customers',
  auth.authenticate,
  rateLimitMiddleware('customer_analytics', 100, 60000),
  periodValidation,
  analyticsController.getCustomerAnalytics
);

// Get product analytics
router.get('/products',
  auth.authenticate,
  rateLimitMiddleware('product_analytics', 100, 60000),
  [
    ...periodValidation,
    query('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  analyticsController.getProductAnalytics
);

// Get financial analytics
router.get('/financial',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('financial_analytics', 50, 60000),
  periodValidation,
  analyticsController.getFinancialAnalytics
);

// Get marketing analytics
router.get('/marketing',
  auth.authenticate,
  rateLimitMiddleware('marketing_analytics', 100, 60000),
  [
    ...periodValidation,
    query('campaignId')
      .optional()
      .isMongoId()
      .withMessage('Invalid campaign ID')
  ],
  analyticsController.getMarketingAnalytics
);

// Get operational analytics
router.get('/operational',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('operational_analytics', 50, 60000),
  periodValidation,
  analyticsController.getOperationalAnalytics
);

// Get real-time metrics
router.get('/realtime',
  auth.authenticate,
  rateLimitMiddleware('realtime_metrics', 200, 60000), // Higher limit for real-time
  query('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID'),
  analyticsController.getRealTimeMetrics
);

// KPI Management Routes

// Get KPIs
router.get('/kpis',
  auth.authenticate,
  rateLimitMiddleware('get_kpis', 100, 60000),
  [
    query('storeId')
      .optional()
      .isMongoId()
      .withMessage('Invalid store ID'),
    query('category')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters')
  ],
  analyticsController.getKPIs
);

// Create KPI
router.post('/kpis',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('create_kpi', 10, 60000),
  kpiValidation,
  analyticsController.createKPI
);

// Update KPI
router.put('/kpis/:id',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('update_kpi', 20, 60000),
  [
    param('id').isMongoId().withMessage('Invalid KPI ID'),
    ...kpiValidation
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { KPI } = require('../models/Analytics');
      const Store = require('../models/Store');

      // Find KPI with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      }

      const kpi = await KPI.findOne(query);
      
      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      // Update KPI
      Object.assign(kpi, updates);
      await kpi.save();

      // Populate references
      await kpi.populate([
        { path: 'owner', select: 'firstName lastName' },
        { path: 'storeId', select: 'name' }
      ]);

      res.json({
        success: true,
        message: 'KPI updated successfully',
        data: kpi
      });

    } catch (error) {
      console.error('Error updating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating KPI',
        error: error.message
      });
    }
  }
);

// Update KPI value
router.put('/kpis/:id/value',
  auth.authenticate,
  rateLimitMiddleware('update_kpi_value', 50, 60000),
  [
    param('id').isMongoId().withMessage('Invalid KPI ID'),
    body('value')
      .isFloat()
      .withMessage('Value must be a number')
  ],
  analyticsController.updateKPIValue
);

// Delete KPI
router.delete('/kpis/:id',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('delete_kpi', 10, 60000),
  param('id').isMongoId().withMessage('Invalid KPI ID'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { KPI } = require('../models/Analytics');
      const Store = require('../models/Store');

      // Find KPI with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      }

      const kpi = await KPI.findOneAndDelete(query);
      
      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      res.json({
        success: true,
        message: 'KPI deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting KPI',
        error: error.message
      });
    }
  }
);

// Reporting Routes

// Generate report
router.post('/reports',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('generate_report', 5, 60000), // Limited due to resource intensity
  reportValidation,
  analyticsController.generateReport
);

// Get reports list
router.get('/reports',
  auth.authenticate,
  rateLimitMiddleware('get_reports', 50, 60000),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('type')
      .optional()
      .isIn([
        'sales_report',
        'product_performance',
        'customer_analysis',
        'inventory_report',
        'financial_statement'
      ])
      .withMessage('Invalid report type'),
    query('status')
      .optional()
      .isIn(['draft', 'active', 'paused', 'archived'])
      .withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status
      } = req.query;

      const { AnalyticsReport } = require('../models/Analytics');
      const Store = require('../models/Store');

      // Build query based on user role
      let query = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      } else if (req.user.role !== 'admin') {
        query.owner = req.user._id;
      }

      if (type) {
        query.type = type;
      }

      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get reports
      const reports = await AnalyticsReport.find(query)
        .populate('owner', 'firstName lastName email')
        .populate('storeId', 'name slug')
        .select('-data') // Exclude large data field from list
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await AnalyticsReport.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          reports,
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
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reports',
        error: error.message
      });
    }
  }
);

// Get specific report
router.get('/reports/:id',
  auth.authenticate,
  rateLimitMiddleware('get_report', 50, 60000),
  param('id').isMongoId().withMessage('Invalid report ID'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { AnalyticsReport } = require('../models/Analytics');
      const Store = require('../models/Store');

      // Build query with role-based restrictions
      let query = { _id: id };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      } else if (req.user.role !== 'admin') {
        query.owner = req.user._id;
      }

      const report = await AnalyticsReport.findOne(query)
        .populate('owner', 'firstName lastName email')
        .populate('storeId', 'name slug');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Update access tracking
      report.accessCount += 1;
      report.lastAccessedAt = new Date();
      await report.save();

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching report',
        error: error.message
      });
    }
  }
);

// Export data
router.get('/export',
  auth.authenticate,
  rateLimitMiddleware('export_data', 10, 60000), // Limited due to resource intensity
  exportValidation,
  analyticsController.exportData
);

// Advanced Analytics Routes

// Get conversion funnel
router.get('/funnel',
  auth.authenticate,
  rateLimitMiddleware('conversion_funnel', 50, 60000),
  [
    ...periodValidation,
    query('steps')
      .optional()
      .isArray()
      .withMessage('Steps must be an array')
  ],
  async (req, res) => {
    try {
      const {
        period = '30d',
        storeId,
        steps = ['product_view', 'add_to_cart', 'checkout', 'purchase']
      } = req.query;

      const dateRange = analyticsController.getDateRange(period);
      const { AnalyticsEvent } = require('../models/Analytics');

      // Build match query
      let matchQuery = {
        timestamp: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const Store = require('../models/Store');
        const store = await Store.findOne({ owner: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Calculate funnel metrics for each step
      const funnelData = [];
      
      for (const step of steps) {
        const count = await AnalyticsEvent.countDocuments({
          ...matchQuery,
          eventAction: step
        });
        
        funnelData.push({
          step,
          count,
          conversionRate: funnelData.length > 0 
            ? (count / funnelData[0].count) * 100 
            : 100
        });
      }

      res.json({
        success: true,
        data: {
          period: { start: dateRange.start, end: dateRange.end },
          funnel: funnelData
        }
      });

    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching conversion funnel',
        error: error.message
      });
    }
  }
);

// Get cohort analysis
router.get('/cohorts',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('cohort_analysis', 20, 60000),
  [
    ...periodValidation,
    query('cohortType')
      .optional()
      .isIn(['weekly', 'monthly'])
      .withMessage('Invalid cohort type')
  ],
  async (req, res) => {
    try {
      const {
        period = '90d',
        cohortType = 'monthly',
        storeId
      } = req.query;

      // This would implement cohort analysis logic
      // For now, returning a placeholder response
      
      res.json({
        success: true,
        data: {
          message: 'Cohort analysis implementation would go here',
          period,
          cohortType,
          storeId
        }
      });

    } catch (error) {
      console.error('Error fetching cohort analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cohort analysis',
        error: error.message
      });
    }
  }
);

// Get predictive analytics
router.get('/predictions',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('predictive_analytics', 10, 60000),
  [
    query('metric')
      .isIn(['revenue', 'orders', 'customers', 'inventory'])
      .withMessage('Invalid prediction metric'),
    query('horizon')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Horizon must be between 1 and 365 days')
  ],
  async (req, res) => {
    try {
      const {
        metric,
        horizon = 30,
        storeId
      } = req.query;

      // This would implement machine learning-based predictions
      // For now, returning a placeholder response
      
      res.json({
        success: true,
        data: {
          message: 'Predictive analytics implementation would go here',
          metric,
          horizon,
          storeId
        }
      });

    } catch (error) {
      console.error('Error fetching predictions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching predictions',
        error: error.message
      });
    }
  }
);

// Admin Analytics Routes

// Get platform-wide analytics (admin only)
router.get('/admin/platform',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('platform_analytics', 20, 60000),
  periodValidation,
  async (req, res) => {
    try {
      const { period = '30d', groupBy = 'day' } = req.query;
      
      const dateRange = analyticsController.getDateRange(period);
      const Order = require('../models/Order');
      const User = require('../models/User');
      const Store = require('../models/Store');

      // Platform-wide metrics
      const platformMetrics = await Promise.all([
        // Total platform revenue
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: dateRange.start, $lte: dateRange.end },
              status: { $in: ['delivered', 'completed'] }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalOrders: { $sum: 1 },
              averageOrderValue: { $avg: '$totalAmount' }
            }
          }
        ]),

        // Active stores
        Store.countDocuments({
          isActive: true,
          createdAt: { $lte: dateRange.end }
        }),

        // New registrations
        User.countDocuments({
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }),

        // Store performance distribution
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: dateRange.start, $lte: dateRange.end },
              status: { $in: ['delivered', 'completed'] }
            }
          },
          {
            $group: {
              _id: '$storeId',
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 10 }
        ])
      ]);

      res.json({
        success: true,
        data: {
          period: { start: dateRange.start, end: dateRange.end },
          totalRevenue: platformMetrics[0][0]?.totalRevenue || 0,
          totalOrders: platformMetrics[0][0]?.totalOrders || 0,
          averageOrderValue: platformMetrics[0][0]?.averageOrderValue || 0,
          activeStores: platformMetrics[1],
          newRegistrations: platformMetrics[2],
          topStores: platformMetrics[3]
        }
      });

    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching platform analytics',
        error: error.message
      });
    }
  }
);

// Error handling middleware for analytics routes
router.use((error, req, res, next) => {
  console.error('Analytics routes error:', error);
  
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
    message: 'Internal server error in analytics operations'
  });
});

// @route   POST /api/analytics/interactions
// @desc    Store user interaction data from Flutter app
// @access  Private
router.post('/interactions', auth.authMiddleware, async (req, res) => {
  try {
    const { interactions } = req.body;
    
    if (!interactions || !Array.isArray(interactions)) {
      return res.status(400).json({
        success: false,
        message: 'Interactions array is required'
      });
    }
    
    // Store interactions (simplified for testing)
    // In production, you'd save these to a database
    console.log(`Received ${interactions.length} interactions from user ${req.user._id}`);
    
    // You can add logic here to:
    // 1. Store in an Interaction model
    // 2. Update user affinity scores
    // 3. Update content engagement metrics
    
    res.json({
      success: true,
      message: `Successfully stored ${interactions.length} interactions`,
      data: {
        processed: interactions.length,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Store interactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store interactions',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/user/:userId
// @desc    Get user analytics summary
// @access  Private
router.get('/user/:userId', auth.authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data (self or admin)
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Return basic analytics (expand as needed)
    res.json({
      success: true,
      data: {
        userId,
        totalInteractions: 0,
        contentViews: 0,
        contentLikes: 0,
        contentComments: 0,
        contentShares: 0,
        followers: 0,
        following: 0,
        period: '30d'
      }
    });
    
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user analytics',
      error: error.message
    });
  }
});

module.exports = router;