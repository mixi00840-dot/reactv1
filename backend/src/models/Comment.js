const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Threading
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Engagement
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  repliesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Moderation
  isHidden: {
    type: Boolean,
    default: false
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  
  // Pinned by creator
  isPinned: {
    type: Boolean,
    default: false
  },
  
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  
  deletedAt: Date,
  
}, {
  timestamps: true
});

// Compound indexes
CommentSchema.index({ contentId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: -1 });
CommentSchema.index({ contentId: 1, isPinned: -1, likesCount: -1 });

// Static method to get top comments
CommentSchema.statics.getTopComments = function(contentId, limit = 10) {
  return this.find({
    contentId,
    parentId: null, // Only top-level comments
    isHidden: false
  })
  .sort({ isPinned: -1, likesCount: -1, createdAt: -1 })
  .limit(limit)
  .populate('userId', 'username fullName avatar isVerified');
};

// Static method to get replies
CommentSchema.statics.getReplies = function(parentId, limit = 20) {
  return this.find({
    parentId,
    isHidden: false
  })
  .sort({ createdAt: 1 })
  .limit(limit)
  .populate('userId', 'username fullName avatar isVerified');
};

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;

