const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema({
  // Stream identification
  streamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Streamer information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Provider information
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StreamProvider',
    required: true
  },
  
  providerStreamId: String, // ID from the streaming provider
  
  // Stream details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  thumbnail: String,
  
  category: {
    type: String,
    enum: ['gaming', 'music', 'sports', 'education', 'entertainment', 'shopping', 'other'],
    default: 'other'
  },
  
  tags: [String],
  
  // Stream status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'error'],
    default: 'scheduled',
    index: true
  },
  
  // Timing
  scheduledStartTime: Date,
  actualStartTime: Date,
  endTime: Date,
  duration: Number, // in seconds
  
  // Stream configuration
  config: {
    resolution: {
      type: String,
      enum: ['480p', '720p', '1080p', '2k', '4k'],
      default: '720p'
    },
    bitrate: Number, // kbps
    frameRate: Number, // fps
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    },
    enableChat: {
      type: Boolean,
      default: true
    },
    enableGifts: {
      type: Boolean,
      default: true
    },
    enableRecording: {
      type: Boolean,
      default: false
    }
  },
  
  // Access control
  privacy: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  
  // Stream tokens/URLs
  streamKey: String,
  rtmpUrl: String,
  playbackUrl: String,
  hlsUrl: String,
  
  // Viewership statistics
  stats: {
    currentViewers: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    giftsReceived: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  
  // Viewer list (for private streams or tracking)
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    watchDuration: Number // seconds
  }],
  
  // Recording information
  recording: {
    enabled: Boolean,
    url: String,
    duration: Number,
    fileSize: Number,
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing'
    }
  },
  
  // Monetization
  monetization: {
    enabled: {
      type: Boolean,
      default: false
    },
    minTicketPrice: Number,
    virtualGiftsEnabled: {
      type: Boolean,
      default: true
    },
    subscriptionOnly: {
      type: Boolean,
      default: false
    }
  },
  
  // Moderation
  moderation: {
    bannedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    slowMode: {
      type: Boolean,
      default: false
    },
    slowModeInterval: Number, // seconds between messages
    chatFilterEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Technical details
  technical: {
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    bitrateDrop: {
      type: Number,
      default: 0
    },
    frameDrops: {
      type: Number,
      default: 0
    },
    reconnects: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  location: {
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  language: String,
  
  // Error tracking
  errors: [{
    timestamp: Date,
    code: String,
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }]
  
}, {
  timestamps: true
});

// Indexes for performance
liveStreamSchema.index({ status: 1, createdAt: -1 });
liveStreamSchema.index({ user: 1, status: 1 });
liveStreamSchema.index({ featured: 1, status: 1 });
liveStreamSchema.index({ category: 1, status: 1 });
liveStreamSchema.index({ 'stats.currentViewers': -1, status: 1 });

// Virtual for watch duration
liveStreamSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

// Virtual for stream URL
liveStreamSchema.virtual('streamUrl').get(function() {
  return this.playbackUrl || this.hlsUrl;
});

// Instance Methods

// Start stream
liveStreamSchema.methods.start = async function() {
  this.status = 'live';
  this.actualStartTime = Date.now();
  
  // Increment provider active streams
  const { StreamProvider } = require('./StreamProvider');
  const provider = await StreamProvider.findById(this.provider);
  if (provider) {
    await provider.incrementActive();
  }
  
  await this.save();
};

// End stream
liveStreamSchema.methods.end = async function() {
  this.status = 'ended';
  this.endTime = Date.now();
  
  if (this.actualStartTime) {
    this.duration = Math.floor((this.endTime - this.actualStartTime) / 1000);
  }
  
  // Decrement provider active streams and record usage
  const { StreamProvider } = require('./StreamProvider');
  const provider = await StreamProvider.findById(this.provider);
  if (provider) {
    await provider.decrementActive();
    await provider.recordUsage(
      Math.floor(this.duration / 60),
      this.stats.uniqueViewers
    );
  }
  
  await this.save();
};

// Add viewer
liveStreamSchema.methods.addViewer = async function(userId) {
  this.stats.currentViewers += 1;
  this.stats.totalViews += 1;
  
  if (this.stats.currentViewers > this.stats.peakViewers) {
    this.stats.peakViewers = this.stats.currentViewers;
  }
  
  // Check if unique viewer
  const existingViewer = this.viewers.find(v => v.user.toString() === userId.toString());
  if (!existingViewer) {
    this.stats.uniqueViewers += 1;
    this.viewers.push({
      user: userId,
      joinedAt: Date.now()
    });
  }
  
  await this.save();
};

// Remove viewer
liveStreamSchema.methods.removeViewer = async function(userId) {
  this.stats.currentViewers = Math.max(0, this.stats.currentViewers - 1);
  
  const viewer = this.viewers.find(v => v.user.toString() === userId.toString());
  if (viewer && !viewer.leftAt) {
    viewer.leftAt = Date.now();
    if (viewer.joinedAt) {
      viewer.watchDuration = Math.floor((viewer.leftAt - viewer.joinedAt) / 1000);
    }
  }
  
  await this.save();
};

// Record error
liveStreamSchema.methods.recordError = async function(errorData) {
  this.errors.push({
    timestamp: Date.now(),
    ...errorData
  });
  
  this.technical.reconnects += 1;
  
  await this.save();
};

// Ban user from chat
liveStreamSchema.methods.banUser = async function(userId) {
  if (!this.moderation.bannedUsers.includes(userId)) {
    this.moderation.bannedUsers.push(userId);
    await this.save();
  }
};

// Static Methods

// Get live streams
liveStreamSchema.statics.getLiveStreams = async function(filters = {}) {
  const query = { status: 'live' };
  
  if (filters.category) query.category = filters.category;
  if (filters.featured) query.featured = true;
  if (filters.language) query.language = filters.language;
  
  return this.find(query)
    .populate('user', 'fullName avatar followers')
    .populate('provider', 'name displayName')
    .sort({ 'stats.currentViewers': -1 })
    .limit(filters.limit || 50);
};

// Get trending streams
liveStreamSchema.statics.getTrending = async function(limit = 10) {
  return this.find({ status: 'live' })
    .populate('user', 'fullName avatar')
    .sort({ 'stats.currentViewers': -1, 'stats.likes': -1 })
    .limit(limit);
};

// Get user's stream history
liveStreamSchema.statics.getUserStreams = async function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

module.exports = { LiveStream };
