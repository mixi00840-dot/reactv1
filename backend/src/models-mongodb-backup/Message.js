const mongoose = require('mongoose');

/**
 * Message Model
 * 
 * Direct messaging system with support for text, media, voice notes,
 * reactions, replies, and read receipts.
 */

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'voice_note', 'sticker', 'gif', 'location', 'content_share'],
    default: 'text'
  },
  
  content: {
    text: String,
    
    // Media messages
    media: {
      url: String,
      thumbnailUrl: String,
      key: String,
      mimeType: String,
      size: Number,
      width: Number,
      height: Number,
      duration: Number, // For audio/video
      waveform: [Number] // For audio visualization
    },
    
    // Voice note
    voiceNote: {
      url: String,
      key: String,
      duration: Number,
      waveform: [Number]
    },
    
    // Sticker/GIF
    sticker: {
      id: String,
      packId: String,
      url: String
    },
    
    // Location
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      placeId: String
    },
    
    // Shared content (video/post)
    sharedContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    }
  },
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivery status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  
  // Encryption
  encrypted: {
    type: Boolean,
    default: false
  },
  
  // Moderation
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: String,
  
  // Soft delete
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  metadata: {
    deviceType: String,
    clientVersion: String,
    ipAddress: String
  }
  
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for reaction counts
messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

// Pre-save: Generate messageId
messageSchema.pre('save', function(next) {
  if (!this.messageId) {
    this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method: Mark as read
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId });
    this.status = 'read';
    await this.save();
  }
  
  return this;
};

// Method: Add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  await this.save();
  
  return this;
};

// Method: Remove reaction
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  await this.save();
  return this;
};

// Method: Soft delete
messageSchema.methods.softDelete = async function(userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
  return this;
};

// Static: Get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, options = {}) {
  const {
    limit = 50,
    before = null, // Message ID to load before
    after = null   // Message ID to load after
  } = options;
  
  let query = { 
    conversation: conversationId,
    deleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  } else if (after) {
    query.createdAt = { $gt: new Date(after) };
  }
  
  return this.find(query)
    .sort({ createdAt: after ? 1 : -1 })
    .limit(limit)
    .populate('sender', 'username avatar fullName')
    .populate('replyTo', 'content.text sender')
    .populate('content.sharedContent', 'title thumbnailUrl');
};

// Static: Get unread count
messageSchema.statics.getUnreadCount = async function(userId, conversationId) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    deleted: false
  });
};

module.exports = mongoose.model('Message', messageSchema);
