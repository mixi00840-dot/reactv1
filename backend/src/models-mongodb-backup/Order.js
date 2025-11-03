const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  variantSku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  selectedAttributes: {
    type: Map,
    of: String
  },
  customization: {
    text: String,
    instructions: String,
    attachments: [String]
  },
  // Item-specific fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  trackingNumber: String,
  carrier: String,
  shippedAt: Date,
  deliveredAt: Date,
  estimatedDelivery: Date
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  guestEmail: String, // For guest checkouts
  
  // Order Items
  items: [orderItemSchema],
  
  // Store Information (for multi-vendor support)
  stores: [{
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    storeName: String,
    subtotal: Number,
    shipping: Number,
    tax: Number,
    commission: Number,
    total: Number
  }],
  
  // Pricing Breakdown
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Applied Discounts
  appliedCoupons: [{
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    code: String,
    discountAmount: Number,
    discountType: String
  }],
  
  // Addresses
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: String
  },
  billingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'wallet', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentIntentId: String, // Stripe payment intent ID
  
  // Shipping Information
  shippingMethod: {
    id: String,
    name: String,
    cost: Number,
    estimatedDays: String,
    carrier: String
  },
  trackingNumbers: [String],
  
  // Fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Important Dates
  orderDate: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  estimatedDelivery: Date,
  
  // Customer Communication
  customerNotes: String,
  internalNotes: String,
  
  // Order Events Log
  events: [{
    type: {
      type: String,
      enum: ['created', 'confirmed', 'payment_received', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'note_added'],
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Refunds and Returns
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Reviews
  allowReviews: {
    type: Boolean,
    default: true
  },
  reviewReminderSent: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  analytics: {
    source: String, // website, mobile_app, etc.
    medium: String, // organic, cpc, email, etc.
    campaign: String,
    deviceType: String,
    userAgent: String,
    ipAddress: String,
    referrer: String
  },
  
  // Risk Assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskFactors: [String],
  
  // Tax Information
  taxDetails: {
    taxRate: Number,
    taxableAmount: Number,
    taxExempt: {
      type: Boolean,
      default: false
    },
    taxExemptReason: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
orderSchema.virtual('customer', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

orderSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'orderId'
});

orderSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'orderId'
});

orderSchema.virtual('disputes', {
  ref: 'Dispute',
  localField: '_id',
  foreignField: 'orderId'
});

// Virtual for total items count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
orderSchema.virtual('uniqueItemCount').get(function() {
  return this.items.length;
});

// Virtual for current price (including discounts)
orderSchema.virtual('finalTotal').get(function() {
  return this.pricing.total;
});

// Virtual to check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtual to check if order can be refunded
orderSchema.virtual('canBeRefunded').get(function() {
  return ['delivered'].includes(this.status) && this.paymentStatus === 'paid';
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  
  // Update timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  
  next();
});

// Instance methods
orderSchema.methods.addEvent = function(eventType, description, performedBy = null, metadata = {}) {
  this.events.push({
    type: eventType,
    description,
    performedBy,
    metadata
  });
  
  return this.save();
};

orderSchema.methods.updateStatus = function(newStatus, performedBy = null, note = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add event log
  this.addEvent('status_changed', `Status changed from ${oldStatus} to ${newStatus}. ${note}`, performedBy);
  
  return this.save();
};

orderSchema.methods.addTracking = function(trackingNumber, carrier, storeId = null) {
  if (!this.trackingNumbers.includes(trackingNumber)) {
    this.trackingNumbers.push(trackingNumber);
  }
  
  // Update specific items if storeId provided
  if (storeId) {
    this.items.forEach(item => {
      if (item.storeId.toString() === storeId.toString()) {
        item.trackingNumber = trackingNumber;
        item.carrier = carrier;
        item.shippedAt = new Date();
        item.fulfillmentStatus = 'shipped';
      }
    });
  }
  
  // Update overall order status if all items are shipped
  const allShipped = this.items.every(item => item.fulfillmentStatus === 'shipped');
  if (allShipped) {
    this.status = 'shipped';
    this.fulfillmentStatus = 'shipped';
    this.shippedAt = new Date();
  }
  
  this.addEvent('tracking_added', `Tracking number ${trackingNumber} added for carrier ${carrier}`);
  
  return this.save();
};

orderSchema.methods.processRefund = function(amount, reason, processedBy) {
  const refund = {
    refundId: 'REF-' + Date.now(),
    amount,
    reason,
    processedBy,
    processedAt: new Date(),
    status: 'completed'
  };
  
  this.refunds.push(refund);
  
  // Update payment status
  const totalRefunded = this.refunds.reduce((sum, r) => sum + r.amount, 0);
  if (totalRefunded >= this.pricing.total) {
    this.paymentStatus = 'refunded';
    this.status = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }
  
  this.addEvent('refunded', `Refund of $${amount} processed. Reason: ${reason}`, processedBy);
  
  return this.save();
};

orderSchema.methods.calculateCommissions = function() {
  const commissions = [];
  
  this.stores.forEach(store => {
    const commission = {
      storeId: store.storeId,
      subtotal: store.subtotal,
      commissionRate: store.commission || 0.10, // 10% default
      commissionAmount: store.subtotal * (store.commission || 0.10),
      payoutAmount: store.subtotal * (1 - (store.commission || 0.10))
    };
    
    commissions.push(commission);
  });
  
  return commissions;
};

orderSchema.methods.getOrderSummary = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    paymentStatus: this.paymentStatus,
    total: this.pricing.total,
    currency: this.pricing.currency,
    itemCount: this.itemCount,
    orderDate: this.orderDate,
    estimatedDelivery: this.estimatedDelivery
  };
};

// Static methods
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query).sort({ createdAt: -1 });
};

orderSchema.statics.findByStore = function(storeId, status = null) {
  const query = { 'stores.storeId': storeId };
  if (status) query.status = status;
  
  return this.find(query).sort({ createdAt: -1 });
};

orderSchema.statics.getRevenueByPeriod = function(startDate, endDate, storeId = null) {
  const match = {
    orderDate: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelled', 'refunded'] }
  };
  
  if (storeId) {
    match['stores.storeId'] = new mongoose.Types.ObjectId(storeId);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);
};

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'stores.storeId': 1, createdAt: -1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ trackingNumbers: 1 });
orderSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Order', orderSchema);