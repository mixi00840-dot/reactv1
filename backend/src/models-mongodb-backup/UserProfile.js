const mongoose = require('mongoose');

/**
 * UserProfile Model
 * 
 * Stores user features, preferences, and behavioral signals
 * for personalized content recommendation and feed ranking.
 * 
 * Key Features:
 * - User preference tracking (topics, creators, content types)
 * - Interaction history aggregation
 * - Behavioral features for ML models
 * - A/B test segment assignment
 * - Real-time feature updates
 */

const userProfileSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Content Preferences
  preferences: {
    // Favorite topics
    topics: [{
      name: String,
      score: Number, // Weighted score based on interactions
      lastInteracted: Date
    }],
    
    // Preferred content types
    contentTypes: {
      shortForm: Number, // 0-1 preference score
      longForm: Number,
      educational: Number,
      entertainment: Number,
      music: Number,
      comedy: Number,
      lifestyle: Number
    },
    
    // Preferred creators
    favoriteCreators: [{
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      interactionCount: Number,
      lastInteracted: Date,
      following: Boolean
    }],
    
    // Language preferences
    languages: [{
      code: String,
      preference: Number // 0-1
    }],
    
    // Content attributes
    preferredDuration: {
      min: Number, // seconds
      max: Number,
      avg: Number
    },
    
    lastUpdated: Date
  },
  
  // Behavioral Features
  behavior: {
    // Engagement patterns
    avgSessionLength: {
      type: Number,
      default: 0
    }, // minutes
    
    avgVideosPerSession: {
      type: Number,
      default: 0
    },
    
    avgWatchTime: {
      type: Number,
      default: 0
    }, // percentage of video
    
    completionRate: {
      type: Number,
      default: 0
    }, // 0-1
    
    // Interaction rates
    likeRate: {
      type: Number,
      default: 0
    }, // likes per 100 views
    
    shareRate: {
      type: Number,
      default: 0
    },
    
    commentRate: {
      type: Number,
      default: 0
    },
    
    followRate: {
      type: Number,
      default: 0
    },
    
    // Time patterns
    activeHours: [Number], // Hours when user is most active (0-23)
    activeDays: [Number],  // Days of week (0-6, Sunday=0)
    
    // Content discovery
    exploreUsage: {
      type: Number,
      default: 0
    }, // % time spent in explore vs feed
    
    searchUsage: {
      type: Number,
      default: 0
    },
    
    // Diversity
    diversityScore: {
      type: Number,
      default: 0.5
    }, // 0 (narrow) to 1 (diverse)
    
    lastUpdated: Date
  },
  
  // Interaction History (Aggregated)
  history: {
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
    
    totalComments: {
      type: Number,
      default: 0
    },
    
    totalFollows: {
      type: Number,
      default: 0
    },
    
    // Recent activity (for freshness)
    last24h: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    
    last7d: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    
    last30d: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    
    lastActive: Date
  },
  
  // User Embedding (Learned representation)
  embedding: {
    vector: {
      type: [Number], // 128-256 dimensional user embedding
      default: []
    },
    
    modelVersion: String,
    generatedAt: Date,
    quality: Number // 0-1 confidence
  },
  
  // Personalization Signals
  signals: {
    // Cold start indicator
    isColdStart: {
      type: Boolean,
      default: true
    },
    
    // User sophistication level
    sophistication: {
      type: String,
      enum: ['new', 'casual', 'engaged', 'power'],
      default: 'new'
    },
    
    // Content saturation (how much they've seen)
    saturation: {
      type: Number,
      default: 0
    }, // 0-1
    
    // Churn risk
    churnRisk: {
      type: Number,
      default: 0
    }, // 0-1
    
    // Engagement tier
    engagementTier: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'low'
    }
  },
  
  // A/B Testing
  experiments: {
    // Active experiment segments
    segments: [{
      experimentId: String,
      variantId: String,
      assignedAt: Date,
      active: Boolean
    }],
    
    // Feature flags
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  
  // Demographics
  demographics: {
    ageGroup: String, // '13-17', '18-24', '25-34', etc.
    gender: String,
    country: String,
    city: String,
    timezone: String,
    locale: String
  },
  
  // Feed State
  feedState: {
    lastFeedPosition: {
      type: Number,
      default: 0
    },
    
    lastFeedUpdate: Date,
    
    seenContent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    }],
    
    // Limit seen content array size
    maxSeenContent: {
      type: Number,
      default: 1000
    }
  },
  
  // Model Features (Pre-computed for ML)
  mlFeatures: {
    // Normalized features for quick scoring
    features: {
      type: Map,
      of: Number,
      default: {}
    },
    
    lastComputed: Date,
    version: String
  }
  
}, {
  timestamps: true
});

// Indexes
userProfileSchema.index({ 'signals.sophistication': 1, 'signals.engagementTier': 1 });
userProfileSchema.index({ 'history.lastActive': -1 });
userProfileSchema.index({ 'preferences.topics.name': 1 });
userProfileSchema.index({ 'experiments.segments.experimentId': 1 });

// ============= INSTANCE METHODS =============

/**
 * Update preferences based on interaction
 */
userProfileSchema.methods.updatePreferences = async function(content, interactionType, weight = 1) {
  const RecommendationMetadata = require('./RecommendationMetadata');
  const metadata = await RecommendationMetadata.findOne({ content: content._id });
  
  if (!metadata) return;
  
  // Update topic preferences
  if (metadata.features.topics) {
    for (const topic of metadata.features.topics) {
      const existing = this.preferences.topics.find(t => t.name === topic.name);
      
      if (existing) {
        existing.score += topic.confidence * weight;
        existing.lastInteracted = new Date();
      } else {
        this.preferences.topics.push({
          name: topic.name,
          score: topic.confidence * weight,
          lastInteracted: new Date()
        });
      }
    }
    
    // Keep only top 50 topics
    this.preferences.topics.sort((a, b) => b.score - a.score);
    this.preferences.topics = this.preferences.topics.slice(0, 50);
  }
  
  // Update creator preferences
  const creatorPref = this.preferences.favoriteCreators.find(
    c => c.creator.toString() === content.creator.toString()
  );
  
  if (creatorPref) {
    creatorPref.interactionCount += 1;
    creatorPref.lastInteracted = new Date();
  } else {
    this.preferences.favoriteCreators.push({
      creator: content.creator,
      interactionCount: 1,
      lastInteracted: new Date(),
      following: false
    });
  }
  
  // Keep only top 100 creators
  this.preferences.favoriteCreators.sort((a, b) => b.interactionCount - a.interactionCount);
  this.preferences.favoriteCreators = this.preferences.favoriteCreators.slice(0, 100);
  
  this.preferences.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Update behavioral features
 */
userProfileSchema.methods.updateBehavior = async function(sessionData) {
  // Update averages with exponential moving average
  const alpha = 0.1; // Smoothing factor
  
  if (sessionData.sessionLength) {
    this.behavior.avgSessionLength = 
      alpha * sessionData.sessionLength + (1 - alpha) * this.behavior.avgSessionLength;
  }
  
  if (sessionData.videosWatched) {
    this.behavior.avgVideosPerSession = 
      alpha * sessionData.videosWatched + (1 - alpha) * this.behavior.avgVideosPerSession;
  }
  
  if (sessionData.avgWatchTime !== undefined) {
    this.behavior.avgWatchTime = 
      alpha * sessionData.avgWatchTime + (1 - alpha) * this.behavior.avgWatchTime;
  }
  
  if (sessionData.completionRate !== undefined) {
    this.behavior.completionRate = 
      alpha * sessionData.completionRate + (1 - alpha) * this.behavior.completionRate;
  }
  
  // Update interaction rates (per 100 views)
  if (sessionData.views > 0) {
    this.behavior.likeRate = (this.history.totalLikes / this.history.totalViews) * 100;
    this.behavior.shareRate = (this.history.totalShares / this.history.totalViews) * 100;
    this.behavior.commentRate = (this.history.totalComments / this.history.totalViews) * 100;
  }
  
  this.behavior.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Update history counters
 */
userProfileSchema.methods.recordInteraction = async function(interactionType) {
  // Update totals
  if (interactionType === 'view') this.history.totalViews += 1;
  if (interactionType === 'like') this.history.totalLikes += 1;
  if (interactionType === 'share') this.history.totalShares += 1;
  if (interactionType === 'comment') this.history.totalComments += 1;
  if (interactionType === 'follow') this.history.totalFollows += 1;
  
  // Update time-windowed counters
  if (['view', 'like', 'share'].includes(interactionType)) {
    this.history.last24h[interactionType + 's'] += 1;
    this.history.last7d[interactionType + 's'] += 1;
    this.history.last30d[interactionType + 's'] += 1;
  }
  
  this.history.lastActive = new Date();
  
  // Update cold start flag
  if (this.history.totalViews > 10) {
    this.signals.isColdStart = false;
  }
  
  // Update sophistication level
  if (this.history.totalViews > 1000) {
    this.signals.sophistication = 'power';
  } else if (this.history.totalViews > 100) {
    this.signals.sophistication = 'engaged';
  } else if (this.history.totalViews > 10) {
    this.signals.sophistication = 'casual';
  }
  
  await this.save();
};

/**
 * Check if content was seen
 */
userProfileSchema.methods.hasSeen = function(contentId) {
  return this.feedState.seenContent.includes(contentId);
};

/**
 * Mark content as seen
 */
userProfileSchema.methods.markAsSeen = async function(contentId) {
  if (!this.hasSeen(contentId)) {
    this.feedState.seenContent.push(contentId);
    
    // Limit array size
    if (this.feedState.seenContent.length > this.feedState.maxSeenContent) {
      this.feedState.seenContent.shift();
    }
    
    await this.save();
  }
};

/**
 * Get personalization features for ML model
 */
userProfileSchema.methods.getMLFeatures = function() {
  return {
    // User sophistication
    isColdStart: this.signals.isColdStart ? 1 : 0,
    sophisticationNew: this.signals.sophistication === 'new' ? 1 : 0,
    sophisticationCasual: this.signals.sophistication === 'casual' ? 1 : 0,
    sophisticationEngaged: this.signals.sophistication === 'engaged' ? 1 : 0,
    sophisticationPower: this.signals.sophistication === 'power' ? 1 : 0,
    
    // Engagement
    totalViews: Math.log(this.history.totalViews + 1),
    totalLikes: Math.log(this.history.totalLikes + 1),
    totalShares: Math.log(this.history.totalShares + 1),
    likeRate: this.behavior.likeRate,
    shareRate: this.behavior.shareRate,
    commentRate: this.behavior.commentRate,
    
    // Watch behavior
    avgWatchTime: this.behavior.avgWatchTime,
    completionRate: this.behavior.completionRate,
    avgSessionLength: this.behavior.avgSessionLength,
    
    // Diversity
    diversityScore: this.behavior.diversityScore,
    
    // Activity
    viewsLast24h: this.history.last24h.views,
    viewsLast7d: this.history.last7d.views,
    
    // Churn risk
    churnRisk: this.signals.churnRisk
  };
};

// ============= STATIC METHODS =============

/**
 * Get or create profile for user
 */
userProfileSchema.statics.getOrCreate = async function(userId) {
  let profile = await this.findOne({ user: userId });
  
  if (!profile) {
    profile = new this({
      user: userId,
      signals: {
        isColdStart: true,
        sophistication: 'new'
      }
    });
    
    await profile.save();
  }
  
  return profile;
};

/**
 * Get users in experiment
 */
userProfileSchema.statics.getUsersInExperiment = async function(experimentId) {
  return this.find({
    'experiments.segments.experimentId': experimentId,
    'experiments.segments.active': true
  });
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
