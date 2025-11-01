const mongoose = require('mongoose');

const explorerSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: [
      'trending',
      'category',
      'hashtag',
      'challenge',
      'music',
      'effects',
      'users',
      'live',
      'featured',
      'recommendation',
      'custom'
    ]
  },
  category: {
    type: String,
    enum: [
      'entertainment',
      'music',
      'dance',
      'comedy',
      'lifestyle',
      'education',
      'sports',
      'fashion',
      'food',
      'travel',
      'art',
      'technology',
      'other'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i,
    default: '#007bff'
  },
  backgroundImage: {
    type: String,
    default: null
  },
  contentFilter: {
    tags: [String],
    minLikes: { type: Number, default: 0 },
    minViews: { type: Number, default: 0 },
    maxAge: { type: Number, default: null }, // in hours
    verified: { type: Boolean, default: null },
    minFollowers: { type: Number, default: 0 }
  },
  algorithm: {
    type: String,
    enum: ['trending', 'newest', 'popular', 'random', 'recommended', 'custom'],
    default: 'trending'
  },
  refreshInterval: {
    type: Number,
    default: 3600 // seconds
  },
  maxContent: {
    type: Number,
    default: 100
  },
  regions: [{
    type: String,
    uppercase: true
  }],
  languages: [{
    type: String,
    lowercase: true
  }],
  targetAudience: {
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    interests: [String],
    demographics: [String]
  },
  performance: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    avgTimeSpent: { type: Number, default: 0 }, // seconds
    conversionRate: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 }
  },
  contentCount: {
    type: Number,
    default: 0
  },
  lastRefresh: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
explorerSectionSchema.index({ isActive: 1, isVisible: 1, order: 1 });
explorerSectionSchema.index({ type: 1, category: 1 });
explorerSectionSchema.index({ isFeatured: -1, order: 1 });
explorerSectionSchema.index({ 'performance.views': -1 });

// Virtual for click-through rate
explorerSectionSchema.virtual('clickThroughRate').get(function() {
  return this.performance.views > 0 ? 
    (this.performance.clicks / this.performance.views) * 100 : 0;
});

// Virtual for engagement score
explorerSectionSchema.virtual('engagementScore').get(function() {
  const ctr = this.clickThroughRate;
  const avgTime = this.performance.avgTimeSpent;
  const shares = this.performance.shares;
  
  return (ctr * 0.4) + (avgTime * 0.3) + (shares * 0.3);
});

// Virtual for needs refresh
explorerSectionSchema.virtual('needsRefresh').get(function() {
  const now = new Date();
  const lastRefresh = new Date(this.lastRefresh);
  const timeDiff = (now - lastRefresh) / 1000; // seconds
  
  return timeDiff >= this.refreshInterval;
});

// Methods
explorerSectionSchema.methods.incrementView = function() {
  this.performance.views += 1;
  return this.save();
};

explorerSectionSchema.methods.incrementClick = function() {
  this.performance.clicks += 1;
  this.performance.conversionRate = this.performance.views > 0 ? 
    (this.performance.clicks / this.performance.views) * 100 : 0;
  return this.save();
};

explorerSectionSchema.methods.recordTimeSpent = function(seconds) {
  const totalTime = (this.performance.avgTimeSpent * this.performance.views) + seconds;
  this.performance.avgTimeSpent = totalTime / (this.performance.views + 1);
  return this.save();
};

explorerSectionSchema.methods.updateContentCount = function(count) {
  this.contentCount = count;
  this.lastRefresh = new Date();
  return this.save();
};

// Static methods
explorerSectionSchema.statics.getActiveSection = function() {
  return this.find({ isActive: true, isVisible: true })
    .sort({ order: 1 });
};

explorerSectionSchema.statics.getFeaturedSections = function() {
  return this.find({ 
    isActive: true, 
    isVisible: true, 
    isFeatured: true 
  })
  .sort({ order: 1 });
};

explorerSectionSchema.statics.getSectionsByType = function(type) {
  return this.find({ 
    isActive: true, 
    isVisible: true, 
    type: type 
  })
  .sort({ order: 1 });
};

explorerSectionSchema.statics.getSectionsByCategory = function(category) {
  return this.find({ 
    isActive: true, 
    isVisible: true, 
    category: category 
  })
  .sort({ order: 1 });
};

explorerSectionSchema.statics.getTopPerformingSections = function(limit = 10) {
  return this.find({ isActive: true, isVisible: true })
    .sort({ 'performance.views': -1, 'performance.clicks': -1 })
    .limit(limit);
};

explorerSectionSchema.statics.getSectionsNeedingRefresh = function() {
  return this.find({ 
    isActive: true,
    $expr: {
      $gte: [
        { $divide: [{ $subtract: [new Date(), '$lastRefresh'] }, 1000] },
        '$refreshInterval'
      ]
    }
  });
};

// Pre-save middleware
explorerSectionSchema.pre('save', function(next) {
  // Recalculate performance metrics
  if (this.performance.views > 0) {
    this.performance.conversionRate = 
      (this.performance.clicks / this.performance.views) * 100;
    this.performance.bounceRate = 
      100 - this.performance.conversionRate;
  }
  next();
});

module.exports = mongoose.model('ExplorerSection', explorerSectionSchema);