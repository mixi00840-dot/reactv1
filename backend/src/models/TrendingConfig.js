const mongoose = require('mongoose');

const TrendingConfigSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  // Legacy weights retained + extended weights for UI expectations
  weights: {
    views: { type: Number, default: 1.0 },
    likes: { type: Number, default: 2.0 },
    comments: { type: Number, default: 1.5 },
    shares: { type: Number, default: 3.0 },
    recency: { type: Number, default: 0.5 },
    // Extended
    watchTime: { type: Number, default: 0.35 },
    completionRate: { type: Number, default: 0.10 }
  },
  // Thresholds object expected by admin dashboard
  thresholds: {
    minViews: { type: Number, default: 100 },
    minEngagement: { type: Number, default: 10 },
    decayHalfLife: { type: Number, default: 48 }
  },
  timeWindow: { type: Number, default: 24 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

TrendingConfigSchema.index({ category: 1 }, { unique: true });

const TrendingConfig = mongoose.model('TrendingConfig', TrendingConfigSchema);

module.exports = TrendingConfig;

