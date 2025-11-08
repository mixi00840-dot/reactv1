const mongoose = require('mongoose');

const SaveSchema = new mongoose.Schema({
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
  
  collection: {
    type: String,
    default: 'default'
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound unique index
SaveSchema.index({ userId: 1, contentId: 1 }, { unique: true });
SaveSchema.index({ userId: 1, createdAt: -1 });

const Save = mongoose.model('Save', SaveSchema);

module.exports = Save;
