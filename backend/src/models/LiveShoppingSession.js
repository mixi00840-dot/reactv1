const mongoose = require('mongoose');

const LiveShoppingSessionSchema = new mongoose.Schema({
  livestreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream',
    required: true,
    index: true
  },
  
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  featuredProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    displayOrder: Number,
    featuredAt: Date
  }],
  
  orders: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    placedAt: Date,
    total: Number
  }],
  
  totalRevenue: {
    type: Number,
    default: 0
  },
  
  totalOrders: {
    type: Number,
    default: 0
  },
  
  conversionRate: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

LiveShoppingSessionSchema.index({ livestreamId: 1 }, { unique: true });
LiveShoppingSessionSchema.index({ hostId: 1 });

const LiveShoppingSession = mongoose.model('LiveShoppingSession', LiveShoppingSessionSchema);

module.exports = LiveShoppingSession;

