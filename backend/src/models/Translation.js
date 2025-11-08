const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  
  languageCode: {
    type: String,
    required: true,
    index: true
  },
  
  value: {
    type: String,
    required: true
  },
  
  context: String,
  description: String,
  
  isPlural: {
    type: Boolean,
    default: false
  },
  
  pluralForms: mongoose.Schema.Types.Mixed,
  
}, {
  timestamps: true
});

TranslationSchema.index({ key: 1, languageCode: 1 }, { unique: true });

const Translation = mongoose.model('Translation', TranslationSchema);

module.exports = Translation;

