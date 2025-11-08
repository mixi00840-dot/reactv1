const mongoose = require('mongoose');

const TranscodeJobSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    index: true
  },
  
  uploadSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadSession'
  },
  
  sourceUrl: {
    type: String,
    required: true
  },
  
  outputUrls: mongoose.Schema.Types.Mixed,
  
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued',
    index: true
  },
  
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  settings: {
    resolutions: [String],
    codec: String,
    bitrate: Number
  },
  
  startedAt: Date,
  completedAt: Date,
  
  error: String,
  
}, {
  timestamps: true
});

TranscodeJobSchema.index({ status: 1, createdAt: 1 });
TranscodeJobSchema.index({ contentId: 1 });

const TranscodeJob = mongoose.model('TranscodeJob', TranscodeJobSchema);

module.exports = TranscodeJob;

