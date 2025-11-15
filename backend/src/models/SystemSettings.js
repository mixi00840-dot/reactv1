const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['streaming', 'storage', 'ai', 'translation', 'payment', 'general'],
    index: true
  },
  key: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can store strings, objects, arrays, etc.
    required: true
  },
  encrypted: {
    type: Boolean,
    default: false // Indicates if the value should be treated as sensitive
  },
  description: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for fast lookups
systemSettingsSchema.index({ category: 1, key: 1 }, { unique: true });

// Static method to get a setting
systemSettingsSchema.statics.getSetting = async function(category, key, defaultValue = null) {
  const setting = await this.findOne({ category, key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting
systemSettingsSchema.statics.setSetting = async function(category, key, value, userId = null) {
  const update = {
    value,
    updatedBy: userId
  };
  
  const setting = await this.findOneAndUpdate(
    { category, key },
    { $set: update },
    { upsert: true, new: true, runValidators: true }
  );
  
  return setting;
};

// Static method to get all settings in a category
systemSettingsSchema.statics.getCategorySettings = async function(category) {
  const settings = await this.find({ category });
  const result = {};
  settings.forEach(setting => {
    result[setting.key] = setting.value;
  });
  return result;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
