const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    name: String,
    price: Number,
    quantity: { type: Number, min: 1 },
    variant: mongoose.Schema.Types.Mixed,
    image: String,
    total: Number
  }],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
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
  
  discount: {
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
  },
  
  // Coupon
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0
  },
  
  // Shipping Address
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: String,
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  
  // Billing Address (if different)
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Shipping
  shippingMethod: String,
  estimatedDelivery: Date,
  trackingNumber: String,
  carrierName: String,
  
  // Payment
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'paypal', 'stripe', 'wallet', 'cash_on_delivery']
  },
  
  paymentProvider: String, // 'stripe', 'paypal', etc.
  paymentId: String, // External payment ID
  paymentIntentId: String,
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
    index: true
  },
  
  // Status History
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Fulfillment
  fulfilledAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  returnedAt: Date,
  returnReason: String,
  
  // Notes
  customerNotes: String,
  sellerNotes: String,
  internalNotes: String,
  
  // Seller Assignment
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Reviews
  canReview: {
    type: Boolean,
    default: false
  },
  reviewedAt: Date,
  
}, {
  timestamps: true
});

// Compound indexes (orderNumber and paymentStatus already have indexes from schema)
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ 'items.storeId': 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook to generate order number
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Method to update status
OrderSchema.methods.updateStatus = async function(newStatus, note, updatedBy) {
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  
  // Update timestamps based on status
  if (newStatus === 'confirmed') {
    this.fulfilledAt = new Date();
    this.canReview = false;
  } else if (newStatus === 'shipped') {
    this.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
    this.canReview = true; // Allow review after delivery
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.canReview = false;
  }
  
  return this.save();
};

// Static method to get user orders
OrderSchema.statics.getUserOrders = function(userId, options = {}) {
  const { status, limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  let query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('items.productId', 'name images')
    .populate('items.storeId', 'name logo');
};

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;

