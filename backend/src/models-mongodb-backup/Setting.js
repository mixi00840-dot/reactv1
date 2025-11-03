const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption utilities
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const settingSchema = new mongoose.Schema({
  // Setting identification
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'i18n',
      'streaming',
      'cms',
      'supporters',
      'currencies',
      'coins',
      'moderation',
      'payments',
      'ads',
      'media',
      'integrations',
      'notifications',
      'security',
      'maintenance'
    ],
    index: true
  },
  key: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Value can be any type
  value: mongoose.Schema.Types.Mixed,
  
  // Metadata
  label: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array', 'encrypted', 'file', 'color', 'url'],
    default: 'string'
  },
  
  // Encryption flag
  encrypted: {
    type: Boolean,
    default: false
  },
  
  // Validation rules
  validation: {
    required: Boolean,
    min: Number,
    max: Number,
    pattern: String,
    enum: [String],
    custom: String // JavaScript validation function as string
  },
  
  // Environment override
  envKey: String, // If set, value can be overridden by process.env[envKey]
  
  // Access control
  requiresRestart: {
    type: Boolean,
    default: false
  },
  publicRead: {
    type: Boolean,
    default: false // If true, can be accessed without admin auth
  },
  
  // Versioning for cache invalidation
  version: {
    type: Number,
    default: 1
  },
  
  // Change tracking
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  },
  
  // Status
  active: {
    type: Boolean,
    default: true
  },
  
  // Tags for grouping
  tags: [String]
}, {
  timestamps: true
});

// Compound unique index
settingSchema.index({ category: 1, key: 1 }, { unique: true });

// Virtual for getting the actual value (with env override and decryption)
settingSchema.virtual('actualValue').get(function() {
  // Check environment override first
  if (this.envKey && process.env[this.envKey] !== undefined) {
    return process.env[this.envKey];
  }
  
  // Decrypt if needed
  if (this.encrypted && this.value) {
    return decrypt(this.value);
  }
  
  return this.value;
});

// Method to set value with encryption
settingSchema.methods.setValue = function(newValue, encrypt = false) {
  if (encrypt || this.encrypted) {
    this.value = typeof newValue === 'string' ? encrypt(newValue) : encrypt(JSON.stringify(newValue));
    this.encrypted = true;
  } else {
    this.value = newValue;
  }
  this.version += 1;
  this.lastModifiedAt = Date.now();
};

// Static method to get setting by key
settingSchema.statics.getSetting = async function(category, key, defaultValue = null) {
  const setting = await this.findOne({ category, key, active: true });
  if (!setting) return defaultValue;
  return setting.actualValue;
};

// Static method to get all settings in a category
settingSchema.statics.getCategorySettings = async function(category) {
  const settings = await this.find({ category, active: true }).lean();
  const result = {};
  
  for (const setting of settings) {
    // Check environment override
    if (setting.envKey && process.env[setting.envKey] !== undefined) {
      result[setting.key] = process.env[setting.envKey];
    } else if (setting.encrypted && setting.value) {
      result[setting.key] = decrypt(setting.value);
    } else {
      result[setting.key] = setting.value;
    }
  }
  
  return result;
};

// Static method to update or create setting
settingSchema.statics.setSetting = async function(category, key, value, userId = null, options = {}) {
  const setting = await this.findOne({ category, key });
  
  if (setting) {
    if (options.encrypted || setting.encrypted) {
      setting.setValue(value, true);
    } else {
      setting.value = value;
      setting.version += 1;
    }
    
    setting.lastModifiedBy = userId;
    setting.lastModifiedAt = Date.now();
    
    if (options.label) setting.label = options.label;
    if (options.description) setting.description = options.description;
    
    await setting.save();
    return setting;
  } else {
    const newSetting = new this({
      category,
      key,
      value: options.encrypted ? encrypt(typeof value === 'string' ? value : JSON.stringify(value)) : value,
      encrypted: options.encrypted || false,
      label: options.label || key,
      description: options.description || '',
      type: options.type || 'string',
      publicRead: options.publicRead || false,
      lastModifiedBy: userId,
      ...options
    });
    
    await newSetting.save();
    return newSetting;
  }
};

// Method to mask sensitive values for display
settingSchema.methods.getMaskedValue = function() {
  if (!this.encrypted) return this.actualValue;
  
  const val = String(this.actualValue || '');
  if (val.length <= 4) return '****';
  return val.slice(0, 4) + '*'.repeat(Math.min(val.length - 4, 20));
};

// Ensure encryption key exists on startup
settingSchema.statics.ensureEncryptionKey = function() {
  if (!process.env.SETTINGS_ENCRYPTION_KEY) {
    console.warn('⚠️  SETTINGS_ENCRYPTION_KEY not set in .env! Using temporary key. Settings will not decrypt after restart.');
    console.warn('⚠️  Generate a key: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\').slice(0,32))"');
  }
};

const Setting = mongoose.model('Setting', settingSchema);

module.exports = { Setting, encrypt, decrypt };
