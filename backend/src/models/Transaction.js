const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      'purchase', 'gift_sent', 'gift_received', 'withdrawal', 
      'refund', 'earning', 'subscription', 'tip', 'transfer',
      'coin_purchase', 'payout', 'commission', 'bonus'
    ],
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true,
    get: v => parseFloat(v.toFixed(2))
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'coins']
  },
  
  // Transaction details
  description: {
    type: String,
    required: true
  },
  
  // Reference to related entity
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  referenceType: {
    type: String,
    enum: ['order', 'gift', 'livestream', 'content', 'subscription', 'withdrawal', 'other']
  },
  
  // Related users/entities
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedContentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Payment provider details
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'wallet', 'stripe', 'in_app_purchase']
  },
  paymentProvider: String, // 'stripe', 'paypal', etc.
  paymentId: String, // External payment ID
  paymentMetadata: mongoose.Schema.Types.Mixed,
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Balance snapshot
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Failure details
  failureReason: String,
  failureCode: String,
  
  // Processing timestamps
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  refundedAt: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // IP and device info
  ipAddress: String,
  userAgent: String,
  
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Compound indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ referenceId: 1, referenceType: 1 });
TransactionSchema.index({ paymentId: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });

// Virtual for is debit/credit
TransactionSchema.virtual('isDebit').get(function() {
  return this.amount < 0;
});

TransactionSchema.virtual('isCredit').get(function() {
  return this.amount > 0;
});

// Static method to get user transaction history
TransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const { limit = 50, page = 1, type, status } = options;
  const skip = (page - 1) * limit;
  
  let query = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedUserId', 'username fullName avatar')
    .populate('relatedContentId', 'caption thumbnailUrl');
};

// Static method to calculate total earnings
TransactionSchema.statics.calculateEarnings = async function(userId, startDate, endDate) {
  const match = {
    userId: mongoose.Types.ObjectId(userId),
    status: 'completed',
    type: { $in: ['earning', 'gift_received', 'tip', 'commission'] }
  };
  
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalEarnings: 0, transactionCount: 0 };
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;

