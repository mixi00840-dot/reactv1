const mongoose = require('mongoose');

const ModerationQueueSchema = new mongoose.Schema({
  contentType: {
    type: String,
    enum: ['content', 'comment', 'user', 'product', 'livestream', 'message'],
    required: true,
    index: true
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  reportCount: {
    type: Number,
    default: 1
  },
  
  reasons: [String],
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'removed'],
    default: 'pending',
    index: true
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewNotes: String,
  
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'account_suspended', 'account_banned']
  },
  
  reviewedAt: Date,
  
}, {
  timestamps: true
});

ModerationQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
ModerationQueueSchema.index({ contentType: 1, contentId: 1 });

const ModerationQueue = mongoose.model('ModerationQueue', ModerationQueueSchema);

module.exports = ModerationQueue;

