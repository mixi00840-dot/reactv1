const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  isTrending: {
    type: Boolean,
    default: false
  },
  
}, {
  timestamps: true
});

TagSchema.index({ name: 1 }, { unique: true });
TagSchema.index({ usageCount: -1 });
TagSchema.index({ isTrending: 1, usageCount: -1 });

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;

