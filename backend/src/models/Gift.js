const mongoose = require('mongoose');

// Gift Schema - Virtual gifts catalog
const giftSchema = new mongoose.Schema({
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
      'emoji',        // Simple emojis
      'sticker',      // Static stickers
      'animated',     // Animated gifts
      'luxury',       // Premium/expensive gifts
      'seasonal',     // Holiday/event specific
      'badge',        // Special badges
      'effect',       // Screen effects
      'combo'         // Multi-gift combos
    ],
    required: true,
    index: true
  },
  
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common',
    index: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Visual assets
  media: {
    icon: {
      type: String,
      required: true
    },
    thumbnail: String,
    animation: String,    // Lottie JSON or video URL
    sound: String,        // Sound effect URL
    duration: Number      // Animation duration in ms
  },
  
  // Visual effects when gift is sent
  effects: {
    screenEffect: {
      type: String,
      enum: ['none', 'confetti', 'fireworks', 'hearts', 'stars', 'sparkles', 'rain', 'snow', 'custom']
    },
    customEffect: String, // Custom effect code/URL
    messageStyle: String, // CSS for gift message display
    vibrate: Boolean,     // Trigger haptic feedback
    flashScreen: Boolean  // Flash screen effect
  },
  
  // Availability
  availability: {
    startDate: Date,
    endDate: Date,
    limitedEdition: Boolean,
    maxQuantity: Number,
    soldCount: {
      type: Number,
      default: 0
    },
    requiredTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
    },
    requiredLevel: Number,
    requiredBadge: String
  },
  
  // Combo/streak mechanics
  combo: {
    enabled: Boolean,
    minCount: Number,          // Minimum gifts to trigger combo
    bonusMultiplier: Number,   // Bonus points multiplier
    comboWindow: Number        // Time window in seconds
  },
  
  // Receiver benefits
  receiverBenefits: {
    experiencePoints: Number,
    creditsBonus: Number,        // Receiver gets some credits back
    badgeProgress: Number,       // Progress towards badges
    specialAccess: [String]      // Unlock special features
  },
  
  tags: [String],
  
  featured: {
    type: Boolean,
    default: false
  },
  
  popular: {
    type: Boolean,
    default: false
  },
  
  newRelease: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'soldout', 'coming_soon'],
    default: 'active'
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  // Statistics
  stats: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    uniqueSenders: {
      type: Number,
      default: 0
    },
    uniqueReceivers: {
      type: Number,
      default: 0
    },
    avgRating: Number,
    reviewCount: {
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

// Virtuals
giftSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  if (this.availability.startDate && now < this.availability.startDate) return false;
  if (this.availability.endDate && now > this.availability.endDate) return false;
  
  if (this.availability.limitedEdition && 
      this.availability.maxQuantity &&
      this.availability.soldCount >= this.availability.maxQuantity) {
    return false;
  }
  
  return true;
});

giftSchema.virtual('rarityValue').get(function() {
  const rarityValues = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5
  };
  return rarityValues[this.rarity] || 1;
});

// Indexes
giftSchema.index({ category: 1, status: 1, order: 1 });
giftSchema.index({ rarity: 1, price: 1 });
giftSchema.index({ featured: 1, popular: 1 });
giftSchema.index({ status: 1, 'availability.startDate': 1 });

// Methods
giftSchema.methods.canUserSend = function(userBalance, userTier) {
  if (!this.isAvailable) {
    return { allowed: false, reason: 'Gift not available' };
  }
  
  if (userBalance.balance < this.price) {
    return { allowed: false, reason: 'Insufficient credits' };
  }
  
  if (this.availability.requiredTier) {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const requiredIndex = tiers.indexOf(this.availability.requiredTier);
    const userIndex = tiers.indexOf(userTier);
    
    if (userIndex < requiredIndex) {
      return { allowed: false, reason: `Requires ${this.availability.requiredTier} tier` };
    }
  }
  
  return { allowed: true };
};

giftSchema.methods.recordSale = async function() {
  this.stats.totalSent += 1;
  this.stats.totalRevenue += this.price;
  
  if (this.availability.limitedEdition && this.availability.maxQuantity) {
    this.availability.soldCount += 1;
    
    if (this.availability.soldCount >= this.availability.maxQuantity) {
      this.status = 'soldout';
    }
  }
  
  await this.save();
};

// Statics
giftSchema.statics.getFeaturedGifts = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    featured: true 
  })
  .sort({ order: 1 })
  .limit(limit);
};

giftSchema.statics.getGiftsByCategory = function(category, limit = 20) {
  return this.find({
    status: 'active',
    category: category
  })
  .sort({ popular: -1, order: 1 })
  .limit(limit);
};

giftSchema.statics.getPopularGifts = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.totalSent': -1 })
    .limit(limit);
};

// Gift Transaction Schema - Records of sent gifts
const giftTransactionSchema = new mongoose.Schema({
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    required: true,
    index: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Context where gift was sent
  context: {
    type: {
      type: String,
      enum: ['livestream', 'profile', 'chat', 'post', 'video'],
      required: true
    },
    livestreamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream'
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  },
  
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  totalCost: {
    type: Number,
    required: true
  },
  
  // Combo/streak information
  combo: {
    isCombo: Boolean,
    comboCount: Number,
    bonusMultiplier: Number,
    totalBonusPoints: Number
  },
  
  message: {
    type: String,
    maxlength: 200
  },
  
  anonymous: {
    type: Boolean,
    default: false
  },
  
  // Display options
  display: {
    showInPublic: {
      type: Boolean,
      default: true
    },
    showInLeaderboard: {
      type: Boolean,
      default: true
    },
    highlightInStream: {
      type: Boolean,
      default: false
    }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'delivered', 'seen', 'thanked', 'failed', 'refunded'],
    default: 'pending'
  },
  
  deliveredAt: Date,
  seenAt: Date,
  thankedAt: Date,
  
  // Thank you response from receiver
  thankYouMessage: String,
  
  // Related credit transaction
  creditTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditTransaction'
  },
  
  // Notification sent
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  metadata: {
    senderLocation: String,
    deviceType: String,
    appVersion: String
  }
}, {
  timestamps: true
});

// Indexes
giftTransactionSchema.index({ sender: 1, createdAt: -1 });
giftTransactionSchema.index({ receiver: 1, createdAt: -1 });
giftTransactionSchema.index({ 'context.type': 1, 'context.livestreamId': 1 });
giftTransactionSchema.index({ status: 1 });
giftTransactionSchema.index({ createdAt: -1 });

// Methods
giftTransactionSchema.methods.markAsDelivered = async function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  await this.save();
  
  // TODO: Send push notification to receiver
  return this;
};

giftTransactionSchema.methods.markAsSeen = async function() {
  if (this.status === 'pending' || this.status === 'delivered') {
    this.status = 'seen';
    this.seenAt = new Date();
    await this.save();
  }
  return this;
};

giftTransactionSchema.methods.addThankYou = async function(message) {
  this.status = 'thanked';
  this.thankedAt = new Date();
  this.thankYouMessage = message;
  await this.save();
  
  // TODO: Send notification to sender
  return this;
};

// Statics
giftTransactionSchema.statics.getReceiverHistory = function(userId, limit = 50) {
  return this.find({ receiver: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('gift', 'name displayName media price')
    .populate('sender', 'username avatar');
};

giftTransactionSchema.statics.getSenderHistory = function(userId, limit = 50) {
  return this.find({ sender: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('gift', 'name displayName media price')
    .populate('receiver', 'username avatar');
};

giftTransactionSchema.statics.getStreamGifts = function(livestreamId, limit = 100) {
  return this.find({ 
    'context.type': 'livestream',
    'context.livestreamId': livestreamId,
    status: { $in: ['delivered', 'seen', 'thanked'] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('gift', 'name displayName media effects')
  .populate('sender', 'username avatar');
};

giftTransactionSchema.statics.getTopGifters = function(receiverId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        receiver: mongoose.Types.ObjectId(receiverId),
        status: { $in: ['delivered', 'seen', 'thanked'] }
      }
    },
    {
      $group: {
        _id: '$sender',
        totalGifts: { $sum: '$quantity' },
        totalValue: { $sum: '$totalCost' },
        giftCount: { $sum: 1 },
        lastGift: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalValue: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user: {
          _id: 1,
          username: 1,
          avatar: 1,
          firstName: 1,
          lastName: 1
        },
        totalGifts: 1,
        totalValue: 1,
        giftCount: 1,
        lastGift: 1
      }
    }
  ]);
};

giftTransactionSchema.statics.getLeaderboard = function(period = 'alltime', limit = 100) {
  const match = { status: { $in: ['delivered', 'seen', 'thanked'] } };
  
  // Add time filter
  if (period === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    match.createdAt = { $gte: today };
  } else if (period === 'weekly') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: weekAgo };
  } else if (period === 'monthly') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: monthAgo };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$sender',
        totalValue: { $sum: '$totalCost' },
        totalGifts: { $sum: '$quantity' },
        giftCount: { $sum: 1 },
        uniqueReceivers: { $addToSet: '$receiver' }
      }
    },
    {
      $project: {
        totalValue: 1,
        totalGifts: 1,
        giftCount: 1,
        uniqueReceiversCount: { $size: '$uniqueReceivers' }
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: {
          _id: 1,
          username: 1,
          avatar: 1,
          firstName: 1,
          lastName: 1
        },
        totalValue: 1,
        totalGifts: 1,
        giftCount: 1,
        uniqueReceiversCount: 1
      }
    }
  ]);
};

// Models
const Gift = mongoose.model('Gift', giftSchema);
const GiftTransaction = mongoose.model('GiftTransaction', giftTransactionSchema);

module.exports = {
  Gift,
  GiftTransaction
};
