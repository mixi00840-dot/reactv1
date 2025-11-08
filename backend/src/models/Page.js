const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['page', 'policy', 'terms', 'help', 'about'],
    default: 'page'
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  seoTitle: String,
  seoDescription: String,
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true
});

PageSchema.index({ slug: 1 }, { unique: true });
PageSchema.index({ type: 1, isPublished: 1 });

const Page = mongoose.model('Page', PageSchema);

module.exports = Page;

