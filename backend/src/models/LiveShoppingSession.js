const mongoose = require('mongoose');

/**
 * Live Shopping Session Model
 * 
 * Handles live commerce/shopping features during livestreams
 * where hosts can showcase and sell products in real-time.
 */

const liveShoppingSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Associated live stream
  stream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: true
  },
  
  // Host/seller
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Store
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Products featured in the session
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    
    // When showcased
    showcasedAt: Date,
    
    // Special live pricing
    livePrice: {
      amount: Number,
      discount: Number,
      originalPrice: Number
    },
    
    // Flash sale
    flashSale: {
      enabled: {
        type: Boolean,
        default: false
      },
      quantity: Number,
      sold: {
        type: Number,
        default: 0
      },
      endsAt: Date
    },
    
    // Product pinned to stream
    pinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: Date,
    
    // Stats for this product in this session
    stats: {
      views: {
        type: Number,
        default: 0
      },
      clicks: {
        type: Number,
        default: 0
      },
      addedToCart: {
        type: Number,
        default: 0
      },
      purchased: {
        type: Number,
        default: 0
      },
      revenue: {
        type: Number,
        default: 0
      }
    }
  }],
  
  // Orders placed during session
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  
  // Vouchers/coupons for live session
  vouchers: [{
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    usageLimit: Number,
    used: {
      type: Number,
      default: 0
    },
    expiresAt: Date
  }],
  
  // Interactive features
  features: {
    // Product carousel
    productCarousel: {
      type: Boolean,
      default: true
    },
    
    // Quick buy button
    quickBuy: {
      type: Boolean,
      default: true
    },
    
    // Limited time offers
    flashDeals: {
      type: Boolean,
      default: true
    },
    
    // Q&A about products
    productQA: {
      type: Boolean,
      default: true
    },
    
    // Shopping cart in stream
    liveCart: {
      type: Boolean,
      default: true
    }
  },
  
  // Session status
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  
  // Time tracking
  startedAt: Date,
  endedAt: Date,
  
  // Statistics
  stats: {
    totalViewers: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  
  // Engagement metrics
  engagement: {
    comments: {
      type: Number,
      default: 0
    },
    productQuestions: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    cartAdditions: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true
});

// Indexes
liveShoppingSessionSchema.index({ sessionId: 1 });
liveShoppingSessionSchema.index({ stream: 1 });
liveShoppingSessionSchema.index({ host: 1, status: 1 });
liveShoppingSessionSchema.index({ store: 1, status: 1 });
liveShoppingSessionSchema.index({ status: 1, startedAt: -1 });

// Generate unique session ID
liveShoppingSessionSchema.pre('save', async function(next) {
  if (!this.sessionId) {
    this.sessionId = `SHOP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Methods

/**
 * Start shopping session
 */
liveShoppingSessionSchema.methods.startSession = async function() {
  this.status = 'active';
  this.startedAt = new Date();
  await this.save();
  
  return this;
};

/**
 * End shopping session
 */
liveShoppingSessionSchema.methods.endSession = async function() {
  this.status = 'ended';
  this.endedAt = new Date();
  
  // Calculate final statistics
  this.calculateStats();
  
  await this.save();
  
  return this;
};

/**
 * Add product to session
 */
liveShoppingSessionSchema.methods.addProduct = async function(productId, livePrice = null, flashSale = null) {
  // Check if product already exists
  const existingProduct = this.products.find(
    p => p.product.toString() === productId.toString()
  );
  
  if (existingProduct) {
    throw new Error('Product already in session');
  }
  
  const productData = {
    product: productId,
    showcasedAt: new Date()
  };
  
  if (livePrice) {
    productData.livePrice = livePrice;
  }
  
  if (flashSale) {
    productData.flashSale = {
      enabled: true,
      ...flashSale
    };
  }
  
  this.products.push(productData);
  
  await this.save();
  
  return this;
};

/**
 * Pin product
 */
liveShoppingSessionSchema.methods.pinProduct = async function(productId) {
  // Unpin all products
  this.products.forEach(p => {
    p.pinned = false;
  });
  
  // Pin the selected product
  const product = this.products.find(
    p => p.product.toString() === productId.toString()
  );
  
  if (!product) {
    throw new Error('Product not found in session');
  }
  
  product.pinned = true;
  product.pinnedAt = new Date();
  
  await this.save();
  
  return this;
};

/**
 * Track product interaction
 */
liveShoppingSessionSchema.methods.trackProductInteraction = async function(productId, interactionType) {
  const product = this.products.find(
    p => p.product.toString() === productId.toString()
  );
  
  if (!product) {
    throw new Error('Product not found in session');
  }
  
  switch (interactionType) {
    case 'view':
      product.stats.views++;
      break;
    case 'click':
      product.stats.clicks++;
      break;
    case 'addToCart':
      product.stats.addedToCart++;
      this.engagement.cartAdditions++;
      break;
    case 'purchase':
      product.stats.purchased++;
      break;
  }
  
  await this.save();
  
  return this;
};

/**
 * Add order to session
 */
liveShoppingSessionSchema.methods.addOrder = async function(orderId, orderValue) {
  this.orders.push(orderId);
  this.stats.totalOrders++;
  this.stats.totalRevenue += orderValue;
  
  await this.save();
  
  return this;
};

/**
 * Create voucher for session
 */
liveShoppingSessionSchema.methods.createVoucher = async function(voucherData) {
  this.vouchers.push({
    code: voucherData.code || `LIVE${Date.now()}`,
    discount: voucherData.discount,
    type: voucherData.type,
    usageLimit: voucherData.usageLimit || 100,
    used: 0,
    expiresAt: voucherData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  
  await this.save();
  
  return this.vouchers[this.vouchers.length - 1];
};

/**
 * Use voucher
 */
liveShoppingSessionSchema.methods.useVoucher = async function(voucherCode) {
  const voucher = this.vouchers.find(v => v.code === voucherCode);
  
  if (!voucher) {
    throw new Error('Voucher not found');
  }
  
  if (new Date() > voucher.expiresAt) {
    throw new Error('Voucher expired');
  }
  
  if (voucher.used >= voucher.usageLimit) {
    throw new Error('Voucher usage limit reached');
  }
  
  voucher.used++;
  
  await this.save();
  
  return voucher;
};

/**
 * Calculate statistics
 */
liveShoppingSessionSchema.methods.calculateStats = function() {
  if (this.stats.totalOrders > 0) {
    this.stats.averageOrderValue = this.stats.totalRevenue / this.stats.totalOrders;
  }
  
  if (this.stats.totalViewers > 0) {
    this.stats.conversionRate = (this.stats.totalOrders / this.stats.totalViewers) * 100;
  }
};

// Statics

/**
 * Get active shopping sessions
 */
liveShoppingSessionSchema.statics.getActiveSessions = async function(limit = 20) {
  return this.find({ status: 'active' })
    .populate('stream', 'title viewerCount')
    .populate('host', 'username avatar fullName')
    .populate('store', 'name logo')
    .populate('products.product', 'name images price')
    .sort({ startedAt: -1 })
    .limit(limit);
};

/**
 * Get top performing sessions
 */
liveShoppingSessionSchema.statics.getTopSessions = async function(timeRange = 'week', limit = 10) {
  const startDate = new Date();
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  
  return this.find({
    status: 'ended',
    endedAt: { $gte: startDate }
  })
    .populate('host', 'username avatar')
    .populate('store', 'name logo')
    .sort({ 'stats.totalRevenue': -1 })
    .limit(limit);
};

module.exports = mongoose.model('LiveShoppingSession', liveShoppingSessionSchema);
