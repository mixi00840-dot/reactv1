const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  type: {
    type: String,
    enum: ['promotional', 'refund', 'bonus', 'referral', 'compensation'],
    required: true
  },
  
  description: String,
  
  expiresAt: Date,
  
  isUsed: {
    type: Boolean,
    default: false
  },
  
  usedAt: Date,
  
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
}, {
  timestamps: true
});

CreditSchema.index({ userId: 1, isUsed: 1 });
CreditSchema.index({ expiresAt: 1 });

const Credit = mongoose.model('Credit', CreditSchema);

module.exports = Credit;

