const mongoose = require('mongoose');

// Credit Package Schema - Purchasable credit bundles
const creditPackageSchema = new mongoose.Schema({
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
  
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  
  bonusCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Total credits = credits + bonusCredits
  
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  popular: {
    type: Boolean,
    default: false
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  icon: String,
  badge: String, // e.g., "BEST VALUE", "POPULAR", "NEW"
  
  minUserLevel: {
    type: Number,
    default: 1
  },
  
  maxPurchasesPerDay: Number,
  maxPurchasesPerMonth: Number,
  
  availability: {
    startDate: Date,
    endDate: Date,
    limitedQuantity: Number,
    soldCount: {
      type: Number,
      default: 0
    }
  },
  
  // First-time purchase bonus
  firstTimeBonusCredits: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'soldout', 'expired'],
    default: 'active'
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  stats: {
    totalSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    avgRating: Number,
    reviewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Virtuals
creditPackageSchema.virtual('totalCredits').get(function() {
  return this.credits + this.bonusCredits;
});

creditPackageSchema.virtual('pricePerCredit').get(function() {
  return this.price.amount / this.totalCredits;
});

creditPackageSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  if (this.availability.startDate && now < this.availability.startDate) return false;
  if (this.availability.endDate && now > this.availability.endDate) return false;
  
  if (this.availability.limitedQuantity && 
      this.availability.soldCount >= this.availability.limitedQuantity) {
    return false;
  }
  
  return true;
});

// Indexes
creditPackageSchema.index({ status: 1, order: 1 });
creditPackageSchema.index({ popular: 1 });
creditPackageSchema.index({ featured: 1 });

// Credit Transaction Schema - Purchase and spending history
const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'purchase',      // Bought credits
      'gift_sent',     // Sent a gift
      'gift_received', // Received credits as gift
      'refund',        // Refunded credits
      'bonus',         // Promotional bonus
      'reward',        // Achievement/quest reward
      'admin_add',     // Admin added credits
      'admin_deduct',  // Admin deducted credits
      'expired',       // Credits expired
      'transfer'       // Transferred to another user
    ],
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  // Positive for additions, negative for deductions
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Related entities
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditPackage'
  },
  
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift'
  },
  
  giftTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiftTransaction'
  },
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment details
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'wallet']
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAmount: Number,
    currency: String,
    gateway: String,
    receiptUrl: String
  },
  
  description: String,
  
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Admin actions
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String,
  
  // Expiration (for promotional credits)
  expiresAt: Date,
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'expired'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1, createdAt: -1 });
creditTransactionSchema.index({ status: 1 });
creditTransactionSchema.index({ 'payment.transactionId': 1 });

// Methods
creditTransactionSchema.methods.refund = async function() {
  if (this.type !== 'purchase') {
    throw new Error('Only purchases can be refunded');
  }
  
  if (this.payment.status === 'refunded') {
    throw new Error('Transaction already refunded');
  }
  
  // Create refund transaction
  const refundTransaction = new CreditTransaction({
    user: this.user,
    type: 'refund',
    amount: this.amount,
    payment: {
      method: this.payment.method,
      transactionId: this.payment.transactionId + '_refund',
      status: 'completed'
    },
    description: `Refund for transaction ${this._id}`,
    metadata: {
      originalTransaction: this._id
    }
  });
  
  // Update original transaction
  this.payment.status = 'refunded';
  this.status = 'cancelled';
  
  await this.save();
  await refundTransaction.save();
  
  return refundTransaction;
};

// User Credit Balance Schema - Tracks user's credit wallet
const userCreditBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Breakdown of credit sources
  breakdown: {
    purchased: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    gifted: {
      type: Number,
      default: 0
    },
    rewards: {
      type: Number,
      default: 0
    }
  },
  
  // Lifetime statistics
  lifetime: {
    totalEarned: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    totalPurchased: {
      type: Number,
      default: 0
    },
    totalGifted: {
      type: Number,
      default: 0
    },
    totalReceived: {
      type: Number,
      default: 0
    }
  },
  
  // Spending statistics
  spending: {
    last7Days: {
      type: Number,
      default: 0
    },
    last30Days: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: Date
  },
  
  // VIP/Tier information
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  tierBenefits: {
    discountPercentage: {
      type: Number,
      default: 0
    },
    bonusCreditsMultiplier: {
      type: Number,
      default: 1
    },
    exclusiveGifts: {
      type: Boolean,
      default: false
    }
  },
  
  // Restrictions
  restrictions: {
    canPurchase: {
      type: Boolean,
      default: true
    },
    canGift: {
      type: Boolean,
      default: true
    },
    dailyGiftLimit: Number,
    reasonIfRestricted: String
  },
  
  lastTransaction: {
    type: Date
  },
  
  lastPurchase: {
    type: Date
  }
}, {
  timestamps: true
});

// Methods
userCreditBalanceSchema.methods.addCredits = async function(amount, type = 'purchase', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  this.balance += amount;
  
  // Update breakdown
  switch(type) {
    case 'purchase':
      this.breakdown.purchased += amount;
      this.lifetime.totalPurchased += amount;
      this.lastPurchase = new Date();
      break;
    case 'bonus':
      this.breakdown.bonus += amount;
      break;
    case 'gift_received':
      this.breakdown.gifted += amount;
      this.lifetime.totalReceived += amount;
      break;
    case 'reward':
      this.breakdown.rewards += amount;
      break;
  }
  
  this.lifetime.totalEarned += amount;
  this.lastTransaction = new Date();
  
  await this.save();
  
  // Create transaction record
  const transaction = new CreditTransaction({
    user: this.user,
    type: type,
    amount: amount,
    balanceAfter: this.balance,
    metadata: metadata
  });
  
  await transaction.save();
  
  return { balance: this.balance, transaction };
};

userCreditBalanceSchema.methods.deductCredits = async function(amount, type = 'gift_sent', metadata = {}) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient credits');
  }
  
  this.balance -= amount;
  
  if (type === 'gift_sent') {
    this.lifetime.totalGifted += amount;
    this.spending.last7Days += amount;
    this.spending.last30Days += amount;
    this.spending.thisMonth += amount;
  }
  
  this.lifetime.totalSpent += amount;
  this.lastTransaction = new Date();
  
  await this.save();
  
  // Create transaction record
  const transaction = new CreditTransaction({
    user: this.user,
    type: type,
    amount: -amount,
    balanceAfter: this.balance,
    metadata: metadata
  });
  
  await transaction.save();
  
  return { balance: this.balance, transaction };
};

userCreditBalanceSchema.methods.canPurchasePackage = function(packageData) {
  if (!this.restrictions.canPurchase) {
    return { allowed: false, reason: this.restrictions.reasonIfRestricted || 'Purchase restricted' };
  }
  
  if (packageData.minUserLevel && this.tier) {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const userTierIndex = tiers.indexOf(this.tier);
    if (userTierIndex < packageData.minUserLevel - 1) {
      return { allowed: false, reason: 'User tier too low' };
    }
  }
  
  return { allowed: true };
};

userCreditBalanceSchema.methods.updateTier = async function() {
  const totalSpent = this.lifetime.totalPurchased;
  
  let newTier = 'bronze';
  if (totalSpent >= 10000) newTier = 'diamond';
  else if (totalSpent >= 5000) newTier = 'platinum';
  else if (totalSpent >= 2000) newTier = 'gold';
  else if (totalSpent >= 500) newTier = 'silver';
  
  if (this.tier !== newTier) {
    this.tier = newTier;
    
    // Update tier benefits
    switch(newTier) {
      case 'silver':
        this.tierBenefits.discountPercentage = 5;
        this.tierBenefits.bonusCreditsMultiplier = 1.05;
        break;
      case 'gold':
        this.tierBenefits.discountPercentage = 10;
        this.tierBenefits.bonusCreditsMultiplier = 1.1;
        break;
      case 'platinum':
        this.tierBenefits.discountPercentage = 15;
        this.tierBenefits.bonusCreditsMultiplier = 1.15;
        this.tierBenefits.exclusiveGifts = true;
        break;
      case 'diamond':
        this.tierBenefits.discountPercentage = 20;
        this.tierBenefits.bonusCreditsMultiplier = 1.2;
        this.tierBenefits.exclusiveGifts = true;
        break;
    }
    
    await this.save();
  }
  
  return newTier;
};

// Statics
userCreditBalanceSchema.statics.getOrCreate = async function(userId) {
  let balance = await this.findOne({ user: userId });
  
  if (!balance) {
    balance = await this.create({
      user: userId,
      balance: 0
    });
  }
  
  return balance;
};

userCreditBalanceSchema.statics.getTopSpenders = async function(limit = 10, period = 'alltime') {
  let sortField = 'lifetime.totalSpent';
  
  if (period === '7days') sortField = 'spending.last7Days';
  else if (period === '30days') sortField = 'spending.last30Days';
  else if (period === 'month') sortField = 'spending.thisMonth';
  
  return this.find({})
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('user', 'username avatar firstName lastName');
};

// Models
const CreditPackage = mongoose.model('CreditPackage', creditPackageSchema);
const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
const UserCreditBalance = mongoose.model('UserCreditBalance', userCreditBalanceSchema);

module.exports = {
  CreditPackage,
  CreditTransaction,
  UserCreditBalance
};
