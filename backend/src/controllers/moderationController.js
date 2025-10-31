const ModerationResult = require('../models/ModerationResult');
const ModerationQueue = require('../models/ModerationQueue');
const Content = require('../models/Content');
const moderationService = require('../services/moderationService');
const sightengineService = require('../services/sightengineService');
const AIModeration = require('../models/AIModeration');

/**
 * Trigger Content Moderation
 * POST /api/moderation/moderate/:contentId
 * 
 * Manually trigger moderation for specific content (admin only)
 */
exports.moderateContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await moderationService.moderateContent(contentId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Moderate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate content',
      error: error.message
    });
  }
};

/**
 * Get Moderation Result
 * GET /api/moderation/result/:contentId
 * 
 * Get moderation result for specific content
 */
exports.getModerationResult = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await ModerationResult.findOne({ contentId })
      .populate('contentId', 'type caption media thumbnails status')
      .populate('creatorId', 'username fullName avatar')
      .populate('manualReview.reviewer', 'username fullName')
      .populate('appeal.appealReviewer', 'username fullName');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Moderation result not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get moderation result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation result',
      error: error.message
    });
  }
};

/**
 * Get Moderation Queue
 * GET /api/moderation/queue
 * 
 * Get items in moderation queue (admin only)
 */
exports.getQueue = async (req, res) => {
  try {
    const { 
      priorityLevel,
      status = 'pending',
      limit = 50,
      page = 1
    } = req.query;

    const query = { status };
    if (priorityLevel) {
      query.priorityLevel = priorityLevel;
    }

    const skip = (page - 1) * limit;

    const items = await ModerationQueue.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('contentId', 'type caption media thumbnails')
      .populate('creatorId', 'username fullName avatar strikeCount')
      .populate('moderationResultId')
      .populate('assignedTo', 'username fullName');

    const total = await ModerationQueue.countDocuments(query);

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        hasMore: skip + items.length < total
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation queue',
      error: error.message
    });
  }
};

/**
 * Get Next Queue Item
 * GET /api/moderation/queue/next
 * 
 * Get next item for moderator to review
 */
exports.getNextItem = async (req, res) => {
  try {
    const item = await ModerationQueue.getNext(req.user._id);

    if (!item) {
      return res.json({
        success: true,
        data: null,
        message: 'Queue is empty'
      });
    }

    // Auto-assign to current moderator
    await item.assign(req.user._id);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get next item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next item',
      error: error.message
    });
  }
};

/**
 * Review Content
 * POST /api/moderation/review/:queueId
 * 
 * Submit review decision for queue item
 */
exports.reviewContent = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { decision, reason, categories, notes } = req.body;

    // Validate decision
    if (!['approve', 'reject', 'escalate'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be: approve, reject, or escalate'
      });
    }

    // Get queue item
    const queueItem = await ModerationQueue.findById(queueId)
      .populate('moderationResultId');

    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }

    // Check if assigned to current moderator
    if (queueItem.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This item is not assigned to you'
      });
    }

    const moderationResult = queueItem.moderationResultId;

    // Apply decision
    if (decision === 'approve') {
      await moderationResult.approve(req.user._id, notes);
      await queueItem.complete();
      
    } else if (decision === 'reject') {
      await moderationResult.reject(req.user._id, reason, categories || []);
      await queueItem.complete();
      
    } else if (decision === 'escalate') {
      await queueItem.escalate(reason);
      queueItem.notes = notes;
      await queueItem.save();
    }

    res.json({
      success: true,
      data: {
        queueItem,
        moderationResult
      }
    });
  } catch (error) {
    console.error('Review content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review content',
      error: error.message
    });
  }
};

/**
 * Submit Appeal
 * POST /api/moderation/appeal/:contentId
 * 
 * Creator submits appeal for rejected content
 */
exports.submitAppeal = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { appealReason, appealNotes } = req.body;

    if (!appealReason) {
      return res.status(400).json({
        success: false,
        message: 'Appeal reason is required'
      });
    }

    // Get moderation result
    const moderationResult = await ModerationResult.findOne({ contentId });

    if (!moderationResult) {
      return res.status(404).json({
        success: false,
        message: 'Moderation result not found'
      });
    }

    // Check if user owns the content
    if (moderationResult.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only appeal your own content'
      });
    }

    // Submit appeal
    await moderationResult.submitAppeal(appealReason, appealNotes);

    // Add back to queue with high priority
    const content = await Content.findById(contentId);
    await ModerationQueue.addToQueue(
      contentId,
      moderationResult._id,
      moderationResult.creatorId,
      'appeal_submitted',
      {
        automatedScore: moderationResult.automated.confidence,
        userReportCount: 0,
        creatorStrikeCount: 0,
        previousViolations: moderationResult.violations.length,
        viralityScore: 0
      }
    );

    res.json({
      success: true,
      data: moderationResult,
      message: 'Appeal submitted successfully'
    });
  } catch (error) {
    console.error('Submit appeal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit appeal',
      error: error.message
    });
  }
};

/**
 * Review Appeal
 * POST /api/moderation/appeal/:contentId/review
 * 
 * Admin reviews appeal (admin only)
 */
exports.reviewAppeal = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { decision, resolution } = req.body;

    if (!['upheld', 'overturned'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be: upheld or overturned'
      });
    }

    const moderationResult = await ModerationResult.findOne({ contentId });

    if (!moderationResult) {
      return res.status(404).json({
        success: false,
        message: 'Moderation result not found'
      });
    }

    if (!moderationResult.appeal.hasAppeal) {
      return res.status(400).json({
        success: false,
        message: 'No appeal found for this content'
      });
    }

    await moderationResult.resolveAppeal(req.user._id, decision, resolution);

    // Complete queue item
    const queueItem = await ModerationQueue.findOne({
      contentId,
      status: { $in: ['pending', 'assigned', 'in_review'] }
    });
    
    if (queueItem) {
      await queueItem.complete();
    }

    res.json({
      success: true,
      data: moderationResult,
      message: `Appeal ${decision}`
    });
  } catch (error) {
    console.error('Review appeal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review appeal',
      error: error.message
    });
  }
};

/**
 * Get Queue Statistics
 * GET /api/moderation/stats
 * 
 * Get moderation queue statistics (admin only)
 */
exports.getStats = async (req, res) => {
  try {
    const queueStats = await ModerationQueue.getQueueStats();
    const moderationStats = await ModerationResult.getStats(7);

    const stats = {
      queue: queueStats,
      moderation: moderationStats,
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

/**
 * Get Pending Appeals
 * GET /api/moderation/appeals
 * 
 * Get list of pending appeals (admin only)
 */
exports.getPendingAppeals = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const appeals = await ModerationResult.getPendingAppeals(parseInt(limit));

    res.json({
      success: true,
      data: appeals
    });
  } catch (error) {
    console.error('Get pending appeals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending appeals',
      error: error.message
    });
  }
};

/**
 * Get High Risk Content
 * GET /api/moderation/high-risk
 * 
 * Get high-risk content needing review (admin only)
 */
exports.getHighRisk = async (req, res) => {
  try {
    const { threshold = 70, limit = 50 } = req.query;

    const highRisk = await ModerationResult.getHighRisk(
      parseInt(threshold),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: highRisk
    });
  } catch (error) {
    console.error('Get high risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get high-risk content',
      error: error.message
    });
  }
};

/**
 * Get Moderator Dashboard
 * GET /api/moderation/dashboard
 * 
 * Get moderator's personal dashboard
 */
exports.getModeratorDashboard = async (req, res) => {
  try {
    const moderatorId = req.user._id;

    // Get assigned items
    const assigned = await ModerationQueue.getAssigned(moderatorId, 20);

    // Get completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await ModerationQueue.countDocuments({
      assignedTo: moderatorId,
      status: 'completed',
      reviewCompletedAt: { $gte: todayStart }
    });

    // Get average review time
    const reviewStats = await ModerationQueue.aggregate([
      {
        $match: {
          assignedTo: moderatorId,
          status: 'completed',
          reviewDuration: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgReviewTime: { $avg: '$reviewDuration' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        assigned,
        stats: {
          completedToday,
          avgReviewTime: reviewStats[0]?.avgReviewTime || 0,
          totalReviews: reviewStats[0]?.totalReviews || 0
        }
      }
    });
  } catch (error) {
    console.error('Get moderator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard',
      error: error.message
    });
  }
};

/**
 * Sightengine AI Moderation - Image
 * POST /api/moderation/sightengine/image
 * 
 * Moderate image using Sightengine AI
 */
exports.moderateImageSightengine = async (req, res) => {
  try {
    const { imageUrl, contentId } = req.body;
    
    if (!imageUrl || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl and contentId are required'
      });
    }

    const result = await sightengineService.moderateImage(
      imageUrl,
      contentId,
      req.user._id
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Sightengine image moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate image',
      error: error.message
    });
  }
};

/**
 * Sightengine AI Moderation - Video
 * POST /api/moderation/sightengine/video
 * 
 * Moderate video using Sightengine AI
 */
exports.moderateVideoSightengine = async (req, res) => {
  try {
    const { videoUrl, contentId, interval } = req.body;
    
    if (!videoUrl || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'videoUrl and contentId are required'
      });
    }

    const result = await sightengineService.moderateVideo(
      videoUrl,
      contentId,
      req.user._id,
      { interval }
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Sightengine video moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate video',
      error: error.message
    });
  }
};

/**
 * Sightengine AI Moderation - Text
 * POST /api/moderation/sightengine/text
 * 
 * Moderate text using Sightengine AI
 */
exports.moderateTextSightengine = async (req, res) => {
  try {
    const { text, contentId } = req.body;
    
    if (!text || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'text and contentId are required'
      });
    }

    const result = await sightengineService.moderateText(
      text,
      contentId,
      req.user._id
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Sightengine text moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate text',
      error: error.message
    });
  }
};

/**
 * Sightengine AI Moderation - Batch
 * POST /api/moderation/sightengine/batch
 * 
 * Moderate multiple items in batch
 */
exports.moderateBatchSightengine = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required'
      });
    }

    const results = await sightengineService.moderateBatch(items, req.user._id);

    res.json({
      success: true,
      data: {
        total: items.length,
        results
      }
    });

  } catch (error) {
    console.error('Sightengine batch moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate batch',
      error: error.message
    });
  }
};

/**
 * Update Sightengine Thresholds
 * PUT /api/moderation/sightengine/thresholds
 * 
 * Update moderation thresholds (Admin only)
 */
exports.updateSightengineThresholds = async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'thresholds object is required'
      });
    }

    const updatedThresholds = sightengineService.updateThresholds(thresholds);

    res.json({
      success: true,
      message: 'Thresholds updated',
      data: { thresholds: updatedThresholds }
    });

  } catch (error) {
    console.error('Update Sightengine thresholds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thresholds',
      error: error.message
    });
  }
};

/**
 * Get Sightengine Configuration
 * GET /api/moderation/sightengine/config
 * 
 * Get Sightengine configuration and status
 */
exports.getSightengineConfig = async (req, res) => {
  try {
    const config = sightengineService.getConfig();

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get Sightengine config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get config',
      error: error.message
    });
  }
};
