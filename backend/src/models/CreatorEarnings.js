const mongoose = require('mongoose');

const CreatorEarningsSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  // Revenue sources
  giftsRevenue: { type: Number, default: 0 },
  subscriptionsRevenue: { type: Number, default: 0 },
  adsRevenue: { type: Number, default: 0 },
  liveShoppingRevenue: { type: Number, default: 0 },
  tipsRevenue: { type: Number, default: 0 },
  
  totalRevenue: {
    type: Number,
    default: 0
  },
  
  platformFee: {
    type: Number,
    default: 0
  },
  
  netEarnings: {
    type: Number,
    default: 0
  },
  
  // Payout
  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  
  paidAt: Date,
  paymentMethod: String,
  
}, {
  timestamps: true
});

CreatorEarningsSchema.index({ creatorId: 1, startDate: -1 });
CreatorEarningsSchema.index({ period: 1, startDate: -1 });

const CreatorEarnings = mongoose.model('CreatorEarnings', CreatorEarningsSchema);

module.exports = CreatorEarnings;

