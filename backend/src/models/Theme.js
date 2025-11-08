const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  colors: {
    primary: String,
    secondary: String,
    accent: String,
    background: String,
    text: String
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPremium: {
    type: Boolean,
    default: false
  },
  
  previewImage: String,
  
}, {
  timestamps: true
});

ThemeSchema.index({ name: 1 }, { unique: true });

const Theme = mongoose.model('Theme', ThemeSchema);

module.exports = Theme;

