const mongoose = require('mongoose');

/**
 * Creator Earnings Model
 * 
 * Tracks revenue and earnings for content creators
 * from various sources: views, gifts, subscriptions, ads, etc.
 */

const creatorEarningsSchema = new mongoose.Schema({
  earningsId: {
    type: String,
    required: true,
    unique: true,
    default: () => `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Creator Reference
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Time Period
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'monthly'
    }
  },
  
  // View-Based Earnings
  viewEarnings: {
    totalViews: { type: Number, default: 0 },
    eligibleViews: { type: Number, default: 0 }, // Views that meet quality criteria
    ratePerThousandViews: { type: Number, default: 0 }, // CPM
    amount: { type: Number, default: 0 },
    breakdown: [{
      contentType: String, // video, livestream, story
      contentId: mongoose.Schema.Types.ObjectId,
      views: Number,
      earnings: Number
    }]
  },
  
  // Gift Earnings
  giftEarnings: {
    totalGifts: { type: Number, default: 0 },
    totalGiftValue: { type: Number, default: 0 }, // in coins
    creatorShare: { type: Number, default: 0.7 }, // 70% to creator
    amount: { type: Number, default: 0 },
    breakdown: [{
      giftType: String,
      quantity: Number,
      value: Number,
      earnings: Number,
      source: { type: String, enum: ['video', 'livestream', 'pk_battle'] }
    }]
  },
  
  // Subscription Earnings
  subscriptionEarnings: {
    totalSubscribers: { type: Number, default: 0 },
    newSubscribers: { type: Number, default: 0 },
    renewedSubscribers: { type: Number, default: 0 },
    canceledSubscribers: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    breakdown: [{
      tier: String,
      subscribers: Number,
      price: Number,
      earnings: Number
    }]
  },
  
  // Ad Revenue
  adRevenue: {
    totalImpressions: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // Click-through rate
    cpm: { type: Number, default: 0 }, // Cost per thousand impressions
    amount: { type: Number, default: 0 },
    breakdown: [{
      adType: String, // pre-roll, mid-roll, post-roll, banner
      impressions: Number,
      clicks: Number,
      earnings: Number
    }]
  },
  
  // Live Shopping Earnings
  shoppingEarnings: {
    totalOrders: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    commission: { type: Number, default: 0.1 }, // 10% commission
    amount: { type: Number, default: 0 },
    breakdown: [{
      sessionId: mongoose.Schema.Types.ObjectId,
      orders: Number,
      sales: Number,
      earnings: Number
    }]
  },
  
  // Affiliate Earnings
  affiliateEarnings: {
    totalClicks: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    breakdown: [{
      productId: mongoose.Schema.Types.ObjectId,
      clicks: Number,
      conversions: Number,
      sales: Number,
      earnings: Number
    }]
  },
  
  // Bonus & Incentives
  bonusEarnings: {
    amount: { type: Number, default: 0 },
    breakdown: [{
      type: String, // milestone, quality, consistency, referral
      reason: String,
      amount: Number,
      awardedAt: { type: Date, default: Date.now }
    }]
  },
  
  // Total Earnings Summary
  summary: {
    grossEarnings: { type: Number, default: 0 }, // Total before fees
    platformFee: { type: Number, default: 0 }, // Platform commission
    taxWithholding: { type: Number, default: 0 }, // Tax if applicable
    netEarnings: { type: Number, default: 0 }, // Amount creator receives
    currency: { type: String, default: 'USD' }
  },
  
  // Creator Tier Info
  creatorTier: {
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze'
    },
    bonusMultiplier: { type: Number, default: 1.0 }, // Tier-based earning boost
    perks: [String]
  },
  
  // Payout Information
  payout: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'on_hold'],
      default: 'pending'
    },
    scheduledDate: Date,
    processedDate: Date,
    paymentMethod: String, // bank_transfer, paypal, stripe, etc.
    transactionId: String,
    failureReason: String
  },
  
  // Performance Metrics
  metrics: {
    avgViewsPerContent: { type: Number, default: 0 },
    avgGiftsPerLivestream: { type: Number, default: 0 },
    subscriberGrowthRate: { type: Number, default: 0 },
    adEngagementRate: { type: Number, default: 0 },
    contentQualityScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  // Adjustments
  adjustments: [{
    type: String, // deduction, addition, refund, chargeback
    amount: Number,
    reason: String,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: { type: Date, default: Date.now }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'finalized', 'paid', 'disputed'],
    default: 'draft'
  },
  
  // Notes
  notes: String
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
creatorEarningsSchema.index({ creator: 1, 'period.startDate': -1 });
creatorEarningsSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
creatorEarningsSchema.index({ 'payout.status': 1 });
creatorEarningsSchema.index({ 'payout.scheduledDate': 1 });
creatorEarningsSchema.index({ status: 1 });
creatorEarningsSchema.index({ createdAt: -1 });

// Instance Methods

/**
 * Calculate total earnings
 */
creatorEarningsSchema.methods.calculateTotalEarnings = function() {
  const gross = 
    (this.viewEarnings.amount || 0) +
    (this.giftEarnings.amount || 0) +
    (this.subscriptionEarnings.amount || 0) +
    (this.adRevenue.amount || 0) +
    (this.shoppingEarnings.amount || 0) +
    (this.affiliateEarnings.amount || 0) +
    (this.bonusEarnings.amount || 0);
  
  // Apply tier bonus multiplier
  const bonusMultiplier = this.creatorTier.bonusMultiplier || 1.0;
  this.summary.grossEarnings = gross * bonusMultiplier;
  
  // Calculate platform fee (typically 10-30%)
  const platformFeeRate = 0.20; // 20%
  this.summary.platformFee = this.summary.grossEarnings * platformFeeRate;
  
  // Calculate tax withholding if applicable (varies by jurisdiction)
  const taxRate = 0; // Set based on creator's tax status
  this.summary.taxWithholding = this.summary.grossEarnings * taxRate;
  
  // Apply adjustments
  const adjustmentTotal = this.adjustments.reduce((sum, adj) => {
    return sum + (adj.type === 'addition' ? adj.amount : -adj.amount);
  }, 0);
  
  // Calculate net earnings
  this.summary.netEarnings = 
    this.summary.grossEarnings - 
    this.summary.platformFee - 
    this.summary.taxWithholding +
    adjustmentTotal;
  
  return this.summary.netEarnings;
};

/**
 * Add adjustment
 */
creatorEarningsSchema.methods.addAdjustment = function(type, amount, reason, userId) {
  this.adjustments.push({
    type,
    amount,
    reason,
    appliedBy: userId
  });
  
  // Recalculate totals
  this.calculateTotalEarnings();
  
  return this.save();
};

/**
 * Finalize earnings for payout
 */
creatorEarningsSchema.methods.finalize = function() {
  if (this.status === 'finalized' || this.status === 'paid') {
    throw new Error('Earnings already finalized');
  }
  
  this.calculateTotalEarnings();
  this.status = 'finalized';
  
  // Schedule payout for next cycle
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 7); // 7 days from now
  this.payout.scheduledDate = scheduledDate;
  this.payout.status = 'pending';
  
  return this.save();
};

/**
 * Mark as paid
 */
creatorEarningsSchema.methods.markPaid = function(transactionId, paymentMethod) {
  this.status = 'paid';
  this.payout.status = 'completed';
  this.payout.processedDate = new Date();
  this.payout.transactionId = transactionId;
  this.payout.paymentMethod = paymentMethod;
  
  return this.save();
};

/**
 * Calculate performance metrics
 */
creatorEarningsSchema.methods.calculateMetrics = function() {
  // Avg views per content
  if (this.viewEarnings.breakdown && this.viewEarnings.breakdown.length > 0) {
    this.metrics.avgViewsPerContent = 
      this.viewEarnings.totalViews / this.viewEarnings.breakdown.length;
  }
  
  // Subscriber growth rate
  if (this.subscriptionEarnings.totalSubscribers > 0) {
    this.metrics.subscriberGrowthRate = 
      (this.subscriptionEarnings.newSubscribers / this.subscriptionEarnings.totalSubscribers) * 100;
  }
  
  // Ad engagement rate
  if (this.adRevenue.totalImpressions > 0) {
    this.metrics.adEngagementRate = 
      (this.adRevenue.totalClicks / this.adRevenue.totalImpressions) * 100;
  }
  
  return this.save();
};

// Static Methods

/**
 * Get creator earnings for period
 */
creatorEarningsSchema.statics.getCreatorEarnings = function(creatorId, startDate, endDate) {
  return this.findOne({
    creator: creatorId,
    'period.startDate': { $gte: startDate },
    'period.endDate': { $lte: endDate }
  }).populate('creator', 'username fullName email');
};

/**
 * Get pending payouts
 */
creatorEarningsSchema.statics.getPendingPayouts = function() {
  return this.find({
    status: 'finalized',
    'payout.status': 'pending',
    'payout.scheduledDate': { $lte: new Date() }
  })
    .populate('creator', 'username fullName email paymentInfo')
    .sort({ 'payout.scheduledDate': 1 });
};

/**
 * Get top earners
 */
creatorEarningsSchema.statics.getTopEarners = function(period = 'monthly', limit = 50) {
  const date = new Date();
  let startDate;
  
  if (period === 'daily') {
    startDate = new Date(date.setDate(date.getDate() - 1));
  } else if (period === 'weekly') {
    startDate = new Date(date.setDate(date.getDate() - 7));
  } else {
    startDate = new Date(date.setMonth(date.getMonth() - 1));
  }
  
  return this.find({
    'period.startDate': { $gte: startDate },
    status: { $in: ['finalized', 'paid'] }
  })
    .sort({ 'summary.netEarnings': -1 })
    .limit(limit)
    .populate('creator', 'username fullName avatar');
};

/**
 * Get earnings statistics
 */
creatorEarningsSchema.statics.getEarningsStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'period.startDate': { $gte: startDate },
        'period.endDate': { $lte: endDate },
        status: { $in: ['finalized', 'paid'] }
      }
    },
    {
      $group: {
        _id: null,
        totalCreators: { $addToSet: '$creator' },
        totalGrossEarnings: { $sum: '$summary.grossEarnings' },
        totalNetEarnings: { $sum: '$summary.netEarnings' },
        totalPlatformFees: { $sum: '$summary.platformFee' },
        avgEarningsPerCreator: { $avg: '$summary.netEarnings' },
        totalViews: { $sum: '$viewEarnings.totalViews' },
        totalGifts: { $sum: '$giftEarnings.totalGifts' },
        totalSubscribers: { $sum: '$subscriptionEarnings.totalSubscribers' },
        totalAdImpressions: { $sum: '$adRevenue.totalImpressions' }
      }
    },
    {
      $project: {
        totalCreators: { $size: '$totalCreators' },
        totalGrossEarnings: 1,
        totalNetEarnings: 1,
        totalPlatformFees: 1,
        avgEarningsPerCreator: 1,
        totalViews: 1,
        totalGifts: 1,
        totalSubscribers: 1,
        totalAdImpressions: 1
      }
    }
  ]);
};

/**
 * Calculate creator tier based on earnings
 */
creatorEarningsSchema.statics.calculateCreatorTier = function(totalEarnings, subscribers, consistency) {
  let tier = 'bronze';
  let multiplier = 1.0;
  
  // Tier thresholds (monthly)
  if (totalEarnings >= 10000 || subscribers >= 100000) {
    tier = 'diamond';
    multiplier = 1.5;
  } else if (totalEarnings >= 5000 || subscribers >= 50000) {
    tier = 'platinum';
    multiplier = 1.3;
  } else if (totalEarnings >= 2000 || subscribers >= 20000) {
    tier = 'gold';
    multiplier = 1.2;
  } else if (totalEarnings >= 500 || subscribers >= 5000) {
    tier = 'silver';
    multiplier = 1.1;
  }
  
  // Consistency bonus (posting regularly)
  if (consistency >= 0.9) {
    multiplier += 0.05;
  }
  
  return { tier, multiplier };
};

const CreatorEarnings = mongoose.model('CreatorEarnings', creatorEarningsSchema);

module.exports = CreatorEarnings;
