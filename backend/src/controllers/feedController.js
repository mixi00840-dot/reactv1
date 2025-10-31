const ScoringService = require('../services/scoringService');
const UserProfile = require('../models/UserProfile');
const ViewEvent = require('../models/ViewEvent');
const Content = require('../models/Content');

/**
 * @desc Get personalized For You feed
 * @route GET /api/feed/for-you
 * @access Private
 */
exports.getForYouFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const refresh = req.query.refresh === 'true';
    
    const feed = await ScoringService.generateForYouFeed(userId, {
      limit,
      offset,
      refresh
    });
    
    res.status(200).json({
      success: true,
      data: feed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get user profile
 * @route GET /api/feed/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.getOrCreate(userId);
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Update user preferences
 * @route POST /api/feed/preferences
 * @access Private
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topics, languages, contentTypes } = req.body;
    
    const profile = await UserProfile.getOrCreate(userId);
    
    if (topics) {
      profile.preferences.topics = topics.map(topic => ({
        name: topic.name,
        score: topic.score || 1,
        lastInteracted: new Date()
      }));
    }
    
    if (languages) {
      profile.preferences.languages = languages;
    }
    
    if (contentTypes) {
      profile.preferences.contentTypes = {
        ...profile.preferences.contentTypes,
        ...contentTypes
      };
    }
    
    profile.preferences.lastUpdated = new Date();
    await profile.save();
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Record feed interaction
 * @route POST /api/feed/interaction
 * @access Private
 */
exports.recordInteraction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contentId, interactionType, data } = req.body;
    
    if (!contentId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'contentId and interactionType required'
      });
    }
    
    const profile = await UserProfile.getOrCreate(userId);
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Record interaction in profile
    await profile.recordInteraction(interactionType);
    
    // Update preferences based on interaction
    if (['like', 'share', 'view_complete'].includes(interactionType)) {
      const weight = interactionType === 'like' ? 2 : interactionType === 'share' ? 3 : 1;
      await profile.updatePreferences(content, interactionType, weight);
    }
    
    // Track in ViewEvent for analytics
    const viewEvent = new ViewEvent({
      user: userId,
      content: contentId,
      eventType: interactionType,
      watchTime: data?.watchTime || 0,
      completionRate: data?.completionRate || 0,
      metadata: data
    });
    
    await viewEvent.save();
    
    res.status(200).json({
      success: true,
      message: 'Interaction recorded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Mark content as not interested
 * @route POST /api/feed/not-interested/:contentId
 * @access Private
 */
exports.markNotInterested = async (req, res) => {
  try {
    const userId = req.user._id;
    const contentId = req.params.contentId;
    const { reason } = req.body;
    
    const profile = await UserProfile.getOrCreate(userId);
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Mark as seen to avoid showing again
    await profile.markAsSeen(contentId);
    
    // Apply negative signal based on reason
    if (reason === 'seen_before' || reason === 'not_relevant') {
      // Reduce topic scores
      const RecommendationMetadata = require('../models/RecommendationMetadata');
      const metadata = await RecommendationMetadata.findOne({ content: contentId });
      
      if (metadata && metadata.features.topics) {
        for (const topic of metadata.features.topics) {
          const userTopic = profile.preferences.topics.find(t => t.name === topic.name);
          if (userTopic) {
            userTopic.score = Math.max(0, userTopic.score - 0.5);
          }
        }
        await profile.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Feedback recorded'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get feed recommendations with A/B test variant
 * @route GET /api/feed/experiment/:experimentId
 * @access Private
 */
exports.getExperimentalFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const experimentId = req.params.experimentId;
    const variantId = req.query.variant;
    
    const profile = await UserProfile.getOrCreate(userId);
    
    // Check if user is in experiment
    let experiment = profile.experiments.segments.find(
      s => s.experimentId === experimentId && s.active
    );
    
    // Assign to experiment if not already
    if (!experiment) {
      experiment = {
        experimentId,
        variantId: variantId || 'control',
        assignedAt: new Date(),
        active: true
      };
      profile.experiments.segments.push(experiment);
      await profile.save();
    }
    
    // Get feed with experiment-specific parameters
    let feedOptions = {
      limit: 20,
      offset: 0
    };
    
    // Variant-specific options
    if (experiment.variantId === 'high_diversity') {
      feedOptions.diversify = true;
      feedOptions.diversityWeight = 0.5;
    } else if (experiment.variantId === 'trending_boost') {
      feedOptions.boostTrending = true;
      feedOptions.trendingBoost = 1.5;
    }
    
    const feed = await ScoringService.generateForYouFeed(userId, feedOptions);
    
    res.status(200).json({
      success: true,
      data: {
        ...feed,
        experiment: {
          id: experimentId,
          variant: experiment.variantId
        }
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
 * @desc Get feed analytics for user
 * @route GET /api/feed/analytics
 * @access Private
 */
exports.getFeedAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const daysBack = parseInt(req.query.days) || 30;
    
    const profile = await UserProfile.getOrCreate(userId);
    
    // Get interaction stats
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    
    const interactions = await ViewEvent.aggregate([
      {
        $match: {
          user: userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const analytics = {
      profile: {
        sophistication: profile.signals.sophistication,
        engagementTier: profile.signals.engagementTier,
        isColdStart: profile.signals.isColdStart,
        diversityScore: profile.behavior.diversityScore
      },
      
      history: {
        totalViews: profile.history.totalViews,
        totalLikes: profile.history.totalLikes,
        totalShares: profile.history.totalShares,
        last24h: profile.history.last24h,
        last7d: profile.history.last7d
      },
      
      behavior: {
        avgWatchTime: profile.behavior.avgWatchTime,
        completionRate: profile.behavior.completionRate,
        avgSessionLength: profile.behavior.avgSessionLength,
        likeRate: profile.behavior.likeRate,
        shareRate: profile.behavior.shareRate
      },
      
      preferences: {
        topTopics: profile.preferences.topics.slice(0, 10),
        favoriteCreators: profile.preferences.favoriteCreators.slice(0, 10)
      },
      
      recentInteractions: interactions
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Clear feed history (reset recommendations)
 * @route POST /api/feed/reset
 * @access Private
 */
exports.resetFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.getOrCreate(userId);
    
    // Clear seen content
    profile.feedState.seenContent = [];
    profile.feedState.lastFeedUpdate = new Date();
    
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Feed history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
