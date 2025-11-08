const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 2000
  },
  
  tagline: {
    type: String,
    maxlength: 150
  },
  
  // Media
  logo: String,
  banner: String,
  
  // Contact
  email: {
    type: String,
    lowercase: true
  },
  
  phone: String,
  website: String,
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Social Media
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  
  // Business Info
  businessType: {
    type: String,
    enum: ['individual', 'business', 'company'],
    default: 'individual'
  },
  
  taxId: String,
  businessLicense: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'closed'],
    default: 'pending',
    index: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: Date,
  
  // Statistics
  productsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalSales: {
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
    max: 5
  },
  
  reviewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Policies
  policies: {
    returns: String,
    shipping: String,
    privacy: String,
    terms: String
  },
  
  // Payment
  paymentMethods: [{
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cash_on_delivery']
  }],
  
  // Shipping
  shippingZones: [{
    name: String,
    countries: [String],
    shippingFee: Number,
    freeShippingThreshold: Number
  }],
  
  // SEO
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  rejectionReason: String,
  
}, {
  timestamps: true
});

// Indexes
StoreSchema.index({ sellerId: 1 }, { unique: true });
StoreSchema.index({ status: 1, isVerified: 1 });
StoreSchema.index({ slug: 1 }, { unique: true });
StoreSchema.index({ rating: -1, totalSales: -1 });

// Text index for search
StoreSchema.index({
  name: 'text',
  description: 'text',
  tagline: 'text'
});

// Pre-save hook to generate slug
StoreSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Virtual for store URL
StoreSchema.virtual('storeUrl').get(function() {
  return `/stores/${this.slug}`;
});

// Method to update statistics
StoreSchema.methods.updateStats = async function() {
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  
  // Count products
  this.productsCount = await Product.countDocuments({ storeId: this._id, status: 'active' });
  
  // Calculate sales
  const salesData = await Order.aggregate([
    { $match: { 'items.storeId': this._id, status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);
  
  if (salesData.length > 0) {
    this.totalSales = salesData[0].totalSales || 0;
    this.totalRevenue = salesData[0].totalRevenue || 0;
  }
  
  return this.save();
};

const Store = mongoose.model('Store', StoreSchema);

module.exports = Store;

