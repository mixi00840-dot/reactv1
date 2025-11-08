const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const ContentMetrics = require('../models/ContentMetrics');
const UserActivity = require('../models/UserActivity');
const { verifyJWT, requireAdmin, optionalAuth } = require('../middleware/jwtAuth');

/**
 * Analytics Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview
 * @access  Admin
 */
router.get('/overview', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const User = require('../models/User');
    const Content = require('../models/Content');
    const Order = require('../models/Order');

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const ordersQuery = dateQuery.$gte ? { createdAt: dateQuery } : {};
    const revenueMatch = dateQuery.$gte ? { createdAt: dateQuery, status: 'delivered' } : { status: 'delivered' };
    
    const [
      totalUsers,
      activeUsers,
      totalContent,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Content.countDocuments({ status: 'active' }),
      Order.countDocuments(ordersQuery),
      Order.aggregate([
        { $match: revenueMatch },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        content: {
          total: totalContent
        },
        orders: {
          total: totalOrders,
          revenue: totalRevenue[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/content
 * @desc    Get all content analytics
 * @access  Admin
 */
router.get('/content', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const Content = require('../models/Content');
    
    const totalContent = await Content.countDocuments({ status: 'active' });
    const totalViews = await Content.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$viewsCount' } } }
    ]);
    const totalLikes = await Content.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalContent,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/content/:id
 * @desc    Get content analytics
 * @access  Private (Content owner or Admin)
 */
router.get('/content/:id', verifyJWT, async (req, res) => {
  try {
    const Content = require('../models/Content');
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check ownership
    if (!content.userId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get metrics
    const metrics = await ContentMetrics.find({ contentId: req.params.id })
      .sort({ date: -1 })
      .limit(30);

    res.json({
      success: true,
      data: {
        content,
        metrics
      }
    });

  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

/**
 * @route   POST /api/analytics/track
 * @desc    Track analytics event
 * @access  Public
 */
router.post('/track', optionalAuth, async (req, res) => {
  try {
    const { event, type, metrics, contentId } = req.body;

    const analyticsEvent = new Analytics({
      userId: req.userId,
      contentId,
      type,
      event,
      metrics,
      device: req.body.device,
      date: new Date(),
      hour: new Date().getHours(),
      ipAddress: req.ip
    });

    await analyticsEvent.save();

    res.json({
      success: true,
      message: 'Event tracked'
    });

  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking event'
    });
  }
});

/**
 * @route   GET /api/analytics/advanced
 * @desc    Get advanced analytics
 * @access  Admin
 */
router.get('/advanced', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const User = require('../models/User');
    const Content = require('../models/Content');
    const Order = require('../models/Order');
    const Wallet = require('../models/Wallet');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    const periodMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = periodMap[period] || 7;
    startDate.setDate(now.getDate() - days);

    // Advanced metrics
    const [
      userGrowth,
      contentByType,
      topCreators,
      revenueByDay,
      engagementMetrics,
      deviceBreakdown
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Content by type
      Content.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalViews: { $sum: '$viewsCount' },
            totalLikes: { $sum: '$likesCount' }
          }
        }
      ]),
      
      // Top creators
      Content.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            contentCount: { $sum: 1 },
            totalViews: { $sum: '$viewsCount' },
            totalLikes: { $sum: '$likesCount' }
          }
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ]),
      
      // Revenue by day
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Engagement metrics
      Content.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: '$likesCount' },
            avgComments: { $avg: '$commentsCount' },
            avgShares: { $avg: '$sharesCount' },
            avgViews: { $avg: '$viewsCount' }
          }
        }
      ]),
      
      // Device breakdown (placeholder - would come from analytics events)
      Promise.resolve([
        { device: 'mobile', percentage: 65 },
        { device: 'desktop', percentage: 25 },
        { device: 'tablet', percentage: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period,
        userGrowth: userGrowth || [],
        contentByType: contentByType || [],
        topCreators: topCreators || [],
        revenueByDay: revenueByDay || [],
        engagement: engagementMetrics[0] || {
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          avgViews: 0
        },
        deviceBreakdown: deviceBreakdown || []
      }
    });

  } catch (error) {
    console.error('Get advanced analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advanced analytics',
      error: error.message
    });
  }
});

module.exports = router;

