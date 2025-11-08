const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Content
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'gif', 'sticker', 'gift', 'product', 'location'],
    default: 'text'
  },
  
  text: {
    type: String,
    maxlength: 5000
  },
  
  mediaUrl: String,
  thumbnailUrl: String,
  
  // Gift
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift'
  },
  
  // Product share
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  // Location
  location: {
    latitude: Number,
    longitude: Number,
    name: String
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Reply to
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // Manual createdAt only
});

// Compound indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

// Method to mark as read
MessageSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Method to add reaction
MessageSchema.methods.addReaction = async function(userId, emoji) {
  const existing = this.reactions.find(r => r.userId.equals(userId) && r.emoji === emoji);
  
  if (!existing) {
    this.reactions.push({
      userId,
      emoji,
      createdAt: new Date()
    });
    return this.save();
  }
};

// Method to remove reaction
MessageSchema.methods.removeReaction = async function(userId, emoji) {
  this.reactions = this.reactions.filter(r => !(r.userId.equals(userId) && r.emoji === emoji));
  return this.save();
};

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;

