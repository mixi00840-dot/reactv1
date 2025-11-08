const mongoose = require('mongoose');

const CoinPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  coins: {
    type: Number,
    required: true,
    min: 1
  },
  
  bonusCoins: {
    type: Number,
    default: 0
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isBestValue: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  purchaseCount: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

CoinPackageSchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for total coins
CoinPackageSchema.virtual('totalCoins').get(function() {
  return this.coins + this.bonusCoins;
});

const CoinPackage = mongoose.model('CoinPackage', CoinPackageSchema);

module.exports = CoinPackage;

