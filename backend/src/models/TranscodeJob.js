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

// Aggregate stats helper
TranscodeJobSchema.statics.getStats = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProgress: { $avg: '$progress' }
      }
    }
  ];
  const raw = await this.aggregate(pipeline);
  const stats = raw.reduce((acc, r) => {
    acc[r._id] = { count: r.count, avgProgress: Math.round(r.avgProgress || 0) };
    return acc;
  }, {});
  return {
    queued: stats.queued || { count: 0, avgProgress: 0 },
    processing: stats.processing || { count: 0, avgProgress: 0 },
    completed: stats.completed || { count: 0, avgProgress: 100 },
    failed: stats.failed || { count: 0, avgProgress: 0 },
    windowHours: hours
  };
};

const TranscodeJob = mongoose.model('TranscodeJob', TranscodeJobSchema);
module.exports = TranscodeJob;

