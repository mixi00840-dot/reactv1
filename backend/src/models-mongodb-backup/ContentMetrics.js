const mongoose = require('mongoose');

/**
 * ContentMetrics Model
 * 
 * Tracks comprehensive engagement metrics for each piece of content.
 * This model is crucial for recommendation engine, trending detection,
 * and creator analytics.
 * 
 * Metrics Categories:
 * - View Metrics: impressions, unique viewers, view duration
 * - Engagement: likes, comments, shares, saves
 * - Watch Behavior: completion rate, rewatch rate, average watch time
 * - Time-based: daily/hourly breakdowns for trending detection
 * - Demographics: age groups, locations for targeting
 */

const contentMetricsSchema = new mongoose.Schema({
  // Reference
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    unique: true,
    index: true
  },

  // View Metrics
  views: {
    total: { type: Number, default: 0 },           // Total view count (includes re-views)
    unique: { type: Number, default: 0 },          // Unique user count
    organic: { type: Number, default: 0 },         // From For You feed
    following: { type: Number, default: 0 },       // From Following feed
    profile: { type: Number, default: 0 },         // From creator profile
    hashtag: { type: Number, default: 0 },         // From hashtag page
    search: { type: Number, default: 0 },          // From search results
    direct: { type: Number, default: 0 },          // Direct links
    other: { type: Number, default: 0 }            // Other sources
  },

  // Impression Metrics
  impressions: {
    total: { type: Number, default: 0 },           // Times shown in feed
    feedViews: { type: Number, default: 0 },       // Times actually viewed after impression
    swipedAway: { type: Number, default: 0 }       // Times swiped without watching
  },

  // Watch Time Metrics (in seconds)
  watchTime: {
    total: { type: Number, default: 0 },           // Total seconds watched (all views combined)
    average: { type: Number, default: 0 },         // Average per view
    median: { type: Number, default: 0 }           // Median watch time
  },

  // Completion Metrics
  completion: {
    full: { type: Number, default: 0 },            // Watched 100%
    over75: { type: Number, default: 0 },          // Watched 75-99%
    over50: { type: Number, default: 0 },          // Watched 50-74%
    over25: { type: Number, default: 0 },          // Watched 25-49%
    under25: { type: Number, default: 0 },         // Watched 0-24%
    rate: { type: Number, default: 0 }             // Completion rate percentage (0-100)
  },

  // Engagement Metrics
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },           // Bookmarks/favorites
    duets: { type: Number, default: 0 },           // Duet/collaboration count
    stitches: { type: Number, default: 0 },        // Stitch/remix count
    soundUses: { type: Number, default: 0 },       // Times sound was reused
    rate: { type: Number, default: 0 }             // Engagement rate percentage
  },

  // Interaction Metrics (negative signals)
  interactions: {
    notInterested: { type: Number, default: 0 },   // "Not Interested" clicks
    reports: { type: Number, default: 0 },         // Report count
    hides: { type: Number, default: 0 },           // Hide content clicks
    unfollows: { type: Number, default: 0 }        // Unfollows after viewing
  },

  // Rewatch Metrics
  rewatch: {
    count: { type: Number, default: 0 },           // Number of rewatches
    rate: { type: Number, default: 0 },            // Rewatch rate (rewatches / unique viewers)
    loopPlays: { type: Number, default: 0 }        // Auto-loop replays
  },

  // Time Distribution (for trending detection)
  timeDistribution: {
    hourly: [{
      hour: Number,                                 // 0-23
      views: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      timestamp: Date
    }],
    daily: [{
      date: Date,
      views: { type: Number, default: 0 },
      uniqueViewers: { type: Number, default: 0 },
      watchTime: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    }]
  },

  // Velocity Metrics (for trending)
  velocity: {
    viewsPerHour: { type: Number, default: 0 },    // Recent velocity
    engagementPerHour: { type: Number, default: 0 },
    sharesPerHour: { type: Number, default: 0 },
    peakVelocity: { type: Number, default: 0 },    // Highest velocity achieved
    peakVelocityAt: Date,
    currentTrend: { type: String, enum: ['rising', 'stable', 'declining'], default: 'stable' }
  },

  // Audience Demographics
  demographics: {
    ageGroups: [{
      range: String,                                // '13-17', '18-24', '25-34', '35-44', '45+'
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }],
    genders: [{
      gender: String,                               // 'male', 'female', 'other', 'unknown'
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }],
    topCountries: [{
      country: String,                              // ISO country code
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }],
    topCities: [{
      city: String,
      country: String,
      count: { type: Number, default: 0 }
    }]
  },

  // Device & Platform
  devices: {
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 },
    tv: { type: Number, default: 0 }
  },

  platforms: {
    ios: { type: Number, default: 0 },
    android: { type: Number, default: 0 },
    web: { type: Number, default: 0 }
  },

  // Quality Score (calculated)
  qualityScore: {
    overall: { type: Number, default: 0, min: 0, max: 100 },     // Composite score
    retention: { type: Number, default: 0, min: 0, max: 100 },   // Based on completion rate
    engagement: { type: Number, default: 0, min: 0, max: 100 },  // Based on likes/comments/shares
    virality: { type: Number, default: 0, min: 0, max: 100 },    // Based on share rate
    watchability: { type: Number, default: 0, min: 0, max: 100 } // Based on rewatch rate
  },

  // Performance Benchmarks (vs creator's average)
  performance: {
    vsCreatorAvg: { type: Number, default: 0 },    // Percentage vs creator's average
    vsPlatformAvg: { type: Number, default: 0 },   // Percentage vs platform average
    ranking: String                                 // 'excellent', 'good', 'average', 'below_average'
  },

  // Last updated timestamp
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'contentmetrics'
});

// Indexes for efficient queries
contentMetricsSchema.index({ 'views.total': -1 });                   // Most viewed
contentMetricsSchema.index({ 'engagement.likes': -1 });              // Most liked
contentMetricsSchema.index({ 'velocity.viewsPerHour': -1 });         // Trending
contentMetricsSchema.index({ 'qualityScore.overall': -1 });          // High quality
contentMetricsSchema.index({ 'completion.rate': -1 });               // Best retention
contentMetricsSchema.index({ createdAt: -1 });                       // Recent metrics
contentMetricsSchema.index({ 'velocity.currentTrend': 1, 'velocity.viewsPerHour': -1 }); // Rising content

// Virtual: CTR (Click-Through Rate)
contentMetricsSchema.virtual('ctr').get(function() {
  if (this.impressions.total === 0) return 0;
  return (this.impressions.feedViews / this.impressions.total * 100).toFixed(2);
});

// Virtual: Average Engagement Rate
contentMetricsSchema.virtual('avgEngagementRate').get(function() {
  if (this.views.total === 0) return 0;
  const totalEngagements = this.engagement.likes + this.engagement.comments + 
                          this.engagement.shares + this.engagement.saves;
  return (totalEngagements / this.views.total * 100).toFixed(2);
});

// Method: Calculate completion rate
contentMetricsSchema.methods.calculateCompletionRate = function() {
  const total = this.completion.full + this.completion.over75 + 
                this.completion.over50 + this.completion.over25 + 
                this.completion.under25;
  
  if (total === 0) return 0;

  // Weighted calculation: full=100%, 75%=87.5%, 50%=62.5%, 25%=37.5%, under25%=12.5%
  const weighted = (
    this.completion.full * 100 +
    this.completion.over75 * 87.5 +
    this.completion.over50 * 62.5 +
    this.completion.over25 * 37.5 +
    this.completion.under25 * 12.5
  ) / total;

  this.completion.rate = Math.round(weighted * 100) / 100;
  return this.completion.rate;
};

// Method: Calculate engagement rate
contentMetricsSchema.methods.calculateEngagementRate = function() {
  if (this.views.total === 0) {
    this.engagement.rate = 0;
    return 0;
  }

  const totalEngagements = this.engagement.likes + this.engagement.comments + 
                          this.engagement.shares + this.engagement.saves;
  
  this.engagement.rate = Math.round((totalEngagements / this.views.total * 100) * 100) / 100;
  return this.engagement.rate;
};

// Method: Calculate rewatch rate
contentMetricsSchema.methods.calculateRewatchRate = function() {
  if (this.views.unique === 0) {
    this.rewatch.rate = 0;
    return 0;
  }

  this.rewatch.rate = Math.round((this.rewatch.count / this.views.unique * 100) * 100) / 100;
  return this.rewatch.rate;
};

// Method: Calculate quality scores
contentMetricsSchema.methods.calculateQualityScores = function() {
  // Retention Score (0-100): Based on completion rate
  this.qualityScore.retention = Math.round(this.completion.rate);

  // Engagement Score (0-100): Based on engagement rate (cap at 20% = 100 points)
  const engagementCap = 20; // 20% engagement = perfect score
  this.qualityScore.engagement = Math.min(100, Math.round((this.engagement.rate / engagementCap) * 100));

  // Virality Score (0-100): Based on share rate (cap at 5% = 100 points)
  const shareRate = this.views.total > 0 ? (this.engagement.shares / this.views.total * 100) : 0;
  const viralityCap = 5;
  this.qualityScore.virality = Math.min(100, Math.round((shareRate / viralityCap) * 100));

  // Watchability Score (0-100): Based on rewatch rate (cap at 30% = 100 points)
  const watchabilityCap = 30;
  this.qualityScore.watchability = Math.min(100, Math.round((this.rewatch.rate / watchabilityCap) * 100));

  // Overall Score: Weighted average
  this.qualityScore.overall = Math.round(
    this.qualityScore.retention * 0.35 +      // 35% weight on retention
    this.qualityScore.engagement * 0.30 +     // 30% weight on engagement
    this.qualityScore.virality * 0.20 +       // 20% weight on virality
    this.qualityScore.watchability * 0.15     // 15% weight on rewatchability
  );

  return this.qualityScore;
};

// Method: Calculate velocity (views per hour in last 24h)
contentMetricsSchema.methods.calculateVelocity = async function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get recent daily data
  const recentData = this.timeDistribution.daily
    .filter(d => d.date >= oneDayAgo)
    .reduce((acc, day) => ({
      views: acc.views + day.views,
      engagement: acc.engagement + (day.likes + day.comments + day.shares),
      shares: acc.shares + day.shares
    }), { views: 0, engagement: 0, shares: 0 });

  this.velocity.viewsPerHour = Math.round(recentData.views / 24);
  this.velocity.engagementPerHour = Math.round(recentData.engagement / 24);
  this.velocity.sharesPerHour = Math.round(recentData.shares / 24);

  // Update peak velocity if current is higher
  if (this.velocity.viewsPerHour > (this.velocity.peakVelocity || 0)) {
    this.velocity.peakVelocity = this.velocity.viewsPerHour;
    this.velocity.peakVelocityAt = new Date();
  }

  // Determine trend
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const previousData = this.timeDistribution.daily
    .filter(d => d.date >= twoDaysAgo && d.date < oneDayAgo)
    .reduce((acc, day) => acc + day.views, 0);

  const previousVelocity = previousData / 24;
  
  if (this.velocity.viewsPerHour > previousVelocity * 1.2) {
    this.velocity.currentTrend = 'rising';
  } else if (this.velocity.viewsPerHour < previousVelocity * 0.8) {
    this.velocity.currentTrend = 'declining';
  } else {
    this.velocity.currentTrend = 'stable';
  }

  return this.velocity;
};

// Method: Add hourly data point
contentMetricsSchema.methods.addHourlyData = function(hour, views, engagement) {
  const existingIndex = this.timeDistribution.hourly.findIndex(h => h.hour === hour);
  
  if (existingIndex >= 0) {
    this.timeDistribution.hourly[existingIndex].views += views;
    this.timeDistribution.hourly[existingIndex].engagement += engagement;
    this.timeDistribution.hourly[existingIndex].timestamp = new Date();
  } else {
    this.timeDistribution.hourly.push({
      hour,
      views,
      engagement,
      timestamp: new Date()
    });
  }

  // Keep only last 7 days of hourly data (168 hours)
  if (this.timeDistribution.hourly.length > 168) {
    this.timeDistribution.hourly = this.timeDistribution.hourly
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 168);
  }
};

// Method: Add daily data point
contentMetricsSchema.methods.addDailyData = function(date, data) {
  const dateStr = date.toISOString().split('T')[0];
  const existingIndex = this.timeDistribution.daily.findIndex(
    d => d.date.toISOString().split('T')[0] === dateStr
  );

  if (existingIndex >= 0) {
    this.timeDistribution.daily[existingIndex].views += data.views || 0;
    this.timeDistribution.daily[existingIndex].uniqueViewers += data.uniqueViewers || 0;
    this.timeDistribution.daily[existingIndex].watchTime += data.watchTime || 0;
    this.timeDistribution.daily[existingIndex].likes += data.likes || 0;
    this.timeDistribution.daily[existingIndex].comments += data.comments || 0;
    this.timeDistribution.daily[existingIndex].shares += data.shares || 0;
  } else {
    this.timeDistribution.daily.push({
      date,
      views: data.views || 0,
      uniqueViewers: data.uniqueViewers || 0,
      watchTime: data.watchTime || 0,
      likes: data.likes || 0,
      comments: data.comments || 0,
      shares: data.shares || 0
    });
  }

  // Keep only last 90 days
  if (this.timeDistribution.daily.length > 90) {
    this.timeDistribution.daily = this.timeDistribution.daily
      .sort((a, b) => b.date - a.date)
      .slice(0, 90);
  }
};

// Method: Update all calculated fields
contentMetricsSchema.methods.recalculate = async function() {
  this.calculateCompletionRate();
  this.calculateEngagementRate();
  this.calculateRewatchRate();
  this.calculateQualityScores();
  await this.calculateVelocity();
  
  this.lastCalculatedAt = new Date();
  return this;
};

// Static: Get or create metrics
contentMetricsSchema.statics.getOrCreate = async function(contentId) {
  let metrics = await this.findOne({ contentId });
  
  if (!metrics) {
    metrics = await this.create({ contentId });
  }
  
  return metrics;
};

// Static: Get top performing content
contentMetricsSchema.statics.getTopPerforming = async function(limit = 50, timeRange = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);

  return this.find({
    createdAt: { $gte: cutoffDate }
  })
  .sort({ 'qualityScore.overall': -1 })
  .limit(limit)
  .populate('contentId', 'type caption media status createdBy');
};

// Static: Get trending content (rising velocity)
contentMetricsSchema.statics.getTrending = async function(limit = 50) {
  return this.find({
    'velocity.currentTrend': 'rising',
    'velocity.viewsPerHour': { $gte: 100 }  // Minimum velocity threshold
  })
  .sort({ 'velocity.viewsPerHour': -1 })
  .limit(limit)
  .populate('contentId', 'type caption media status createdBy');
};

// Pre-save: Update timestamps and recalculate
contentMetricsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ContentMetrics', contentMetricsSchema);
