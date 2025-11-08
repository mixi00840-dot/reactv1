const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const Follow = require('../models/Follow');
const ContentRecommendation = require('../models/ContentRecommendation');
const Like = require('../models/Like');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Feed Routes - MongoDB Implementation
 * Personalized content feed
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Feed API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/feed
 * @desc    Get personalized feed
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.userId;

    // Get followed users
    const follows = await Follow.find({ followerId: userId }).distinct('followingId');

    // Get content from followed users
    const followedContent = await Content.find({
      userId: { $in: follows },
      status: 'active',
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * 0.7) // 70% from follows
    .populate('userId', 'username fullName avatar isVerified')
    .populate('soundId', 'title artist audioUrl');

    // Get recommended content
    const recommendations = await ContentRecommendation.findOne({
      userId,
      expiresAt: { $gt: new Date() }
    });

    let recommendedContent = [];
    if (recommendations && recommendations.recommendedContent.length > 0) {
      const recIds = recommendations.recommendedContent
        .slice(0, Math.floor(parseInt(limit) * 0.3))
        .map(r => r.contentId);
      
      recommendedContent = await Content.find({
        _id: { $in: recIds },
        status: 'active',
        isDeleted: false
      })
      .populate('userId', 'username fullName avatar isVerified')
      .populate('soundId', 'title artist audioUrl');
    }

    // Combine and shuffle
    const feed = [...followedContent, ...recommendedContent];
    
    // Simple shuffle
    for (let i = feed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [feed[i], feed[j]] = [feed[j], feed[i]];
    }

    res.json({
      success: true,
      data: {
        feed: feed.slice(0, parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed'
    });
  }
});

/**
 * @route   POST /api/feed/not-interested
 * @desc    Mark content as not interested
 * @access  Private
 */
router.post('/not-interested', verifyJWT, async (req, res) => {
  try {
    const { contentId } = req.body;
    const userId = req.userId;

    // Update recommendation metadata
    let metadata = await RecommendationMetadata.findOne({ userId });

    if (!metadata) {
      metadata = new RecommendationMetadata({ userId });
    }

    if (!metadata.interactions) {
      metadata.interactions = { liked: [], watched: [], notInterested: [] };
    }

    if (!metadata.interactions.notInterested.includes(contentId)) {
      metadata.interactions.notInterested.push(contentId);
      await metadata.save();
    }

    res.json({
      success: true,
      message: 'Marked as not interested'
    });

  } catch (error) {
    console.error('Not interested error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

module.exports = router;

