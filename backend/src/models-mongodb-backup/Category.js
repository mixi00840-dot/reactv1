const mongoose = require('mongoose');

const attributeFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'select', 'multiselect', 'boolean', 'color', 'image', 'date'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  placeholder: String,
  helpText: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [String], // For select/multiselect types
  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String,
    message: String
  },
  order: {
    type: Number,
    default: 0
  },
  showInListing: {
    type: Boolean,
    default: false
  },
  showInFilters: {
    type: Boolean,
    default: false
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  image: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: [String], // Array of ancestor slugs for easy querying
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  commission: {
    rate: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const productAttributeTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Predefined attribute fields for this template
  attributeFields: [attributeFieldSchema],
  
  // Sample data to help sellers
  sampleData: {
    title: String,
    description: String,
    tags: [String],
    sampleImages: [String]
  },
  
  // Template settings
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    allowCustomAttributes: {
      type: Boolean,
      default: true
    },
    requiredImages: {
      min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number,
        default: 10
      }
    },
    autoApprove: {
      type: Boolean,
      default: false
    }
  },
  
  // Usage statistics
  stats: {
    usageCount: {
      type: Number,
      default: 0
    },
    lastUsedAt: Date
  },
  
  // Admin information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Category virtuals
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryIds'
});

// Template virtuals
productAttributeTemplateSchema.virtual('categories', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id'
});

productAttributeTemplateSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'templateId'
});

// Category pre-save middleware
categorySchema.pre('save', function(next) {
  // Generate slug from name
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Calculate level and path based on parent
  if (this.isModified('parentId')) {
    if (this.parentId) {
      // This will be updated by a post-save hook or separate method
      // since we need to query the parent
    } else {
      this.level = 0;
      this.path = [];
    }
  }
  
  next();
});

// Category static methods
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.findRoot = function() {
  return this.find({ parentId: null, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.findByLevel = function(level) {
  return this.find({ level, isActive: true }).sort({ sortOrder: 1 });
};

// Category instance methods
categorySchema.methods.getAncestors = async function() {
  const ancestors = [];
  let current = this;
  
  while (current.parentId) {
    const parent = await this.constructor.findById(current.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return ancestors;
};

categorySchema.methods.getDescendants = async function() {
  const descendants = [];
  
  const findChildren = async (categoryId) => {
    const children = await this.constructor.find({ parentId: categoryId });
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return descendants;
};

// Template static methods
productAttributeTemplateSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    categoryIds: categoryId, 
    'settings.isActive': true 
  }).sort({ 'stats.usageCount': -1 });
};

productAttributeTemplateSchema.statics.findDefault = function() {
  return this.findOne({ 'settings.isDefault': true, 'settings.isActive': true });
};

// Template instance methods
productAttributeTemplateSchema.methods.incrementUsage = function() {
  this.stats.usageCount += 1;
  this.stats.lastUsedAt = new Date();
  return this.save();
};

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

productAttributeTemplateSchema.index({ categoryIds: 1 });
productAttributeTemplateSchema.index({ 'settings.isActive': 1 });
productAttributeTemplateSchema.index({ 'settings.isDefault': 1 });
productAttributeTemplateSchema.index({ 'stats.usageCount': -1 });

const Category = mongoose.model('Category', categorySchema);
const ProductAttributeTemplate = mongoose.model('ProductAttributeTemplate', productAttributeTemplateSchema);

module.exports = { Category, ProductAttributeTemplate };