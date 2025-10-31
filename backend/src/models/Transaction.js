const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Related Entities
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    index: true
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['payment', 'refund', 'payout', 'commission', 'fee', 'adjustment', 'chargeback'],
    required: true
  },
  subtype: {
    type: String,
    enum: ['purchase', 'partial_refund', 'full_refund', 'seller_payout', 'platform_fee', 'processing_fee', 'dispute_fee']
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Fee Breakdown
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    stripeFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  
  // Net Amount (amount - fees)
  netAmount: {
    type: Number,
    required: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'wallet', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  
  // Payment Provider Information
  provider: {
    name: {
      type: String,
      enum: ['stripe', 'paypal', 'internal_wallet', 'bank', 'cash'],
      required: true
    },
    transactionId: String, // Provider's transaction ID
    paymentIntentId: String, // Stripe payment intent
    chargeId: String, // Stripe charge ID
    payoutId: String, // For payout transactions
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded'],
    default: 'pending'
  },
  
  // Failure Information
  failureReason: String,
  failureCode: String,
  
  // Timing
  processedAt: Date,
  settledAt: Date,
  
  // Description
  description: String,
  internalNotes: String,
  
  // Risk Assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100
  },
  riskFactors: [String],
  
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  
  // Audit Trail
  events: [{
    type: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment Method Details
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_account', 'paypal', 'wallet'],
    required: true
  },
  
  // Provider Information
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'internal'],
    required: true
  },
  providerId: String, // Provider's payment method ID
  
  // Card Information (if applicable)
  card: {
    brand: String, // visa, mastercard, amex, etc.
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    fingerprint: String
  },
  
  // Bank Account Information (if applicable)
  bankAccount: {
    bankName: String,
    accountType: String, // checking, savings
    last4: String,
    routingNumber: String
  },
  
  // Billing Address
  billingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Status
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  nickname: String, // User-defined name for the payment method
  
  // Last Usage
  lastUsedAt: Date
}, {
  timestamps: true
});

const payoutSchema = new mongoose.Schema({
  // Payout Identification
  payoutId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Store Information
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Period Information
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Included Transactions
  transactions: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: Number,
    commission: Number,
    netAmount: Number
  }],
  
  // Fee Information
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    adjustments: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  
  // Net Payout Amount
  netAmount: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe_express', 'check', 'wire_transfer']
  },
  
  // Provider Information
  provider: {
    name: String,
    payoutId: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Banking Details
  bankDetails: {
    accountHolderName: String,
    accountNumber: String, // Encrypted
    routingNumber: String,
    bankName: String,
    swiftCode: String
  },
  
  // Timing
  scheduledAt: Date,
  processedAt: Date,
  
  // Failure Information
  failureReason: String,
  
  // Notes
  notes: String,
  adminNotes: String,
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const disputeSchema = new mongoose.Schema({
  // Dispute Identification
  disputeId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Related Entities
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Dispute Type
  type: {
    type: String,
    enum: ['chargeback', 'inquiry', 'refund_request', 'return_request', 'quality_issue', 'shipping_issue', 'unauthorized'],
    required: true
  },
  
  // Dispute Details
  reason: {
    type: String,
    required: true
  },
  description: String,
  
  // Amount
  disputedAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Status
  status: {
    type: String,
    enum: ['open', 'under_review', 'waiting_response', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['receipt', 'shipping_proof', 'communication', 'product_image', 'documentation', 'other']
    },
    description: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Communication
  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isFromAdmin: {
      type: Boolean,
      default: false
    }
  }],
  
  // Resolution
  resolution: {
    type: String,
    enum: ['refund_full', 'refund_partial', 'replacement', 'store_credit', 'no_action', 'chargeback_lost', 'chargeback_won']
  },
  resolutionAmount: Number,
  resolutionNotes: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Provider Information (for chargebacks)
  provider: {
    name: String,
    disputeId: String,
    reason: String,
    evidence_due_by: Date,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Important Dates
  dueDate: Date,
  respondedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Transaction Virtuals
transactionSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

transactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

transactionSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

// Payment Method Virtuals
paymentMethodSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Payout Virtuals
payoutSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

// Dispute Virtuals
disputeSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

disputeSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

disputeSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    this.transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  // Calculate net amount
  this.netAmount = this.amount - this.fees.totalFees;
  
  // Set processed date for completed transactions
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  next();
});

payoutSchema.pre('save', function(next) {
  // Generate payout ID if not exists
  if (!this.payoutId) {
    this.payoutId = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  // Calculate net amount
  this.netAmount = this.amount - this.fees.totalFees;
  
  next();
});

disputeSchema.pre('save', function(next) {
  // Generate dispute ID if not exists
  if (!this.disputeId) {
    this.disputeId = 'DIS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  next();
});

// Static methods
transactionSchema.statics.findByOrder = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

transactionSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

transactionSchema.statics.findByStore = function(storeId) {
  return this.find({ storeId }).sort({ createdAt: -1 });
};

transactionSchema.statics.getRevenueByPeriod = function(startDate, endDate, storeId = null) {
  const match = {
    createdAt: { $gte: startDate, $lte: endDate },
    type: 'payment',
    status: 'completed'
  };
  
  if (storeId) {
    match.storeId = storeId;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        netRevenue: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

// Instance methods
transactionSchema.methods.addEvent = function(eventType, description, metadata = {}) {
  this.events.push({
    type: eventType,
    description,
    metadata
  });
  
  return this.save();
};

payoutSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.amount += transactionData.netAmount;
  
  return this.save();
};

disputeSchema.methods.addMessage = function(from, to, message, isFromAdmin = false) {
  this.messages.push({
    from,
    to,
    message,
    isFromAdmin
  });
  
  return this.save();
};

disputeSchema.methods.addEvidence = function(evidenceData) {
  this.evidence.push(evidenceData);
  return this.save();
};

// Indexes
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ storeId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'provider.transactionId': 1 });
transactionSchema.index({ createdAt: -1 });

paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ providerId: 1 });
paymentMethodSchema.index({ isDefault: 1 });

payoutSchema.index({ payoutId: 1 });
payoutSchema.index({ storeId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });

disputeSchema.index({ disputeId: 1 });
disputeSchema.index({ orderId: 1 });
disputeSchema.index({ userId: 1 });
disputeSchema.index({ storeId: 1 });
disputeSchema.index({ status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const Payout = mongoose.model('Payout', payoutSchema);
const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = { Transaction, PaymentMethod, Payout, Dispute };