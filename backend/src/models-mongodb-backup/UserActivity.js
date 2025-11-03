const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: ['view', 'like', 'comment', 'share', 'follow', 'purchase', 'search', 'gift_send', 'stream_join'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['content', 'user', 'product', 'livestream', 'store', 'search'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  metadata: {
    watchTime: Number, // seconds watched
    watchPercentage: Number, // percentage of video watched
    searchQuery: String,
    deviceType: String,
    os: String,
    browser: String,
    location: {
      country: String,
      city: String
    },
    referrer: String
  },
  sessionId: {
    type: String,
    index: true
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for analytics queries
userActivitySchema.index({ user: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });
userActivitySchema.index({ targetType: 1, targetId: 1 });
userActivitySchema.index({ timestamp: -1 });

// TTL index - automatically delete activities older than 90 days
userActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
