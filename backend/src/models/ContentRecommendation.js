const mongoose = require('mongoose');

const ContentRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  recommendedContent: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    score: Number,
    reason: String,
    rank: Number
  }],
  
  algorithm: {
    type: String,
    enum: ['collaborative', 'content_based', 'hybrid', 'trending', 'personalized'],
    default: 'hybrid'
  },
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  expiresAt: {
    type: Date,
    index: true
  },
  
  version: {
    type: Number,
    default: 1
  },
  
}, {
  timestamps: false
});

ContentRecommendationSchema.index({ userId: 1, generatedAt: -1 });
ContentRecommendationSchema.index({ expiresAt: 1 });

const ContentRecommendation = mongoose.model('ContentRecommendation', ContentRecommendationSchema);

module.exports = ContentRecommendation;

