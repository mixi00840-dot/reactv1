const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true
  },
  attributes: {
    type: Map,
    of: String // e.g., { "color": "red", "size": "large" }
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
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    }
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description must not exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description must not exceed 500 characters']
  },
  
  // Store Information
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Product Identification
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  barcode: String,
  brand: String,
  
  // Categorization
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [String],
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Inventory Management
  inventory: {
    trackQuantity: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'on_backorder'],
      default: 'in_stock'
    },
    allowBackorders: {
      type: Boolean,
      default: false
    }
  },
  
  // Product Variants (for size, color, etc.)
  hasVariants: {
    type: Boolean,
    default: false
  },
  variants: [productVariantSchema],
  variantOptions: {
    // Define available variant types
    color: [String],
    size: [String],
    material: [String],
    style: [String]
  },
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  videos: [{
    url: String,
    thumbnail: String,
    duration: Number,
    type: {
      type: String,
      enum: ['product_demo', 'unboxing', 'tutorial'],
      default: 'product_demo'
    }
  }],
  
  // Physical Properties
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['g', 'kg', 'oz', 'lb'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  
  // Shipping
  shippingClass: {
    type: String,
    default: 'standard'
  },
  requiresShipping: {
    type: Boolean,
    default: true
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  
  // Tax
  taxClass: {
    type: String,
    default: 'standard'
  },
  taxable: {
    type: Boolean,
    default: true
  },
  
  // Product Attributes (flexible key-value pairs)
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Custom Fields
  customFields: [{
    name: String,
    value: String,
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'date', 'url'],
      default: 'text'
    }
  }],
  
  // Status & Visibility
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'rejected', 'blocked'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'public'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    canonicalUrl: String
  },
  
  // Product Metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Dates
  publishedAt: Date,
  featuredAt: Date,
  lastSoldAt: Date,
  
  // Admin fields
  adminNotes: [{
    note: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rejectionReason: String,
  
  // Processing time
  processingTime: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 3
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
productSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

productSchema.virtual('categories', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id'
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId'
});

productSchema.virtual('cartItems', {
  ref: 'Cart',
  localField: '_id',
  foreignField: 'items.productId'
});

productSchema.virtual('orderItems', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'items.productId'
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for current price (sale price if available, otherwise regular price)
productSchema.virtual('currentPrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.salePrice && this.salePrice < this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  if (!this.inventory.trackQuantity) return true;
  return this.inventory.quantity > this.inventory.reserved;
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Generate slug from title
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  
  // Update stock status based on quantity
  if (this.inventory.trackQuantity) {
    const availableStock = this.inventory.quantity - this.inventory.reserved;
    if (availableStock <= 0) {
      this.inventory.stockStatus = 'out_of_stock';
    } else if (availableStock <= this.inventory.lowStockThreshold) {
      this.inventory.stockStatus = 'low_stock';
    } else {
      this.inventory.stockStatus = 'in_stock';
    }
  }
  
  // Set published date when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Static methods
productSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'active' });
};

productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active' 
  }).limit(limit);
};

productSchema.statics.findByStore = function(storeId, status = 'active') {
  return this.find({ storeId, status });
};

productSchema.statics.search = function(query, filters = {}) {
  const searchQuery = { status: 'active' };
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    searchQuery.categoryIds = { $in: filters.categoryIds };
  }
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    searchQuery.price = {};
    if (filters.minPrice) searchQuery.price.$gte = filters.minPrice;
    if (filters.maxPrice) searchQuery.price.$lte = filters.maxPrice;
  }
  
  // Store filter
  if (filters.storeId) {
    searchQuery.storeId = filters.storeId;
  }
  
  // In stock filter
  if (filters.inStock) {
    searchQuery['inventory.stockStatus'] = { $ne: 'out_of_stock' };
  }
  
  return this.find(searchQuery);
};

// Instance methods
productSchema.methods.updateMetrics = async function() {
  // This would be called after orders, reviews, etc.
  // Implementation depends on how you track these metrics
  return this.save();
};

productSchema.methods.reserveStock = function(quantity, variantSku = null) {
  if (variantSku && this.hasVariants) {
    const variant = this.variants.find(v => v.sku === variantSku);
    if (variant && variant.stock.quantity >= quantity) {
      variant.stock.reserved += quantity;
      return true;
    }
    return false;
  } else {
    if (this.inventory.quantity >= quantity) {
      this.inventory.reserved += quantity;
      return true;
    }
    return false;
  }
};

productSchema.methods.releaseStock = function(quantity, variantSku = null) {
  if (variantSku && this.hasVariants) {
    const variant = this.variants.find(v => v.sku === variantSku);
    if (variant) {
      variant.stock.reserved = Math.max(0, variant.stock.reserved - quantity);
      return true;
    }
    return false;
  } else {
    this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
    return true;
  }
};

productSchema.methods.decreaseStock = function(quantity, variantSku = null) {
  if (variantSku && this.hasVariants) {
    const variant = this.variants.find(v => v.sku === variantSku);
    if (variant && variant.stock.quantity >= quantity) {
      variant.stock.quantity -= quantity;
      variant.stock.reserved = Math.max(0, variant.stock.reserved - quantity);
      return true;
    }
    return false;
  } else {
    if (this.inventory.quantity >= quantity) {
      this.inventory.quantity -= quantity;
      this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
      return true;
    }
    return false;
  }
};

// Indexes for performance and search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ categoryIds: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'inventory.stockStatus': 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ publishedAt: -1 });
productSchema.index({ 'metrics.averageRating': -1 });
productSchema.index({ 'metrics.totalSales': -1 });

module.exports = mongoose.model('Product', productSchema);