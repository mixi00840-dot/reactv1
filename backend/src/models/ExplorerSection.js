const mongoose = require('mongoose');

const ExplorerSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['trending', 'category', 'curated', 'personalized'],
    required: true
  },
  
  category: String,
  
  content: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  refreshInterval: {
    type: Number,
    default: 3600 // seconds
  },
  
  lastRefreshed: Date,
  
}, {
  timestamps: true
});

ExplorerSectionSchema.index({ type: 1, sortOrder: 1 });
ExplorerSectionSchema.index({ isActive: 1, sortOrder: 1 });

const ExplorerSection = mongoose.model('ExplorerSection', ExplorerSectionSchema);

module.exports = ExplorerSection;

