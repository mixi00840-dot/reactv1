const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionTier',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  autoRenew: { type: Boolean, default: true },
  price: Number,
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' }
}, {
  timestamps: true
});

SubscriptionSchema.index({ userId: 1, creatorId: 1 });
SubscriptionSchema.index({ status: 1, endDate: 1 });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;
