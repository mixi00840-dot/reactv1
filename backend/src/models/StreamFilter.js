const mongoose = require('mongoose');

const StreamFilterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  displayName: String,
  
  type: {
    type: String,
    enum: ['beauty', 'ar', 'background', 'color'],
    required: true
  },
  
  thumbnailUrl: String,
  
  config: mongoose.Schema.Types.Mixed,
  
  isPremium: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

StreamFilterSchema.index({ name: 1 }, { unique: true });
StreamFilterSchema.index({ type: 1, isActive: 1 });

const StreamFilter = mongoose.model('StreamFilter', StreamFilterSchema);

module.exports = StreamFilter;

