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

module.exports = router;

