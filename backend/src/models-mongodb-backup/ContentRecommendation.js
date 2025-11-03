const mongoose = require('mongoose');

const contentRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recommendedContent: [{
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    score: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      enum: ['collaborative', 'content_based', 'trending', 'following', 'similar_users', 'category_match']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  userPreferences: {
    favoriteCategories: [String],
    favoriteCreators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    avgWatchTime: Number,
    preferredContentLength: String, // 'short', 'medium', 'long'
    activeHours: [Number], // hours of day user is most active
    engagementRate: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for efficient recommendation retrieval
contentRecommendationSchema.index({ user: 1, lastUpdated: -1 });
contentRecommendationSchema.index({ 'recommendedContent.score': -1 });

module.exports = mongoose.model('ContentRecommendation', contentRecommendationSchema);
