const mongoose = require('mongoose');

const SubscriptionTierSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: { type: String, default: 'USD' },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  benefits: [String],
  isActive: { type: Boolean, default: true },
  subscribersCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

SubscriptionTierSchema.index({ creatorId: 1, isActive: 1 });

const SubscriptionTier = mongoose.model('SubscriptionTier', SubscriptionTierSchema);

module.exports = SubscriptionTier;
