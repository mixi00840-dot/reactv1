const express = require('express');
const router = express.Router();
const TrendingRecord = require('../models/TrendingRecord');
const Content = require('../models/Content');
const Tag = require('../models/Tag');

/**
 * Trending Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Trending API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/trending
 * @desc    Get trending content
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category = 'overall', period = 'daily', limit = 20 } = req.query;

    // Try to get cached trending records
    const latestDate = new Date();
    latestDate.setHours(0, 0, 0, 0); // Start of day

    let trendingRecords = await TrendingRecord.find({
      category,
      period,
      date: { $gte: latestDate }
    })
    .sort({ rank: 1 })
    .limit(parseInt(limit))
    .populate('contentId');

    if (trendingRecords.length === 0) {
      // Generate trending if not cached
      trendingRecords = await generateTrending(category, period, limit);
    }

    const content = trendingRecords.map(r => r.contentId).filter(c => c !== null);

    res.json({
      success: true,
      data: {
        trending: content,
        category,
        period
      }
    });

  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending content'
    });
  }
});

/**
 * Generate trending content
 */
async function generateTrending(category, period, limit) {
  const hoursMap = { hourly: 1, daily: 24, weekly: 168 };
  const hours = hoursMap[period] || 24;
  
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Find trending content
  const trending = await Content.find({
    status: 'active',
    isDeleted: false,
    createdAt: { $gte: startDate },
    viewsCount: { $gte: 100 }
  })
  .sort({ viewsCount: -1, likesCount: -1, commentsCount: -1 })
  .limit(limit);

  // Save trending records
  const records = [];
  for (let i = 0; i < trending.length; i++) {
    const content = trending[i];
    const score = content.viewsCount * 1.0 + content.likesCount * 2.0 + content.commentsCount * 1.5;
    
    const record = new TrendingRecord({
      contentId: content._id,
      rank: i + 1,
      score,
      category,
      period,
      date: new Date(),
      metrics: {
        views: content.viewsCount,
        likes: content.likesCount,
        comments: content.commentsCount,
        shares: content.sharesCount,
        engagementRate: content.engagementRate || 0
      }
    });
    
    await record.save().catch(() => {}); // Don't fail if already exists
    records.push(record);
  }

  return records;
}

/**
 * @route   GET /api/trending/hashtags
 * @desc    Get trending hashtags
 * @access  Public
 */
router.get('/hashtags', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const hashtags = await Tag.find({ isTrending: true, isBlocked: false })
      .sort({ usageCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { hashtags }
    });

  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending hashtags'
    });
  }
});

/**
 * @route   GET /api/trending/sounds
 * @desc    Get trending sounds
 * @access  Public
 */
router.get('/sounds', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const Sound = require('../models/Sound');

    const sounds = await Sound.find({
      status: 'active',
      isTrending: true
    })
    .sort({ trendingScore: -1, usageCount: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { sounds }
    });

  } catch (error) {
    console.error('Get trending sounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending sounds'
    });
  }
});

/**
 * @route   GET /api/trending/analytics
 * @desc    Get trending analytics
 * @access  Admin
 */
router.get('/analytics', async (req, res) => {
  try {
    const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
    
    // Get trending stats
    const totalTrending = await TrendingRecord.countDocuments();
    const trendingByCategory = await TrendingRecord.aggregate([
      { $group: { _id: '$category', count: { $count: {} } } }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalTrending,
        byCategory: trendingByCategory,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get trending analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending analytics'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
const { verifyJWT } = require('../middleware/jwtAuth');
const { requireAdmin } = require('../middleware/jwtAuth');
const TrendingConfig = require('../models/TrendingConfig');

/**
 * @route   GET /api/trending/admin/config
 * @desc    Get trending algorithm configuration (Admin)
 * @access  Admin
 */
router.get('/admin/config', verifyJWT, requireAdmin, async (req, res) => {
  try {
    let config = await TrendingConfig.findOne().sort({ createdAt: -1 });

    if (!config) {
      // Create default config with required category field
      config = new TrendingConfig({
        category: 'default',
        weights: {
          watchTime: 0.35,
          likes: 0.20,
          shares: 0.20,
          comments: 0.10,
          completionRate: 0.10,
          recency: 0.05
        },
        thresholds: {
          minViews: 100,
          minEngagement: 10,
          decayHalfLife: 48
        }
      });
      await config.save();
    }

    res.json({
      success: true,
      data: { config }
    });

  } catch (error) {
    console.error('Get trending config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending configuration'
    });
  }
});

/**
 * @route   PUT /api/trending/admin/config
 * @desc    Update trending algorithm configuration (Admin)
 * @access  Admin
 */
router.put('/admin/config', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { weights, thresholds } = req.body;

    if (!weights || !thresholds) {
      return res.status(400).json({
        success: false,
        message: 'Weights and thresholds are required'
      });
    }

    // Validate weights sum to 1.0
    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Weights must sum to 1.0'
      });
    }

    const config = new TrendingConfig({
      category: 'default',
      weights,
      thresholds,
      updatedBy: req.userId
    });
    await config.save();

    res.json({
      success: true,
      data: { config },
      message: 'Trending configuration updated successfully'
    });

  } catch (error) {
    console.error('Update trending config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trending configuration'
    });
  }
});

/**
 * @route   GET /api/trending/admin/config/history
 * @desc    Get trending configuration history (Admin)
 * @access  Admin
 */
router.get('/admin/config/history', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = await TrendingConfig.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('updatedBy', 'username email');

    res.json({
      success: true,
      data: { history }
    });

  } catch (error) {
    console.error('Get config history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration history'
    });
  }
});

/**
 * @route   POST /api/trending/admin/recalculate
 * @desc    Force recalculation of trending content (Admin)
 * @access  Admin
 */
router.post('/admin/recalculate', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { category = 'overall', period = 'daily' } = req.body;

    // Clear old trending records for this category/period
    await TrendingRecord.deleteMany({ category, period });

    // Generate new trending
    const records = await generateTrending(category, period, 50);

    res.json({
      success: true,
      data: {
        recalculated: records.length,
        category,
        period
      },
      message: 'Trending content recalculated successfully'
    });

  } catch (error) {
    console.error('Recalculate trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating trending'
    });
  }
});

module.exports = router;

