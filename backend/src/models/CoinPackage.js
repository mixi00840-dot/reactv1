const mongoose = require('mongoose');

const coinPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  coins: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true
  },
  bonusCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    validUntil: Date,
    isActive: { type: Boolean, default: false }
  },
  popular: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i,
    default: '#ffd700'
  },
  platforms: [{
    type: String,
    enum: ['ios', 'android', 'web'],
    default: ['ios', 'android', 'web']
  }],
  purchaseLimit: {
    daily: { type: Number, default: null },
    weekly: { type: Number, default: null },
    monthly: { type: Number, default: null }
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  tags: [String],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    analytics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
coinPackageSchema.index({ isActive: 1, sortOrder: 1 });
coinPackageSchema.index({ popular: -1, featured: -1 });
coinPackageSchema.index({ price: 1 });
coinPackageSchema.index({ coins: 1 });

// Virtual for total coins (including bonus)
coinPackageSchema.virtual('totalCoins').get(function() {
  return this.coins + this.bonusCoins;
});

// Virtual for effective price (after discount)
coinPackageSchema.virtual('effectivePrice').get(function() {
  if (this.discount.isActive && this.discount.percentage > 0) {
    const discountAmount = (this.price * this.discount.percentage) / 100;
    return this.price - discountAmount;
  }
  return this.price;
});

// Virtual for coins per dollar
coinPackageSchema.virtual('coinsPerDollar').get(function() {
  return this.effectivePrice > 0 ? this.totalCoins / this.effectivePrice : 0;
});

// Virtual for discount amount
coinPackageSchema.virtual('discountAmount').get(function() {
  if (this.discount.isActive && this.discount.percentage > 0) {
    return (this.price * this.discount.percentage) / 100;
  }
  return 0;
});

// Methods
coinPackageSchema.methods.isDiscountValid = function() {
  if (!this.discount.isActive) return false;
  if (!this.discount.validUntil) return true;
  return new Date() <= this.discount.validUntil;
};

coinPackageSchema.methods.canPurchase = function(userPurchases = {}) {
  if (!this.isActive) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Check daily limit
  if (this.purchaseLimit.daily && userPurchases.daily >= this.purchaseLimit.daily) {
    return false;
  }
  
  // Check weekly limit
  if (this.purchaseLimit.weekly && userPurchases.weekly >= this.purchaseLimit.weekly) {
    return false;
  }
  
  // Check monthly limit
  if (this.purchaseLimit.monthly && userPurchases.monthly >= this.purchaseLimit.monthly) {
    return false;
  }
  
  return true;
};

coinPackageSchema.methods.recordPurchase = function(amount = this.effectivePrice) {
  this.purchaseCount += 1;
  this.revenue += amount;
  this.metadata.analytics.conversionRate = this.metadata.analytics.clicks > 0 ? 
    (this.purchaseCount / this.metadata.analytics.clicks) * 100 : 0;
  return this.save();
};

// Static methods
coinPackageSchema.statics.getActivePackages = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, price: 1 });
};

coinPackageSchema.statics.getFeaturedPackages = function() {
  return this.find({ isActive: true, featured: true })
    .sort({ sortOrder: 1 });
};

coinPackageSchema.statics.getPopularPackages = function() {
  return this.find({ isActive: true, popular: true })
    .sort({ purchaseCount: -1 });
};

coinPackageSchema.statics.getBestValue = function() {
  return this.find({ isActive: true })
    .sort({ coinsPerDollar: -1 })
    .limit(1);
};

// Pre-save middleware
coinPackageSchema.pre('save', function(next) {
  // Update conversion rate
  if (this.metadata.analytics.clicks > 0) {
    this.metadata.analytics.conversionRate = 
      (this.purchaseCount / this.metadata.analytics.clicks) * 100;
  }
  next();
});

module.exports = mongoose.model('CoinPackage', coinPackageSchema);