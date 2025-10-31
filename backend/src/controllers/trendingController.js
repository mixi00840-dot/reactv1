const TrendingService = require('../services/trendingService');
const TrendingRecord = require('../models/TrendingRecord');

/**
 * @desc Get global trending content
 * @route GET /api/trending/global
 * @access Public
 */
exports.getGlobalTrending = async (req, res) => {
  try {
    const timeWindow = req.query.window || '24h';
    const limit = parseInt(req.query.limit) || 50;
    
    const trending = await TrendingRecord.getGlobalTrending(timeWindow, limit);
    
    res.status(200).json({
      success: true,
      timeWindow,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending by country
 * @route GET /api/trending/country/:countryCode
 * @access Public
 */
exports.getTrendingByCountry = async (req, res) => {
  try {
    const { countryCode } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const trending = await TrendingRecord.getTrendingByCountry(countryCode, limit);
    
    res.status(200).json({
      success: true,
      country: countryCode,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending by category
 * @route GET /api/trending/category/:category
 * @access Public
 */
exports.getTrendingByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const trending = await TrendingRecord.getTrendingByCategory(category, limit);
    
    res.status(200).json({
      success: true,
      category,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending by hashtag
 * @route GET /api/trending/hashtag/:hashtag
 * @access Public
 */
exports.getTrendingByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const trending = await TrendingRecord.getTrendingByHashtag(hashtag, limit);
    
    res.status(200).json({
      success: true,
      hashtag,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending hashtags
 * @route GET /api/trending/hashtags
 * @access Public
 */
exports.getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const hashtags = await TrendingService.getTrendingHashtags(limit);
    
    res.status(200).json({
      success: true,
      count: hashtags.length,
      data: hashtags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get featured content
 * @route GET /api/trending/featured
 * @access Public
 */
exports.getFeatured = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const featured = await TrendingRecord.getFeatured(limit);
    
    res.status(200).json({
      success: true,
      count: featured.length,
      data: featured
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Generate Explore feed
 * @route GET /api/trending/explore
 * @access Private
 */
exports.getExploreFeed = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const limit = parseInt(req.query.limit) || 20;
    const country = req.query.country;
    const categories = req.query.categories ? req.query.categories.split(',') : [];
    
    const exploreFeed = await TrendingService.generateExploreFeed(userId, {
      limit,
      country,
      categories,
      includeGlobal: true,
      includeGeographic: !!country
    });
    
    res.status(200).json({
      success: true,
      data: exploreFeed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Update trending for content (manual trigger)
 * @route POST /api/trending/update/:contentId
 * @access Private (Admin)
 */
exports.updateTrending = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const result = await TrendingService.updateTrending(contentId, {
      timeWindows: ['24h', '7d'],
      detectGeographic: true,
      detectCategory: true
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Batch update trending
 * @route POST /api/trending/batch-update
 * @access Private (Admin)
 */
exports.batchUpdate = async (req, res) => {
  try {
    const { limit, minViews } = req.body;
    
    const result = await TrendingService.batchUpdateTrending({
      limit: limit || 100,
      minViews: minViews || 100
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Feature content manually
 * @route POST /api/trending/:id/feature
 * @access Private (Admin)
 */
exports.featureContent = async (req, res) => {
  try {
    const trendingId = req.params.id;
    const userId = req.user._id;
    
    const record = await TrendingRecord.findById(trendingId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Trending record not found'
      });
    }
    
    await record.feature(userId);
    
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Pin content to position
 * @route POST /api/trending/:id/pin
 * @access Private (Admin)
 */
exports.pinContent = async (req, res) => {
  try {
    const trendingId = req.params.id;
    const { position } = req.body;
    
    if (!position || position < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid position required'
      });
    }
    
    const record = await TrendingRecord.findById(trendingId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Trending record not found'
      });
    }
    
    await record.pin(position);
    
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Hide content from trending
 * @route POST /api/trending/:id/hide
 * @access Private (Admin)
 */
exports.hideContent = async (req, res) => {
  try {
    const trendingId = req.params.id;
    
    const record = await TrendingRecord.findById(trendingId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Trending record not found'
      });
    }
    
    record.manual.hidden = true;
    await record.save();
    
    res.status(200).json({
      success: true,
      message: 'Content hidden from trending'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending analytics
 * @route GET /api/trending/analytics
 * @access Private (Admin)
 */
exports.getTrendingAnalytics = async (req, res) => {
  try {
    const analytics = await TrendingRecord.aggregate([
      {
        $match: {
          'period.expiresAt': { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$trendingType',
          count: { $sum: 1 },
          avgScore: { $avg: '$scores.overall' },
          totalViews: { $sum: '$metrics.current.views' }
        }
      }
    ]);
    
    const statusBreakdown = await TrendingRecord.aggregate([
      {
        $match: {
          'period.expiresAt': { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        byType: analytics,
        byStatus: statusBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Trending Algorithm Configuration
 * GET /api/trending/config
 */
exports.getTrendingConfig = async (req, res) => {
  try {
    const TrendingConfig = require('../models/TrendingConfig');
    
    let config = await TrendingConfig.findOne().lean();
    
    if (!config) {
      // Return default configuration
      config = {
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
      };
    }

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get trending config error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update Trending Algorithm Weights (Admin)
 * PUT /api/trending/config/weights
 */
exports.updateTrendingWeights = async (req, res) => {
  try {
    const { weights, reason } = req.body;
    const TrendingConfig = require('../models/TrendingConfig');

    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'weights object is required'
      });
    }

    // Validate weights sum to 1.0
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Weights must sum to 1.0 (current sum: ${sum.toFixed(2)})`
      });
    }

    let config = await TrendingConfig.findOne();
    
    if (!config) {
      config = new TrendingConfig({
        weights,
        updatedBy: req.user._id
      });
    } else {
      config.weights = { ...config.weights, ...weights };
      config.updatedBy = req.user._id;
      config.lastUpdated = new Date();
    }

    await config.save();

    res.json({
      success: true,
      message: 'Trending weights updated successfully',
      data: config
    });

  } catch (error) {
    console.error('Update trending weights error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update Trending Thresholds (Admin)
 * PUT /api/trending/config/thresholds
 */
exports.updateTrendingThresholds = async (req, res) => {
  try {
    const { thresholds } = req.body;
    const TrendingConfig = require('../models/TrendingConfig');

    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'thresholds object is required'
      });
    }

    let config = await TrendingConfig.findOne();
    
    if (!config) {
      config = new TrendingConfig({
        thresholds,
        updatedBy: req.user._id
      });
    } else {
      config.thresholds = { ...config.thresholds, ...thresholds };
      config.updatedBy = req.user._id;
      config.lastUpdated = new Date();
    }

    await config.save();

    res.json({
      success: true,
      message: 'Trending thresholds updated successfully',
      data: config
    });

  } catch (error) {
    console.error('Update trending thresholds error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Trending Configuration History
 * GET /api/trending/config/history
 */
exports.getTrendingConfigHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const TrendingConfig = require('../models/TrendingConfig');

    const config = await TrendingConfig.findOne()
      .populate('history.updatedBy', 'username displayName')
      .lean();

    if (!config || !config.history) {
      return res.json({
        success: true,
        data: []
      });
    }

    const history = config.history
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Get trending config history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Calculate Trending Score for Content
 * POST /api/trending/:contentId/calculate
 */
exports.calculateTrendingScore = async (req, res) => {
  try {
    const { contentId } = req.params;
    const Content = require('../models/Content');
    const TrendingConfig = require('../models/TrendingConfig');

    const content = await Content.findById(contentId)
      .populate('userId', 'followers verified')
      .lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Get weights
    const config = await TrendingConfig.findOne().lean();
    const weights = config?.weights || {
      watchTime: 0.35,
      likes: 0.20,
      shares: 0.20,
      comments: 0.10,
      completionRate: 0.10,
      recency: 0.05
    };

    // Calculate component scores
    const scores = {
      watchTime: calculateWatchTimeScore(content),
      likes: calculateLikesScore(content),
      shares: calculateSharesScore(content),
      comments: calculateCommentsScore(content),
      completionRate: content.analytics?.averageWatchPercentage || 0,
      recency: calculateRecencyScore(content, config?.thresholds?.decayHalfLife || 48)
    };

    // Apply weights
    const weightedScore = 
      (scores.watchTime * weights.watchTime) +
      (scores.likes * weights.likes) +
      (scores.shares * weights.shares) +
      (scores.comments * weights.comments) +
      (scores.completionRate * weights.completionRate) +
      (scores.recency * weights.recency);

    // Apply creator multiplier
    const creatorMultiplier = content.userId?.verified ? 1.1 : 1.0;
    const finalScore = weightedScore * creatorMultiplier;

    // Update content
    await Content.findByIdAndUpdate(contentId, {
      'trending.score': Math.round(finalScore * 100) / 100,
      'trending.lastCalculated': new Date(),
      'trending.components': scores
    });

    res.json({
      success: true,
      data: {
        contentId,
        score: finalScore,
        components: scores,
        weights,
        creatorMultiplier
      }
    });

  } catch (error) {
    console.error('Calculate trending score error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper functions for score calculation
function calculateWatchTimeScore(content) {
  const totalWatchMinutes = (content.analytics?.totalWatchTime || 0) / 60;
  if (totalWatchMinutes === 0) return 0;
  const score = (Math.log10(totalWatchMinutes + 1) / Math.log10(1000)) * 100;
  return Math.min(100, Math.max(0, score));
}

function calculateLikesScore(content) {
  const likes = content.analytics?.likes || 0;
  const views = content.analytics?.views || 1;
  const likeRate = likes / views;
  const absoluteScore = (Math.log10(likes + 1) / Math.log10(10000)) * 50;
  const rateScore = (likeRate / 0.1) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateSharesScore(content) {
  const shares = content.analytics?.shares || 0;
  const views = content.analytics?.views || 1;
  const shareRate = shares / views;
  const absoluteScore = (Math.log10(shares + 1) / Math.log10(5000)) * 50;
  const rateScore = (shareRate / 0.05) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateCommentsScore(content) {
  const comments = content.analytics?.comments || 0;
  const views = content.analytics?.views || 1;
  const commentRate = comments / views;
  const absoluteScore = (Math.log10(comments + 1) / Math.log10(2000)) * 50;
  const rateScore = (commentRate / 0.03) * 50;
  const score = absoluteScore + rateScore;
  return Math.min(100, Math.max(0, score));
}

function calculateRecencyScore(content, decayHalfLife = 48) {
  const now = new Date();
  const createdAt = new Date(content.createdAt);
  const hoursOld = (now - createdAt) / (1000 * 60 * 60);
  const score = 100 * Math.pow(0.5, hoursOld / decayHalfLife);
  return Math.max(0, score);
}

module.exports = exports;
