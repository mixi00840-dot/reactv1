const mongoose = require('mongoose');

const videoQualitySchema = new mongoose.Schema({
  originalVideo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  quality: {
    type: String,
    enum: ['360p', '480p', '720p', '1080p', '1440p', '4k', 'original'],
    required: true
  },
  resolution: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  bitrate: {
    type: Number, // in kbps
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  url: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  format: {
    type: String,
    default: 'mp4'
  },
  codec: {
    video: { type: String, default: 'h264' },
    audio: { type: String, default: 'aac' }
  },
  fps: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingStarted: Date,
  processingCompleted: Date,
  error: String
}, {
  timestamps: true
});

// Compound index for efficient queries
videoQualitySchema.index({ originalVideo: 1, quality: 1 }, { unique: true });
videoQualitySchema.index({ status: 1 });

module.exports = mongoose.model('VideoQuality', videoQualitySchema);
