const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  nativeName: String,
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  rtl: {
    type: Boolean,
    default: false
  },
  
  flagIcon: String,
  
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
}, {
  timestamps: true
});

LanguageSchema.index({ code: 1 }, { unique: true });

const Language = mongoose.model('Language', LanguageSchema);

module.exports = Language;

