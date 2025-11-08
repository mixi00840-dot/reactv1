const mongoose = require('mongoose');

const FeaturedSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['content', 'user', 'shop', 'product'],
    required: true
  },
  
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type'
  },
  
  position: {
    type: String,
    enum: ['homepage', 'explore', 'trending', 'shop'],
    default: 'homepage'
  },
  
  priority: {
    type: Number,
    default: 1
  },
  
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  impressions: {
    type: Number,
    default: 0
  },
  
  clicks: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

FeaturedSchema.index({ type: 1, isActive: 1, priority: -1 });
FeaturedSchema.index({ endDate: 1 });
FeaturedSchema.index({ itemId: 1, type: 1 });

// Check if featured item is expired
FeaturedSchema.methods.isExpired = function() {
  return this.endDate < new Date();
};

// Update expired status automatically
FeaturedSchema.pre('find', function() {
  this.where({ endDate: { $gte: new Date() } });
});

const Featured = mongoose.model('Featured', FeaturedSchema);

module.exports = Featured;
