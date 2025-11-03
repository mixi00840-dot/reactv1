const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantSku: {
    type: String,
    default: null // For products with variants
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
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
  selectedAttributes: {
    type: Map,
    of: String // e.g., { "color": "red", "size": "large" }
  },
  customization: {
    text: String,
    instructions: String,
    attachments: [String]
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Cart Items
  items: [cartItemSchema],
  
  // Applied Coupons
  appliedCoupons: [{
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    code: String,
    discountAmount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping']
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Totals
  totals: {
    subtotal: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Shipping Information
  shippingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  // Shipping Method
  selectedShippingMethod: {
    id: String,
    name: String,
    cost: Number,
    estimatedDays: String,
    carrier: String
  },
  
  // Cart Status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted', 'expired'],
    default: 'active'
  },
  
  // Session Information
  sessionId: String,
  fingerprint: String, // Browser fingerprint for guest carts
  
  // Cart Metadata
  metadata: {
    deviceType: String,
    userAgent: String,
    ipAddress: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },
  
  // Abandonment tracking
  abandonedAt: Date,
  abandonmentRemindersSent: {
    type: Number,
    default: 0
  },
  lastReminderSentAt: Date,
  
  // Cart expiry
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  
  // Last activity
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
cartSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('uniqueItemCount').get(function() {
  return this.items.length;
});

cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

cartSchema.virtual('hasExpired').get(function() {
  return this.expiresAt < new Date();
});

cartSchema.virtual('isAbandoned').get(function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.lastActivityAt < thirtyMinutesAgo && this.status === 'active' && !this.isEmpty;
});

// Pre-save middleware
cartSchema.pre('save', function(next) {
  // Update totals
  this.calculateTotals();
  
  // Update last activity
  this.lastActivityAt = new Date();
  
  // Check for abandonment
  if (this.isAbandoned && this.status === 'active') {
    this.status = 'abandoned';
    this.abandonedAt = new Date();
  }
  
  next();
});

// Instance methods
cartSchema.methods.addItem = function(productData) {
  const existingItem = this.items.find(item => 
    item.productId.toString() === productData.productId.toString() &&
    item.variantSku === productData.variantSku
  );
  
  if (existingItem) {
    existingItem.quantity += productData.quantity || 1;
  } else {
    this.items.push({
      productId: productData.productId,
      variantSku: productData.variantSku,
      quantity: productData.quantity || 1,
      price: productData.price,
      salePrice: productData.salePrice,
      selectedAttributes: productData.selectedAttributes,
      customization: productData.customization
    });
  }
  
  return this.save();
};

cartSchema.methods.removeItem = function(productId, variantSku = null) {
  this.items = this.items.filter(item => 
    !(item.productId.toString() === productId.toString() && 
      item.variantSku === variantSku)
  );
  
  return this.save();
};

cartSchema.methods.updateItemQuantity = function(productId, quantity, variantSku = null) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString() &&
    item.variantSku === variantSku
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, variantSku);
    } else {
      item.quantity = quantity;
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.appliedCoupons = [];
  this.totals = {
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0
  };
  
  return this.save();
};

cartSchema.methods.applyCoupon = function(couponData) {
  // Check if coupon is already applied
  const existingCoupon = this.appliedCoupons.find(c => c.code === couponData.code);
  if (existingCoupon) {
    throw new Error('Coupon already applied');
  }
  
  this.appliedCoupons.push({
    couponId: couponData.couponId,
    code: couponData.code,
    discountAmount: couponData.discountAmount,
    discountType: couponData.discountType
  });
  
  return this.save();
};

cartSchema.methods.removeCoupon = function(code) {
  this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== code);
  return this.save();
};

cartSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.totals.subtotal = this.items.reduce((total, item) => {
    const price = item.salePrice || item.price;
    return total + (price * item.quantity);
  }, 0);
  
  // Calculate discount from coupons
  this.totals.discount = this.appliedCoupons.reduce((total, coupon) => {
    if (coupon.discountType === 'fixed') {
      return total + coupon.discountAmount;
    } else if (coupon.discountType === 'percentage') {
      return total + (this.totals.subtotal * coupon.discountAmount / 100);
    }
    return total;
  }, 0);
  
  // Calculate tax (simplified - would need proper tax calculation)
  const taxRate = 0.08; // 8% tax rate - this should be configurable
  this.totals.tax = (this.totals.subtotal - this.totals.discount) * taxRate;
  
  // Shipping is set separately based on selected shipping method
  if (!this.totals.shipping) {
    this.totals.shipping = 0;
  }
  
  // Calculate total
  this.totals.total = Math.max(0, 
    this.totals.subtotal - this.totals.discount + this.totals.tax + this.totals.shipping
  );
};

cartSchema.methods.getItemsByStore = function() {
  const itemsByStore = new Map();
  
  this.items.forEach(item => {
    // This would need to be populated with product data
    const storeId = item.productId.storeId || 'unknown';
    
    if (!itemsByStore.has(storeId)) {
      itemsByStore.set(storeId, []);
    }
    
    itemsByStore.get(storeId).push(item);
  });
  
  return itemsByStore;
};

cartSchema.methods.validateStock = async function() {
  const Product = mongoose.model('Product');
  const errors = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    
    if (!product) {
      errors.push(`Product ${item.productId} not found`);
      continue;
    }
    
    if (product.status !== 'active') {
      errors.push(`Product "${product.title}" is not available`);
      continue;
    }
    
    // Check stock for variant or main product
    let availableStock;
    if (item.variantSku && product.hasVariants) {
      const variant = product.variants.find(v => v.sku === item.variantSku);
      if (!variant) {
        errors.push(`Variant ${item.variantSku} not found for product "${product.title}"`);
        continue;
      }
      availableStock = variant.stock.quantity - variant.stock.reserved;
    } else {
      availableStock = product.inventory.quantity - product.inventory.reserved;
    }
    
    if (product.inventory.trackQuantity && availableStock < item.quantity) {
      errors.push(`Not enough stock for product "${product.title}". Available: ${availableStock}, Requested: ${item.quantity}`);
    }
  }
  
  return errors;
};

// Static methods
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId }).populate('items.productId');
};

cartSchema.statics.findOrCreateByUser = async function(userId) {
  let cart = await this.findByUser(userId);
  
  if (!cart) {
    cart = new this({ userId });
    await cart.save();
  }
  
  return cart;
};

cartSchema.statics.findAbandoned = function(hoursAgo = 24) {
  const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  return this.find({
    status: 'abandoned',
    lastActivityAt: { $lt: cutoffDate },
    'items.0': { $exists: true } // Has at least one item
  });
};

cartSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: { $in: ['abandoned', 'expired'] }
  });
};

// Indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ status: 1, lastActivityAt: 1 });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ fingerprint: 1 });

module.exports = mongoose.model('Cart', cartSchema);