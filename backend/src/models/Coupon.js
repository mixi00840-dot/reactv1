const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // Coupon Identification
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  // Store Reference (null for platform-wide coupons)
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Coupon Type
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'bundle_discount'],
    required: true
  },
  
  // Discount Configuration
  discount: {
    // For percentage and fixed_amount
    value: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    
    // For buy_x_get_y
    buyQuantity: Number,
    getQuantity: Number,
    getDiscountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free']
    },
    getDiscountValue: Number,
    
    // Maximum discount amount (for percentage discounts)
    maxDiscountAmount: Number,
    
    // Apply to
    applyTo: {
      type: String,
      enum: ['order_total', 'shipping', 'specific_products', 'category', 'cheapest_item', 'most_expensive_item'],
      default: 'order_total'
    }
  },
  
  // Usage Conditions
  conditions: {
    // Minimum order requirements
    minOrderAmount: Number,
    minOrderQuantity: Number,
    
    // Product restrictions
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    excludedCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    
    // Customer restrictions
    customerTypes: [String], // ['new', 'returning', 'vip', 'wholesale']
    eligibleUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    excludedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // Geographic restrictions
    allowedCountries: [String],
    excludedCountries: [String],
    allowedStates: [String],
    excludedStates: [String],
    
    // First time customer only
    firstTimeCustomerOnly: {
      type: Boolean,
      default: false
    },
    
    // Shipping method requirements
    requiredShippingMethods: [String],
    
    // Other conditions
    requiresSubscription: Boolean,
    minimumAccountAge: Number, // days
    maximumPreviousOrders: Number
  },
  
  // Usage Limits
  usage: {
    // Total usage limits
    maxTotalUses: Number,
    currentTotalUses: {
      type: Number,
      default: 0
    },
    
    // Per-customer limits
    maxUsesPerCustomer: {
      type: Number,
      default: 1
    },
    
    // Time-based limits
    maxUsesPerDay: Number,
    maxUsesPerWeek: Number,
    maxUsesPerMonth: Number,
    
    // Daily usage tracking
    dailyUsage: [{
      date: Date,
      count: Number
    }],
    
    // Customer usage tracking
    customerUsage: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      usageCount: {
        type: Number,
        default: 0
      },
      lastUsed: Date,
      ordersUsed: [{
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order'
        },
        usedAt: Date,
        discountAmount: Number
      }]
    }]
  },
  
  // Validity Period
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    
    // Time-based restrictions
    validDays: [String], // ['monday', 'tuesday', ...]
    validHours: {
      start: String, // "09:00"
      end: String    // "17:00"
    },
    
    // Timezone
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'disabled'],
    default: 'draft'
  },
  
  // Auto-application settings
  autoApply: {
    enabled: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 0
    },
    conditions: mongoose.Schema.Types.Mixed
  },
  
  // Combination Rules
  combinableWith: {
    otherCoupons: {
      type: Boolean,
      default: false
    },
    saleItems: {
      type: Boolean,
      default: true
    },
    loyaltyRewards: {
      type: Boolean,
      default: true
    }
  },
  
  // Promotion Campaign
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  // Analytics
  analytics: {
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    uniqueCustomers: {
      type: Number,
      default: 0
    }
  },
  
  // Creation Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notes
  internalNotes: String,
  customerMessage: String, // Message shown to customer when coupon is applied
  
  // SEO and Marketing
  landingPageUrl: String,
  socialMediaMessage: String,
  emailSubject: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const campaignSchema = new mongoose.Schema({
  // Campaign Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Store Reference
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    index: true
  },
  
  // Campaign Type
  type: {
    type: String,
    enum: ['seasonal', 'flash_sale', 'clearance', 'new_customer', 'loyalty', 'influencer', 'affiliate', 'bulk_discount'],
    required: true
  },
  
  // Campaign Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  
  // Target Audience
  targetAudience: {
    customerTypes: [String],
    demographics: {
      ageRange: {
        min: Number,
        max: Number
      },
      locations: [String],
      interests: [String]
    },
    behaviorTargeting: {
      purchaseHistory: [String],
      browsingBehavior: [String],
      engagementLevel: String
    }
  },
  
  // Associated Coupons
  coupons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }],
  
  // Budget and Limits
  budget: {
    totalBudget: Number,
    spent: {
      type: Number,
      default: 0
    },
    maxDiscountPerCustomer: Number,
    maxTotalDiscount: Number
  },
  
  // Goals and KPIs
  goals: {
    targetRevenue: Number,
    targetConversions: Number,
    targetNewCustomers: Number,
    targetOrderValue: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Analytics
  performance: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    newCustomersAcquired: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  
  // Marketing Channels
  channels: {
    email: {
      enabled: Boolean,
      templateId: String,
      sentCount: Number,
      openRate: Number,
      clickRate: Number
    },
    sms: {
      enabled: Boolean,
      message: String,
      sentCount: Number,
      responseRate: Number
    },
    social: {
      platforms: [String],
      posts: [{
        platform: String,
        postId: String,
        reach: Number,
        engagement: Number
      }]
    },
    website: {
      bannerEnabled: Boolean,
      popupEnabled: Boolean,
      bannerText: String,
      popupText: String
    }
  },
  
  // Creation Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notes
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const loyaltyProgramSchema = new mongoose.Schema({
  // Program Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Store Reference
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Program Type
  type: {
    type: String,
    enum: ['points', 'tiers', 'cashback', 'punch_card', 'subscription'],
    required: true
  },
  
  // Points System
  pointsSystem: {
    // Earning rules
    earningRules: {
      pointsPerDollar: {
        type: Number,
        default: 1
      },
      bonusMultipliers: [{
        condition: String, // 'birthday', 'first_purchase', 'bulk_order'
        multiplier: Number,
        description: String
      }],
      categoryBonuses: [{
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        },
        pointsPerDollar: Number
      }]
    },
    
    // Redemption rules
    redemptionRules: {
      minimumRedemption: {
        type: Number,
        default: 100
      },
      pointValue: {
        type: Number,
        default: 0.01 // $0.01 per point
      },
      maxRedemptionPerOrder: Number,
      expirationMonths: Number // Points expire after X months
    }
  },
  
  // Tier System
  tierSystem: {
    tiers: [{
      name: String,
      minSpent: Number, // Minimum spent to reach this tier
      benefits: {
        discountPercentage: Number,
        freeShipping: Boolean,
        earlyAccess: Boolean,
        birthdayBonus: Number,
        personalShopper: Boolean
      },
      color: String, // For UI display
      icon: String
    }]
  },
  
  // Cashback System
  cashbackSystem: {
    percentage: Number,
    minimumPurchase: Number,
    maxCashbackPerMonth: Number,
    payoutThreshold: Number // Minimum cashback to payout
  },
  
  // Punch Card System
  punchCardSystem: {
    requiredPunches: Number,
    reward: {
      type: String,
      enum: ['free_item', 'discount', 'cashback'],
      value: Number,
      description: String
    }
  },
  
  // Subscription Benefits
  subscriptionBenefits: {
    monthlyFee: Number,
    benefits: {
      freeShipping: Boolean,
      exclusiveDiscounts: Boolean,
      earlyAccess: Boolean,
      memberPricing: Boolean,
      prioritySupport: Boolean
    }
  },
  
  // Member Levels
  memberLevels: [{
    name: String,
    requirements: {
      minPurchases: Number,
      minSpent: Number,
      timeframe: Number // months
    },
    benefits: mongoose.Schema.Types.Mixed
  }],
  
  // Program Rules
  rules: {
    joiningRequirements: {
      minAge: Number,
      verificationRequired: Boolean,
      inviteOnly: Boolean
    },
    earningSuspension: {
      reasons: [String],
      duration: Number // days
    },
    termination: {
      reasons: [String],
      pointsForfeiture: Boolean
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Launch and End Dates
  launchDate: Date,
  endDate: Date,
  
  // Analytics
  analytics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    totalPointsIssued: {
      type: Number,
      default: 0
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0
    },
    averagePointsPerMember: {
      type: Number,
      default: 0
    },
    programRevenue: {
      type: Number,
      default: 0
    },
    memberRetentionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Creation Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const loyaltyMemberSchema = new mongoose.Schema({
  // Member Details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Program Reference
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyProgram',
    required: true,
    index: true
  },
  
  // Member Number
  memberNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Current Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active'
  },
  
  // Points Balance
  pointsBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tier Information
  currentTier: {
    name: String,
    level: Number,
    reachedAt: Date
  },
  
  // Spending Tracking
  spending: {
    totalSpent: {
      type: Number,
      default: 0
    },
    yearToDateSpent: {
      type: Number,
      default: 0
    },
    tierQualifyingSpent: {
      type: Number,
      default: 0
    }
  },
  
  // Points History
  pointsHistory: [{
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'adjusted', 'bonus']
    },
    amount: Number,
    description: String,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    expiresAt: Date,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cashback Balance (if applicable)
  cashbackBalance: {
    type: Number,
    default: 0
  },
  
  // Punch Card Progress (if applicable)
  punchCardProgress: {
    currentPunches: {
      type: Number,
      default: 0
    },
    completedCards: {
      type: Number,
      default: 0
    }
  },
  
  // Subscription Status (if applicable)
  subscription: {
    isActive: Boolean,
    startDate: Date,
    renewalDate: Date,
    paymentMethodId: String
  },
  
  // Member Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    birthday: Date,
    favoriteCategories: [String]
  },
  
  // Important Dates
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: Date,
  lastPurchase: Date,
  
  // Special Statuses
  vipStatus: {
    isVip: {
      type: Boolean,
      default: false
    },
    vipSince: Date,
    vipBenefits: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
couponSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.validity.startDate <= now && 
         (!this.validity.endDate || this.validity.endDate >= now) &&
         (!this.usage.maxTotalUses || this.usage.currentTotalUses < this.usage.maxTotalUses);
});

campaignSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

loyaltyProgramSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

loyaltyMemberSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

loyaltyMemberSchema.virtual('program', {
  ref: 'LoyaltyProgram',
  localField: 'programId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
loyaltyMemberSchema.pre('save', function(next) {
  if (!this.memberNumber) {
    this.memberNumber = 'LM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

// Instance methods
couponSchema.methods.canUseBy = function(userId, orderData) {
  // Check if coupon is valid
  if (!this.isValid) return { valid: false, reason: 'Coupon is not valid or expired' };
  
  // Check customer usage limits
  const customerUsage = this.usage.customerUsage.find(u => u.userId.toString() === userId.toString());
  if (customerUsage && customerUsage.usageCount >= this.usage.maxUsesPerCustomer) {
    return { valid: false, reason: 'Usage limit exceeded for this customer' };
  }
  
  // Check minimum order amount
  if (this.conditions.minOrderAmount && orderData.total < this.conditions.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount of $${this.conditions.minOrderAmount} required` };
  }
  
  // Check minimum order quantity
  if (this.conditions.minOrderQuantity && orderData.quantity < this.conditions.minOrderQuantity) {
    return { valid: false, reason: `Minimum ${this.conditions.minOrderQuantity} items required` };
  }
  
  // Check first time customer restriction
  if (this.conditions.firstTimeCustomerOnly && orderData.isReturningCustomer) {
    return { valid: false, reason: 'This coupon is only for first-time customers' };
  }
  
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(orderData) {
  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (orderData.subtotal * this.discount.value) / 100;
      if (this.discount.maxDiscountAmount) {
        discount = Math.min(discount, this.discount.maxDiscountAmount);
      }
      break;
      
    case 'fixed_amount':
      discount = this.discount.value;
      break;
      
    case 'free_shipping':
      discount = orderData.shippingCost || 0;
      break;
      
    case 'buy_x_get_y':
      // Implementation depends on specific cart structure
      discount = this.calculateBuyXGetYDiscount(orderData);
      break;
  }
  
  return Math.min(discount, orderData.subtotal);
};

couponSchema.methods.calculateBuyXGetYDiscount = function(orderData) {
  // Simplified implementation - would need more complex logic for real use
  const eligibleItems = orderData.items.filter(item => 
    this.isProductEligible(item.productId)
  );
  
  const totalEligibleQty = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
  const freeItems = Math.floor(totalEligibleQty / this.discount.buyQuantity) * this.discount.getQuantity;
  
  // Calculate discount based on cheapest eligible items
  const sortedItems = eligibleItems.sort((a, b) => a.price - b.price);
  let discount = 0;
  let remainingFreeItems = freeItems;
  
  for (const item of sortedItems) {
    if (remainingFreeItems <= 0) break;
    
    const freeQty = Math.min(item.quantity, remainingFreeItems);
    
    if (this.discount.getDiscountType === 'free') {
      discount += item.price * freeQty;
    } else if (this.discount.getDiscountType === 'percentage') {
      discount += (item.price * freeQty * this.discount.getDiscountValue) / 100;
    } else if (this.discount.getDiscountType === 'fixed_amount') {
      discount += this.discount.getDiscountValue * freeQty;
    }
    
    remainingFreeItems -= freeQty;
  }
  
  return discount;
};

couponSchema.methods.markUsed = function(userId, orderId, discountAmount) {
  // Update total usage
  this.usage.currentTotalUses += 1;
  
  // Update customer usage
  const customerUsage = this.usage.customerUsage.find(u => u.userId.toString() === userId.toString());
  if (customerUsage) {
    customerUsage.usageCount += 1;
    customerUsage.lastUsed = new Date();
    customerUsage.ordersUsed.push({
      orderId,
      usedAt: new Date(),
      discountAmount
    });
  } else {
    this.usage.customerUsage.push({
      userId,
      usageCount: 1,
      lastUsed: new Date(),
      ordersUsed: [{
        orderId,
        usedAt: new Date(),
        discountAmount
      }]
    });
  }
  
  // Update analytics
  this.analytics.totalDiscountGiven += discountAmount;
  
  return this.save();
};

loyaltyMemberSchema.methods.addPoints = function(points, description, orderId = null, expirationMonths = null) {
  this.pointsBalance += points;
  
  const expiresAt = expirationMonths ? 
    new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000) : 
    null;
  
  this.pointsHistory.push({
    type: 'earned',
    amount: points,
    description,
    orderId,
    expiresAt
  });
  
  this.lastActivity = new Date();
  return this.save();
};

loyaltyMemberSchema.methods.redeemPoints = function(points, description, orderId = null) {
  if (this.pointsBalance < points) {
    throw new Error('Insufficient points balance');
  }
  
  this.pointsBalance -= points;
  
  this.pointsHistory.push({
    type: 'redeemed',
    amount: points,
    description,
    orderId
  });
  
  this.lastActivity = new Date();
  return this.save();
};

loyaltyMemberSchema.methods.updateTier = async function() {
  const LoyaltyProgram = mongoose.model('LoyaltyProgram');
  const program = await LoyaltyProgram.findById(this.programId);
  
  if (!program || !program.tierSystem || !program.tierSystem.tiers) {
    return this;
  }
  
  const eligibleTier = program.tierSystem.tiers
    .filter(tier => this.spending.tierQualifyingSpent >= tier.minSpent)
    .sort((a, b) => b.minSpent - a.minSpent)[0];
  
  if (eligibleTier && (!this.currentTier.name || eligibleTier.name !== this.currentTier.name)) {
    this.currentTier = {
      name: eligibleTier.name,
      level: program.tierSystem.tiers.indexOf(eligibleTier),
      reachedAt: new Date()
    };
    
    await this.save();
  }
  
  return this;
};

// Static methods
couponSchema.statics.findValidCoupons = function(storeId = null) {
  const now = new Date();
  const query = {
    status: 'active',
    'validity.startDate': { $lte: now },
    $or: [
      { 'validity.endDate': { $gte: now } },
      { 'validity.endDate': null }
    ]
  };
  
  if (storeId) {
    query.$or = [
      { storeId: storeId },
      { storeId: null } // Platform-wide coupons
    ];
  }
  
  return this.find(query);
};

loyaltyMemberSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId }).populate('program');
};

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ storeId: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });
couponSchema.index({ 'conditions.applicableProducts': 1 });
couponSchema.index({ 'usage.customerUsage.userId': 1 });

campaignSchema.index({ storeId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ type: 1 });

loyaltyProgramSchema.index({ storeId: 1 });
loyaltyProgramSchema.index({ isActive: 1 });

loyaltyMemberSchema.index({ userId: 1 });
loyaltyMemberSchema.index({ programId: 1 });
loyaltyMemberSchema.index({ memberNumber: 1 });
loyaltyMemberSchema.index({ status: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const LoyaltyProgram = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);
const LoyaltyMember = mongoose.model('LoyaltyMember', loyaltyMemberSchema);

module.exports = { Coupon, Campaign, LoyaltyProgram, LoyaltyMember };