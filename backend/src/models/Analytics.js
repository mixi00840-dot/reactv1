const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    index: true
  },
  
  // Analytics type
  type: {
    type: String,
    enum: ['content_view', 'profile_view', 'search', 'click', 'impression', 'engagement'],
    required: true,
    index: true
  },
  
  // Event data
  event: {
    type: String,
    required: true
  },
  
  // Metrics
  metrics: mongoose.Schema.Types.Mixed,
  
  // Device & location
  device: {
    type: String,
    enum: ['ios', 'android', 'web', 'other']
  },
  
  platform: String,
  appVersion: String,
  
  ipAddress: String,
  country: String,
  city: String,
  
  // Aggregation period
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  hour: Number,
  
}, {
  timestamps: true
});

// Compound indexes for aggregation
AnalyticsSchema.index({ type: 1, date: -1 });
AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ contentId: 1, date: -1 });
AnalyticsSchema.index({ date: -1, type: 1 });

// TTL - keep analytics for 1 year
AnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = Analytics;
