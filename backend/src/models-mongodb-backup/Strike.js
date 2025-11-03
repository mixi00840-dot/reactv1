const mongoose = require('mongoose');

const strikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['warning', 'strike', 'final_warning'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Strike reason is required'],
    maxlength: [500, 'Reason must not exceed 500 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description must not exceed 1000 characters']
  },
  // Related content (if applicable)
  relatedContentType: {
    type: String,
    enum: ['video', 'post', 'comment', 'profile', 'other'],
    default: 'other'
  },
  relatedContentId: {
    type: String,
    default: null
  },
  // Action taken
  actionTaken: {
    type: String,
    enum: ['content_removed', 'account_suspended', 'account_banned', 'content_hidden', 'feature_restricted', 'warning_issued'],
    required: true
  },
  // Automatic actions
  isAutoStrike: {
    type: Boolean,
    default: false
  },
  autoStrikeRule: String,
  // Admin info
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'appealed', 'overturned', 'expired'],
    default: 'active'
  },
  // Appeal process
  appealSubmittedAt: Date,
  appealReason: String,
  appealStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: undefined
  },
  appealReviewedAt: Date,
  appealReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Expiry (for temporary strikes)
  expiresAt: {
    type: Date,
    default: null
  },
  // Evidence/attachments
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'text', 'url']
    },
    content: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Virtual for user details
strikeSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for admin who issued strike
strikeSchema.virtual('admin', {
  ref: 'User',
  localField: 'issuedBy',
  foreignField: '_id',
  justOne: true
});

// Method to appeal strike
strikeSchema.methods.appeal = function(reason) {
  this.status = 'appealed';
  this.appealSubmittedAt = new Date();
  this.appealReason = reason;
  this.appealStatus = 'pending';
  return this.save();
};

// Method to approve appeal
strikeSchema.methods.approveAppeal = function(adminId) {
  this.status = 'overturned';
  this.appealStatus = 'approved';
  this.appealReviewedAt = new Date();
  this.appealReviewedBy = adminId;
  return this.save();
};

// Method to reject appeal
strikeSchema.methods.rejectAppeal = function(adminId) {
  this.status = 'active';
  this.appealStatus = 'rejected';
  this.appealReviewedAt = new Date();
  this.appealReviewedBy = adminId;
  return this.save();
};

// Static method to count active strikes for user
strikeSchema.statics.countActiveStrikes = function(userId) {
  return this.countDocuments({
    userId,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Index for performance
strikeSchema.index({ userId: 1 });
strikeSchema.index({ status: 1 });
strikeSchema.index({ createdAt: -1 });
strikeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Strike', strikeSchema);