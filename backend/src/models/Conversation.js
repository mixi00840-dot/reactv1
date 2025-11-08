const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Conversation type
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  
  // Group chat details
  groupName: String,
  groupAvatar: String,
  groupDescription: String,
  
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Last message
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    type: String,
    timestamp: Date
  },
  
  // Status for each participant
  participantStatus: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    lastReadAt: Date,
    isMuted: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date
  }],
  
  // Settings
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  messagesCount: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

// Indexes
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ 'participantStatus.userId': 1, updatedAt: -1 });
ConversationSchema.index({ updatedAt: -1 });

// Method to add participant
ConversationSchema.methods.addParticipant = async function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    
    this.participantStatus.push({
      userId,
      unreadCount: 0,
      joinedAt: new Date()
    });
    
    return this.save();
  }
};

// Method to remove participant
ConversationSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(id => !id.equals(userId));
  
  const status = this.participantStatus.find(s => s.userId.equals(userId));
  if (status) {
    status.leftAt = new Date();
  }
  
  return this.save();
};

// Method to update unread count
ConversationSchema.methods.incrementUnread = async function(userId) {
  const status = this.participantStatus.find(s => s.userId.equals(userId));
  if (status) {
    status.unreadCount += 1;
    return this.save();
  }
};

// Method to mark as read
ConversationSchema.methods.markAsRead = async function(userId) {
  const status = this.participantStatus.find(s => s.userId.equals(userId));
  if (status) {
    status.unreadCount = 0;
    status.lastReadAt = new Date();
    return this.save();
  }
};

// Static method to find conversation between users
ConversationSchema.statics.findBetweenUsers = function(user1Id, user2Id) {
  return this.findOne({
    type: 'private',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  });
};

// Static method to get user conversations
ConversationSchema.statics.getUserConversations = function(userId, options = {}) {
  const { limit = 50, page = 1, includeArchived = false } = options;
  const skip = (page - 1) * limit;
  
  let match = { participants: userId };
  
  if (!includeArchived) {
    match['participantStatus'] = {
      $not: {
        $elemMatch: {
          userId: userId,
          isArchived: true
        }
      }
    };
  }
  
  return this.find(match)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('participants', 'username fullName avatar isVerified')
    .populate('lastMessage.senderId', 'username fullName');
};

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;

