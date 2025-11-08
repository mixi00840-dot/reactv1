const mongoose = require('mongoose');

const SupporterBadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  description: String,
  
  icon: String,
  color: String,
  
  requirement: {
    type: String,
    enum: ['subscription', 'gifts', 'duration', 'engagement', 'special'],
    required: true
  },
  
  threshold: Number, // Minimum requirement (e.g., $100 in gifts, 6 months subscription)
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
}, {
  timestamps: true
});

SupporterBadgeSchema.index({ name: 1 }, { unique: true });

const SupporterBadge = mongoose.model('SupporterBadge', SupporterBadgeSchema);

module.exports = SupporterBadge;

