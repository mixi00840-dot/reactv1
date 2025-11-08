const mongoose = require('mongoose');

const VideoQualitySchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  qualities: [{
    resolution: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '1440p', '2160p']
    },
    url: String,
    fileSize: Number,
    bitrate: Number,
    codec: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending'
    }
  }],
  
  originalUrl: String,
  originalSize: Number,
  
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  error: String,
  
}, {
  timestamps: true
});

VideoQualitySchema.index({ contentId: 1 }, { unique: true });

const VideoQuality = mongoose.model('VideoQuality', VideoQualitySchema);

module.exports = VideoQuality;

