const mongoose = require('mongoose');

const ContentMetricsSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Daily metrics
  views: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  
  // Watch time
  totalWatchTime: { type: Number, default: 0 }, // seconds
  avgWatchTime: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  
  // Traffic sources
  sources: {
    direct: { type: Number, default: 0 },
    feed: { type: Number, default: 0 },
    search: { type: Number, default: 0 },
    profile: { type: Number, default: 0 },
    hashtag: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Demographics
  demographics: {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  
  // Devices
  devices: {
    ios: { type: Number, default: 0 },
    android: { type: Number, default: 0 },
    web: { type: Number, default: 0 }
  },
  
}, {
  timestamps: false
});

ContentMetricsSchema.index({ contentId: 1, date: -1 }, { unique: true });
ContentMetricsSchema.index({ date: -1 });

const ContentMetrics = mongoose.model('ContentMetrics', ContentMetricsSchema);

module.exports = ContentMetrics;

