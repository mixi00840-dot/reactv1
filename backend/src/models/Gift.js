const mongoose = require('mongoose');

const GiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'coins',
    enum: ['coins', 'USD', 'EUR']
  },
  
  // Media
  icon: {
    type: String,
    required: true // Emoji or URL to icon
  },
  
  animationUrl: String,
  
  animation: {
    type: String,
    enum: ['none', 'float', 'pulse', 'sparkle', 'shine', 'explode', 'confetti', 'fireworks'],
    default: 'none'
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    index: true
  },
  
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // Visibility
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Availability
  isLimitedEdition: {
    type: Boolean,
    default: false
  },
  
  availableFrom: Date,
  availableUntil: Date,
  
  // Statistics
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  timesSent: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Creator earnings percentage
  creatorEarningsPercent: {
    type: Number,
    default: 50, // 50% to creator, 50% to platform
    min: 0,
    max: 100
  },
  
  // Display order
  sortOrder: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

// Indexes
GiftSchema.index({ category: 1, isActive: 1 });
GiftSchema.index({ popularity: -1 });
GiftSchema.index({ isFeatured: 1, popularity: -1 });
GiftSchema.index({ price: 1 });
GiftSchema.index({ rarity: 1, isActive: 1 });

// Virtual for effective price (considering any promotions)
GiftSchema.virtual('effectivePrice').get(function() {
  // Could add promotion logic here
  return this.price;
});

// Method to check if gift is available
GiftSchema.methods.isAvailable = function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  if (this.availableFrom && now < this.availableFrom) return false;
  if (this.availableUntil && now > this.availableUntil) return false;
  
  return true;
};

// Static method to get popular gifts
GiftSchema.statics.getPopularGifts = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ popularity: -1, timesSent: -1 })
    .limit(limit);
};

// Static method to get gifts by category
GiftSchema.statics.getByCategory = function(category, limit = 50) {
  return this.find({ category, isActive: true })
    .sort({ sortOrder: 1, popularity: -1 })
    .limit(limit);
};

const Gift = mongoose.model('Gift', GiftSchema);

module.exports = Gift;

