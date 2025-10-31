const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  // Page identification
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Page type
  type: {
    type: String,
    enum: ['standard', 'landing', 'legal', 'help', 'custom'],
    default: 'standard',
    index: true
  },
  
  // Template/layout
  template: {
    type: String,
    enum: ['default', 'full-width', 'sidebar-left', 'sidebar-right', 'blank'],
    default: 'default'
  },
  
  // Page content (block-based)
  blocks: [{
    id: String,
    type: {
      type: String,
      enum: [
        'heading', 'text', 'image', 'video', 'button', 'spacer',
        'divider', 'columns', 'hero', 'features', 'testimonials',
        'faq', 'pricing', 'cta', 'form', 'embed', 'products',
        'categories', 'banner', 'html'
      ],
      required: true
    },
    order: Number,
    
    // Block configuration
    config: {
      // Common properties
      className: String,
      style: mongoose.Schema.Types.Mixed,
      
      // Heading
      text: String,
      level: Number, // h1-h6
      
      // Text/paragraph
      content: String,
      alignment: String,
      
      // Image
      src: String,
      alt: String,
      width: Number,
      height: Number,
      link: String,
      
      // Video
      videoUrl: String,
      thumbnail: String,
      autoplay: Boolean,
      loop: Boolean,
      
      // Button
      label: String,
      href: String,
      target: String,
      variant: String,
      size: String,
      
      // Spacer
      height: Number,
      
      // Columns
      columns: [mongoose.Schema.Types.Mixed],
      
      // Hero
      heading: String,
      subheading: String,
      backgroundImage: String,
      overlay: Boolean,
      
      // Features
      features: [{
        icon: String,
        title: String,
        description: String
      }],
      
      // Testimonials
      testimonials: [{
        name: String,
        avatar: String,
        role: String,
        content: String,
        rating: Number
      }],
      
      // FAQ
      items: [{
        question: String,
        answer: String
      }],
      
      // Pricing
      plans: [{
        name: String,
        price: Number,
        currency: String,
        interval: String,
        features: [String],
        highlighted: Boolean
      }],
      
      // Form
      formId: String,
      fields: [mongoose.Schema.Types.Mixed],
      
      // Products/Categories
      productIds: [mongoose.Schema.Types.ObjectId],
      categoryIds: [mongoose.Schema.Types.ObjectId],
      displayMode: String,
      
      // HTML
      html: String,
      css: String,
      js: String
    },
    
    // Block visibility
    visible: {
      type: Boolean,
      default: true
    },
    
    // Device-specific visibility
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
    }
  }],
  
  // SEO metadata
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterCard: String,
    canonicalUrl: String,
    noIndex: {
      type: Boolean,
      default: false
    },
    noFollow: {
      type: Boolean,
      default: false
    }
  },
  
  // Page settings
  settings: {
    // Layout
    maxWidth: String,
    padding: String,
    backgroundColor: String,
    
    // Header/Footer
    showHeader: {
      type: Boolean,
      default: true
    },
    showFooter: {
      type: Boolean,
      default: true
    },
    
    // Custom CSS/JS
    customCSS: String,
    customJS: String,
    
    // Protected page
    requireAuth: {
      type: Boolean,
      default: false
    },
    allowedRoles: [String],
    
    // Comments
    enableComments: {
      type: Boolean,
      default: false
    }
  },
  
  // Multilingual support
  translations: [{
    language: String,
    title: String,
    slug: String,
    blocks: [mongoose.Schema.Types.Mixed]
  }],
  
  // Status and versioning
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  // Version history
  versions: [{
    version: Number,
    blocks: [mongoose.Schema.Types.Mixed],
    savedAt: Date,
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  
  // Publishing
  publishedAt: Date,
  scheduledPublishAt: Date,
  
  // Featured/priority
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  // Parent page (for hierarchy)
  parentPage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  },
  
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    avgTimeOnPage: Number, // seconds
    bounceRate: Number,
    
    dailyViews: [{
      date: Date,
      views: Number,
      uniqueVisitors: Number
    }]
  },
  
  // Metadata
  tags: [String],
  category: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
  
}, {
  timestamps: true
});

// Indexes
pageSchema.index({ slug: 1, status: 1 });
pageSchema.index({ type: 1, status: 1 });
pageSchema.index({ featured: 1, order: 1 });

// Ensure unique slug
pageSchema.pre('save', async function(next) {
  if (this.isModified('title') && this.isNew) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Virtual for full URL
pageSchema.virtual('url').get(function() {
  return `/pages/${this.slug}`;
});

// Virtual for is published
pageSchema.virtual('isPublished').get(function() {
  return this.status === 'published' && (!this.scheduledPublishAt || this.scheduledPublishAt <= new Date());
});

// Instance Methods

// Publish page
pageSchema.methods.publish = async function(userId) {
  this.status = 'published';
  this.publishedAt = Date.now();
  this.lastModifiedBy = userId;
  await this.save();
};

// Save version
pageSchema.methods.saveVersion = async function(userId, note = '') {
  const versionData = {
    version: this.version,
    blocks: JSON.parse(JSON.stringify(this.blocks)),
    savedAt: Date.now(),
    savedBy: userId,
    note
  };
  
  this.versions.push(versionData);
  this.version += 1;
  
  // Keep only last 10 versions
  if (this.versions.length > 10) {
    this.versions = this.versions.slice(-10);
  }
  
  await this.save();
};

// Restore version
pageSchema.methods.restoreVersion = async function(versionNumber, userId) {
  const version = this.versions.find(v => v.version === versionNumber);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Save current state before restoring
  await this.saveVersion(userId, `Before restoring to v${versionNumber}`);
  
  this.blocks = JSON.parse(JSON.stringify(version.blocks));
  this.lastModifiedBy = userId;
  
  await this.save();
};

// Record view
pageSchema.methods.recordView = async function(isUnique = false) {
  this.analytics.views += 1;
  
  if (isUnique) {
    this.analytics.uniqueVisitors += 1;
  }
  
  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = this.analytics.dailyViews.find(
    s => s.date.toISOString().split('T')[0] === today
  );
  
  if (todayStats) {
    todayStats.views += 1;
    if (isUnique) todayStats.uniqueVisitors += 1;
  } else {
    this.analytics.dailyViews.push({
      date: new Date(),
      views: 1,
      uniqueVisitors: isUnique ? 1 : 0
    });
  }
  
  await this.save();
};

// Duplicate page
pageSchema.methods.duplicate = async function(userId) {
  const duplicate = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    slug: undefined,
    title: `${this.title} (Copy)`,
    status: 'draft',
    publishedAt: undefined,
    createdBy: userId,
    lastModifiedBy: userId,
    analytics: {
      views: 0,
      uniqueVisitors: 0,
      dailyViews: []
    },
    versions: []
  });
  
  await duplicate.save();
  return duplicate;
};

// Static Methods

// Get published pages
pageSchema.statics.getPublished = async function(options = {}) {
  const query = {
    status: 'published',
    $or: [
      { scheduledPublishAt: { $exists: false } },
      { scheduledPublishAt: { $lte: new Date() } }
    ]
  };
  
  if (options.type) query.type = options.type;
  if (options.featured) query.featured = true;
  if (options.category) query.category = options.category;
  
  return this.find(query)
    .populate('createdBy', 'fullName avatar')
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .limit(options.limit || 50);
};

// Get page by slug
pageSchema.statics.getBySlug = async function(slug, includeUnpublished = false) {
  const query = { slug };
  
  if (!includeUnpublished) {
    query.status = 'published';
  }
  
  return this.findOne(query)
    .populate('createdBy', 'fullName avatar')
    .populate('parentPage', 'title slug');
};

// Search pages
pageSchema.statics.search = async function(searchTerm, options = {}) {
  const query = {
    $or: [
      { title: new RegExp(searchTerm, 'i') },
      { 'blocks.config.content': new RegExp(searchTerm, 'i') },
      { tags: new RegExp(searchTerm, 'i') }
    ]
  };
  
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20);
};

const Page = mongoose.model('Page', pageSchema);

module.exports = { Page };
