const mongoose = require('mongoose');

/**
 * Trending Configuration Model
 * Stores admin-configurable weights for trending algorithm
 */

const trendingConfigSchema = new mongoose.Schema({
  weights: {
    watchTime: {
      type: Number,
      default: 0.35,
      min: 0,
      max: 1
    },
    likes: {
      type: Number,
      default: 0.20,
      min: 0,
      max: 1
    },
    shares: {
      type: Number,
      default: 0.20,
      min: 0,
      max: 1
    },
    comments: {
      type: Number,
      default: 0.10,
      min: 0,
      max: 1
    },
    completionRate: {
      type: Number,
      default: 0.10,
      min: 0,
      max: 1
    },
    recency: {
      type: Number,
      default: 0.05,
      min: 0,
      max: 1
    }
  },
  
  thresholds: {
    minViews: {
      type: Number,
      default: 100
    },
    minEngagement: {
      type: Number,
      default: 10
    },
    decayHalfLife: {
      type: Number,
      default: 48,
      description: 'Hours until content loses half its trending score'
    }
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  history: [{
    weights: Object,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Validate weights sum to 1.0
trendingConfigSchema.pre('save', function(next) {
  const weightSum = 
    this.weights.watchTime +
    this.weights.likes +
    this.weights.shares +
    this.weights.comments +
    this.weights.completionRate +
    this.weights.recency;
  
  if (Math.abs(weightSum - 1.0) > 0.01) {
    return next(new Error(`Weights must sum to 1.0 (current sum: ${weightSum.toFixed(2)})`));
  }
  
  next();
});

// Add to history before updating
trendingConfigSchema.pre('save', function(next) {
  if (this.isModified('weights') && !this.isNew) {
    this.history.push({
      weights: this.weights.toObject(),
      updatedBy: this.updatedBy,
      updatedAt: new Date(),
      reason: 'Configuration update'
    });
  }
  next();
});

module.exports = mongoose.models.TrendingConfig || mongoose.model('TrendingConfig', trendingConfigSchema);
