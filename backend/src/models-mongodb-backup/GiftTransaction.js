const mongoose = require('mongoose');

/**
 * Gift Transaction Schema
 * Tracks virtual gift purchases and sends between users
 */
const giftTransactionSchema = new mongoose.Schema({
  // Transaction ID
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Receiver information
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Gift information
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    required: true,
    index: true
  },
  
  giftDetails: {
    name: String,
    displayName: String,
    category: String,
    rarity: String,
    icon: String
  },
  
  // Quantity sent
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Cost information
  cost: {
    total: {
      type: Number,
      required: true
    },
    perUnit: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'coins'
    }
  },
  
  // Context where gift was sent
  context: {
    type: {
      type: String,
      enum: ['livestream', 'pk_battle', 'multihost', 'video', 'post', 'direct_message'],
      required: true,
      index: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    referenceName: String
  },
  
  // PK Battle specific (if sent during PK battle)
  pkBattle: {
    battleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PKBattle'
    },
    side: {
      type: String,
      enum: ['host1', 'host2']
    },
    pointsAwarded: Number
  },
  
  // Message attached to gift
  message: {
    type: String,
    maxlength: 200
  },
  
  // Display settings
  display: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    showInFeed: {
      type: Boolean,
      default: true
    }
  },
  
  // Combo information (multiple gifts in sequence)
  combo: {
    isCombo: {
      type: Boolean,
      default: false
    },
    comboCount: {
      type: Number,
      default: 1
    },
    comboMultiplier: {
      type: Number,
      default: 1
    }
  },
  
  // Revenue sharing
  revenueShare: {
    receiverShare: {
      type: Number,
      default: 0
    },
    receiverPercentage: {
      type: Number,
      default: 70
    },
    platformShare: {
      type: Number,
      default: 0
    },
    platformPercentage: {
      type: Number,
      default: 30
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
    index: true
  },
  
  // Payment information
  payment: {
    method: String,
    transactionId: String,
    processedAt: Date
  },
  
  // Refund information
  refund: {
    reason: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundedAt: Date,
    refundAmount: Number
  },
  
  // Statistics
  stats: {
    impressions: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  metadata: {
    senderBalance: Number,
    receiverBalance: Number,
    ipAddress: String,
    userAgent: String,
    deviceType: String
  }
}, {
  timestamps: true
});

// Indexes for common queries
giftTransactionSchema.index({ sender: 1, createdAt: -1 });
giftTransactionSchema.index({ receiver: 1, createdAt: -1 });
giftTransactionSchema.index({ 'context.type': 1, 'context.referenceId': 1 });
giftTransactionSchema.index({ 'pkBattle.battleId': 1, 'pkBattle.side': 1 });
giftTransactionSchema.index({ createdAt: -1 });
giftTransactionSchema.index({ status: 1, createdAt: -1 });

// Virtual for total value including combo multiplier
giftTransactionSchema.virtual('totalValue').get(function() {
  return this.cost.total * this.combo.comboMultiplier;
});

// Method to calculate revenue share
giftTransactionSchema.methods.calculateRevenueShare = function() {
  const totalAmount = this.cost.total * this.quantity;
  
  this.revenueShare.receiverShare = totalAmount * (this.revenueShare.receiverPercentage / 100);
  this.revenueShare.platformShare = totalAmount * (this.revenueShare.platformPercentage / 100);
  
  return {
    receiver: this.revenueShare.receiverShare,
    platform: this.revenueShare.platformShare,
    total: totalAmount
  };
};

// Method to process refund
giftTransactionSchema.methods.processRefund = async function(reason, refundedBy) {
  this.status = 'refunded';
  this.refund = {
    reason,
    refundedBy,
    refundedAt: new Date(),
    refundAmount: this.cost.total * this.quantity
  };
  
  await this.save();
  return this;
};

// Static method to get transactions for livestream
giftTransactionSchema.statics.getForLivestream = function(livestreamId, options = {}) {
  const query = {
    'context.type': 'livestream',
    'context.referenceId': livestreamId,
    status: 'completed'
  };
  
  return this.find(query)
    .populate('sender', 'username displayName avatar')
    .populate('receiver', 'username displayName avatar')
    .populate('gift')
    .sort({ createdAt: options.sort || -1 })
    .limit(options.limit || 100);
};

// Static method to get transactions for PK battle
giftTransactionSchema.statics.getForPKBattle = function(battleId, side = null) {
  const query = {
    'pkBattle.battleId': battleId,
    status: 'completed'
  };
  
  if (side) {
    query['pkBattle.side'] = side;
  }
  
  return this.find(query)
    .populate('sender', 'username displayName avatar')
    .populate('gift')
    .sort({ createdAt: -1 });
};

// Static method to get user's gift history
giftTransactionSchema.statics.getUserHistory = function(userId, type = 'sent', options = {}) {
  const field = type === 'sent' ? 'sender' : 'receiver';
  
  return this.find({ [field]: userId, status: 'completed' })
    .populate('sender', 'username displayName avatar')
    .populate('receiver', 'username displayName avatar')
    .populate('gift')
    .sort({ createdAt: options.sort || -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get top gifters
giftTransactionSchema.statics.getTopGifters = async function(period = 'all', limit = 10) {
  const matchStage = { status: 'completed' };
  
  // Add time filter
  if (period !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }
    
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$sender',
        totalSpent: { $sum: { $multiply: ['$cost.total', '$quantity'] } },
        giftCount: { $sum: '$quantity' },
        uniqueReceivers: { $addToSet: '$receiver' }
      }
    },
    {
      $project: {
        userId: '$_id',
        totalSpent: 1,
        giftCount: 1,
        uniqueReceivers: { $size: '$uniqueReceivers' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get revenue statistics
giftTransactionSchema.statics.getRevenueStats = async function(receiverId, startDate, endDate) {
  const match = {
    receiver: receiverId,
    status: 'completed'
  };
  
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenueShare.receiverShare' },
        totalGifts: { $sum: '$quantity' },
        uniqueSenders: { $addToSet: '$sender' },
        avgGiftValue: { $avg: '$cost.total' }
      }
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalGifts: 1,
        uniqueSenders: { $size: '$uniqueSenders' },
        avgGiftValue: 1
      }
    }
  ]);
  
  return stats[0] || {
    totalRevenue: 0,
    totalGifts: 0,
    uniqueSenders: 0,
    avgGiftValue: 0
  };
};

module.exports = mongoose.models.GiftTransaction || mongoose.model('GiftTransaction', giftTransactionSchema);
