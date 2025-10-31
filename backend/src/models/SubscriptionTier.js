const mongoose = require('mongoose');

/**
 * Subscription Tier Model
 * 
 * Defines subscription tier templates that creators can offer
 * to their subscribers with customizable benefits and pricing.
 */

const subscriptionTierSchema = new mongoose.Schema({
  tierId: {
    type: String,
    required: true,
    unique: true,
    default: () => `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tier Configuration
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Pricing
  pricing: {
    monthly: { type: Number, required: true, min: 0.99 },
    quarterly: Number, // Optional discounted rate
    yearly: Number, // Optional discounted rate
    currency: { type: String, default: 'USD' }
  },
  
  // Tier Level
  level: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'custom'],
    default: 'basic'
  },
  rank: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Benefits & Perks
  benefits: {
    // Content Access
    exclusiveContent: {
      enabled: { type: Boolean, default: false },
      contentPerMonth: { type: Number, default: 0 },
      contentTypes: [String] // videos, photos, livestreams, posts
    },
    
    // Early Access
    earlyAccess: {
      enabled: { type: Boolean, default: false },
      hoursBefore: { type: Number, default: 24 }
    },
    
    // Badges & Recognition
    badge: {
      enabled: { type: Boolean, default: true },
      badgeIcon: String,
      badgeColor: String,
      customName: String
    },
    
    // Custom Emojis
    customEmojis: {
      enabled: { type: Boolean, default: false },
      emojiCount: { type: Number, default: 0 },
      emojiList: [{
        name: String,
        imageUrl: String,
        unlockLevel: Number
      }]
    },
    
    // Interaction Benefits
    priorityComments: { type: Boolean, default: false },
    highlightedMessages: { type: Boolean, default: false },
    directMessaging: { type: Boolean, default: false },
    
    // Experience
    adFree: { type: Boolean, default: false },
    qualityStreaming: {
      enabled: { type: Boolean, default: false },
      maxQuality: String // 1080p, 4K
    },
    
    // Community Access
    privateCommunity: { type: Boolean, default: false },
    exclusiveLivestreams: { type: Boolean, default: false },
    behindTheScenes: { type: Boolean, default: false },
    
    // Voting & Influence
    pollsVoting: { type: Boolean, default: false },
    contentSuggestions: { type: Boolean, default: false },
    
    // Shoutouts & Recognition
    monthlyShoutout: { type: Boolean, default: false },
    nameInCredits: { type: Boolean, default: false },
    
    // Discounts
    merchandiseDiscount: {
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    
    // Custom Benefits
    customBenefits: [{
      title: String,
      description: String,
      icon: String
    }]
  },
  
  // Limits & Restrictions
  limits: {
    maxSubscribers: Number, // Optional cap on tier
    currentSubscribers: { type: Number, default: 0 },
    minimumCommitment: {
      enabled: { type: Boolean, default: false },
      months: { type: Number, default: 1 }
    }
  },
  
  // Trial Configuration
  trial: {
    enabled: { type: Boolean, default: false },
    durationDays: { type: Number, default: 7 },
    trialPrice: { type: Number, default: 0 }
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Featured/Recommended
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredUntil: Date,
    displayOrder: { type: Number, default: 0 }
  },
  
  // Welcome Message
  welcomeMessage: {
    enabled: { type: Boolean, default: false },
    title: String,
    content: String,
    mediaUrl: String
  },
  
  // Statistics
  stats: {
    totalSubscribers: { type: Number, default: 0 },
    activeSubscribers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgSubscriptionDuration: { type: Number, default: 0 }, // in months
    churnRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    renewalRate: { type: Number, default: 0 }
  },
  
  // Tier Color Theme
  theme: {
    primaryColor: String,
    accentColor: String,
    iconUrl: String,
    bannerUrl: String
  },
  
  // Notes
  internalNotes: String
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subscriptionTierSchema.index({ creator: 1, isActive: 1 });
subscriptionTierSchema.index({ creator: 1, rank: 1 });
subscriptionTierSchema.index({ level: 1 });
subscriptionTierSchema.index({ 'pricing.monthly': 1 });
subscriptionTierSchema.index({ isPublic: 1, isActive: 1 });
subscriptionTierSchema.index({ createdAt: -1 });

// Virtual for available slots
subscriptionTierSchema.virtual('availableSlots').get(function() {
  if (!this.limits.maxSubscribers) return Infinity;
  return Math.max(0, this.limits.maxSubscribers - this.limits.currentSubscribers);
});

// Virtual for is full
subscriptionTierSchema.virtual('isFull').get(function() {
  if (!this.limits.maxSubscribers) return false;
  return this.limits.currentSubscribers >= this.limits.maxSubscribers;
});

// Instance Methods

/**
 * Check if tier is available for subscription
 */
subscriptionTierSchema.methods.isAvailable = function() {
  if (!this.isActive || !this.isPublic) return false;
  if (this.isFull) return false;
  return true;
};

/**
 * Add subscriber
 */
subscriptionTierSchema.methods.addSubscriber = function() {
  this.limits.currentSubscribers += 1;
  this.stats.totalSubscribers += 1;
  this.stats.activeSubscribers += 1;
  return this.save();
};

/**
 * Remove subscriber
 */
subscriptionTierSchema.methods.removeSubscriber = function(wasActive = true) {
  this.limits.currentSubscribers = Math.max(0, this.limits.currentSubscribers - 1);
  if (wasActive) {
    this.stats.activeSubscribers = Math.max(0, this.stats.activeSubscribers - 1);
  }
  return this.save();
};

/**
 * Update revenue
 */
subscriptionTierSchema.methods.addRevenue = function(amount) {
  this.stats.totalRevenue += amount;
  return this.save();
};

/**
 * Calculate churn rate
 */
subscriptionTierSchema.methods.calculateChurnRate = function(cancelledThisMonth, activeStartOfMonth) {
  if (activeStartOfMonth === 0) {
    this.stats.churnRate = 0;
  } else {
    this.stats.churnRate = (cancelledThisMonth / activeStartOfMonth) * 100;
  }
  return this.save();
};

/**
 * Calculate renewal rate
 */
subscriptionTierSchema.methods.calculateRenewalRate = function(renewed, expired) {
  const total = renewed + expired;
  if (total === 0) {
    this.stats.renewalRate = 0;
  } else {
    this.stats.renewalRate = (renewed / total) * 100;
  }
  return this.save();
};

/**
 * Get benefit summary
 */
subscriptionTierSchema.methods.getBenefitSummary = function() {
  const benefits = [];
  
  if (this.benefits.exclusiveContent.enabled) {
    benefits.push(`${this.benefits.exclusiveContent.contentPerMonth} exclusive posts per month`);
  }
  
  if (this.benefits.earlyAccess.enabled) {
    benefits.push(`Early access ${this.benefits.earlyAccess.hoursBefore}h before public`);
  }
  
  if (this.benefits.badge.enabled) {
    benefits.push('Exclusive subscriber badge');
  }
  
  if (this.benefits.customEmojis.enabled && this.benefits.customEmojis.emojiCount > 0) {
    benefits.push(`${this.benefits.customEmojis.emojiCount} custom emojis`);
  }
  
  if (this.benefits.priorityComments) {
    benefits.push('Priority comments');
  }
  
  if (this.benefits.directMessaging) {
    benefits.push('Direct messaging with creator');
  }
  
  if (this.benefits.adFree) {
    benefits.push('Ad-free experience');
  }
  
  if (this.benefits.exclusiveLivestreams) {
    benefits.push('Exclusive livestreams');
  }
  
  if (this.benefits.monthlyShoutout) {
    benefits.push('Monthly shoutout');
  }
  
  if (this.benefits.merchandiseDiscount.enabled) {
    benefits.push(`${this.benefits.merchandiseDiscount.percentage}% merchandise discount`);
  }
  
  // Add custom benefits
  this.benefits.customBenefits.forEach(benefit => {
    benefits.push(benefit.title);
  });
  
  return benefits;
};

/**
 * Clone tier for another creator (template)
 */
subscriptionTierSchema.methods.cloneForCreator = function(newCreatorId) {
  const clone = this.toObject();
  delete clone._id;
  delete clone.tierId;
  delete clone.createdAt;
  delete clone.updatedAt;
  clone.creator = newCreatorId;
  clone.stats = {
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalRevenue: 0,
    avgSubscriptionDuration: 0,
    churnRate: 0,
    conversionRate: 0,
    renewalRate: 0
  };
  clone.limits.currentSubscribers = 0;
  
  return new this.constructor(clone);
};

// Static Methods

/**
 * Get creator's tiers
 */
subscriptionTierSchema.statics.getCreatorTiers = function(creatorId, activeOnly = true) {
  const query = { creator: creatorId };
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ rank: 1, 'pricing.monthly': 1 });
};

/**
 * Get public tiers for creator
 */
subscriptionTierSchema.statics.getPublicTiers = function(creatorId) {
  return this.find({
    creator: creatorId,
    isActive: true,
    isPublic: true
  }).sort({ rank: 1 });
};

/**
 * Get tier by ID
 */
subscriptionTierSchema.statics.getTierById = function(tierId) {
  return this.findOne({ tierId }).populate('creator', 'username fullName avatar');
};

/**
 * Get featured tiers
 */
subscriptionTierSchema.statics.getFeaturedTiers = function() {
  const now = new Date();
  return this.find({
    'featured.isFeatured': true,
    'featured.featuredUntil': { $gte: now },
    isActive: true,
    isPublic: true
  })
    .sort({ 'featured.displayOrder': 1 })
    .populate('creator', 'username fullName avatar');
};

/**
 * Get tier statistics
 */
subscriptionTierSchema.statics.getTierStats = function(creatorId) {
  return this.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId(creatorId),
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalTiers: { $sum: 1 },
        totalSubscribers: { $sum: '$stats.activeSubscribers' },
        totalRevenue: { $sum: '$stats.totalRevenue' },
        avgPricing: { $avg: '$pricing.monthly' },
        avgChurnRate: { $avg: '$stats.churnRate' },
        avgRenewalRate: { $avg: '$stats.renewalRate' }
      }
    }
  ]);
};

/**
 * Get popular tier by creator
 */
subscriptionTierSchema.statics.getMostPopularTier = function(creatorId) {
  return this.findOne({
    creator: creatorId,
    isActive: true
  }).sort({ 'stats.activeSubscribers': -1 });
};

/**
 * Calculate estimated MRR for tier
 */
subscriptionTierSchema.methods.calculateEstimatedMRR = function() {
  return this.pricing.monthly * this.stats.activeSubscribers;
};

/**
 * Get recommended tier for user (based on price and benefits)
 */
subscriptionTierSchema.statics.getRecommendedTier = async function(creatorId, userBudget = null) {
  const tiers = await this.find({
    creator: creatorId,
    isActive: true,
    isPublic: true
  }).sort({ rank: 1 });
  
  if (tiers.length === 0) return null;
  
  // If budget specified, find best tier within budget
  if (userBudget) {
    const affordableTiers = tiers.filter(t => t.pricing.monthly <= userBudget);
    if (affordableTiers.length > 0) {
      return affordableTiers[affordableTiers.length - 1]; // Highest affordable tier
    }
  }
  
  // Otherwise, recommend middle tier or most popular
  const popularTier = tiers.reduce((prev, current) => 
    (current.stats.activeSubscribers > prev.stats.activeSubscribers) ? current : prev
  );
  
  return popularTier;
};

const SubscriptionTier = mongoose.model('SubscriptionTier', subscriptionTierSchema);

module.exports = SubscriptionTier;
