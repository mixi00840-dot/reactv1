const mongoose = require('mongoose');

const TrendingRecordSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  
  score: {
    type: Number,
    required: true,
    default: 0
  },
  
  category: {
    type: String,
    enum: ['overall', 'music', 'comedy', 'education', 'sports', 'gaming', 'other'],
    default: 'overall',
    index: true
  },
  
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    required: true,
    index: true
  },
  
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  metrics: {
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    engagementRate: Number
  },
  
}, {
  timestamps: false
});

TrendingRecordSchema.index({ period: 1, category: 1, date: -1, rank: 1 });
TrendingRecordSchema.index({ date: -1 });

// TTL - keep for 30 days
TrendingRecordSchema.index({ date: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const TrendingRecord = mongoose.model('TrendingRecord', TrendingRecordSchema);

module.exports = TrendingRecord;

