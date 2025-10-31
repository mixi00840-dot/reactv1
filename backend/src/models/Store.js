const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  // Basic Information
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    minlength: [2, 'Store name must be at least 2 characters'],
    maxlength: [100, 'Store name must not exceed 100 characters']
  },
  storeSlug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description must not exceed 1000 characters'],
    default: ''
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description must not exceed 200 characters'],
    default: ''
  },
  
  // Owner Information
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Store Media
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  gallery: [{
    url: String,
    alt: String,
    order: { type: Number, default: 0 }
  }],
  
  // Store Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected', 'closed'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Business Information
  businessInfo: {
    businessType: {
      type: String,
      enum: ['individual', 'business', 'corporation'],
      required: true
    },
    taxId: String,
    businessLicense: String,
    registrationNumber: String
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String
    }
  },
  
  // Address Information
  address: {
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
      required: true,
      default: 'US'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Shipping Settings
  shippingSettings: {
    enableShipping: {
      type: Boolean,
      default: true
    },
    freeShippingThreshold: {
      type: Number,
      default: 0
    },
    defaultShippingClass: {
      type: String,
      default: 'standard'
    },
    processingTime: {
      min: { type: Number, default: 1 }, // days
      max: { type: Number, default: 3 }
    },
    shippingZones: [{
      name: String,
      countries: [String],
      states: [String],
      methods: [{
        name: String,
        cost: Number,
        estimatedDays: String
      }]
    }]
  },
  
  // Return & Refund Policy
  policies: {
    returnPolicy: {
      enabled: { type: Boolean, default: true },
      days: { type: Number, default: 30 },
      description: String
    },
    refundPolicy: {
      description: String
    },
    privacyPolicy: String,
    termsOfService: String
  },
  
  // Payment Settings
  paymentSettings: {
    stripeAccountId: String,
    payoutSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    minimumPayout: {
      type: Number,
      default: 25
    }
  },
  
  // Store Metrics
  metrics: {
    totalProducts: {
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
    viewCount: {
      type: Number,
      default: 0
    },
    followerCount: {
      type: Number,
      default: 0
    }
  },
  
  // Commission Settings (can be overridden per store)
  commission: {
    rate: {
      type: Number,
      default: 0.10, // 10% default
      min: 0,
      max: 1
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },
  
  // Store Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowReviews: {
      type: Boolean,
      default: true
    },
    autoApproveProducts: {
      type: Boolean,
      default: false
    },
    vacationMode: {
      enabled: { type: Boolean, default: false },
      message: String,
      startDate: Date,
      endDate: Date
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Admin Notes
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
  
  // Important Dates
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  suspendedAt: Date,
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
storeSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'storeId'
});

storeSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'storeId'
});

storeSchema.virtual('wallet', {
  ref: 'Wallet',
  localField: '_id',
  foreignField: 'storeId',
  justOne: true
});

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'storeId'
});

// Pre-save middleware to generate slug
storeSchema.pre('save', function(next) {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }
  next();
});

// Static methods
storeSchema.statics.findBySlug = function(slug) {
  return this.findOne({ storeSlug: slug, status: 'active' });
};

storeSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active' 
  }).limit(limit);
};

// Instance methods
storeSchema.methods.updateMetrics = async function() {
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  
  const [productCount, orders] = await Promise.all([
    Product.countDocuments({ storeId: this._id, status: 'active' }),
    Order.find({ storeId: this._id, status: { $ne: 'cancelled' } })
  ]);
  
  this.metrics.totalProducts = productCount;
  this.metrics.totalOrders = orders.length;
  this.metrics.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  
  return this.save();
};

// Indexes for performance
storeSchema.index({ ownerId: 1 });
storeSchema.index({ status: 1 });
storeSchema.index({ storeSlug: 1 });
storeSchema.index({ isFeatured: 1, status: 1 });
storeSchema.index({ 'metrics.averageRating': -1 });
storeSchema.index({ createdAt: -1 });
storeSchema.index({ lastActiveAt: -1 });

module.exports = mongoose.model('Store', storeSchema);