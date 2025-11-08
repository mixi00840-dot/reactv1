const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // Parent category (for hierarchical categories)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  
  // Media
  icon: String,
  image: String,
  color: String,
  
  // Display
  sortOrder: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  productsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  
}, {
  timestamps: true
});

// Indexes (slug already has unique index from schema)
CategorySchema.index({ parentId: 1, sortOrder: 1 });
CategorySchema.index({ isActive: 1, isFeatured: -1 });

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
