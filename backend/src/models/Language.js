const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  // Language identification
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 5,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nativeName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Direction
  direction: {
    type: String,
    enum: ['ltr', 'rtl'],
    default: 'ltr'
  },
  
  // Status
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Versioning for cache invalidation
  version: {
    type: Number,
    default: 1
  },
  lastPublishedAt: Date,
  
  // Translation coverage
  translationProgress: {
    total: { type: Number, default: 0 },
    translated: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  
  // Regional settings
  region: String, // e.g., 'US', 'GB', 'AE'
  locale: String, // Full locale code e.g., 'en-US', 'ar-AE'
  
  // Formatting
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  timeFormat: {
    type: String,
    default: 'hh:mm A'
  },
  numberFormat: {
    decimalSeparator: { type: String, default: '.' },
    thousandsSeparator: { type: String, default: ',' }
  },
  currency: {
    code: String,
    symbol: String,
    position: { type: String, enum: ['before', 'after'], default: 'before' }
  },
  
  // Metadata
  flag: String, // Emoji or URL to flag icon
  priority: {
    type: Number,
    default: 0 // Higher priority shows first in lists
  },
  
  // Auto-translation
  autoTranslateEnabled: {
    type: Boolean,
    default: false
  },
  autoTranslateProvider: {
    type: String,
    enum: ['google', 'deepl', 'microsoft', 'manual'],
    default: 'manual'
  },
  
  // Change tracking
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: Date,
  
  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Statistics
  stats: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    lastUsedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
languageSchema.index({ enabled: 1, isDefault: 1 });
languageSchema.index({ status: 1, enabled: 1 });
languageSchema.index({ priority: -1, name: 1 });

// Ensure only one default language
languageSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Update translation progress
languageSchema.methods.updateProgress = async function() {
  const Translation = mongoose.model('Translation');
  
  const total = await Translation.countDocuments({ status: 'active' });
  const translated = await Translation.countDocuments({
    [`translations.${this.code}`]: { $exists: true, $ne: '' },
    status: 'active'
  });
  
  this.translationProgress = {
    total,
    translated,
    percentage: total > 0 ? Math.round((translated / total) * 100) : 0
  };
  
  await this.save();
};

// Publish language pack
languageSchema.methods.publish = async function(userId) {
  this.status = 'published';
  this.lastPublishedAt = Date.now();
  this.version += 1;
  this.lastModifiedBy = userId;
  this.lastModifiedAt = Date.now();
  
  await this.save();
  
  // Log audit
  const { AuditLog } = require('./AuditLog');
  await AuditLog.logChange({
    entityType: 'language',
    entityId: this._id,
    action: 'publish',
    userId,
    description: `Published language pack for ${this.name} (v${this.version})`,
    severity: 'medium'
  });
};

// Static method to get default language
languageSchema.statics.getDefault = async function() {
  let defaultLang = await this.findOne({ isDefault: true, enabled: true });
  
  if (!defaultLang) {
    // Fallback to first enabled language
    defaultLang = await this.findOne({ enabled: true }).sort({ priority: -1 });
  }
  
  return defaultLang;
};

// Static method to get enabled languages
languageSchema.statics.getEnabled = async function() {
  return this.find({ enabled: true, status: 'published' })
    .sort({ priority: -1, name: 1 })
    .lean();
};

const Language = mongoose.model('Language', languageSchema);

module.exports = { Language };
