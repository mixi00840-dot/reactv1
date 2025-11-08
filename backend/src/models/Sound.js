const mongoose = require('mongoose');

const SoundSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  artist: {
    type: String,
    trim: true
  },
  
  // Audio file
  audioUrl: {
    type: String,
    required: true
  },
  
  duration: {
    type: Number,
    required: true // seconds
  },
  
  // Waveform data for visualization
  waveform: [Number],
  
  // Cover image
  coverUrl: String,
  
  // Creator
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  isOriginal: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'removed'],
    default: 'pending',
    index: true
  },
  
  // Usage
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Trending
  isTrending: {
    type: Boolean,
    default: false
  },
  
  trendingScore: {
    type: Number,
    default: 0
  },
  
  // Categorization
  genre: String,
  mood: [String],
  tags: [String],
  
}, {
  timestamps: true
});

// Indexes
SoundSchema.index({ status: 1, createdAt: -1 });
SoundSchema.index({ usageCount: -1 });
SoundSchema.index({ isTrending: 1, trendingScore: -1 });
SoundSchema.index({ uploadedBy: 1 });

// Text search
SoundSchema.index({ title: 'text', artist: 'text' });

const Sound = mongoose.model('Sound', SoundSchema);

module.exports = Sound;
