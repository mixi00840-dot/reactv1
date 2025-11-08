const mongoose = require('mongoose');

const uploadSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileKey: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending',
    index: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: Date,
  error: String
}, {
  timestamps: true
});

// Index for cleanup queries
uploadSessionSchema.index({ expiresAt: 1, status: 1 });
uploadSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UploadSession', uploadSessionSchema);
