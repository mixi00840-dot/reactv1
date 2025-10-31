const mongoose = require('mongoose');

const scheduledContentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentType: {
    type: String,
    enum: ['video', 'livestream', 'story', 'post'],
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'publishing', 'published', 'failed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  content: {
    // Pre-uploaded content data
    title: String,
    description: String,
    videoUrl: String,
    thumbnailUrl: String,
    tags: [String],
    category: String,
    visibility: {
      type: String,
      enum: ['public', 'private', 'followers'],
      default: 'public'
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDuet: {
      type: Boolean,
      default: true
    }
  },
  livestreamConfig: {
    // For scheduled livestreams
    streamTitle: String,
    streamDescription: String,
    streamKey: String,
    reminderSent: {
      type: Boolean,
      default: false
    },
    notifyFollowers: {
      type: Boolean,
      default: true
    }
  },
  publishedContentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  publishedAt: Date,
  error: String,
  retryCount: {
    type: Number,
    default: 0
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

// Compound indexes
scheduledContentSchema.index({ creator: 1, scheduledFor: -1 });
scheduledContentSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('ScheduledContent', scheduledContentSchema);
