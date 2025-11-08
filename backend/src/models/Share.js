const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'whatsapp', 'telegram', 'copy_link', 'other'],
    default: 'other'
  },
  
  sharedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

ShareSchema.index({ contentId: 1, sharedAt: -1 });
ShareSchema.index({ userId: 1, sharedAt: -1 });

const Share = mongoose.model('Share', ShareSchema);

module.exports = Share;
