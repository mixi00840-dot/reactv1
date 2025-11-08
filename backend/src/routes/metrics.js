const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const Order = require('../models/Order');
const Analytics = require('../models/Analytics');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Metrics Routes - MongoDB Implementation
 * Platform metrics and overview statistics
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/metrics/overview
 * @desc    Get platform metrics overview
 * @access  Admin
 */
router.get('/overview', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get metrics
    const [
      totalViews,
      activeUsers,
      videosUploaded,
      revenue,
      totalUsers,
      totalContent,
      totalOrders
    ] = await Promise.all([
      Content.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } }
      ]),
      User.countDocuments({
        lastActiveAt: { $gte: startDate },
        status: 'active'
      }),
      Content.countDocuments({
        type: 'video',
        createdAt: { $gte: startDate }
      }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      User.countDocuments(),
      Content.countDocuments(),
      Order.countDocuments()
    ]);

    // Calculate engagement rate
    const totalInteractions = await Content.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: { $add: ['$likesCount', '$commentsCount', '$sharesCount'] } } } }
    ]);

    const totalContentViews = totalViews[0]?.total || 0;
    const engagementRate = totalContentViews > 0 
      ? ((totalInteractions[0]?.total || 0) / totalContentViews * 100).toFixed(2)
      : 0;

    // Calculate average watch time (simplified)
    const avgWatchTime = totalContentViews > 0 
      ? (totalContentViews * 0.4).toFixed(2)  // Placeholder calculation
      : 0;

    res.json({
      success: true,
      data: {
        totalViews: totalContentViews,
        activeUsers: activeUsers,
        videosUploaded: videosUploaded,
        engagementRate: parseFloat(engagementRate),
        avgWatchTime: parseFloat(avgWatchTime),
        revenue: revenue[0]?.total || 0,
        overview: {
          totalUsers,
          totalContent,
          totalOrders
        },
        timeRange
      }
    });

  } catch (error) {
    console.error('Get metrics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics overview',
      error: error.message
    });
  }
});

module.exports = router;

