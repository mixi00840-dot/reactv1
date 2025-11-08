const mongoose = require('mongoose');

const ViewSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // View details
  watchTime: {
    type: Number,
    default: 0 // seconds
  },
  
  completionRate: {
    type: Number,
    default: 0 // percentage
  },
  
  // Device info
  device: {
    type: String,
    enum: ['ios', 'android', 'web', 'other'],
    default: 'other'
  },
  
  ipAddress: String,
  
  // Location
  country: String,
  city: String,
  
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Indexes
ViewSchema.index({ contentId: 1, viewedAt: -1 });
ViewSchema.index({ userId: 1, viewedAt: -1 });
ViewSchema.index({ viewedAt: -1 });

// TTL Index - keep views for 90 days
ViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const View = mongoose.model('View', ViewSchema);

module.exports = View;
