const mongoose = require('mongoose');

/**
 * Sound Model - Music/Audio library for content
 * Supports original sounds, licensed tracks, and partner catalogs
 */
const soundSchema = new mongoose.Schema({
  soundId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Basic information
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  
  artist: {
    type: String,
    trim: true,
    index: 'text'
  },
  
  album: {
    type: String,
    trim: true
  },
  
  // Source type
  sourceType: {
    type: String,
    enum: ['original', 'upload', 'licensed', 'partner', 'ugc', 'royalty_free'],
    required: true,
    index: true
  },
  
  // Creator (for original/upload)
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // File information
  duration: {
    type: Number,
    required: true // seconds
  },
  
  fileUrl: {
    type: String,
    required: true
  },
  
  fileKey: {
    type: String // S3 key
  },
  
  waveformUrl: String, // visual waveform image
  
  coverArt: {
    url: String,
    key: String
  },
  
  // Audio metadata
  metadata: {
    format: String, // mp3, aac, wav
    bitrate: Number,
    sampleRate: Number,
    channels: Number,
    size: Number, // bytes
    codec: String,
    
    // Music metadata
    genre: [String],
    mood: [String], // happy, sad, energetic, calm
    tempo: Number, // BPM
    key: String, // C major, A minor
    language: String,
    explicit: {
      type: Boolean,
      default: false
    },
    
    // ISRC code (International Standard Recording Code)
    isrc: String,
    
    // Audio fingerprint for matching
    fingerprint: {
      chromaprint: String, // AcoustID
      echoprint: String,
      hash: String
    }
  },
  
  // Rights and licensing
  rightsInfo: {
    // Copyright holder
    copyrightHolder: String,
    publishingRights: String,
    
    // License type
    licenseType: {
      type: String,
      enum: ['full_rights', 'licensed', 'royalty_free', 'creative_commons', 'public_domain', 'restricted']
    },
    
    // License terms
    licensedFrom: String, // partner name
    licenseStartDate: Date,
    licenseEndDate: Date,
    
    // Geographic restrictions
    allowedCountries: [String], // ISO codes, empty = all
    restrictedCountries: [String],
    
    // Usage restrictions
    commercialUse: {
      type: Boolean,
      default: false
    },
    requiresAttribution: {
      type: Boolean,
      default: false
    },
    attributionText: String,
    
    // Royalty information
    royaltyType: {
      type: String,
      enum: ['none', 'per_play', 'per_sale', 'revenue_share']
    },
    royaltyRate: Number, // percentage or fixed amount
    minimumRoyalty: Number,
    
    // Claims and disputes
    hasClaims: {
      type: Boolean,
      default: false
    },
    claims: [{
      claimId: String,
      claimant: String,
      claimDate: Date,
      status: String,
      resolution: String
    }]
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
    index: true
  },
  
  stats: {
    totalPlays: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalShares: {
      type: Number,
      default: 0
    },
    uniqueCreators: {
      type: Number,
      default: 0
    },
    
    // Trending metrics
    growthRate: Number, // percentage
    viralityScore: Number,
    trendingRank: Number,
    
    // Time-based stats
    last24hVideos: {
      type: Number,
      default: 0
    },
    last7dVideos: {
      type: Number,
      default: 0
    },
    last30dVideos: {
      type: Number,
      default: 0
    }
  },
  
  // Revenue tracking (for licensed/partner content)
  revenue: {
    totalEarned: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    pendingPayment: {
      type: Number,
      default: 0
    },
    lastPaymentDate: Date,
    
    breakdown: [{
      period: String, // '2025-10'
      plays: Number,
      earnings: Number,
      paid: Boolean
    }]
  },
  
  // Status and availability
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_review', 'blocked', 'removed', 'expired'],
    default: 'active',
    index: true
  },
  
  availability: {
    startDate: Date,
    endDate: Date,
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  
  // Moderation
  moderation: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    
    copyrightClaimed: {
      type: Boolean,
      default: false
    }
  },
  
  // Featured/Promoted
  featured: {
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    featuredCategory: String,
    featuredUntil: Date
  },
  
  // Discovery and tags
  tags: [{
    type: String,
    lowercase: true
  }],
  
  categories: [{
    type: String,
    enum: [
      'pop', 'rock', 'hip_hop', 'electronic', 'classical', 'jazz', 'country',
      'r&b', 'latin', 'indie', 'folk', 'metal', 'reggae', 'blues', 'soul',
      'dance', 'house', 'techno', 'dubstep', 'ambient', 'world', 'soundtrack',
      'comedy', 'podcast', 'other'
    ]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
soundSchema.index({ title: 'text', artist: 'text' });
soundSchema.index({ 'stats.totalVideos': -1 });
soundSchema.index({ 'stats.trendingRank': 1 });
soundSchema.index({ creatorId: 1, createdAt: -1 });
soundSchema.index({ sourceType: 1, status: 1 });
soundSchema.index({ categories: 1, 'stats.totalVideos': -1 });

// Virtual: is sound available for use
soundSchema.virtual('isUsable').get(function() {
  if (this.status !== 'active') return false;
  if (!this.availability.isAvailable) return false;
  if (this.moderation.copyrightClaimed) return false;
  
  const now = new Date();
  if (this.availability.startDate && now < this.availability.startDate) return false;
  if (this.availability.endDate && now > this.availability.endDate) return false;
  
  return true;
});

// Virtual: trending status
soundSchema.virtual('isTrending').get(function() {
  return this.stats.trendingRank && this.stats.trendingRank <= 50;
});

// Pre-save: generate soundId
soundSchema.pre('save', function(next) {
  if (!this.soundId) {
    this.soundId = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method: increment usage count
soundSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.stats.totalVideos += 1;
  await this.save();
};

// Method: update stats from content metrics
soundSchema.methods.updateStats = async function(metricsUpdate) {
  Object.assign(this.stats, metricsUpdate);
  await this.save();
};

// Method: calculate royalty for a period
soundSchema.methods.calculateRoyalty = function(plays) {
  if (!this.rightsInfo.royaltyType || this.rightsInfo.royaltyType === 'none') {
    return 0;
  }
  
  let royalty = 0;
  
  switch (this.rightsInfo.royaltyType) {
    case 'per_play':
      royalty = plays * (this.rightsInfo.royaltyRate || 0);
      break;
    case 'revenue_share':
      // Would need video revenue data
      royalty = 0; // Placeholder
      break;
    default:
      royalty = 0;
  }
  
  if (this.rightsInfo.minimumRoyalty && royalty < this.rightsInfo.minimumRoyalty) {
    royalty = this.rightsInfo.minimumRoyalty;
  }
  
  return royalty;
};

// Method: check geographic availability
soundSchema.methods.isAvailableInCountry = function(countryCode) {
  if (!countryCode) return true;
  
  if (this.rightsInfo.restrictedCountries?.includes(countryCode)) {
    return false;
  }
  
  if (this.rightsInfo.allowedCountries?.length > 0) {
    return this.rightsInfo.allowedCountries.includes(countryCode);
  }
  
  return true;
};

// Static: Get trending sounds
soundSchema.statics.getTrending = async function(options = {}) {
  const {
    timeWindow = 7, // days
    limit = 50,
    category
  } = options;
  
  const query = {
    status: 'active',
    'availability.isAvailable': true
  };
  
  if (category) query.categories = category;
  
  return this.find(query)
    .sort({ 'stats.trendingRank': 1, 'stats.last7dVideos': -1 })
    .limit(limit)
    .populate('creatorId', 'username fullName profilePicture verified')
    .lean();
};

// Static: Search sounds
soundSchema.statics.searchSounds = async function(searchTerm, options = {}) {
  const {
    limit = 20,
    skip = 0,
    category,
    mood
  } = options;
  
  const query = {
    status: 'active',
    'availability.isAvailable': true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { artist: { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (category) query.categories = category;
  if (mood) query['metadata.mood'] = mood;
  
  return this.find(query)
    .sort({ 'stats.totalVideos': -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static: Get featured sounds
soundSchema.statics.getFeatured = async function(limit = 20) {
  return this.find({
    'featured.isFeatured': true,
    status: 'active',
    'availability.isAvailable': true,
    'featured.featuredUntil': { $gte: new Date() }
  })
    .sort({ 'featured.featuredUntil': -1 })
    .limit(limit)
    .lean();
};

// Static: Get sounds by creator
soundSchema.statics.getByCreator = async function(creatorId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({
    creatorId,
    status: 'active'
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const Sound = mongoose.model('Sound', soundSchema);

module.exports = Sound;
