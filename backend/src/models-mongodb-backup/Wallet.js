const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Wallet Reference
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
    index: true
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer_in', 'transfer_out', 'refund', 'fee', 'bonus', 'cashback', 'reward', 'penalty', 'commission', 'earning'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Balance Information
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Description and Reference
  description: {
    type: String,
    required: true
  },
  reference: String, // Order ID, transaction ID, etc.
  
  // Related Entities
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Audit
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Balance Information
  balance: {
    type: Number,
    default: 0.00,
    min: 0,
    set: value => Math.round(value * 100) / 100 // Round to 2 decimal places
  },
  
  // Pending amounts (for holds/reserves)
  pendingCredit: {
    type: Number,
    default: 0.00,
    min: 0
  },
  pendingDebit: {
    type: Number,
    default: 0.00,
    min: 0
  },
  
  // Available balance (balance - pendingDebit)
  availableBalance: {
    type: Number,
    default: 0.00,
    min: 0
  },
  
  // Enhanced tracking from original model
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpendings: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlySpendings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Support Level from original model
  supportLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  
  // Wallet Status (enhanced)
  status: {
    type: String,
    enum: ['active', 'frozen', 'suspended', 'closed'],
    default: 'active'
  },
  
  // Legacy status fields for compatibility
  isActive: {
    type: Boolean,
    default: true
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  
  // Security Settings
  security: {
    pin: String, // Hashed PIN for additional security
    pinAttempts: {
      type: Number,
      default: 0
    },
    lastPinAttempt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // Limits and Settings
  limits: {
    daily: {
      spending: {
        type: Number,
        default: 1000
      },
      withdrawal: {
        type: Number,
        default: 500
      }
    },
    monthly: {
      spending: {
        type: Number,
        default: 10000
      },
      withdrawal: {
        type: Number,
        default: 5000
      }
    },
    transaction: {
      min: {
        type: Number,
        default: 0.01
      },
      max: {
        type: Number,
        default: 5000
      }
    }
  },
  
  // Usage Tracking
  usage: {
    dailySpent: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    totalTransactions: {
      type: Number,
      default: 0
    }
  },
  
  // Verification level affects limits
  verificationLevel: {
    type: String,
    enum: ['basic', 'verified', 'premium', 'business'],
    default: 'basic'
  },
  
  // Withdrawal info from original model
  withdrawalMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'crypto', 'mobile_money'],
    default: undefined
  },
  withdrawalDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    paypalEmail: String,
    cryptoAddress: String,
    mobileNumber: String
  },
  
  // Cashback and Rewards
  rewards: {
    totalCashback: {
      type: Number,
      default: 0
    },
    pendingCashback: {
      type: Number,
      default: 0
    },
    totalRewards: {
      type: Number,
      default: 0
    },
    rewardPoints: {
      type: Number,
      default: 0
    }
  },
  
  // Notifications
  notifications: {
    lowBalance: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 10
      }
    },
    transactions: {
      enabled: {
        type: Boolean,
        default: true
      },
      minAmount: {
        type: Number,
        default: 1
      }
    }
  },
  
  // Freeze/Suspension Details
  frozenReason: String,
  frozenAt: Date,
  frozenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Audit Fields
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastTransactionAt: {
    type: Date,
    default: null
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for net worth (from original)
walletSchema.virtual('netWorth').get(function() {
  return this.totalEarnings - this.totalSpendings;
});

// Virtual for user
walletSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for recent transactions
walletSchema.virtual('recentTransactions', {
  ref: 'WalletTransaction',
  localField: '_id',
  foreignField: 'walletId',
  options: { sort: { createdAt: -1 }, limit: 10 }
});

// Pre-save middleware
walletSchema.pre('save', function(next) {
  // Update available balance
  this.availableBalance = this.balance - this.pendingDebit;
  
  // Sync legacy status fields
  this.isActive = this.status === 'active';
  this.isFrozen = this.status === 'frozen';
  
  // Reset daily/monthly usage if needed
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  
  // Reset daily usage at midnight
  if (now.getDate() !== lastReset.getDate()) {
    this.usage.dailySpent = 0;
  }
  
  // Reset monthly usage on first of month
  if (now.getMonth() !== lastReset.getMonth()) {
    this.monthlySpendings = 0;
    this.monthlyEarnings = 0;
  }
  
  // Update support level based on total earnings
  this.updateSupportLevel();
  
  // Update last reset date
  this.usage.lastResetDate = now;
  
  next();
});

// Original methods (maintained for compatibility)
walletSchema.methods.credit = async function(amount, description = '', reference = null, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  
  const balanceBefore = this.balance;
  this.balance += amount;
  this.totalEarnings += amount;
  this.monthlyEarnings += amount;
  this.usage.totalTransactions += 1;
  this.lastActivity = new Date();
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create wallet transaction record
  const WalletTransaction = mongoose.model('WalletTransaction');
  const transaction = new WalletTransaction({
    transactionId: 'WT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    walletId: this._id,
    type: 'credit',
    amount,
    currency: this.currency,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    reference,
    metadata
  });
  
  await transaction.save();
  return transaction;
};

walletSchema.methods.debit = async function(amount, description = '', reference = null, metadata = {}) {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  if (!this.canDebit(amount)) {
    throw new Error('Debit not allowed: wallet frozen or limits exceeded');
  }
  
  const balanceBefore = this.balance;
  this.balance -= amount;
  this.totalSpendings += amount;
  this.monthlySpendings += amount;
  this.usage.dailySpent += amount;
  this.usage.totalTransactions += 1;
  this.lastActivity = new Date();
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create wallet transaction record
  const WalletTransaction = mongoose.model('WalletTransaction');
  const transaction = new WalletTransaction({
    transactionId: 'WT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    walletId: this._id,
    type: 'debit',
    amount,
    currency: this.currency,
    balanceBefore,
    balanceAfter: this.balance,
    description,
    reference,
    metadata
  });
  
  await transaction.save();
  return transaction;
};

// Original support level method
walletSchema.methods.updateSupportLevel = function() {
  const earnings = this.totalEarnings;
  
  if (earnings >= 100000) {
    this.supportLevel = 'diamond';
  } else if (earnings >= 50000) {
    this.supportLevel = 'platinum';
  } else if (earnings >= 25000) {
    this.supportLevel = 'gold';
  } else if (earnings >= 10000) {
    this.supportLevel = 'silver';
  } else {
    this.supportLevel = 'bronze';
  }
};

// Original freeze/unfreeze methods
walletSchema.methods.freeze = function(adminId, reason) {
  this.status = 'frozen';
  this.isFrozen = true;
  this.frozenReason = reason;
  this.frozenAt = new Date();
  this.frozenBy = adminId;
  return this.save();
};

walletSchema.methods.unfreeze = function() {
  this.status = 'active';
  this.isFrozen = false;
  this.frozenReason = null;
  this.frozenAt = null;
  this.frozenBy = null;
  return this.save();
};

// Enhanced methods
walletSchema.methods.hold = async function(amount, description, reference) {
  if (amount <= 0) {
    throw new Error('Hold amount must be positive');
  }
  
  if (this.availableBalance < amount) {
    throw new Error('Insufficient available funds for hold');
  }
  
  this.pendingDebit += amount;
  await this.save();
  
  return {
    amount,
    description,
    reference,
    timestamp: new Date()
  };
};

walletSchema.methods.releaseHold = async function(amount) {
  if (amount <= 0) {
    throw new Error('Release amount must be positive');
  }
  
  if (this.pendingDebit < amount) {
    throw new Error('Cannot release more than pending amount');
  }
  
  this.pendingDebit -= amount;
  await this.save();
  
  return true;
};

walletSchema.methods.captureHold = async function(amount, description, reference) {
  if (amount <= 0) {
    throw new Error('Capture amount must be positive');
  }
  
  if (this.pendingDebit < amount) {
    throw new Error('Cannot capture more than pending amount');
  }
  
  // Release the hold and debit the actual amount
  this.pendingDebit -= amount;
  return await this.debit(amount, description, reference);
};

walletSchema.methods.canDebit = function(amount) {
  return this.availableBalance >= amount && 
         this.status === 'active' &&
         !this.isFrozen &&
         this.usage.dailySpent + amount <= this.limits.daily.spending &&
         this.monthlySpendings + amount <= this.limits.monthly.spending &&
         amount >= this.limits.transaction.min &&
         amount <= this.limits.transaction.max;
};

walletSchema.methods.canWithdraw = function(amount) {
  return this.canDebit(amount) && 
         amount <= this.limits.daily.withdrawal;
};

walletSchema.methods.transfer = async function(toWalletId, amount, description, reference) {
  if (amount <= 0) {
    throw new Error('Transfer amount must be positive');
  }
  
  if (!this.canDebit(amount)) {
    throw new Error('Cannot transfer: insufficient funds or limits exceeded');
  }
  
  const Wallet = mongoose.model('Wallet');
  const toWallet = await Wallet.findById(toWalletId);
  
  if (!toWallet) {
    throw new Error('Destination wallet not found');
  }
  
  if (toWallet.status !== 'active') {
    throw new Error('Destination wallet is not active');
  }
  
  // Perform the transfer
  const fromTransaction = await this.debit(amount, `Transfer to ${toWallet.userId}: ${description}`, reference, {
    transferTo: toWalletId,
    transferType: 'outgoing'
  });
  
  const toTransaction = await toWallet.credit(amount, `Transfer from ${this.userId}: ${description}`, reference, {
    transferFrom: this._id,
    transferType: 'incoming'
  });
  
  return {
    fromTransaction,
    toTransaction
  };
};

walletSchema.methods.addCashback = async function(amount, description, reference) {
  this.rewards.totalCashback += amount;
  return await this.credit(amount, description, reference, { type: 'cashback' });
};

walletSchema.methods.addCommission = async function(amount, description, reference) {
  return await this.credit(amount, description, reference, { type: 'commission' });
};

// Static methods
walletSchema.statics.createForUser = function(userId, initialBalance = 0) {
  return this.create({ 
    userId,
    balance: initialBalance,
    createdBy: userId
  });
};

walletSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId }).populate('user');
};

walletSchema.statics.getTotalBalance = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalBalance: { $sum: '$balance' } } }
  ]);
};

walletSchema.statics.getBalanceDistribution = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $bucket: {
        groupBy: '$balance',
        boundaries: [0, 10, 50, 100, 500, 1000, 5000, 10000, Infinity],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          totalBalance: { $sum: '$balance' }
        }
      }
    }
  ]);
};

// Indexes
walletSchema.index({ userId: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ balance: 1 });
walletSchema.index({ supportLevel: 1 });
walletSchema.index({ totalEarnings: -1 });
walletSchema.index({ verificationLevel: 1 });
walletSchema.index({ lastActivity: -1 });

walletTransactionSchema.index({ transactionId: 1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });
walletTransactionSchema.index({ relatedOrderId: 1 });
walletTransactionSchema.index({ status: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = { Wallet, WalletTransaction };