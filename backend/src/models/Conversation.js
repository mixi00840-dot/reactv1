const mongoose = require('mongoose');

/**
 * Conversation Model
 * 
 * Manages one-on-one and group conversations with participant management,
 * last message tracking, and typing indicators.
 */

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Conversation type
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    
    // Participant settings
    settings: {
      muted: {
        type: Boolean,
        default: false
      },
      mutedUntil: Date,
      notifications: {
        type: Boolean,
        default: true
      }
    },
    
    // Last read
    lastRead: {
      type: Date,
      default: Date.now
    },
    lastReadMessageId: String
  }],
  
  // Group conversation details
  name: String,
  description: String,
  avatar: String,
  
  // Last message
  lastMessage: {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date
  },
  
  // Typing indicators
  typingUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: Date
  }],
  
  // Statistics
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMedia: {
      type: Number,
      default: 0
    }
  },
  
  // Settings
  settings: {
    encrypted: {
      type: Boolean,
      default: false
    },
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: Number // seconds
    }
  },
  
  // Archived
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  
  // Deleted
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
  
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });
conversationSchema.index({ type: 1, archived: 1, deleted: 1 });

// Pre-save: Generate conversationId
conversationSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method: Add participant
conversationSchema.methods.addParticipant = async function(userId, role = 'member') {
  const exists = this.participants.some(p => p.user.toString() === userId.toString());
  
  if (!exists) {
    this.participants.push({ user: userId, role });
    await this.save();
  }
  
  return this;
};

// Method: Remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.leftAt = new Date();
    await this.save();
  }
  
  return this;
};

// Method: Update last message
conversationSchema.methods.updateLastMessage = async function(message) {
  this.lastMessage = {
    message: message._id,
    text: message.content.text || `[${message.type}]`,
    sender: message.sender,
    sentAt: message.createdAt
  };
  
  this.stats.totalMessages += 1;
  if (message.type !== 'text') {
    this.stats.totalMedia += 1;
  }
  
  await this.save();
  return this;
};

// Method: Mark as read
conversationSchema.methods.markAsRead = async function(userId, messageId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.lastRead = new Date();
    if (messageId) {
      participant.lastReadMessageId = messageId;
    }
    await this.save();
  }
  
  return this;
};

// Method: Set typing indicator
conversationSchema.methods.setTyping = async function(userId, isTyping) {
  if (isTyping) {
    // Add or update typing indicator
    const existing = this.typingUsers.find(t => t.user.toString() === userId.toString());
    if (existing) {
      existing.startedAt = new Date();
    } else {
      this.typingUsers.push({ user: userId, startedAt: new Date() });
    }
  } else {
    // Remove typing indicator
    this.typingUsers = this.typingUsers.filter(t => t.user.toString() !== userId.toString());
  }
  
  await this.save();
  return this;
};

// Method: Mute conversation
conversationSchema.methods.mute = async function(userId, duration = null) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.settings.muted = true;
    if (duration) {
      participant.settings.mutedUntil = new Date(Date.now() + duration * 1000);
    }
    await this.save();
  }
  
  return this;
};

// Method: Unmute conversation
conversationSchema.methods.unmute = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.settings.muted = false;
    participant.settings.mutedUntil = null;
    await this.save();
  }
  
  return this;
};

// Static: Get user conversations
conversationSchema.statics.getUserConversations = function(userId, options = {}) {
  const {
    limit = 50,
    includeArchived = false
  } = options;
  
  const query = {
    'participants.user': userId,
    'participants.leftAt': { $exists: false },
    deleted: false
  };
  
  if (!includeArchived) {
    query.archived = false;
  }
  
  return this.find(query)
    .sort({ 'lastMessage.sentAt': -1 })
    .limit(limit)
    .populate('participants.user', 'username avatar fullName isOnline lastSeen')
    .populate('lastMessage.sender', 'username avatar');
};

// Static: Get or create direct conversation
conversationSchema.statics.getOrCreateDirect = async function(user1Id, user2Id) {
  // Check if conversation already exists
  let conversation = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    'participants.leftAt': { $exists: false }
  });
  
  if (!conversation) {
    // Create new conversation
    conversation = await this.create({
      type: 'direct',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ]
    });
  }
  
  return conversation;
};

// Static: Get unread conversations count
conversationSchema.statics.getUnreadCount = async function(userId) {
  const Message = mongoose.model('Message');
  
  const conversations = await this.find({
    'participants.user': userId,
    deleted: false
  }).select('_id participants');
  
  let totalUnread = 0;
  
  for (const conv of conversations) {
    const participant = conv.participants.find(p => p.user.toString() === userId.toString());
    
    const unreadCount = await Message.countDocuments({
      conversation: conv._id,
      sender: { $ne: userId },
      createdAt: { $gt: participant.lastRead },
      deleted: false
    });
    
    totalUnread += unreadCount;
  }
  
  return totalUnread;
};

module.exports = mongoose.model('Conversation', conversationSchema);
