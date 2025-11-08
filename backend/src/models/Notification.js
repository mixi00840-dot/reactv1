const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'like', 'comment', 'follow', 'mention',
      'gift', 'order', 'message', 'live',
      'system', 'promotion', 'achievement',
      'payment', 'review', 'reply', 'share'
    ],
    required: true,
    index: true
  },
  
  // Content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  imageUrl: String,
  
  // Related entities
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  relatedContentId: mongoose.Schema.Types.ObjectId,
  relatedType: {
    type: String,
    enum: ['content', 'livestream', 'order', 'product', 'comment', 'message', 'story']
  },
  
  // Action
  actionUrl: String,
  actionData: mongoose.Schema.Types.Mixed,
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: Date,
  
  // Push notification
  sentViaFCM: {
    type: Boolean,
    default: false
  },
  
  fcmMessageId: String,
  fcmSentAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Expiry (for time-sensitive notifications)
  expiresAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // Manual createdAt only
});

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

// TTL Index - auto-delete old notifications after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get user notifications
NotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { type, limit = 50, page = 1, unreadOnly = false } = options;
  const skip = (page - 1) * limit;
  
  let query = { userId };
  if (type) query.type = type;
  if (unreadOnly) query.isRead = false;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'username fullName avatar');
};

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;

