const mongoose = require('mongoose');

const TrendingConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  
  weights: {
    views: { type: Number, default: 1.0 },
    likes: { type: Number, default: 2.0 },
    comments: { type: Number, default: 1.5 },
    shares: { type: Number, default: 3.0 },
    recency: { type: Number, default: 0.5 }
  },
  
  timeWindow: {
    type: Number,
    default: 24 // hours
  },
  
  minEngagement: {
    type: Number,
    default: 100
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
}, {
  timestamps: true
});

TrendingConfigSchema.index({ category: 1 }, { unique: true });

const TrendingConfig = mongoose.model('TrendingConfig', TrendingConfigSchema);

module.exports = TrendingConfig;

