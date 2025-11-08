const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  
  exchangeRate: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  
  baseCurrency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  decimalPlaces: {
    type: Number,
    default: 2,
    min: 0,
    max: 8
  },
  
  country: String,
  
  flag: String, // URL or emoji
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Indexes (removed duplicate unique index on code since it's defined in schema)
CurrencySchema.index({ isActive: 1, isDefault: -1 });

// Ensure only one default currency
CurrencySchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default from other currencies
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Static method to get active currencies
CurrencySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ isDefault: -1, code: 1 });
};

// Static method to get default currency
CurrencySchema.statics.getDefault = function() {
  return this.findOne({ isDefault: true });
};

// Method to update exchange rate
CurrencySchema.methods.updateRate = async function(newRate) {
  this.exchangeRate = newRate;
  this.lastUpdated = new Date();
  return await this.save();
};

const Currency = mongoose.model('Currency', CurrencySchema);

module.exports = Currency;
