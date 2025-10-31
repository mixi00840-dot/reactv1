const mongoose = require('mongoose');

/**
 * Ad Campaign Model
 * 
 * Manages advertising campaigns for in-stream video ads,
 * banner ads, and sponsored content.
 */

const adCampaignSchema = new mongoose.Schema({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    default: () => `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Advertiser Information
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advertiserInfo: {
    companyName: String,
    contactEmail: String,
    contactPhone: String,
    website: String
  },
  
  // Campaign Details
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Campaign Type
  type: {
    type: String,
    enum: ['video', 'banner', 'sponsored_content', 'livestream_overlay'],
    required: true
  },
  
  // Ad Creative
  creative: {
    // Video Ad
    videoUrl: String,
    videoDuration: Number, // seconds
    
    // Banner Ad
    bannerImageUrl: String,
    bannerSize: String, // e.g., '300x250', '728x90', '320x50'
    
    // General
    title: String,
    subtitle: String,
    callToAction: String, // e.g., 'Learn More', 'Shop Now', 'Download'
    destinationUrl: String,
    thumbnailUrl: String
  },
  
  // Targeting
  targeting: {
    // Geographic
    countries: [String],
    regions: [String],
    cities: [String],
    
    // Demographic
    ageRange: {
      min: { type: Number, min: 13 },
      max: { type: Number, max: 100 }
    },
    gender: {
      type: String,
      enum: ['all', 'male', 'female', 'other']
    },
    languages: [String],
    
    // Interest-Based
    interests: [String],
    categories: [String],
    
    // Behavioral
    deviceTypes: [String], // mobile, desktop, tablet
    platforms: [String], // ios, android, web
    
    // Content Targeting
    contentCategories: [String],
    contentKeywords: [String],
    excludeKeywords: [String],
    
    // Creator Targeting
    targetCreators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    creatorTiers: [String], // bronze, silver, gold, platinum, diamond
    minCreatorFollowers: Number,
    
    // User Segments
    userSegments: [String] // new_users, active_users, returning_users, etc.
  },
  
  // Placement
  placement: {
    // Video Ad Positions
    videoPositions: [{
      type: String,
      enum: ['pre_roll', 'mid_roll', 'post_roll']
    }],
    
    // Banner Ad Locations
    bannerLocations: [{
      type: String,
      enum: ['feed', 'sidebar', 'header', 'footer', 'between_content']
    }],
    
    // Livestream Placement
    livestreamPosition: {
      type: String,
      enum: ['overlay', 'break', 'sponsored_segment']
    },
    
    // Frequency
    maxImpressionsPerUser: { type: Number, default: 3 }, // per day
    minTimeBetweenAds: { type: Number, default: 300 } // seconds
  },
  
  // Budget & Bidding
  budget: {
    totalBudget: { type: Number, required: true },
    dailyBudget: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    
    // Bidding Strategy
    biddingModel: {
      type: String,
      enum: ['cpm', 'cpc', 'cpa', 'cpv'], // Cost per: Mille, Click, Action, View
      default: 'cpm'
    },
    bidAmount: { type: Number, required: true }, // Bid per unit
    
    // Pacing
    pacingStrategy: {
      type: String,
      enum: ['standard', 'accelerated'],
      default: 'standard'
    }
  },
  
  // Schedule
  schedule: {
    startDate: { type: Date, required: true },
    endDate: Date,
    timezone: { type: String, default: 'UTC' },
    
    // Day/Time Targeting
    daysOfWeek: [Number], // 0-6, Sunday=0
    hoursOfDay: [Number], // 0-23
    
    // Always running or scheduled
    isAlwaysOn: { type: Boolean, default: false }
  },
  
  // Performance Metrics
  metrics: {
    impressions: { type: Number, default: 0 },
    uniqueImpressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    videoViews: { type: Number, default: 0 },
    videoCompletions: { type: Number, default: 0 },
    
    // Rates
    ctr: { type: Number, default: 0 }, // Click-through rate
    cvr: { type: Number, default: 0 }, // Conversion rate
    completionRate: { type: Number, default: 0 }, // Video completion rate
    
    // Engagement
    avgViewDuration: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  },
  
  // Revenue Sharing
  revenueShare: {
    creatorShare: { type: Number, default: 0.55 }, // 55% to creator
    platformShare: { type: Number, default: 0.45 }, // 45% to platform
    totalRevenue: { type: Number, default: 0 },
    creatorPayouts: { type: Number, default: 0 },
    platformEarnings: { type: Number, default: 0 }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'rejected', 'cancelled'],
    default: 'draft'
  },
  
  // Approval
  approval: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: String,
    complianceNotes: String
  },
  
  // Optimization
  optimization: {
    autoOptimize: { type: Boolean, default: true },
    optimizationGoal: {
      type: String,
      enum: ['impressions', 'clicks', 'conversions', 'video_views'],
      default: 'clicks'
    },
    minBudgetForOptimization: Number,
    learningPhaseComplete: { type: Boolean, default: false }
  },
  
  // A/B Testing
  abTest: {
    isABTest: { type: Boolean, default: false },
    variants: [{
      variantId: String,
      name: String,
      creative: mongoose.Schema.Types.Mixed,
      trafficPercentage: Number,
      metrics: {
        impressions: Number,
        clicks: Number,
        conversions: Number,
        ctr: Number
      }
    }],
    winningVariant: String
  },
  
  // Notes & Tags
  tags: [String],
  notes: String,
  
  // Billing
  billing: {
    invoiceId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: String,
    lastPaymentDate: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
adCampaignSchema.index({ advertiser: 1 });
adCampaignSchema.index({ status: 1 });
adCampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
adCampaignSchema.index({ type: 1 });
adCampaignSchema.index({ 'targeting.countries': 1 });
adCampaignSchema.index({ 'targeting.categories': 1 });
adCampaignSchema.index({ createdAt: -1 });

// Instance Methods

/**
 * Calculate performance metrics
 */
adCampaignSchema.methods.calculateMetrics = function() {
  // Click-through rate
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
  }
  
  // Conversion rate
  if (this.metrics.clicks > 0) {
    this.metrics.cvr = (this.metrics.conversions / this.metrics.clicks) * 100;
  }
  
  // Video completion rate
  if (this.metrics.videoViews > 0) {
    this.metrics.completionRate = (this.metrics.videoCompletions / this.metrics.videoViews) * 100;
  }
  
  // Engagement score (0-100)
  const ctrWeight = 0.4;
  const cvrWeight = 0.3;
  const completionWeight = 0.3;
  
  this.metrics.engagementScore = (
    (this.metrics.ctr * ctrWeight) +
    (this.metrics.cvr * cvrWeight) +
    (this.metrics.completionRate * completionWeight)
  );
  
  return this.save();
};

/**
 * Check if campaign is active
 */
adCampaignSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  
  // Check dates
  if (this.schedule.startDate > now) return false;
  if (this.schedule.endDate && this.schedule.endDate < now) return false;
  
  // Check budget
  if (this.budget.spent >= this.budget.totalBudget) return false;
  if (this.budget.dailyBudget) {
    // Check daily budget logic (would need additional tracking)
  }
  
  return true;
};

/**
 * Record impression
 */
adCampaignSchema.methods.recordImpression = function(isUnique = false) {
  this.metrics.impressions += 1;
  if (isUnique) {
    this.metrics.uniqueImpressions += 1;
  }
  
  // Calculate cost based on bidding model
  if (this.budget.biddingModel === 'cpm') {
    this.budget.spent += this.budget.bidAmount / 1000;
  }
  
  return this.save();
};

/**
 * Record click
 */
adCampaignSchema.methods.recordClick = function(isUnique = false) {
  this.metrics.clicks += 1;
  if (isUnique) {
    this.metrics.uniqueClicks += 1;
  }
  
  // Calculate cost based on bidding model
  if (this.budget.biddingModel === 'cpc') {
    this.budget.spent += this.budget.bidAmount;
  }
  
  this.calculateMetrics();
  return this.save();
};

/**
 * Record conversion
 */
adCampaignSchema.methods.recordConversion = function() {
  this.metrics.conversions += 1;
  
  // Calculate cost based on bidding model
  if (this.budget.biddingModel === 'cpa') {
    this.budget.spent += this.budget.bidAmount;
  }
  
  this.calculateMetrics();
  return this.save();
};

/**
 * Record video view
 */
adCampaignSchema.methods.recordVideoView = function(completed = false, duration = 0) {
  this.metrics.videoViews += 1;
  
  if (completed) {
    this.metrics.videoCompletions += 1;
  }
  
  // Update average view duration
  const totalDuration = this.metrics.avgViewDuration * (this.metrics.videoViews - 1);
  this.metrics.avgViewDuration = (totalDuration + duration) / this.metrics.videoViews;
  
  // Calculate cost based on bidding model
  if (this.budget.biddingModel === 'cpv' && completed) {
    this.budget.spent += this.budget.bidAmount;
  }
  
  this.calculateMetrics();
  return this.save();
};

/**
 * Pause campaign
 */
adCampaignSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

/**
 * Resume campaign
 */
adCampaignSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

/**
 * Complete campaign
 */
adCampaignSchema.methods.complete = function() {
  this.status = 'completed';
  this.schedule.endDate = new Date();
  return this.save();
};

// Static Methods

/**
 * Get active campaigns
 */
adCampaignSchema.statics.getActiveCampaigns = function(targeting = {}) {
  const now = new Date();
  const query = {
    status: 'active',
    'schedule.startDate': { $lte: now },
    $or: [
      { 'schedule.endDate': { $gte: now } },
      { 'schedule.endDate': null }
    ],
    $expr: { $lt: ['$budget.spent', '$budget.totalBudget'] }
  };
  
  // Apply targeting filters
  if (targeting.country) {
    query['targeting.countries'] = targeting.country;
  }
  if (targeting.category) {
    query['targeting.categories'] = targeting.category;
  }
  
  return this.find(query).populate('advertiser', 'username companyName');
};

/**
 * Get campaigns for creator
 */
adCampaignSchema.statics.getCampaignsForCreator = function(creatorId, creatorData = {}) {
  const now = new Date();
  const query = {
    status: 'active',
    'schedule.startDate': { $lte: now },
    $or: [
      { 'schedule.endDate': { $gte: now } },
      { 'schedule.endDate': null }
    ]
  };
  
  // Filter by creator tier if applicable
  if (creatorData.tier) {
    query.$or = [
      { 'targeting.creatorTiers': creatorData.tier },
      { 'targeting.creatorTiers': { $exists: false } },
      { 'targeting.creatorTiers': { $size: 0 } }
    ];
  }
  
  // Filter by follower count
  if (creatorData.followers && creatorData.followers >= 0) {
    query.$and = [
      {
        $or: [
          { 'targeting.minCreatorFollowers': { $lte: creatorData.followers } },
          { 'targeting.minCreatorFollowers': { $exists: false } }
        ]
      }
    ];
  }
  
  return this.find(query).sort({ 'budget.bidAmount': -1 });
};

/**
 * Get campaign statistics
 */
adCampaignSchema.statics.getCampaignStats = function(advertiserId = null) {
  const query = {};
  if (advertiserId) {
    query.advertiser = advertiserId;
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget.totalBudget' },
        totalSpent: { $sum: '$budget.spent' },
        totalImpressions: { $sum: '$metrics.impressions' },
        totalClicks: { $sum: '$metrics.clicks' },
        totalConversions: { $sum: '$metrics.conversions' },
        avgCTR: { $avg: '$metrics.ctr' },
        avgCVR: { $avg: '$metrics.cvr' }
      }
    }
  ]);
};

/**
 * Get top performing campaigns
 */
adCampaignSchema.statics.getTopPerformers = function(metric = 'ctr', limit = 10) {
  const sortField = `metrics.${metric}`;
  return this.find({ status: { $in: ['active', 'completed'] } })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('advertiser', 'username companyName');
};

const AdCampaign = mongoose.model('AdCampaign', adCampaignSchema);

module.exports = AdCampaign;
