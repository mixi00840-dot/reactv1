const ViewEvent = require('../models/ViewEvent');
const ContentMetrics = require('../models/ContentMetrics');
const Content = require('../models/Content');
const { eventAggregator } = require('../services/eventAggregator');

/**
 * Track Event
 * POST /api/metrics/events/track
 * 
 * Track a user interaction event
 */
exports.trackEvent = async (req, res) => {
  try {
    const {
      eventType,
      contentId,
      sessionId,
      viewData,
      source,
      device,
      location,
      network,
      interactionData
    } = req.body;

    // Validate required fields
    if (!eventType || !contentId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'eventType, contentId, and sessionId are required'
      });
    }

    // Get content to extract creatorId
    const content = await Content.findById(contentId).select('createdBy');
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Create event
    const event = await ViewEvent.create({
      eventType,
      contentId,
      userId: req.user._id,
      creatorId: content.createdBy,
      sessionId,
      viewData,
      source,
      device,
      location,
      network,
      interactionData
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: event._id,
        timestamp: event.timestamp
      }
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      error: error.message
    });
  }
};

/**
 * Track Batch Events
 * POST /api/metrics/events/track-batch
 * 
 * Track multiple events at once (for offline sync)
 */
exports.trackBatchEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'events array is required'
      });
    }

    // Limit batch size
    if (events.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 events per batch'
      });
    }

    // Get all content IDs to fetch creators
    const contentIds = [...new Set(events.map(e => e.contentId))];
    const contents = await Content.find({ _id: { $in: contentIds } })
      .select('_id createdBy');
    
    const contentMap = {};
    contents.forEach(c => {
      contentMap[c._id.toString()] = c.createdBy;
    });

    // Prepare events for insertion
    const eventDocs = events.map(event => ({
      eventType: event.eventType,
      contentId: event.contentId,
      userId: req.user._id,
      creatorId: contentMap[event.contentId],
      sessionId: event.sessionId,
      viewData: event.viewData,
      source: event.source,
      device: event.device,
      location: event.location,
      network: event.network,
      interactionData: event.interactionData,
      timestamp: event.timestamp || new Date()
    }));

    // Insert all events
    const insertedEvents = await ViewEvent.insertMany(eventDocs);

    res.status(201).json({
      success: true,
      data: {
        inserted: insertedEvents.length
      }
    });
  } catch (error) {
    console.error('Track batch events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track batch events',
      error: error.message
    });
  }
};

/**
 * Get Content Metrics
 * GET /api/metrics/content/:contentId
 * 
 * Get detailed metrics for specific content
 */
exports.getContentMetrics = async (req, res) => {
  try {
    const { contentId } = req.params;

    const metrics = await ContentMetrics.findOne({ contentId })
      .populate('contentId', 'type caption media thumbnails status createdBy createdAt');

    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'Metrics not found for this content'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get content metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
};

/**
 * Get Creator Analytics
 * GET /api/metrics/creator/analytics
 * 
 * Get aggregated analytics for logged-in creator
 */
exports.getCreatorAnalytics = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { timeRange = 30 } = req.query; // Days

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Get all content by creator
    const creatorContent = await Content.find({
      createdBy: creatorId,
      status: 'ready',
      createdAt: { $gte: cutoffDate }
    }).select('_id');

    const contentIds = creatorContent.map(c => c._id);

    // Get metrics for all content
    const metrics = await ContentMetrics.find({
      contentId: { $in: contentIds }
    });

    // Aggregate totals
    const totals = metrics.reduce((acc, m) => ({
      totalViews: acc.totalViews + m.views.total,
      uniqueViewers: acc.uniqueViewers + m.views.unique,
      totalLikes: acc.totalLikes + m.engagement.likes,
      totalComments: acc.totalComments + m.engagement.comments,
      totalShares: acc.totalShares + m.engagement.shares,
      totalWatchTime: acc.totalWatchTime + m.watchTime.total
    }), {
      totalViews: 0,
      uniqueViewers: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalWatchTime: 0
    });

    // Calculate averages
    const contentCount = metrics.length;
    const averages = {
      avgViews: contentCount > 0 ? Math.round(totals.totalViews / contentCount) : 0,
      avgLikes: contentCount > 0 ? Math.round(totals.totalLikes / contentCount) : 0,
      avgComments: contentCount > 0 ? Math.round(totals.totalComments / contentCount) : 0,
      avgShares: contentCount > 0 ? Math.round(totals.totalShares / contentCount) : 0,
      avgWatchTime: contentCount > 0 ? Math.round(totals.totalWatchTime / contentCount) : 0
    };

    // Get top performing content
    const topContent = metrics
      .sort((a, b) => b.views.total - a.views.total)
      .slice(0, 10)
      .map(m => ({
        contentId: m.contentId,
        views: m.views.total,
        likes: m.engagement.likes,
        comments: m.engagement.comments,
        shares: m.engagement.shares,
        qualityScore: m.qualityScore.overall
      }));

    // Aggregate demographics
    const topCountries = this.aggregateDemographics(
      metrics.map(m => m.demographics.topCountries)
    );

    res.json({
      success: true,
      data: {
        timeRange,
        contentCount,
        totals,
        averages,
        topContent,
        demographics: {
          topCountries: topCountries.slice(0, 10)
        }
      }
    });
  } catch (error) {
    console.error('Get creator analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator analytics',
      error: error.message
    });
  }
};

/**
 * Get Creator Content Performance
 * GET /api/metrics/creator/content
 * 
 * Get list of creator's content with metrics
 */
exports.getCreatorContentPerformance = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'recent',  // recent, views, engagement, quality
      timeRange = 30
    } = req.query;

    const skip = (page - 1) * limit;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Get creator's content
    const content = await Content.find({
      createdBy: creatorId,
      status: 'ready',
      createdAt: { $gte: cutoffDate }
    }).select('_id type caption media thumbnails createdAt');

    const contentIds = content.map(c => c._id);

    // Get metrics
    const metrics = await ContentMetrics.find({
      contentId: { $in: contentIds }
    });

    // Create content-metrics map
    const metricsMap = {};
    metrics.forEach(m => {
      metricsMap[m.contentId.toString()] = m;
    });

    // Combine content with metrics
    let combined = content.map(c => {
      const m = metricsMap[c._id.toString()];
      return {
        contentId: c._id,
        type: c.type,
        caption: c.caption,
        thumbnail: c.thumbnails?.[0]?.url,
        createdAt: c.createdAt,
        metrics: m ? {
          views: m.views.total,
          likes: m.engagement.likes,
          comments: m.engagement.comments,
          shares: m.engagement.shares,
          completionRate: m.completion.rate,
          engagementRate: m.engagement.rate,
          qualityScore: m.qualityScore.overall,
          velocity: m.velocity.viewsPerHour,
          trend: m.velocity.currentTrend
        } : null
      };
    });

    // Sort
    switch (sortBy) {
      case 'views':
        combined.sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0));
        break;
      case 'engagement':
        combined.sort((a, b) => (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0));
        break;
      case 'quality':
        combined.sort((a, b) => (b.metrics?.qualityScore || 0) - (a.metrics?.qualityScore || 0));
        break;
      case 'recent':
      default:
        combined.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Paginate
    const paginated = combined.slice(skip, skip + limit);
    const total = combined.length;

    res.json({
      success: true,
      data: paginated,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Get creator content performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content performance',
      error: error.message
    });
  }
};

/**
 * Get Trending Content
 * GET /api/metrics/trending
 * 
 * Get currently trending content
 */
exports.getTrendingContent = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const trending = await ContentMetrics.getTrending(parseInt(limit));

    const results = trending.map(m => ({
      contentId: m.contentId._id,
      type: m.contentId.type,
      caption: m.contentId.caption,
      thumbnail: m.contentId.media?.thumbnails?.[0]?.url,
      creator: {
        id: m.contentId.createdBy,
      },
      metrics: {
        views: m.views.total,
        velocity: m.velocity.viewsPerHour,
        trend: m.velocity.currentTrend,
        likes: m.engagement.likes,
        shares: m.engagement.shares,
        qualityScore: m.qualityScore.overall
      }
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get trending content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending content',
      error: error.message
    });
  }
};

/**
 * Get Top Performing Content
 * GET /api/metrics/top-performing
 * 
 * Get top quality content
 */
exports.getTopPerforming = async (req, res) => {
  try {
    const { limit = 50, timeRange = 7 } = req.query;

    const topContent = await ContentMetrics.getTopPerforming(
      parseInt(limit),
      parseInt(timeRange)
    );

    const results = topContent.map(m => ({
      contentId: m.contentId._id,
      type: m.contentId.type,
      caption: m.contentId.caption,
      thumbnail: m.contentId.media?.thumbnails?.[0]?.url,
      creator: {
        id: m.contentId.createdBy,
      },
      metrics: {
        views: m.views.total,
        likes: m.engagement.likes,
        completionRate: m.completion.rate,
        engagementRate: m.engagement.rate,
        qualityScore: m.qualityScore.overall
      }
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get top performing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top performing content',
      error: error.message
    });
  }
};

/**
 * Get User Watch History
 * GET /api/metrics/user/watch-history
 * 
 * Get logged-in user's watch history
 */
exports.getUserWatchHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const history = await ViewEvent.getUserWatchHistory(
      req.user._id,
      parseInt(limit)
    );

    const results = history.map(event => ({
      contentId: event.contentId._id,
      type: event.contentId.type,
      caption: event.contentId.caption,
      thumbnail: event.contentId.thumbnails?.[0]?.url,
      creator: {
        id: event.creatorId._id,
        username: event.creatorId.username,
        fullName: event.creatorId.fullName,
        avatar: event.creatorId.avatar
      },
      watchedAt: event.timestamp
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get watch history',
      error: error.message
    });
  }
};

/**
 * Trigger Event Processing (Admin only)
 * POST /api/metrics/admin/process-events
 * 
 * Manually trigger event aggregation
 */
exports.processEvents = async (req, res) => {
  try {
    const result = await eventAggregator.processEvents();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Process events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process events',
      error: error.message
    });
  }
};

/**
 * Get Platform Statistics (Admin only)
 * GET /api/metrics/admin/stats
 * 
 * Get overall platform metrics
 */
exports.getPlatformStats = async (req, res) => {
  try {
    const { timeRange = 7 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Aggregate platform-wide metrics
    const stats = await ContentMetrics.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views.total' },
          totalUniqueViewers: { $sum: '$views.unique' },
          totalLikes: { $sum: '$engagement.likes' },
          totalComments: { $sum: '$engagement.comments' },
          totalShares: { $sum: '$engagement.shares' },
          totalWatchTime: { $sum: '$watchTime.total' },
          avgCompletionRate: { $avg: '$completion.rate' },
          avgEngagementRate: { $avg: '$engagement.rate' },
          avgQualityScore: { $avg: '$qualityScore.overall' },
          contentCount: { $sum: 1 }
        }
      }
    ]);

    // Get event counts
    const eventCounts = await ViewEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeRange,
        stats: stats[0] || {},
        eventCounts
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform stats',
      error: error.message
    });
  }
};

/**
 * Helper: Aggregate demographics from multiple metrics
 */
exports.aggregateDemographics = function(demographicsArray) {
  const aggregated = {};

  demographicsArray.forEach(demographics => {
    demographics.forEach(item => {
      const key = item.country || item.city;
      if (!aggregated[key]) {
        aggregated[key] = { ...item };
      } else {
        aggregated[key].count += item.count;
      }
    });
  });

  return Object.values(aggregated).sort((a, b) => b.count - a.count);
};
