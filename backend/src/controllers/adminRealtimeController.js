/**
 * Admin Real-Time Controller
 * Handles admin dashboard endpoints for real-time monitoring,
 * AI services, cache statistics, and webhook activity
 */

const Content = require('../models/Content');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const socketService = require('../services/socketService');
const redisCache = require('../services/redisCache');
const vertexAI = require('../services/vertexAI');

/**
 * @desc Get real-time interaction statistics
 * @route GET /api/admin/realtime/stats
 * @access Admin
 */
exports.getRealtimeStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate today's interactions
    const [
      likesToday,
      commentsToday,
      viewsToday,
      sharesTotal
    ] = await Promise.all([
      Like.countDocuments({ createdAt: { $gte: today } }),
      Comment.countDocuments({ createdAt: { $gte: today } }),
      Content.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } }
      ]),
      Content.aggregate([
        { $group: { _id: null, total: { $sum: '$sharesCount' } } }
      ])
    ]);

    // Get Socket.io statistics
    const socketIO = socketService.getIO();
    const connectedClients = socketService.getConnectedClientsCount();
    
    // Get active rooms breakdown
    const roomBreakdown = {};
    if (socketIO && socketIO.sockets && socketIO.sockets.adapter && socketIO.sockets.adapter.rooms) {
      const rooms = socketIO.sockets.adapter.rooms;
      rooms.forEach((sockets, roomName) => {
        if (roomName.startsWith('video_')) {
          roomBreakdown[roomName] = sockets.size;
        }
      });
    }

    const activeRooms = Object.keys(roomBreakdown).length;

    res.json({
      success: true,
      data: {
        interactions: {
          likesToday: likesToday || 0,
          commentsToday: commentsToday || 0,
          viewsToday: viewsToday[0]?.total || 0,
          sharesToday: sharesTotal[0]?.total || 0
        },
        socketIO: {
          enabled: socketIO ? true : false,
          connectedClients: connectedClients || 0,
          activeRooms: activeRooms || 0,
          roomBreakdown: roomBreakdown,
          topRooms: Object.entries(roomBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([room, count]) => ({
              room: room.replace('video_', ''),
              viewers: count
            }))
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get realtime stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching realtime statistics',
      error: error.message
    });
  }
};

/**
 * @desc Get AI moderation statistics
 * @route GET /api/admin/ai/moderation-stats
 * @access Admin
 */
exports.getAIModerationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get moderation statistics
    const [
      contentAnalyzedToday,
      contentWithModeration,
      pendingModeration,
      rejectedContent
    ] = await Promise.all([
      Content.countDocuments({
        moderationScore: { $exists: true, $ne: null },
        createdAt: { $gte: today }
      }),
      Content.countDocuments({
        moderationScore: { $exists: true, $ne: null }
      }),
      Content.countDocuments({
        status: 'pending',
        moderationScore: { $lt: 50 }
      }),
      Content.countDocuments({
        status: 'rejected'
      })
    ]);

    // Get average moderation scores
    const avgScores = await Content.aggregate([
      { $match: { moderationScore: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$moderationScore' },
          minScore: { $min: '$moderationScore' },
          maxScore: { $max: '$moderationScore' }
        }
      }
    ]);

    // Get content flagged by AI tags
    const flaggedByTag = await Content.aggregate([
      { $match: { aiTags: { $exists: true, $ne: [] } } },
      { $unwind: '$aiTags' },
      { $group: { _id: '$aiTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate approval rate
    const approvedCount = contentWithModeration - rejectedContent;
    const approvalRate = contentWithModeration > 0 
      ? ((approvedCount / contentWithModeration) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        today: {
          contentAnalyzed: contentAnalyzedToday || 0,
          approved: contentAnalyzedToday - rejectedContent || 0,
          rejected: rejectedContent || 0,
          avgModerationScore: avgScores[0]?.avgScore?.toFixed(2) || 0
        },
        allTime: {
          totalAnalyzed: contentWithModeration || 0,
          approvalRate: approvalRate,
          avgScore: avgScores[0]?.avgScore?.toFixed(2) || 0,
          minScore: avgScores[0]?.minScore || 0,
          maxScore: avgScores[0]?.maxScore || 0
        },
        queue: pendingModeration || 0,
        topFlags: flaggedByTag.map(f => ({ tag: f._id, count: f.count })),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get AI moderation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI moderation statistics',
      error: error.message
    });
  }
};

/**
 * @desc Get Redis cache statistics
 * @route GET /api/admin/cache/stats
 * @access Admin
 */
exports.getCacheStats = async (req, res) => {
  try {
    // Get Redis health and stats
    const health = await redisCache.healthCheck();
    const stats = await redisCache.getStats();

    res.json({
      success: true,
      data: {
        redis: {
          connected: health.connected,
          status: health.status,
          memoryUsed: stats.used_memory_human || 'N/A',
          memoryPeak: stats.used_memory_peak_human || 'N/A',
          memoryLimit: process.env.REDIS_MAX_MEMORY || '1gb',
          hitRate: stats.hitRate ? `${stats.hitRate.toFixed(2)}%` : 'N/A',
          missRate: stats.missRate ? `${stats.missRate.toFixed(2)}%` : 'N/A',
          keys: stats.db0_keys || 0,
          expiredKeys: stats.expired_keys || 0,
          evictedKeys: stats.evicted_keys || 0,
          connectedClients: stats.connected_clients || 0,
          uptime: stats.uptime_in_seconds 
            ? `${Math.floor(stats.uptime_in_seconds / 86400)}d ${Math.floor((stats.uptime_in_seconds % 86400) / 3600)}h`
            : 'N/A',
          avgResponseTime: stats.avgResponseTime ? `${stats.avgResponseTime.toFixed(2)}ms` : 'N/A'
        },
        cacheMetrics: {
          feedsCached: stats.feedsCached || 0,
          profilesCached: stats.profilesCached || 0,
          trendingCached: stats.trendingCached || 0,
          totalCached: stats.totalCached || 0
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cache statistics',
      error: error.message,
      data: {
        redis: {
          connected: false,
          status: 'error',
          error: error.message
        }
      }
    });
  }
};

/**
 * @desc Get Vertex AI usage statistics
 * @route GET /api/admin/ai/vertex-usage
 * @access Admin
 */
exports.getVertexAIUsage = async (req, res) => {
  try {
    // Check if Vertex AI is enabled
    const enabled = process.env.ENABLE_AI_MODERATION === 'true';
    
    if (!enabled) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          message: 'Vertex AI is currently disabled',
          quotaLimit: 0,
          quotaUsed: 0,
          quotaRemaining: 0,
          requestsToday: 0
        }
      });
    }

    // Get Vertex AI health check
    const health = await vertexAI.healthCheck();

    // Get today's content analyzed with AI
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestsToday = await Content.countDocuments({
      embeddings: { $exists: true, $ne: [] },
      createdAt: { $gte: today }
    });

    // Estimate quota (rough calculation)
    const quotaLimit = 1000000; // Default monthly limit
    const estimatedUsed = requestsToday * 100; // Rough estimate
    const costPerRequest = 0.00001; // ~$0.01 per 1000 requests
    const estimatedCost = (requestsToday * costPerRequest).toFixed(4);

    res.json({
      success: true,
      data: {
        enabled: true,
        status: health.status,
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'mixillo',
        location: process.env.VERTEX_AI_LOCATION || 'us-central1',
        quotaLimit: quotaLimit,
        quotaUsed: estimatedUsed,
        quotaRemaining: quotaLimit - estimatedUsed,
        usagePercentage: ((estimatedUsed / quotaLimit) * 100).toFixed(2),
        requestsToday: requestsToday,
        costEstimate: `$${estimatedCost}`,
        services: {
          textModeration: health.available,
          imageModeration: health.available,
          embeddings: health.available,
          captionGeneration: health.available
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get Vertex AI usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Vertex AI usage',
      error: error.message
    });
  }
};

/**
 * @desc Get webhook activity
 * @route GET /api/admin/webhooks/activity
 * @access Admin
 */
exports.getWebhookActivity = async (req, res) => {
  try {
    // Get recent content processed via webhooks
    const recentContent = await Content.find({
      aiTags: { $exists: true, $ne: [] }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id videoUrl thumbnailUrl aiTags moderationScore feedScore createdAt')
      .lean();

    // Count webhook-processed content
    const totalProcessed = await Content.countDocuments({
      aiTags: { $exists: true, $ne: [] }
    });

    // Get today's processed count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedToday = await Content.countDocuments({
      aiTags: { $exists: true, $ne: [] },
      createdAt: { $gte: today }
    });

    // Get last processed content
    const lastProcessed = recentContent[0];

    res.json({
      success: true,
      data: {
        cloudinary: {
          enabled: process.env.CLOUDINARY_CLOUD_NAME ? true : false,
          webhookUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/cloudinary`,
          lastReceived: lastProcessed?.createdAt || null,
          totalProcessed: totalProcessed || 0,
          processedToday: processedToday || 0,
          errors: 0, // Would need to track this separately
          recentEvents: recentContent.map(content => ({
            contentId: content._id,
            videoUrl: content.videoUrl,
            thumbnailUrl: content.thumbnailUrl,
            aiTags: content.aiTags,
            moderationScore: content.moderationScore,
            feedScore: content.feedScore,
            processedAt: content.createdAt
          }))
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get webhook activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook activity',
      error: error.message
    });
  }
};

/**
 * @desc Get recent content interactions
 * @route GET /api/admin/interactions/recent
 * @access Admin
 */
exports.getRecentInteractions = async (req, res) => {
  try {
    const { type = 'all', limit = 50 } = req.query;

    let interactions = [];

    // Get recent likes
    if (type === 'all' || type === 'like') {
      const likes = await Like.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'username avatar')
        .populate('contentId', 'title videoUrl thumbnailUrl')
        .lean();

      interactions.push(...likes.map(like => ({
        type: 'like',
        contentId: like.contentId?._id,
        contentTitle: like.contentId?.title,
        contentThumbnail: like.contentId?.thumbnailUrl,
        userId: like.userId?._id,
        username: like.userId?.username,
        userAvatar: like.userId?.avatar,
        timestamp: like.createdAt
      })));
    }

    // Get recent comments
    if (type === 'all' || type === 'comment') {
      const comments = await Comment.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('userId', 'username avatar')
        .populate('contentId', 'title videoUrl thumbnailUrl')
        .lean();

      interactions.push(...comments.map(comment => ({
        type: 'comment',
        contentId: comment.contentId?._id,
        contentTitle: comment.contentId?.title,
        contentThumbnail: comment.contentId?.thumbnailUrl,
        userId: comment.userId?._id,
        username: comment.userId?.username,
        userAvatar: comment.userId?.avatar,
        text: comment.text?.substring(0, 100),
        timestamp: comment.createdAt
      })));
    }

    // Sort by timestamp
    interactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    interactions = interactions.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        interactions: interactions,
        total: interactions.length,
        type: type,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Get recent interactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent interactions',
      error: error.message
    });
  }
};

module.exports = exports;
