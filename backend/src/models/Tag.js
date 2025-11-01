const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['entertainment', 'music', 'lifestyle', 'education', 'sports', 'comedy', 'dance', 'fashion', 'food', 'travel', 'other'],
    default: 'other'
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i,
    default: '#007bff'
  },
  icon: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  metadata: {
    weeklyUsage: { type: Number, default: 0 },
    monthlyUsage: { type: Number, default: 0 },
    peakUsage: { type: Number, default: 0 },
    associatedUsers: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ isTrending: -1, usageCount: -1 });
tagSchema.index({ category: 1, isActive: 1 });
tagSchema.index({ isActive: 1, isFeatured: -1 });

// Virtual for popularity score
tagSchema.virtual('popularityScore').get(function() {
  const weeklyWeight = 0.5;
  const monthlyWeight = 0.3;
  const totalWeight = 0.2;
  
  return (
    (this.metadata.weeklyUsage * weeklyWeight) +
    (this.metadata.monthlyUsage * monthlyWeight) +
    (this.usageCount * totalWeight)
  );
});

// Methods
tagSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.metadata.weeklyUsage += 1;
  this.metadata.monthlyUsage += 1;
  this.lastUsed = new Date();
  return this.save();
};

tagSchema.methods.setTrending = function(trending = true) {
  this.isTrending = trending;
  return this.save();
};

// Static methods
tagSchema.statics.getTrendingTags = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    isTrending: true 
  })
  .sort({ usageCount: -1, updatedAt: -1 })
  .limit(limit);
};

tagSchema.statics.getPopularTags = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

tagSchema.statics.searchTags = function(query, limit = 10) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { displayName: { $regex: query, $options: 'i' } }
    ]
  })
  .sort({ usageCount: -1 })
  .limit(limit);
};

// Pre-save middleware
tagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().trim();
  }
  next();
});

module.exports = mongoose.model('Tag', tagSchema);