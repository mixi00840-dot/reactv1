const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  // Banner identification
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Banner content
  type: {
    type: String,
    enum: ['image', 'video', 'carousel', 'html'],
    default: 'image',
    required: true
  },
  
  content: {
    // For image/video banners
    mediaUrl: String,
    thumbnailUrl: String,
    
    // For carousel
    slides: [{
      mediaUrl: String,
      title: String,
      description: String,
      ctaText: String,
      ctaLink: String,
      duration: Number // seconds
    }],
    
    // For HTML banners
    htmlContent: String,
    
    // Common fields
    altText: String,
    title: String,
    description: String
  },
  
  // Action configuration
  action: {
    type: {
      type: String,
      enum: ['none', 'link', 'product', 'category', 'livestream', 'custom'],
      default: 'none'
    },
    url: String,
    target: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self'
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    customData: mongoose.Schema.Types.Mixed
  },
  
  // Placement and targeting
  placement: {
    type: String,
    enum: [
      'home_hero',
      'home_top',
      'home_middle',
      'home_bottom',
      'shop_hero',
      'shop_sidebar',
      'product_detail',
      'category_top',
      'livestream_break',
      'profile_top',
      'modal_popup',
      'floating',
      'custom'
    ],
    required: true,
    index: true
  },
  
  position: {
    type: Number,
    default: 0 // For ordering multiple banners in same placement
  },
  
  // Display settings
  display: {
    // Device targeting
    showOnMobile: {
      type: Boolean,
      default: true
    },
    showOnTablet: {
      type: Boolean,
      default: true
    },
    showOnDesktop: {
      type: Boolean,
      default: true
    },
    
    // Dimensions
    width: Number,
    height: Number,
    aspectRatio: String, // e.g., "16:9", "1:1"
    
    // Animation
    animation: {
      type: String,
      enum: ['none', 'fade', 'slide', 'zoom', 'bounce'],
      default: 'none'
    },
    animationDuration: Number, // milliseconds
    
    // Auto-close for modal/popup
    autoClose: Boolean,
    autoCloseDelay: Number // seconds
  },
  
  // Targeting rules
  targeting: {
    // User targeting
    userTypes: [{
      type: String,
      enum: ['all', 'guests', 'users', 'sellers', 'subscribers']
    }],
    
    // Geographic
    countries: [String],
    cities: [String],
    
    // Language
    languages: [String],
    
    // User behavior
    minSessionCount: Number,
    maxSessionCount: Number,
    
    // Custom segments
    customSegments: [String]
  },
  
  // Scheduling
  schedule: {
    startDate: {
      type: Date,
      index: true
    },
    endDate: {
      type: Date,
      index: true
    },
    
    // Time of day (24-hour format)
    activeHours: {
      start: String, // e.g., "09:00"
      end: String // e.g., "21:00"
    },
    
    // Days of week (0 = Sunday, 6 = Saturday)
    activeDays: [Number],
    
    // Timezone
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Status and publishing
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'expired', 'archived'],
    default: 'draft',
    index: true
  },
  
  priority: {
    type: Number,
    default: 0, // Higher priority banners shown first
    index: true
  },
  
  // Analytics
  analytics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    ctr: {
      type: Number,
      default: 0 // Click-through rate
    },
    revenue: {
      type: Number,
      default: 0
    },
    
    // Detailed tracking
    dailyStats: [{
      date: Date,
      impressions: Number,
      clicks: Number,
      conversions: Number
    }]
  },
  
  // A/B Testing
  abTest: {
    enabled: {
      type: Boolean,
      default: false
    },
    variantId: String,
    testGroup: {
      type: String,
      enum: ['A', 'B', 'control'],
      default: 'control'
    },
    trafficSplit: Number // Percentage of traffic (0-100)
  },
  
  // Budget and limits
  limits: {
    maxImpressions: Number,
    maxClicks: Number,
    maxBudget: Number,
    dailyBudget: Number,
    currentSpend: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  tags: [String],
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  publishedAt: Date,
  archivedAt: Date
  
}, {
  timestamps: true
});

// Indexes for performance
bannerSchema.index({ placement: 1, status: 1, priority: -1 });
bannerSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
bannerSchema.index({ status: 1, 'schedule.startDate': 1 });

// Generate slug from title
bannerSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Update CTR when impressions or clicks change
bannerSchema.pre('save', function(next) {
  if (this.analytics.impressions > 0) {
    this.analytics.ctr = (this.analytics.clicks / this.analytics.impressions) * 100;
  }
  next();
});

// Virtuals
bannerSchema.virtual('isActive').get(function() {
  const now = new Date();
  
  if (this.status !== 'active' && this.status !== 'scheduled') {
    return false;
  }
  
  // Check schedule
  if (this.schedule.startDate && now < this.schedule.startDate) {
    return false;
  }
  
  if (this.schedule.endDate && now > this.schedule.endDate) {
    return false;
  }
  
  // Check budget limits
  if (this.limits.maxBudget && this.limits.currentSpend >= this.limits.maxBudget) {
    return false;
  }
  
  if (this.limits.maxImpressions && this.analytics.impressions >= this.limits.maxImpressions) {
    return false;
  }
  
  if (this.limits.maxClicks && this.analytics.clicks >= this.limits.maxClicks) {
    return false;
  }
  
  return true;
});

// Instance Methods

// Record impression
bannerSchema.methods.recordImpression = async function() {
  this.analytics.impressions += 1;
  
  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = this.analytics.dailyStats.find(
    s => s.date.toISOString().split('T')[0] === today
  );
  
  if (todayStats) {
    todayStats.impressions += 1;
  } else {
    this.analytics.dailyStats.push({
      date: new Date(),
      impressions: 1,
      clicks: 0,
      conversions: 0
    });
  }
  
  await this.save();
};

// Record click
bannerSchema.methods.recordClick = async function() {
  this.analytics.clicks += 1;
  
  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = this.analytics.dailyStats.find(
    s => s.date.toISOString().split('T')[0] === today
  );
  
  if (todayStats) {
    todayStats.clicks += 1;
  } else {
    this.analytics.dailyStats.push({
      date: new Date(),
      impressions: 0,
      clicks: 1,
      conversions: 0
    });
  }
  
  await this.save();
};

// Record conversion
bannerSchema.methods.recordConversion = async function(revenue = 0) {
  this.analytics.conversions += 1;
  this.analytics.revenue += revenue;
  
  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = this.analytics.dailyStats.find(
    s => s.date.toISOString().split('T')[0] === today
  );
  
  if (todayStats) {
    todayStats.conversions += 1;
  }
  
  await this.save();
};

// Publish banner
bannerSchema.methods.publish = async function() {
  this.status = 'active';
  this.publishedAt = Date.now();
  await this.save();
};

// Pause banner
bannerSchema.methods.pause = async function() {
  this.status = 'paused';
  await this.save();
};

// Archive banner
bannerSchema.methods.archive = async function() {
  this.status = 'archived';
  this.archivedAt = Date.now();
  await this.save();
};

// Static Methods

// Get active banners for placement
bannerSchema.statics.getActiveForPlacement = async function(placement, options = {}) {
  const now = new Date();
  
  const query = {
    placement,
    status: { $in: ['active', 'scheduled'] },
    $or: [
      { 'schedule.startDate': { $exists: false } },
      { 'schedule.startDate': { $lte: now } }
    ],
    $or: [
      { 'schedule.endDate': { $exists: false } },
      { 'schedule.endDate': { $gte: now } }
    ]
  };
  
  // Device targeting
  if (options.device === 'mobile') {
    query['display.showOnMobile'] = true;
  } else if (options.device === 'tablet') {
    query['display.showOnTablet'] = true;
  } else if (options.device === 'desktop') {
    query['display.showOnDesktop'] = true;
  }
  
  // User type targeting
  if (options.userType) {
    query.$or = [
      { 'targeting.userTypes': 'all' },
      { 'targeting.userTypes': options.userType }
    ];
  }
  
  // Language targeting
  if (options.language) {
    query.$or = [
      { 'targeting.languages': { $exists: false } },
      { 'targeting.languages': { $size: 0 } },
      { 'targeting.languages': options.language }
    ];
  }
  
  const banners = await this.find(query)
    .sort({ priority: -1, position: 1 })
    .limit(options.limit || 10);
  
  // Filter by active status (budget, impressions, etc.)
  return banners.filter(b => b.isActive);
};

// Get banner performance
bannerSchema.statics.getPerformance = async function(dateRange = {}) {
  const { startDate, endDate } = dateRange;
  
  const match = { status: { $ne: 'archived' } };
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$analytics.impressions' },
        totalClicks: { $sum: '$analytics.clicks' },
        totalConversions: { $sum: '$analytics.conversions' },
        totalRevenue: { $sum: '$analytics.revenue' },
        avgCTR: { $avg: '$analytics.ctr' }
      }
    }
  ]);
  
  return stats[0] || {
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgCTR: 0
  };
};

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = { Banner };
