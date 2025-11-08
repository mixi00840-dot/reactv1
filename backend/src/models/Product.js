const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0,
    get: v => parseFloat(v.toFixed(2))
  },
  
  compareAtPrice: {
    type: Number,
    min: 0,
    get: v => v ? parseFloat(v.toFixed(2)) : null
  },
  
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP']
  },
  
  // Inventory
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  
  trackInventory: {
    type: Boolean,
    default: true
  },
  
  // Media
  images: [{
    url: String,
    alt: String,
    sortOrder: Number
  }],
  
  videoUrl: String,
  
  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  
  subcategory: String,
  
  tags: [{
    type: String,
    lowercase: true
  }],
  
  brand: String,
  
  // Variants
  hasVariants: {
    type: Boolean,
    default: false
  },
  
  variants: [{
    name: String, // 'Color', 'Size'
    value: String, // 'Red', 'Large'
    price: Number,
    stock: Number,
    sku: String,
    image: String
  }],
  
  // Shipping
  weight: Number, // kg
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  
  shippingClass: String,
  freeShipping: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'out_of_stock', 'archived', 'rejected'],
    default: 'draft',
    index: true
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: Date,
  
  // Statistics
  viewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  salesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    get: v => parseFloat(v.toFixed(1))
  },
  
  reviewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  featuredUntil: Date,
  
  // Rejection details
  rejectionReason: String,
  rejectedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

// Indexes (slug already has unique index from schema)
ProductSchema.index({ storeId: 1, status: 1 });
ProductSchema.index({ sellerId: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1, isPublished: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1, salesCount: -1 });
ProductSchema.index({ price: 1 });

// Text index for search
ProductSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  brand: 'text'
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercent').get(function() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

// Virtual for is in stock
ProductSchema.virtual('inStock').get(function() {
  if (!this.trackInventory) return true;
  return this.stock > 0;
});

// Virtual for is low stock
ProductSchema.virtual('isLowStock').get(function() {
  if (!this.trackInventory) return false;
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Pre-save hook to generate slug
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Method to reduce stock
ProductSchema.methods.reduceStock = async function(quantity) {
  if (!this.trackInventory) return this;
  
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  this.stock -= quantity;
  this.salesCount += quantity;
  
  if (this.stock === 0) {
    this.status = 'out_of_stock';
  }
  
  return this.save();
};

// Static method to get best sellers
ProductSchema.statics.getBestSellers = function(limit = 20) {
  return this.find({ status: 'active', isPublished: true })
    .sort({ salesCount: -1, rating: -1 })
    .limit(limit)
    .populate('storeId', 'name logo')
    .populate('sellerId', 'username fullName');
};

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;

