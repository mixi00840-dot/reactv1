const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // What's being reported
  reportedType: {
    type: String,
    enum: ['content', 'user', 'comment', 'livestream', 'message', 'product', 'store'],
    required: true,
    index: true
  },
  
  reportedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Report details
  reason: {
    type: String,
    enum: [
      'spam', 'harassment', 'hate_speech', 'violence',
      'nudity', 'copyright', 'false_info', 'scam',
      'inappropriate', 'other'
    ],
    required: true
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Evidence
  screenshots: [String],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  
  // Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  
  reviewNotes: String,
  
  // Action taken
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'account_suspended', 'account_banned'],
    default: 'none'
  },
  
}, {
  timestamps: true
});

// Indexes
ReportSchema.index({ reportedType: 1, reportedId: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
