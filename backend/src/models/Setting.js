const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  value: mongoose.Schema.Types.Mixed,
  
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  
  category: {
    type: String,
    enum: ['general', 'security', 'email', 'payment', 'storage', 'streaming', 'notification', 'social'],
    default: 'general'
  },
  
  description: String,
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true
});

SettingSchema.index({ key: 1 }, { unique: true });
SettingSchema.index({ category: 1 });

// Static method to get setting
SettingSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting
SettingSchema.statics.setSetting = async function(key, value, options = {}) {
  const { type = typeof value, category = 'general', description, updatedBy } = options;
  
  return this.findOneAndUpdate(
    { key },
    {
      key,
      value,
      type,
      category,
      description,
      updatedBy,
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );
};

const Setting = mongoose.model('Setting', SettingSchema);

module.exports = Setting;
