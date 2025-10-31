const mongoose = require('mongoose');

/**
 * TrendingRecord Model
 * 
 * Tracks trending content using multi-signal velocity detection,
 * geographic trending, and time-based trending calculations.
 * 
 * Key Features:
 * - Velocity-based trending detection (views, engagement growth)
 * - Geographic trending (country, city-level)
 * - Category/hashtag trending
 * - Manual feature controls for editorial picks
 * - Time-windowed trending (hourly, daily, weekly)
 */

const trendingRecordSchema = new mongoose.Schema({
  // Content Reference
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  // Trending Type
  trendingType: {
    type: String,
    enum: ['global', 'geographic', 'category', 'hashtag', 'featured'],
    default: 'global',
    index: true
  },
  
  // Geographic Scope (if applicable)
  geography: {
    country: String, // ISO country code
    city: String,
    region: String
  },
  
  // Category/Hashtag (if applicable)
  category: String,
  hashtag: String,
  
  // Trending Scores
  scores: {
    // Overall trending score (0-100)
    overall: {
      type: Number,
      default: 0,
      index: -1 // Descending index for sorting
    },
    
    // Velocity score (growth rate)
    velocity: {
      type: Number,
      default: 0
    },
    
    // Engagement score
    engagement: {
      type: Number,
      default: 0
    },
    
    // Virality score
    virality: {
      type: Number,
      default: 0
    },
    
    // Momentum score (sustained growth)
    momentum: {
      type: Number,
      default: 0
    },
    
    // Recency boost
    recency: {
      type: Number,
      default: 1
    }
  },
  
  // Metrics Snapshot
  metrics: {
    // Current metrics
    current: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    },
    
    // Previous snapshot (for velocity calculation)
    previous: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      timestamp: Date
    },
    
    // Growth rates (per hour)
    growth: {
      viewsPerHour: { type: Number, default: 0 },
      likesPerHour: { type: Number, default: 0 },
      sharesPerHour: { type: Number, default: 0 },
      commentsPerHour: { type: Number, default: 0 }
    },
    
    lastUpdated: Date
  },
  
  // Time Window
  timeWindow: {
    type: String,
    enum: ['1h', '6h', '24h', '7d', '30d'],
    default: '24h',
    index: true
  },
  
  // Ranking Position
  rank: {
    current: Number,
    previous: Number,
    peak: Number,
    peakDate: Date
  },
  
  // Trending Status
  status: {
    type: String,
    enum: ['rising', 'trending', 'peak', 'declining', 'expired'],
    default: 'rising',
    index: true
  },
  
  // Manual Controls
  manual: {
    featured: {
      type: Boolean,
      default: false
    },
    
    featuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    featuredAt: Date,
    
    pinned: {
      type: Boolean,
      default: false
    },
    
    pinnedPosition: Number,
    
    hidden: {
      type: Boolean,
      default: false
    },
    
    boost: {
      type: Number,
      default: 0,
      min: -50,
      max: 50
    }
  },
  
  // Trending Period
  period: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    
    peakedAt: Date,
    
    expiresAt: {
      type: Date,
      index: true
    },
    
    duration: Number // milliseconds
  },
  
  // Audience Demographics
  demographics: {
    topCountries: [{
      code: String,
      percentage: Number,
      views: Number
    }],
    
    topCities: [{
      name: String,
      country: String,
      views: Number
    }],
    
    ageGroups: [{
      range: String,
      percentage: Number
    }]
  },
  
  // Trending Indicators
  indicators: {
    isBreakout: Boolean,      // Sudden spike
    isSustained: Boolean,      // Consistent growth
    isViral: Boolean,          // Exponential spread
    isSeasonal: Boolean,       // Seasonal pattern
    isPeaking: Boolean,        // At peak now
    isDecaying: Boolean        // Declining
  },
  
  // Historical Data (snapshots)
  history: [{
    timestamp: Date,
    rank: Number,
    score: Number,
    views: Number,
    engagement: Number
  }]
  
}, {
  timestamps: true
});

// Compound indexes for efficient queries
trendingRecordSchema.index({ trendingType: 1, 'scores.overall': -1 });
trendingRecordSchema.index({ trendingType: 1, timeWindow: 1, 'scores.overall': -1 });
trendingRecordSchema.index({ 'geography.country': 1, 'scores.overall': -1 });
trendingRecordSchema.index({ category: 1, 'scores.overall': -1 });
trendingRecordSchema.index({ hashtag: 1, 'scores.overall': -1 });
trendingRecordSchema.index({ status: 1, 'scores.overall': -1 });
trendingRecordSchema.index({ 'period.expiresAt': 1 });

// TTL index to auto-remove expired records
trendingRecordSchema.index({ 'period.expiresAt': 1 }, { expireAfterSeconds: 0 });

// ============= INSTANCE METHODS =============

/**
 * Update metrics and recalculate scores
 */
trendingRecordSchema.methods.updateMetrics = async function(currentMetrics) {
  // Store previous as snapshot
  this.metrics.previous = {
    views: this.metrics.current.views,
    likes: this.metrics.current.likes,
    shares: this.metrics.current.shares,
    comments: this.metrics.current.comments,
    timestamp: this.metrics.lastUpdated || new Date()
  };
  
  // Update current
  this.metrics.current = currentMetrics;
  
  // Calculate growth rates
  if (this.metrics.previous.timestamp) {
    const hoursSince = (Date.now() - this.metrics.previous.timestamp) / (1000 * 60 * 60);
    
    if (hoursSince > 0) {
      this.metrics.growth.viewsPerHour = (currentMetrics.views - this.metrics.previous.views) / hoursSince;
      this.metrics.growth.likesPerHour = (currentMetrics.likes - this.metrics.previous.likes) / hoursSince;
      this.metrics.growth.sharesPerHour = (currentMetrics.shares - this.metrics.previous.shares) / hoursSince;
      this.metrics.growth.commentsPerHour = (currentMetrics.comments - this.metrics.previous.comments) / hoursSince;
    }
  }
  
  this.metrics.lastUpdated = new Date();
  
  // Recalculate scores
  this.calculateScores();
  
  await this.save();
};

/**
 * Calculate trending scores
 */
trendingRecordSchema.methods.calculateScores = function() {
  // Velocity Score (growth rate importance)
  const viewVelocity = Math.log(this.metrics.growth.viewsPerHour + 1) * 10;
  const engagementVelocity = 
    (this.metrics.growth.likesPerHour * 5) +
    (this.metrics.growth.sharesPerHour * 10) +
    (this.metrics.growth.commentsPerHour * 3);
  
  this.scores.velocity = Math.min(viewVelocity + engagementVelocity, 100);
  
  // Engagement Score
  const totalViews = this.metrics.current.views || 1;
  const engagementRate = 
    (this.metrics.current.likes + this.metrics.current.shares + this.metrics.current.comments) / totalViews;
  
  this.scores.engagement = Math.min(engagementRate * 100, 100);
  
  // Virality Score (share rate)
  const shareRate = this.metrics.current.shares / totalViews;
  this.scores.virality = Math.min(shareRate * 500, 100);
  
  // Momentum Score (sustained growth)
  if (this.history.length >= 3) {
    const recentGrowth = this.history.slice(-3).map(h => h.views);
    const isGrowing = recentGrowth.every((val, i) => i === 0 || val > recentGrowth[i - 1]);
    this.scores.momentum = isGrowing ? 100 : 50;
  }
  
  // Recency Boost (decay over time)
  const ageHours = (Date.now() - this.period.startedAt) / (1000 * 60 * 60);
  this.scores.recency = Math.exp(-ageHours / 24); // 24-hour half-life
  
  // Overall Score (weighted combination)
  this.scores.overall = Math.min(
    this.scores.velocity * 0.35 +
    this.scores.engagement * 0.25 +
    this.scores.virality * 0.20 +
    this.scores.momentum * 0.10 +
    this.scores.recency * 100 * 0.10 +
    this.manual.boost,
    100
  );
  
  // Update indicators
  this.updateIndicators();
};

/**
 * Update trending indicators
 */
trendingRecordSchema.methods.updateIndicators = function() {
  // Breakout: sudden spike in velocity
  this.indicators.isBreakout = this.scores.velocity > 80;
  
  // Sustained: consistent momentum
  this.indicators.isSustained = this.scores.momentum > 70;
  
  // Viral: high share rate
  this.indicators.isViral = this.scores.virality > 70;
  
  // Peaking: at or near peak score
  if (!this.rank.peak || this.scores.overall >= this.rank.peak * 0.95) {
    this.indicators.isPeaking = true;
    this.rank.peak = Math.max(this.rank.peak || 0, this.scores.overall);
    this.rank.peakDate = new Date();
  }
  
  // Decaying: score dropping
  if (this.history.length >= 2) {
    const recentScores = this.history.slice(-2).map(h => h.score);
    this.indicators.isDecaying = recentScores[1] < recentScores[0] * 0.9;
  }
  
  // Update status
  if (this.indicators.isPeaking && this.scores.overall > 80) {
    this.status = 'peak';
  } else if (this.indicators.isDecaying) {
    this.status = 'declining';
  } else if (this.scores.overall > 60) {
    this.status = 'trending';
  } else {
    this.status = 'rising';
  }
};

/**
 * Add to history
 */
trendingRecordSchema.methods.addToHistory = async function() {
  this.history.push({
    timestamp: new Date(),
    rank: this.rank.current,
    score: this.scores.overall,
    views: this.metrics.current.views,
    engagement: this.metrics.current.likes + this.metrics.current.shares
  });
  
  // Keep only last 100 snapshots
  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
  
  await this.save();
};

/**
 * Feature content manually
 */
trendingRecordSchema.methods.feature = async function(userId) {
  this.manual.featured = true;
  this.manual.featuredBy = userId;
  this.manual.featuredAt = new Date();
  this.manual.boost += 20; // Boost featured content
  
  this.calculateScores();
  
  await this.save();
};

/**
 * Pin to position
 */
trendingRecordSchema.methods.pin = async function(position) {
  this.manual.pinned = true;
  this.manual.pinnedPosition = position;
  
  await this.save();
};

// ============= STATIC METHODS =============

/**
 * Get global trending content
 */
trendingRecordSchema.statics.getGlobalTrending = async function(timeWindow = '24h', limit = 50) {
  return this.find({
    trendingType: 'global',
    timeWindow,
    status: { $in: ['trending', 'peak', 'rising'] },
    'period.expiresAt': { $gt: new Date() }
  })
  .sort({ 'manual.pinned': -1, 'manual.pinnedPosition': 1, 'scores.overall': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl duration');
};

/**
 * Get trending by country
 */
trendingRecordSchema.statics.getTrendingByCountry = async function(countryCode, limit = 50) {
  return this.find({
    trendingType: 'geographic',
    'geography.country': countryCode,
    status: { $in: ['trending', 'peak', 'rising'] },
    'period.expiresAt': { $gt: new Date() }
  })
  .sort({ 'scores.overall': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl');
};

/**
 * Get trending by category
 */
trendingRecordSchema.statics.getTrendingByCategory = async function(category, limit = 50) {
  return this.find({
    trendingType: 'category',
    category,
    status: { $in: ['trending', 'peak', 'rising'] },
    'period.expiresAt': { $gt: new Date() }
  })
  .sort({ 'scores.overall': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl');
};

/**
 * Get trending by hashtag
 */
trendingRecordSchema.statics.getTrendingByHashtag = async function(hashtag, limit = 50) {
  return this.find({
    trendingType: 'hashtag',
    hashtag: hashtag.toLowerCase(),
    status: { $in: ['trending', 'peak', 'rising'] },
    'period.expiresAt': { $gt: new Date() }
  })
  .sort({ 'scores.overall': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl');
};

/**
 * Get featured content
 */
trendingRecordSchema.statics.getFeatured = async function(limit = 20) {
  return this.find({
    'manual.featured': true,
    'manual.hidden': false,
    'period.expiresAt': { $gt: new Date() }
  })
  .sort({ 'manual.featuredAt': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl');
};

/**
 * Clean up expired records
 */
trendingRecordSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    'period.expiresAt': { $lt: new Date() },
    'manual.featured': false,
    'manual.pinned': false
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('TrendingRecord', trendingRecordSchema);
