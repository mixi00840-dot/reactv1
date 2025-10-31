const mongoose = require('mongoose');

// Supporter Badge Schema - Achievement badges for supporters
const supporterBadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: String,
  
  category: {
    type: String,
    enum: [
      'spending',      // Based on total credits spent
      'gifting',       // Based on gifts sent
      'loyalty',       // Time-based, consecutive days
      'milestone',     // Specific achievements
      'exclusive',     // Limited/special badges
      'seasonal',      // Event-based
      'tier',          // User tier badges
      'special'        // Custom/admin awarded
    ],
    required: true,
    index: true
  },
  
  tier: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Visual appearance
  appearance: {
    icon: {
      type: String,
      required: true
    },
    color: String,
    backgroundColor: String,
    borderColor: String,
    animation: String,        // Lottie animation URL
    glowEffect: Boolean,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common'
    }
  },
  
  // Requirements to unlock
  requirements: {
    type: {
      type: String,
      enum: ['spending', 'gifts_sent', 'gifts_received', 'days_active', 'supporters_count', 'custom'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    // Additional criteria
    specificGift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gift'
    },
    timeframe: String,        // e.g., "30days", "1year"
    consecutiveDays: Number,
    minimumTier: String
  },
  
  // Benefits of having this badge
  benefits: {
    creditsBonus: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    exclusiveGifts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gift'
    }],
    customEmoji: Boolean,
    chatBadge: Boolean,
    profileBadge: Boolean,
    prioritySupport: Boolean,
    adFree: Boolean,
    specialFeatures: [String]
  },
  
  // Point value for leaderboards
  pointValue: {
    type: Number,
    default: 0
  },
  
  // Availability
  availability: {
    startDate: Date,
    endDate: Date,
    limitedQuantity: Number,
    awardedCount: {
      type: Number,
      default: 0
    },
    autoAward: {
      type: Boolean,
      default: true
    }
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'coming_soon'],
    default: 'active'
  },
  
  // Statistics
  stats: {
    totalAwarded: {
      type: Number,
      default: 0
    },
    currentHolders: {
      type: Number,
      default: 0
    }
  },
  
  // Localization
  translations: [{
    language: String,
    displayName: String,
    description: String
  }]
}, {
  timestamps: true
});

// Indexes
supporterBadgeSchema.index({ category: 1, tier: 1 });
supporterBadgeSchema.index({ status: 1, order: 1 });
supporterBadgeSchema.index({ featured: 1 });

// Methods
supporterBadgeSchema.methods.checkEligibility = async function(userId) {
  const User = mongoose.model('User');
  const UserCreditBalance = mongoose.model('UserCreditBalance');
  const GiftTransaction = mongoose.model('GiftTransaction');
  
  const user = await User.findById(userId);
  if (!user) return false;
  
  const balance = await UserCreditBalance.findOne({ user: userId });
  if (!balance) return false;
  
  // Check requirements
  switch(this.requirements.type) {
    case 'spending':
      return balance.lifetime.totalSpent >= this.requirements.value;
      
    case 'gifts_sent':
      return balance.lifetime.totalGifted >= this.requirements.value;
      
    case 'gifts_received':
      const receivedCount = await GiftTransaction.countDocuments({
        receiver: userId,
        status: { $in: ['delivered', 'seen', 'thanked'] }
      });
      return receivedCount >= this.requirements.value;
      
    case 'days_active':
      // Would need activity tracking
      return false;
      
    case 'supporters_count':
      const uniqueSupporters = await GiftTransaction.distinct('sender', {
        receiver: userId,
        status: { $in: ['delivered', 'seen', 'thanked'] }
      });
      return uniqueSupporters.length >= this.requirements.value;
      
    default:
      return false;
  }
};

// User Badge Schema - Tracks badges awarded to users
const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupporterBadge',
    required: true,
    index: true
  },
  
  // When awarded
  awardedAt: {
    type: Date,
    default: Date.now
  },
  
  awardedBy: {
    type: String,
    enum: ['system', 'admin', 'achievement'],
    default: 'system'
  },
  
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Display settings
  display: {
    showOnProfile: {
      type: Boolean,
      default: true
    },
    showInChat: {
      type: Boolean,
      default: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  },
  
  // Progress tracking (for tiered badges)
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: Number,
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // Expiration (for temporary badges)
  expiresAt: Date,
  
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metadata: {
    achievementDetails: String,
    seasonId: String,
    eventId: String
  },
  
  // Notification sent
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for user-badge uniqueness
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });
userBadgeSchema.index({ user: 1, 'display.isPrimary': 1 });
userBadgeSchema.index({ expiresAt: 1 }, { sparse: true });

// Methods
userBadgeSchema.methods.updateProgress = async function(current) {
  this.progress.current = current;
  
  if (this.progress.target) {
    this.progress.percentage = Math.min((current / this.progress.target) * 100, 100);
  }
  
  await this.save();
  return this;
};

userBadgeSchema.methods.checkExpiration = function() {
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isExpired = true;
    return true;
  }
  return false;
};

userBadgeSchema.methods.setAsPrimary = async function() {
  // Unset other primary badges for this user
  await this.constructor.updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { 'display.isPrimary': false }
  );
  
  this.display.isPrimary = true;
  await this.save();
  
  return this;
};

// Statics
userBadgeSchema.statics.getUserBadges = function(userId, includeExpired = false) {
  const query = { user: userId };
  if (!includeExpired) {
    query.isExpired = false;
  }
  
  return this.find(query)
    .populate('badge')
    .sort({ 'display.order': 1, awardedAt: -1 });
};

userBadgeSchema.statics.awardBadge = async function(userId, badgeId, awardedBy = 'system', adminUserId = null) {
  // Check if user already has this badge
  const existing = await this.findOne({ user: userId, badge: badgeId });
  if (existing && !existing.isExpired) {
    return { success: false, message: 'Badge already awarded', badge: existing };
  }
  
  const SupporterBadge = mongoose.model('SupporterBadge');
  const badge = await SupporterBadge.findById(badgeId);
  
  if (!badge || badge.status !== 'active') {
    return { success: false, message: 'Badge not available' };
  }
  
  // Check limited quantity
  if (badge.availability.limitedQuantity && 
      badge.availability.awardedCount >= badge.availability.limitedQuantity) {
    return { success: false, message: 'Badge limit reached' };
  }
  
  // Create user badge
  const userBadge = await this.create({
    user: userId,
    badge: badgeId,
    awardedBy: awardedBy,
    adminUser: adminUserId,
    progress: {
      target: badge.requirements.value
    }
  });
  
  // Update badge stats
  badge.stats.totalAwarded += 1;
  badge.stats.currentHolders += 1;
  badge.availability.awardedCount += 1;
  await badge.save();
  
  // TODO: Send notification
  
  return { success: true, badge: userBadge };
};

userBadgeSchema.statics.revokeBadge = async function(userId, badgeId) {
  const userBadge = await this.findOne({ user: userId, badge: badgeId });
  
  if (!userBadge) {
    return { success: false, message: 'Badge not found' };
  }
  
  await userBadge.deleteOne();
  
  // Update badge stats
  const SupporterBadge = mongoose.model('SupporterBadge');
  await SupporterBadge.updateOne(
    { _id: badgeId },
    { $inc: { 'stats.currentHolders': -1 } }
  );
  
  return { success: true };
};

// Supporter Tier Schema - User tier progression
const supporterTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: String,
  
  tier: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  
  appearance: {
    icon: String,
    color: String,
    backgroundColor: String,
    badge: String
  },
  
  // Requirements to reach this tier
  requirements: {
    totalSpent: {
      type: Number,
      required: true
    },
    orTotalGifted: Number,
    orTimeActive: Number  // Days
  },
  
  // Benefits at this tier
  benefits: {
    discountPercentage: {
      type: Number,
      default: 0
    },
    bonusCreditsMultiplier: {
      type: Number,
      default: 1
    },
    exclusiveGifts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gift'
    }],
    exclusiveBadges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupporterBadge'
    }],
    dailyGiftLimit: Number,
    monthlyGiftLimit: Number,
    features: [String]
  },
  
  nextTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupporterTier'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  stats: {
    currentUsers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
supporterTierSchema.index({ tier: 1 });
supporterTierSchema.index({ status: 1 });

// Statics
supporterTierSchema.statics.getTierForUser = async function(totalSpent) {
  const tiers = await this.find({ status: 'active' })
    .sort({ 'requirements.totalSpent': -1 });
  
  for (const tier of tiers) {
    if (totalSpent >= tier.requirements.totalSpent) {
      return tier;
    }
  }
  
  // Return lowest tier
  return tiers[tiers.length - 1];
};

// Models
const SupporterBadge = mongoose.model('SupporterBadge', supporterBadgeSchema);
const UserBadge = mongoose.model('UserBadge', userBadgeSchema);
const SupporterTier = mongoose.model('SupporterTier', supporterTierSchema);

module.exports = {
  SupporterBadge,
  UserBadge,
  SupporterTier
};
