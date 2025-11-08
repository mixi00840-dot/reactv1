const mongoose = require('mongoose');

const ScheduledContentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['scheduled', 'published', 'failed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  
  contentData: mongoose.Schema.Types.Mixed, // Draft content data
  
  publishedAt: Date,
  error: String,
  
}, {
  timestamps: true
});

ScheduledContentSchema.index({ status: 1, scheduledFor: 1 });
ScheduledContentSchema.index({ userId: 1, scheduledFor: -1 });

const ScheduledContent = mongoose.model('ScheduledContent', ScheduledContentSchema);

module.exports = ScheduledContent;

