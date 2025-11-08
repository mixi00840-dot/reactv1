const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  activityType: {
    type: String,
    enum: [
      'login', 'logout', 'view_content', 'create_content',
      'like', 'comment', 'share', 'follow', 'unfollow',
      'purchase', 'gift_sent', 'live_start', 'live_end'
    ],
    required: true,
    index: true
  },
  
  targetId: mongoose.Schema.Types.ObjectId,
  targetType: String,
  
  metadata: mongoose.Schema.Types.Mixed,
  
  device: String,
  ipAddress: String,
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ activityType: 1, timestamp: -1 });

// TTL - keep for 90 days
UserActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const UserActivity = mongoose.model('UserActivity', UserActivitySchema);

module.exports = UserActivity;

