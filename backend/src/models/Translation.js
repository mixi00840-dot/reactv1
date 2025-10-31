const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  // Translation key (unique identifier)
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Category/namespace for organization
  category: {
    type: String,
    required: true,
    enum: [
      'common', 'auth', 'profile', 'settings', 'products', 'orders',
      'checkout', 'shipping', 'payments', 'reviews', 'chat', 'notifications',
      'errors', 'validation', 'buttons', 'labels', 'messages', 'onboarding',
      'store', 'seller', 'support', 'legal', 'admin', 'livestream', 'other'
    ],
    index: true
  },
  
  // Default text (usually in English)
  defaultText: {
    type: String,
    required: true
  },
  
  // Description for translators
  description: String,
  context: String, // Where this translation is used
  
  // Translations for each language { languageCode: translatedText }
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Pluralization support
  pluralForms: {
    type: Map,
    of: {
      zero: String,
      one: String,
      two: String,
      few: String,
      many: String,
      other: String
    }
  },
  
  // Variables/placeholders in the text
  variables: [{
    name: String,
    example: String,
    description: String
  }],
  
  // Character limits (for UI constraints)
  maxLength: Number,
  minLength: Number,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'deprecated', 'draft'],
    default: 'active',
    index: true
  },
  
  // Translation status per language
  translationStatus: {
    type: Map,
    of: {
      status: {
        type: String,
        enum: ['missing', 'draft', 'translated', 'verified', 'auto'],
        default: 'missing'
      },
      translatedBy: mongoose.Schema.Types.ObjectId,
      translatedAt: Date,
      verifiedBy: mongoose.Schema.Types.ObjectId,
      verifiedAt: Date,
      autoTranslated: Boolean,
      needsReview: Boolean
    }
  },
  
  // Tags for filtering
  tags: [String],
  
  // Change tracking
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: Date,
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  
  // Usage statistics
  usage: {
    platforms: [{ type: String, enum: ['web', 'ios', 'android', 'all'] }],
    screens: [String],
    frequency: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
  },
  
  // Screenshot reference
  screenshot: String,
  
  // Comments/notes
  notes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Compound indexes
translationSchema.index({ category: 1, key: 1 });
translationSchema.index({ status: 1, category: 1 });
translationSchema.index({ 'usage.frequency': 1 });

// Text search index
translationSchema.index({
  key: 'text',
  defaultText: 'text',
  description: 'text'
});

// Virtual for completion percentage
translationSchema.virtual('completionRate').get(function() {
  const { Language } = require('./Language');
  const totalLanguages = Language.countDocuments({ enabled: true });
  const translatedCount = this.translations.size;
  return totalLanguages > 0 ? Math.round((translatedCount / totalLanguages) * 100) : 0;
});

// Method to set translation for a language
translationSchema.methods.setTranslation = async function(languageCode, text, userId, options = {}) {
  this.translations.set(languageCode, text);
  
  const statusInfo = {
    status: options.autoTranslated ? 'auto' : (options.verified ? 'verified' : 'translated'),
    translatedBy: userId,
    translatedAt: Date.now(),
    autoTranslated: options.autoTranslated || false,
    needsReview: options.needsReview || false
  };
  
  if (options.verified) {
    statusInfo.verifiedBy = userId;
    statusInfo.verifiedAt = Date.now();
  }
  
  if (!this.translationStatus) {
    this.translationStatus = new Map();
  }
  this.translationStatus.set(languageCode, statusInfo);
  
  this.lastModifiedBy = userId;
  this.lastModifiedAt = Date.now();
  this.version += 1;
  
  await this.save();
  
  // Update language progress
  const { Language } = require('./Language');
  const language = await Language.findOne({ code: languageCode });
  if (language) {
    await language.updateProgress();
  }
};

// Method to get translation for a language with fallback
translationSchema.methods.getTranslation = function(languageCode, fallbackToDefault = true) {
  const translation = this.translations.get(languageCode);
  
  if (translation) {
    return translation;
  }
  
  if (fallbackToDefault) {
    return this.defaultText;
  }
  
  return null;
};

// Method to verify translation
translationSchema.methods.verifyTranslation = async function(languageCode, userId) {
  const status = this.translationStatus.get(languageCode);
  
  if (status) {
    status.status = 'verified';
    status.verifiedBy = userId;
    status.verifiedAt = Date.now();
    status.needsReview = false;
    
    this.translationStatus.set(languageCode, status);
    await this.save();
  }
};

// Static method to get translations for a language
translationSchema.statics.getLanguagePack = async function(languageCode, options = {}) {
  const { category, status = 'active' } = options;
  
  const query = { status };
  if (category) query.category = category;
  
  const translations = await this.find(query).lean();
  
  const pack = {};
  
  for (const t of translations) {
    const text = t.translations?.[languageCode] || t.defaultText;
    pack[t.key] = text;
    
    // Include plural forms if available
    if (t.pluralForms && t.pluralForms[languageCode]) {
      pack[`${t.key}_plural`] = t.pluralForms[languageCode];
    }
  }
  
  return pack;
};

// Static method to import translations
translationSchema.statics.importTranslations = async function(data, userId, options = {}) {
  const results = { created: 0, updated: 0, errors: [] };
  
  for (const item of data) {
    try {
      const existing = await this.findOne({ key: item.key });
      
      if (existing) {
        // Update existing
        if (options.overwrite || !existing.translations.has(item.languageCode)) {
          await existing.setTranslation(
            item.languageCode,
            item.text,
            userId,
            { verified: options.verified }
          );
          results.updated++;
        }
      } else {
        // Create new
        const translation = new this({
          key: item.key,
          category: item.category || 'other',
          defaultText: item.defaultText || item.text,
          description: item.description,
          translations: { [item.languageCode]: item.text },
          lastModifiedBy: userId,
          lastModifiedAt: Date.now()
        });
        
        await translation.save();
        results.created++;
      }
    } catch (error) {
      results.errors.push({ key: item.key, error: error.message });
    }
  }
  
  return results;
};

// Static method to search translations
translationSchema.statics.searchTranslations = async function(searchTerm, options = {}) {
  const {
    category,
    status = 'active',
    languageCode,
    limit = 50,
    skip = 0
  } = options;
  
  const query = { status };
  if (category) query.category = category;
  
  if (searchTerm) {
    query.$or = [
      { key: { $regex: searchTerm, $options: 'i' } },
      { defaultText: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ];
    
    if (languageCode) {
      query.$or.push({
        [`translations.${languageCode}`]: { $regex: searchTerm, $options: 'i' }
      });
    }
  }
  
  const translations = await this.find(query)
    .sort({ category: 1, key: 1 })
    .limit(limit)
    .skip(skip)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return { translations, total };
};

const Translation = mongoose.model('Translation', translationSchema);

module.exports = { Translation };
