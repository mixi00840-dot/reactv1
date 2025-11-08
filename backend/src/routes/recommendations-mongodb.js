const express = require('express');
const router = express.Router();
const ContentRecommendation = require('../models/ContentRecommendation');
const RecommendationMetadata = require('../models/RecommendationMetadata');
const Content = require('../models/Content');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Recommendations Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Recommendations API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized recommendations
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.userId;

    // Try to get cached recommendations
    let recommendations = await ContentRecommendation.findOne({
      userId,
      expiresAt: { $gt: new Date() }
    }).populate('recommendedContent.contentId');

    if (!recommendations || recommendations.recommendedContent.length === 0) {
      // Generate new recommendations
      recommendations = await generateRecommendations(userId, limit);
    }

    const content = recommendations.recommendedContent
      .slice(0, parseInt(limit))
      .map(r => r.contentId);

    res.json({
      success: true,
      data: {
        recommendations: content,
        algorithm: recommendations.algorithm
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
});

/**
 * Generate recommendations for user
 */
async function generateRecommendations(userId, limit) {
  // Get user's interaction history
  const userLikes = await Like.find({ userId }).distinct('contentId');
  const userFollows = await Follow.find({ followerId: userId }).distinct('followingId');

  // Find similar content
  const recommendedContent = await Content.find({
    status: 'active',
    isDeleted: false,
    userId: { $in: userFollows },
    _id: { $nin: userLikes }
  })
  .sort({ createdAt: -1, viewsCount: -1 })
  .limit(limit * 2)
  .select('_id viewsCount likesCount');

  // Calculate scores
  const scored = recommendedContent.map((content, index) => ({
    contentId: content._id,
    score: (content.viewsCount * 0.3 + content.likesCount * 0.7) / (index + 1),
    reason: 'based_on_follows',
    rank: index + 1
  }));

  // Create or update recommendations
  const recommendation = await ContentRecommendation.findOneAndUpdate(
    { userId },
    {
      userId,
      recommendedContent: scored.slice(0, limit),
      algorithm: 'collaborative',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    { upsert: true, new: true }
  );

  return recommendation;
}

/**
 * @route   POST /api/recommendations/refresh
 * @desc    Refresh recommendations
 * @access  Private
 */
router.post('/refresh', verifyJWT, async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.userId, 50);

    res.json({
      success: true,
      data: { recommendations },
      message: 'Recommendations refreshed'
    });

  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing recommendations'
    });
  }
});

module.exports = router;

