const mongoose = require('mongoose');

/**
 * Notification Model
 * 
 * Multi-type notification system with real-time delivery,
 * read tracking, and action links.
 */

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Recipient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
      'like', 'comment', 'mention', 'reply',
      'follow', 'follow_request',
      'share', 'save',
      'live_start', 'story_view', 'story_reply',
      'gift', 'tip',
      'message',
      'system', 'announcement',
      'moderation_warning', 'content_removed'
    ],
    index: true
  },
  
  // Notification sender/actor
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Related content
  relatedContent: {
    contentType: {
      type: String,
      enum: ['content', 'comment', 'story', 'message', 'livestream', 'user']
    },
    contentId: mongoose.Schema.Types.ObjectId
  },
  
  // Notification title and body
  title: {
    type: String,
    required: true
  },
  
  body: {
    type: String,
    required: true
  },
  
  // Thumbnail image
  image: String,
  
  // Action link
  actionUrl: String,
  actionText: String,
  
  // Additional data
  data: mongoose.Schema.Types.Mixed,
  
  // Read status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  
  // Delivery status
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  
  // Push notification
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  
  // Email notification
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Grouping (for batching similar notifications)
  groupKey: String,
  
  // Expiration
  expiresAt: Date
  
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

// Pre-save: Generate notificationId
notificationSchema.pre('save', function(next) {
  if (!this.notificationId) {
    this.notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method: Mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Method: Mark as delivered
notificationSchema.methods.markAsDelivered = async function() {
  if (!this.delivered) {
    this.delivered = true;
    this.deliveredAt = new Date();
    await this.save();
  }
  return this;
};

// Static: Create like notification
notificationSchema.statics.createLikeNotification = async function(userId, actorId, contentId) {
  const Content = mongoose.model('Content');
  const content = await Content.findById(contentId);
  
  if (!content || content.user.toString() === actorId.toString()) {
    return null; // Don't notify self
  }
  
  return this.create({
    user: content.user,
    type: 'like',
    actor: actorId,
    relatedContent: {
      contentType: 'content',
      contentId: contentId
    },
    title: 'New Like',
    body: 'liked your video',
    image: content.thumbnailUrl,
    actionUrl: `/content/${contentId}`,
    groupKey: `like_${contentId}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
};

// Static: Create comment notification
notificationSchema.statics.createCommentNotification = async function(commentId, actorId) {
  const Comment = mongoose.model('Comment');
  const Content = mongoose.model('Content');
  
  const comment = await Comment.findById(commentId).populate('content');
  
  if (!comment || comment.content.user.toString() === actorId.toString()) {
    return null; // Don't notify self
  }
  
  return this.create({
    user: comment.content.user,
    type: 'comment',
    actor: actorId,
    relatedContent: {
      contentType: 'comment',
      contentId: commentId
    },
    title: 'New Comment',
    body: `commented: "${comment.text.substring(0, 50)}..."`,
    image: comment.content.thumbnailUrl,
    actionUrl: `/content/${comment.content._id}?comment=${commentId}`,
    groupKey: `comment_${comment.content._id}`
  });
};

// Static: Create follow notification
notificationSchema.statics.createFollowNotification = async function(userId, followerId) {
  return this.create({
    user: userId,
    type: 'follow',
    actor: followerId,
    title: 'New Follower',
    body: 'started following you',
    actionUrl: `/profile/${followerId}`
  });
};

// Static: Create message notification
notificationSchema.statics.createMessageNotification = async function(messageId, senderId, recipientId) {
  const Message = mongoose.model('Message');
  const message = await Message.findById(messageId);
  
  return this.create({
    user: recipientId,
    type: 'message',
    actor: senderId,
    relatedContent: {
      contentType: 'message',
      contentId: messageId
    },
    title: 'New Message',
    body: message.content.text || '[Media]',
    actionUrl: `/messages/${message.conversation}`,
    priority: 'high'
  });
};

// Static: Create gift notification
notificationSchema.statics.createGiftNotification = async function(giftTransactionId, senderId, recipientId) {
  const GiftTransaction = mongoose.model('GiftTransaction');
  const gift = await GiftTransaction.findById(giftTransactionId).populate('gift');
  
  return this.create({
    user: recipientId,
    type: 'gift',
    actor: senderId,
    title: 'Gift Received',
    body: `sent you ${gift.gift.displayName}`,
    image: gift.gift.media.thumbnailUrl,
    actionUrl: `/gifts`,
    priority: 'high'
  });
};

// Static: Get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    limit = 50,
    unreadOnly = false,
    types = null
  } = options;
  
  const query = { user: userId };
  
  if (unreadOnly) {
    query.read = false;
  }
  
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'username avatar fullName isVerified')
    .lean();
};

// Static: Get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    read: false
  });
};

// Static: Mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

// Static: Delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
