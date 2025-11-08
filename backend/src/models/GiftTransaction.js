const mongoose = require('mongoose');

const GiftTransactionSchema = new mongoose.Schema({
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    required: true,
    index: true
  },
  
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Context
  context: {
    type: String,
    enum: ['livestream', 'video', 'profile', 'message'],
    required: true
  },
  
  livestreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream'
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Gift details
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  unitPrice: {
    type: Number,
    required: true
  },
  
  totalCost: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'coins'
  },
  
  // Earnings split
  creatorEarnings: {
    type: Number,
    required: true
  },
  
  platformFee: {
    type: Number,
    required: true
  },
  
  // Gift metadata (snapshot at time of sending)
  giftName: String,
  giftIcon: String,
  giftAnimation: String,
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
    index: true
  },
  
  // Message from sender (optional)
  message: {
    type: String,
    maxlength: 200
  },
  
  // Visibility
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Related transactions
  walletTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We only need createdAt
});

// Compound indexes
GiftTransactionSchema.index({ livestreamId: 1, createdAt: -1 });
GiftTransactionSchema.index({ contentId: 1, createdAt: -1 });
GiftTransactionSchema.index({ senderId: 1, createdAt: -1 });
GiftTransactionSchema.index({ recipientId: 1, createdAt: -1 });
GiftTransactionSchema.index({ giftId: 1, createdAt: -1 });

// Static method to get livestream gifts
GiftTransactionSchema.statics.getLivestreamGifts = function(livestreamId, limit = 100) {
  return this.find({ livestreamId, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('giftId', 'name icon animation')
    .populate('senderId', 'username fullName avatar')
    .populate('recipientId', 'username fullName avatar');
};

// Static method to calculate total gifts received
GiftTransactionSchema.statics.calculateTotalReceived = async function(userId, startDate, endDate) {
  const match = {
    recipientId: mongoose.Types.ObjectId(userId),
    status: 'completed'
  };
  
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalGifts: { $sum: '$quantity' },
        totalValue: { $sum: '$totalCost' },
        totalEarnings: { $sum: '$creatorEarnings' },
        uniqueSenders: { $addToSet: '$senderId' }
      }
    }
  ]);
  
  const data = result[0] || { totalGifts: 0, totalValue: 0, totalEarnings: 0, uniqueSenders: [] };
  data.uniqueSendersCount = data.uniqueSenders?.length || 0;
  delete data.uniqueSenders;
  
  return data;
};

// Pre-save hook to calculate earnings split
GiftTransactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.creatorEarnings) {
    const gift = await mongoose.model('Gift').findById(this.giftId);
    if (gift) {
      const creatorPercent = gift.creatorEarningsPercent || 50;
      this.creatorEarnings = (this.totalCost * creatorPercent) / 100;
      this.platformFee = this.totalCost - this.creatorEarnings;
    }
  }
  next();
});

const GiftTransaction = mongoose.model('GiftTransaction', GiftTransactionSchema);

module.exports = GiftTransaction;

