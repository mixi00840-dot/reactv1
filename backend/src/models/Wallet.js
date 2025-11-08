const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  balance: {
    type: Number,
    default: 0,
    min: 0,
    get: v => parseFloat(v.toFixed(2))
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'coins']
  },
  
  // Earnings breakdown
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  withdrawableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeWithdrawals: {
    type: Number,
    default: 0
  },
  
  // Payment methods
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'paypal', 'bank', 'stripe']
    },
    details: mongoose.Schema.Types.Mixed,
    isDefault: Boolean,
    isVerified: Boolean,
    addedAt: Date
  }],
  
  // Wallet status
  isLocked: {
    type: Boolean,
    default: false
  },
  lockReason: String,
  
  // Last transaction
  lastTransactionAt: Date,
  lastWithdrawalAt: Date,
  
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Index for lookups
WalletSchema.index({ userId: 1 }, { unique: true });

// Method to add funds
WalletSchema.methods.addFunds = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  this.balance += amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  await Transaction.create({
    userId: this.userId,
    walletId: this._id,
    type: 'purchase',
    amount,
    description,
    balanceBefore: this.balance - amount,
    balanceAfter: this.balance,
    status: 'completed'
  });
  
  return this;
};

// Method to deduct funds
WalletSchema.methods.deductFunds = async function(amount, description = '') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  if (this.isLocked) {
    throw new Error('Wallet is locked');
  }
  
  this.balance -= amount;
  this.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const Transaction = mongoose.model('Transaction');
  await Transaction.create({
    userId: this.userId,
    walletId: this._id,
    type: 'purchase',
    amount: -amount,
    description,
    balanceBefore: this.balance + amount,
    balanceAfter: this.balance,
    status: 'completed'
  });
  
  return this;
};

// Method to transfer funds to another wallet
WalletSchema.methods.transferTo = async function(recipientWalletId, amount, description = '') {
  const recipientWallet = await mongoose.model('Wallet').findById(recipientWalletId);
  
  if (!recipientWallet) {
    throw new Error('Recipient wallet not found');
  }
  
  await this.deductFunds(amount, `Transfer to ${recipientWallet.userId}: ${description}`);
  await recipientWallet.addFunds(amount, `Transfer from ${this.userId}: ${description}`);
  
  return { sender: this, recipient: recipientWallet };
};

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;

