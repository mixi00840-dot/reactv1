const mongoose = require('mongoose');

/**
 * ViewEvent Model
 * 
 * Tracks individual view events for analytics and recommendation engine.
 * Each event represents a user interaction with content.
 * 
 * Event Types:
 * - impression: Content shown in feed
 * - view_start: User started watching
 * - view_progress: Periodic progress updates (every 5 seconds)
 * - view_complete: User watched to completion
 * - pause: User paused
 * - resume: User resumed
 * - seek: User scrubbed timeline
 * - swipe_away: User swiped without watching
 * - like: User liked content
 * - unlike: User unliked
 * - comment: User commented
 * - share: User shared
 * - save: User saved/bookmarked
 * - report: User reported content
 * - not_interested: User marked not interested
 */

const viewEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'impression',
      'view_start',
      'view_progress',
      'view_complete',
      'pause',
      'resume',
      'seek',
      'swipe_away',
      'like',
      'unlike',
      'comment',
      'share',
      'save',
      'unsave',
      'report',
      'not_interested',
      'hide',
      'follow',
      'unfollow'
    ],
    index: true
  },

  // References
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Session tracking
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // View details (for view events)
  viewData: {
    watchTime: Number,              // Seconds watched in this event
    totalWatchTime: Number,         // Cumulative watch time in session
    progress: Number,               // Current position in seconds
    duration: Number,               // Total content duration
    completionPercent: Number,      // 0-100
    isRewatch: Boolean,             // Is this a rewatch?
    loopCount: Number               // How many times auto-looped
  },

  // Source tracking
  source: {
    type: {
      type: String,
      enum: ['for_you', 'following', 'profile', 'hashtag', 'search', 'direct', 'notification', 'other'],
      default: 'for_you'
    },
    referrer: String,               // Previous page/content
    entryPoint: String,             // How user arrived at platform
    campaign: String                // Marketing campaign ID
  },

  // Device & Platform
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'tv'],
      required: true
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true
    },
    model: String,                  // Device model
    os: String,                     // OS version
    appVersion: String,             // App version
    screenSize: String              // e.g., "1920x1080"
  },

  // Location
  location: {
    country: String,                // ISO country code
    countryName: String,
    region: String,                 // State/province
    city: String,
    timezone: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]         // [longitude, latitude]
    }
  },

  // Network info
  network: {
    type: {
      type: String,
      enum: ['wifi', '5g', '4g', '3g', '2g', 'unknown']
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  },

  // Interaction context (for engagement events)
  interactionData: {
    commentText: String,            // For comment events
    shareMethod: String,            // 'native', 'copy_link', 'qr_code', etc.
    reportReason: String,           // For report events
    notInterestedReason: String     // For not_interested events
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Processing flags
  processed: {
    type: Boolean,
    default: false,
    index: true
  },

  aggregated: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false,  // We use custom timestamp field
  collection: 'viewevents'
});

// Compound indexes for efficient queries
viewEventSchema.index({ contentId: 1, eventType: 1, timestamp: -1 });
viewEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
viewEventSchema.index({ sessionId: 1, timestamp: 1 });
viewEventSchema.index({ processed: 1, timestamp: 1 });
viewEventSchema.index({ timestamp: -1 });  // For time-based cleanup
viewEventSchema.index({ 'location.country': 1, timestamp: -1 });  // Geographic analytics

// Geospatial index for location-based queries
viewEventSchema.index({ 'location.coordinates': '2dsphere' });

// TTL index - automatically delete events older than 90 days
viewEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static: Track impression
viewEventSchema.statics.trackImpression = async function(data) {
  return this.create({
    eventType: 'impression',
    contentId: data.contentId,
    userId: data.userId,
    creatorId: data.creatorId,
    sessionId: data.sessionId,
    source: data.source,
    device: data.device,
    location: data.location,
    network: data.network
  });
};

// Static: Track view start
viewEventSchema.statics.trackViewStart = async function(data) {
  return this.create({
    eventType: 'view_start',
    contentId: data.contentId,
    userId: data.userId,
    creatorId: data.creatorId,
    sessionId: data.sessionId,
    viewData: {
      duration: data.duration,
      isRewatch: data.isRewatch || false
    },
    source: data.source,
    device: data.device,
    location: data.location,
    network: data.network
  });
};

// Static: Track view progress
viewEventSchema.statics.trackViewProgress = async function(data) {
  return this.create({
    eventType: 'view_progress',
    contentId: data.contentId,
    userId: data.userId,
    creatorId: data.creatorId,
    sessionId: data.sessionId,
    viewData: {
      watchTime: data.watchTime,
      totalWatchTime: data.totalWatchTime,
      progress: data.progress,
      duration: data.duration,
      completionPercent: Math.round((data.progress / data.duration) * 100),
      loopCount: data.loopCount || 0
    },
    source: data.source,
    device: data.device
  });
};

// Static: Track view complete
viewEventSchema.statics.trackViewComplete = async function(data) {
  return this.create({
    eventType: 'view_complete',
    contentId: data.contentId,
    userId: data.userId,
    creatorId: data.creatorId,
    sessionId: data.sessionId,
    viewData: {
      totalWatchTime: data.totalWatchTime,
      duration: data.duration,
      completionPercent: 100,
      loopCount: data.loopCount || 0
    },
    source: data.source,
    device: data.device
  });
};

// Static: Track engagement (like, share, etc.)
viewEventSchema.statics.trackEngagement = async function(eventType, data) {
  return this.create({
    eventType,
    contentId: data.contentId,
    userId: data.userId,
    creatorId: data.creatorId,
    sessionId: data.sessionId,
    interactionData: data.interactionData,
    source: data.source,
    device: data.device,
    location: data.location
  });
};

// Static: Get unprocessed events
viewEventSchema.statics.getUnprocessed = async function(limit = 1000) {
  return this.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(limit);
};

// Static: Mark events as processed
viewEventSchema.statics.markProcessed = async function(eventIds) {
  return this.updateMany(
    { _id: { $in: eventIds } },
    { $set: { processed: true } }
  );
};

// Static: Get events by content (for analytics)
viewEventSchema.statics.getContentEvents = async function(contentId, options = {}) {
  const query = { contentId };

  if (options.eventType) {
    query.eventType = options.eventType;
  }

  if (options.startDate) {
    query.timestamp = { $gte: options.startDate };
  }

  if (options.endDate) {
    query.timestamp = query.timestamp || {};
    query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 1000);
};

// Static: Get user watch history
viewEventSchema.statics.getUserWatchHistory = async function(userId, limit = 50) {
  return this.find({
    userId,
    eventType: 'view_start'
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('contentId', 'type caption media thumbnails createdBy')
  .populate('creatorId', 'username fullName avatar');
};

// Static: Calculate average watch time for content
viewEventSchema.statics.getAverageWatchTime = async function(contentId) {
  const result = await this.aggregate([
    {
      $match: {
        contentId: mongoose.Types.ObjectId(contentId),
        eventType: 'view_progress',
        'viewData.totalWatchTime': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        maxWatchTime: { $max: '$viewData.totalWatchTime' }
      }
    },
    {
      $group: {
        _id: null,
        avgWatchTime: { $avg: '$maxWatchTime' },
        totalSessions: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { avgWatchTime: 0, totalSessions: 0 };
};

// Static: Get completion rate for content
viewEventSchema.statics.getCompletionRate = async function(contentId) {
  const [totalViews, completedViews] = await Promise.all([
    this.countDocuments({ contentId, eventType: 'view_start' }),
    this.countDocuments({ contentId, eventType: 'view_complete' })
  ]);

  return {
    totalViews,
    completedViews,
    completionRate: totalViews > 0 ? (completedViews / totalViews * 100).toFixed(2) : 0
  };
};

// Static: Cleanup old processed events (beyond TTL)
viewEventSchema.statics.cleanupOld = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
    processed: true,
    aggregated: true
  });

  return result.deletedCount;
};

module.exports = mongoose.model('ViewEvent', viewEventSchema);
