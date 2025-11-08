const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
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
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound unique index
LikeSchema.index({ userId: 1, contentId: 1 }, { unique: true });
LikeSchema.index({ contentId: 1, createdAt: -1 });

const Like = mongoose.model('Like', LikeSchema);

module.exports = Like;
