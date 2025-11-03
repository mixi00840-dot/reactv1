const mongoose = require('mongoose');

/**
 * Creator Subscription Model
 * 
 * Manages creator subscription tiers and recurring payments
 * for exclusive content access.
 */

const creatorSubscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Creator & Subscriber
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Subscription Tier
  tier: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'custom'],
    required: true
  },
  tierDetails: {
    name: String,
    description: String,
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    
    // Benefits
    benefits: [{
      type: String,
      enum: [
        'exclusive_content',
        'early_access',
        'badges',
        'custom_emojis',
        'priority_comments',
        'ad_free',
        'behind_scenes',
        'live_chat',
        'monthly_shoutout',
        'exclusive_livestreams',
        'private_messages',
        'polls_voting',
        'custom_requests'
      ]
    }],
    
    // Content Access
    accessLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'all'],
      default: 'basic'
    },
    exclusiveContentCount: Number // Number of exclusive posts/videos per month
  },
  
  // Billing Cycle
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Subscription Status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused', 'payment_failed'],
    default: 'active'
  },
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  nextBillingDate: Date,
  cancelledAt: Date,
  expiredAt: Date,
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Payment Information
  payment: {
    method: String, // stripe, paypal, etc.
    lastPaymentDate: Date,
    lastPaymentAmount: Number,
    nextPaymentAmount: Number,
    paymentIntentId: String,
    customerId: String, // Payment provider customer ID
    
    // Payment History
    transactions: [{
      transactionId: String,
      amount: Number,
      status: String,
      date: { type: Date, default: Date.now },
      failureReason: String
    }]
  },
  
  // Trial Period
  trial: {
    isTrial: { type: Boolean, default: false },
    trialDays: Number,
    trialEndDate: Date
  },
  
  // Discount/Coupon
  discount: {
    couponCode: String,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    discountValue: Number,
    discountedPrice: Number,
    discountEndDate: Date
  },
  
  // Gifted Subscription
  gifted: {
    isGift: { type: Boolean, default: false },
    giftedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    giftMessage: String,
    giftDuration: Number // months
  },
  
  // Subscriber Badge
  badge: {
    enabled: { type: Boolean, default: true },
    badgeIcon: String,
    badgeColor: String,
    displayName: String,
    monthsSubscribed: { type: Number, default: 0 }
  },
  
  // Custom Emojis/Emotes
  customEmotes: [{
    emoteId: String,
    emoteName: String,
    emoteUrl: String,
    unlockedAt: { type: Date, default: Date.now }
  }],
  
  // Engagement Stats
  stats: {
    totalPayments: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    consecutiveMonths: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    exclusiveContentViewed: { type: Number, default: 0 },
    lastAccessDate: Date
  },
  
  // Cancellation Details
  cancellation: {
    reason: String,
    feedback: String,
    cancelledBy: {
      type: String,
      enum: ['subscriber', 'creator', 'admin', 'payment_failure']
    }
  },
  
  // Renewal Reminder
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: Date,
  
  // Notes
  notes: String
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
creatorSubscriptionSchema.index({ creator: 1, subscriber: 1 });
creatorSubscriptionSchema.index({ creator: 1, status: 1 });
creatorSubscriptionSchema.index({ subscriber: 1, status: 1 });
creatorSubscriptionSchema.index({ status: 1 });
creatorSubscriptionSchema.index({ nextBillingDate: 1 });
creatorSubscriptionSchema.index({ 'payment.customerId': 1 });
creatorSubscriptionSchema.index({ createdAt: -1 });

// Compound index for unique active subscription per creator
creatorSubscriptionSchema.index({ creator: 1, subscriber: 1, status: 1 }, { unique: false });

// Instance Methods

/**
 * Calculate next billing date
 */
creatorSubscriptionSchema.methods.calculateNextBillingDate = function() {
  const current = this.currentPeriodEnd || this.startDate;
  const next = new Date(current);
  
  switch (this.billingCycle) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  this.nextBillingDate = next;
  this.currentPeriodStart = this.currentPeriodEnd || this.startDate;
  this.currentPeriodEnd = next;
  
  return next;
};

/**
 * Process payment
 */
creatorSubscriptionSchema.methods.processPayment = async function(paymentResult) {
  const transaction = {
    transactionId: paymentResult.transactionId,
    amount: paymentResult.amount,
    status: paymentResult.status,
    date: new Date()
  };
  
  if (paymentResult.status === 'succeeded') {
    this.payment.lastPaymentDate = new Date();
    this.payment.lastPaymentAmount = paymentResult.amount;
    this.stats.totalPayments += 1;
    this.stats.totalPaid += paymentResult.amount;
    this.stats.consecutiveMonths += 1;
    
    if (this.stats.consecutiveMonths > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.consecutiveMonths;
    }
    
    // Update badge months
    this.badge.monthsSubscribed += 1;
    
    // Calculate next billing
    this.calculateNextBillingDate();
    
    this.status = 'active';
  } else {
    transaction.failureReason = paymentResult.failureReason;
    this.status = 'payment_failed';
    this.stats.consecutiveMonths = 0; // Reset streak on failed payment
  }
  
  this.payment.transactions.push(transaction);
  return this.save();
};

/**
 * Cancel subscription
 */
creatorSubscriptionSchema.methods.cancel = function(reason, cancelledBy = 'subscriber', feedback = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;
  this.cancellation = {
    reason,
    feedback,
    cancelledBy
  };
  
  return this.save();
};

/**
 * Pause subscription
 */
creatorSubscriptionSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

/**
 * Resume subscription
 */
creatorSubscriptionSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
    this.calculateNextBillingDate();
  }
  return this.save();
};

/**
 * Check if subscription is active
 */
creatorSubscriptionSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.currentPeriodEnd && new Date() > this.currentPeriodEnd) return false;
  return true;
};

/**
 * Apply discount
 */
creatorSubscriptionSchema.methods.applyDiscount = function(couponCode, discountType, discountValue, endDate) {
  this.discount = {
    couponCode,
    discountType,
    discountValue,
    discountEndDate: endDate
  };
  
  // Calculate discounted price
  const basePrice = this.tierDetails.price;
  if (discountType === 'percentage') {
    this.discount.discountedPrice = basePrice * (1 - discountValue / 100);
  } else {
    this.discount.discountedPrice = Math.max(0, basePrice - discountValue);
  }
  
  this.payment.nextPaymentAmount = this.discount.discountedPrice;
  return this.save();
};

/**
 * Unlock custom emote
 */
creatorSubscriptionSchema.methods.unlockEmote = function(emoteId, emoteName, emoteUrl) {
  if (!this.customEmotes.find(e => e.emoteId === emoteId)) {
    this.customEmotes.push({
      emoteId,
      emoteName,
      emoteUrl
    });
  }
  return this.save();
};

// Static Methods

/**
 * Get active subscriptions for creator
 */
creatorSubscriptionSchema.statics.getCreatorSubscriptions = function(creatorId, status = 'active') {
  return this.find({ creator: creatorId, status })
    .populate('subscriber', 'username fullName avatar')
    .sort({ createdAt: -1 });
};

/**
 * Get user's subscriptions
 */
creatorSubscriptionSchema.statics.getUserSubscriptions = function(userId, status = 'active') {
  return this.find({ subscriber: userId, status })
    .populate('creator', 'username fullName avatar')
    .sort({ createdAt: -1 });
};

/**
 * Check if user is subscribed to creator
 */
creatorSubscriptionSchema.statics.isSubscribed = async function(subscriberId, creatorId) {
  const subscription = await this.findOne({
    subscriber: subscriberId,
    creator: creatorId,
    status: 'active'
  });
  
  return subscription ? subscription.isActive() : false;
};

/**
 * Get subscriptions due for renewal
 */
creatorSubscriptionSchema.statics.getDueForRenewal = function(days = 3) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    autoRenew: true,
    nextBillingDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    reminderSent: false
  }).populate('subscriber creator', 'username email fullName');
};

/**
 * Get expired subscriptions
 */
creatorSubscriptionSchema.statics.getExpiredSubscriptions = function() {
  return this.find({
    status: 'active',
    currentPeriodEnd: { $lt: new Date() }
  }).populate('subscriber creator', 'username email');
};

/**
 * Get subscription statistics for creator
 */
creatorSubscriptionSchema.statics.getCreatorStats = function(creatorId) {
  return this.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId(creatorId),
        status: { $in: ['active', 'cancelled'] }
      }
    },
    {
      $group: {
        _id: '$tier',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$stats.totalPaid' },
        avgMonthsSubscribed: { $avg: '$badge.monthsSubscribed' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * Get top subscribers for creator
 */
creatorSubscriptionSchema.statics.getTopSubscribers = function(creatorId, limit = 10) {
  return this.find({
    creator: creatorId,
    status: 'active'
  })
    .sort({ 'stats.totalPaid': -1, 'badge.monthsSubscribed': -1 })
    .limit(limit)
    .populate('subscriber', 'username fullName avatar');
};

/**
 * Calculate MRR (Monthly Recurring Revenue) for creator
 */
creatorSubscriptionSchema.statics.calculateMRR = async function(creatorId) {
  const subscriptions = await this.find({
    creator: creatorId,
    status: 'active'
  });
  
  let mrr = 0;
  subscriptions.forEach(sub => {
    const price = sub.discount?.discountedPrice || sub.tierDetails.price;
    
    // Normalize to monthly
    if (sub.billingCycle === 'yearly') {
      mrr += price / 12;
    } else if (sub.billingCycle === 'quarterly') {
      mrr += price / 3;
    } else {
      mrr += price;
    }
  });
  
  return mrr;
};

const CreatorSubscription = mongoose.model('CreatorSubscription', creatorSubscriptionSchema);

module.exports = CreatorSubscription;
