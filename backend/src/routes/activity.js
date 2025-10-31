const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const recommendationService = require('../services/recommendationService');
const ContentRecommendation = require('../models/ContentRecommendation');
const Content = require('../models/Content');
const { protect } = require('../middleware/auth');

// @route   POST /api/activity/track
// @desc    Track user activity
// @access  Private
router.post('/track', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      activityType,
      targetType,
      targetId,
      metadata
    } = req.body;

    if (!activityType || !targetType || !targetId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const activity = new UserActivity({
      user: userId,
      activityType,
      targetType,
      targetId,
      metadata: {
        ...metadata,
        deviceType: req.device?.type,
        os: req.device?.os,
        browser: req.device?.browser
      },
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await activity.save();

    res.json({
      success: true,
      message: 'Activity tracked'
    });

  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/activity/my-activity
// @desc    Get user's activity history
// @access  Private
router.get('/my-activity', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityType, limit = 100 } = req.query;

    const query = { user: userId };
    if (activityType) {
      query.activityType = activityType;
    }

    const activities = await UserActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/activity/recommendations
// @desc    Get personalized content recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, refresh = false } = req.query;

    // Check if we have cached recommendations
    const cached = await ContentRecommendation.findOne({ user: userId });

    if (cached && !refresh && (Date.now() - cached.lastUpdated < 3600000)) {
      // Recommendations are less than 1 hour old
      const content = await Content.find({
        _id: { $in: cached.recommendedContent.map(r => r.content) },
        status: 'active'
      })
        .populate('creator', 'username avatar verified')
        .limit(parseInt(limit));

      return res.json({
        success: true,
        recommendations: content,
        cached: true,
        lastUpdated: cached.lastUpdated
      });
    }

    // Generate fresh recommendations
    const recommendations = await recommendationService.generateRecommendations(
      userId,
      parseInt(limit)
    );

    const content = await Content.find({
      _id: { $in: recommendations.map(r => r.content) }
    }).populate('creator', 'username avatar verified');

    res.json({
      success: true,
      recommendations: content,
      cached: false,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/activity/refresh-recommendations
// @desc    Refresh user recommendations
// @access  Private
router.post('/refresh-recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await recommendationService.generateRecommendations(userId, 50);

    const content = await Content.find({
      _id: { $in: recommendations.map(r => r.content) }
    }).populate('creator', 'username avatar verified');

    res.json({
      success: true,
      message: 'Recommendations refreshed',
      recommendations: content
    });

  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/activity/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await recommendationService.analyzeUserPreferences(userId);

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/activity/analytics
// @desc    Get activity analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const match = { user: userId };
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const analytics = await UserActivity.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          avgWatchTime: { $avg: '$metadata.watchTime' }
        }
      }
    ]);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
