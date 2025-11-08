const mongoose = require('mongoose');

const ShippingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Shipping details
  carrier: {
    type: String,
    enum: ['USPS', 'FedEx', 'UPS', 'DHL', 'Other'],
    required: true
  },
  
  trackingNumber: String,
  trackingUrl: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'pending',
    index: true
  },
  
  // Timeline
  shippedAt: Date,
  estimatedDelivery: Date,
  deliveredAt: Date,
  
  // Location tracking
  currentLocation: String,
  events: [{
    status: String,
    location: String,
    timestamp: Date,
    description: String
  }],
  
}, {
  timestamps: true
});

ShippingSchema.index({ orderId: 1 }, { unique: true });
ShippingSchema.index({ trackingNumber: 1 });
ShippingSchema.index({ status: 1, shippedAt: -1 });

const Shipping = mongoose.model('Shipping', ShippingSchema);

module.exports = Shipping;

