const mongoose = require('mongoose');

const RecommendationMetadataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  preferences: {
    categories: [String],
    creators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    hashtags: [String]
  },
  
  interactions: {
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    watched: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    notInterested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }]
  },
  
  affinityScores: mongoose.Schema.Types.Mixed,
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
}, {
  timestamps: true
});

RecommendationMetadataSchema.index({ userId: 1 }, { unique: true });

const RecommendationMetadata = mongoose.model('RecommendationMetadata', RecommendationMetadataSchema);

module.exports = RecommendationMetadata;

