const mongoose = require('mongoose');

/**
 * Comment Model
 * 
 * Nested comments system with threading, reactions, mentions,
 * and moderation support.
 */

const commentSchema = new mongoose.Schema({
  commentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parent content
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  // Comment author
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Comment text
  text: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Threading: reply to another comment
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  },
  
  // Thread depth (0 for top-level)
  depth: {
    type: Number,
    default: 0,
    max: 5 // Limit nesting depth
  },
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Reactions/Likes
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    }
  },
  
  // Moderation
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: String,
  flaggedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved'
  },
  
  // Pinned by content creator
  pinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  
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
  
  // Edited
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    text: String,
    editedAt: Date
  }]
  
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ content: 1, createdAt: -1 });
commentSchema.index({ content: 1, pinned: -1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ moderationStatus: 1 });

// Pre-save: Generate commentId
commentSchema.pre('save', function(next) {
  if (!this.commentId) {
    this.commentId = `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method: Add like
commentSchema.methods.addLike = async function(userId) {
  const alreadyLiked = this.likes.some(l => l.user.toString() === userId.toString());
  
  if (!alreadyLiked) {
    this.likes.push({ user: userId });
    this.stats.likes = this.likes.length;
    await this.save();
  }
  
  return this;
};

// Method: Remove like
commentSchema.methods.removeLike = async function(userId) {
  this.likes = this.likes.filter(l => l.user.toString() !== userId.toString());
  this.stats.likes = this.likes.length;
  await this.save();
  return this;
};

// Method: Edit comment
commentSchema.methods.edit = async function(newText) {
  // Save edit history
  this.editHistory.push({
    text: this.text,
    editedAt: new Date()
  });
  
  this.text = newText;
  this.edited = true;
  this.editedAt = new Date();
  
  await this.save();
  return this;
};

// Method: Pin comment
commentSchema.methods.pin = async function() {
  this.pinned = true;
  this.pinnedAt = new Date();
  await this.save();
  return this;
};

// Method: Unpin comment
commentSchema.methods.unpin = async function() {
  this.pinned = false;
  this.pinnedAt = null;
  await this.save();
  return this;
};

// Method: Flag comment
commentSchema.methods.flag = async function(userId, reason) {
  if (!this.flaggedBy.includes(userId)) {
    this.flaggedBy.push(userId);
  }
  
  this.flagged = true;
  this.flaggedReason = reason;
  
  // Auto-hide if flagged by multiple users
  if (this.flaggedBy.length >= 5) {
    this.moderationStatus = 'hidden';
  }
  
  await this.save();
  return this;
};

// Method: Soft delete
commentSchema.methods.softDelete = async function(userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
  return this;
};

// Static: Get content comments
commentSchema.statics.getContentComments = function(contentId, options = {}) {
  const {
    limit = 50,
    sortBy = 'createdAt', // or 'likes'
    order = 'desc'
  } = options;
  
  const sortOptions = {};
  sortOptions[sortBy] = order === 'desc' ? -1 : 1;
  
  return this.find({
    content: contentId,
    parentComment: null, // Top-level comments only
    deleted: false,
    moderationStatus: { $in: ['approved', 'pending'] }
  })
    .sort({ pinned: -1, ...sortOptions })
    .limit(limit)
    .populate('user', 'username avatar fullName isVerified')
    .populate({
      path: 'mentions',
      select: 'username'
    });
};

// Static: Get comment replies
commentSchema.statics.getCommentReplies = function(commentId, limit = 20) {
  return this.find({
    parentComment: commentId,
    deleted: false,
    moderationStatus: { $in: ['approved', 'pending'] }
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('user', 'username avatar fullName isVerified');
};

// Static: Get user comments
commentSchema.statics.getUserComments = function(userId, limit = 50) {
  return this.find({
    user: userId,
    deleted: false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('content', 'title thumbnailUrl')
    .populate('user', 'username avatar');
};

// Static: Update reply count
commentSchema.statics.updateReplyCount = async function(commentId) {
  const comment = await this.findById(commentId);
  if (comment) {
    const replyCount = await this.countDocuments({
      parentComment: commentId,
      deleted: false
    });
    
    comment.stats.replies = replyCount;
    await comment.save();
  }
};

module.exports = mongoose.model('Comment', commentSchema);
