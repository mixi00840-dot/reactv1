const mongoose = require('mongoose');

/**
 * RecommendationMetadata Model
 * 
 * Stores content embeddings, user interaction history, and preference signals
 * for powering personalized recommendations through candidate generation.
 * 
 * Key Features:
 * - Content embeddings (video, audio, text features)
 * - User interaction tracking (views, likes, shares, watch time)
 * - Collaborative filtering signals
 * - Content-based filtering features
 * - Real-time feature updates
 * - ANN (Approximate Nearest Neighbor) indexing support
 */

const recommendationMetadataSchema = new mongoose.Schema({
  // Content Reference
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    unique: true,
    index: true
  },
  
  // Content Embeddings (Feature Vectors)
  embeddings: {
    // Visual embeddings from video frames (ResNet, VGG, etc.)
    visual: {
      type: [Number], // 512-1024 dimensional vector
      default: []
    },
    
    // Audio embeddings from sound (VGGish, OpenL3, etc.)
    audio: {
      type: [Number], // 128-512 dimensional vector
      default: []
    },
    
    // Text embeddings from caption/title (BERT, Sentence Transformers)
    text: {
      type: [Number], // 384-768 dimensional vector
      default: []
    },
    
    // Combined multimodal embedding
    combined: {
      type: [Number], // Concatenated or fused vector
      default: []
    },
    
    // Embedding generation metadata
    modelVersion: String,
    generatedAt: Date,
    quality: Number // 0-1 confidence score
  },
  
  // Content Features (Structured)
  features: {
    // Category/Topic signals
    topics: [{
      name: String,
      confidence: Number
    }],
    
    hashtags: [String],
    
    // Visual features
    colors: [{
      hex: String,
      dominance: Number // 0-1
    }],
    
    brightness: Number, // 0-1
    contrast: Number, // 0-1
    motionLevel: String, // 'static', 'low', 'medium', 'high'
    
    // Audio features
    tempo: Number, // BPM
    energy: Number, // 0-1
    valence: Number, // 0-1 (sad to happy)
    
    // Content attributes
    duration: Number, // seconds
    aspectRatio: String,
    hasCaption: Boolean,
    language: String,
    
    // Creator signals
    creatorFollowers: Number,
    creatorVerified: Boolean,
    creatorTier: String // 'new', 'rising', 'established', 'star'
  },
  
  // Interaction Signals (Aggregated)
  signals: {
    // Engagement metrics
    views: {
      type: Number,
      default: 0
    },
    
    likes: {
      type: Number,
      default: 0
    },
    
    shares: {
      type: Number,
      default: 0
    },
    
    comments: {
      type: Number,
      default: 0
    },
    
    saves: {
      type: Number,
      default: 0
    },
    
    // Watch time metrics
    avgWatchTime: {
      type: Number,
      default: 0
    }, // seconds
    
    completionRate: {
      type: Number,
      default: 0
    }, // 0-1
    
    // Velocity (trending signals)
    viewsLastHour: {
      type: Number,
      default: 0
    },
    
    viewsLast24h: {
      type: Number,
      default: 0
    },
    
    viewsLast7d: {
      type: Number,
      default: 0
    },
    
    // Engagement rate
    engagementRate: {
      type: Number,
      default: 0
    }, // (likes + shares + comments) / views
    
    // Quality scores
    qualityScore: {
      type: Number,
      default: 0
    }, // 0-100
    
    viralityScore: {
      type: Number,
      default: 0
    }, // 0-100
    
    // Freshness
    freshness: {
      type: Number,
      default: 1
    }, // Decay function: 1 (new) → 0 (old)
    
    lastUpdated: Date
  },
  
  // User Interaction History (Sampled for efficiency)
  userInteractions: {
    // Recent viewers (for collaborative filtering)
    recentViewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date,
      watchTime: Number,
      completed: Boolean
    }],
    
    // Users who liked
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // Users who shared
    sharedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    maxSampleSize: {
      type: Number,
      default: 1000
    } // Limit array growth
  },
  
  // Collaborative Filtering Features
  collaborative: {
    // Similar content (co-viewed)
    similarContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      similarity: Number, // 0-1
      coViewCount: Number
    }],
    
    // Users with similar taste
    similarUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      similarity: Number // 0-1
    }],
    
    lastUpdated: Date
  },
  
  // Audience Demographics
  demographics: {
    ageGroups: [{
      range: String, // '13-17', '18-24', '25-34', etc.
      percentage: Number
    }],
    
    genderDistribution: {
      male: Number,
      female: Number,
      other: Number
    },
    
    topCountries: [{
      code: String, // ISO country code
      percentage: Number
    }],
    
    lastUpdated: Date
  },
  
  // Performance Segments
  segments: {
    trending: Boolean,
    viral: Boolean,
    rising: Boolean,
    evergreen: Boolean,
    
    audienceType: String, // 'niche', 'broad', 'mass'
    contentTier: String // 'discovery', 'popular', 'viral'
  },
  
  // Indexing Metadata (for ANN search)
  indexing: {
    indexed: {
      type: Boolean,
      default: false
    },
    
    indexedAt: Date,
    
    // Index IDs in external systems (Faiss, Annoy, Milvus)
    externalIds: {
      faiss: String,
      annoy: String,
      milvus: String
    },
    
    needsReindex: {
      type: Boolean,
      default: false
    }
  },
  
  // Cache for quick retrieval
  cache: {
    score: Number, // Pre-computed base score
    rank: Number,  // Global ranking position
    lastComputed: Date,
    ttl: Number    // Seconds until re-computation needed
  }
  
}, {
  timestamps: true
});

// Indexes for efficient querying
recommendationMetadataSchema.index({ 'signals.qualityScore': -1, 'signals.freshness': -1 });
recommendationMetadataSchema.index({ 'signals.viralityScore': -1 });
recommendationMetadataSchema.index({ 'signals.viewsLast24h': -1 });
recommendationMetadataSchema.index({ 'segments.trending': 1, 'signals.qualityScore': -1 });
recommendationMetadataSchema.index({ 'features.topics.name': 1 });
recommendationMetadataSchema.index({ 'features.hashtags': 1 });
recommendationMetadataSchema.index({ 'indexing.indexed': 1, 'indexing.needsReindex': 1 });

// ============= INSTANCE METHODS =============

/**
 * Update interaction signals from ContentMetrics
 */
recommendationMetadataSchema.methods.updateSignals = async function(metrics) {
  this.signals.views = metrics.totalViews || 0;
  this.signals.likes = metrics.totalLikes || 0;
  this.signals.shares = metrics.totalShares || 0;
  this.signals.comments = metrics.totalComments || 0;
  this.signals.saves = metrics.totalBookmarks || 0;
  
  this.signals.avgWatchTime = metrics.avgWatchTime || 0;
  this.signals.completionRate = metrics.completionRate || 0;
  
  this.signals.viewsLastHour = metrics.viewsLastHour || 0;
  this.signals.viewsLast24h = metrics.viewsLast24Hours || 0;
  this.signals.viewsLast7d = metrics.viewsLast7Days || 0;
  
  this.signals.engagementRate = metrics.engagementRate || 0;
  this.signals.qualityScore = metrics.qualityScore || 0;
  this.signals.viralityScore = metrics.viralityScore || 0;
  
  // Calculate freshness decay
  const ageHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  this.signals.freshness = Math.exp(-ageHours / 48); // 48-hour half-life
  
  this.signals.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Add user interaction for collaborative filtering
 */
recommendationMetadataSchema.methods.addInteraction = async function(userId, type, data = {}) {
  // Add to recent viewers (with size limit)
  if (type === 'view') {
    this.userInteractions.recentViewers.push({
      user: userId,
      timestamp: new Date(),
      watchTime: data.watchTime || 0,
      completed: data.completed || false
    });
    
    // Keep only recent N viewers
    if (this.userInteractions.recentViewers.length > this.userInteractions.maxSampleSize) {
      this.userInteractions.recentViewers.shift();
    }
  }
  
  // Track likes
  if (type === 'like' && !this.userInteractions.likedBy.includes(userId)) {
    this.userInteractions.likedBy.push(userId);
  }
  
  // Track shares
  if (type === 'share' && !this.userInteractions.sharedBy.includes(userId)) {
    this.userInteractions.sharedBy.push(userId);
  }
  
  await this.save();
};

/**
 * Update collaborative filtering data
 */
recommendationMetadataSchema.methods.updateCollaborative = async function(similarContent, similarUsers) {
  this.collaborative.similarContent = similarContent.map(item => ({
    contentId: item.contentId,
    similarity: item.similarity,
    coViewCount: item.coViewCount || 0
  }));
  
  this.collaborative.similarUsers = similarUsers.map(item => ({
    userId: item.userId,
    similarity: item.similarity
  }));
  
  this.collaborative.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Mark for reindexing
 */
recommendationMetadataSchema.methods.markForReindex = async function() {
  this.indexing.needsReindex = true;
  await this.save();
};

/**
 * Confirm indexed
 */
recommendationMetadataSchema.methods.confirmIndexed = async function(externalIds = {}) {
  this.indexing.indexed = true;
  this.indexing.indexedAt = new Date();
  this.indexing.needsReindex = false;
  
  if (externalIds.faiss) this.indexing.externalIds.faiss = externalIds.faiss;
  if (externalIds.annoy) this.indexing.externalIds.annoy = externalIds.annoy;
  if (externalIds.milvus) this.indexing.externalIds.milvus = externalIds.milvus;
  
  await this.save();
};

// ============= STATIC METHODS =============

/**
 * Get top trending content
 */
recommendationMetadataSchema.statics.getTrending = async function(limit = 50) {
  return this.find({
    'segments.trending': true
  })
  .sort({ 'signals.viralityScore': -1, 'signals.viewsLast24h': -1 })
  .limit(limit)
  .populate('content', 'title creator videoUrl thumbnailUrl');
};

/**
 * Get content needing reindexing
 */
recommendationMetadataSchema.statics.getNeedingReindex = async function(limit = 100) {
  return this.find({
    $or: [
      { 'indexing.indexed': false },
      { 'indexing.needsReindex': true }
    ]
  })
  .limit(limit)
  .populate('content');
};

/**
 * Find similar content by embedding
 */
recommendationMetadataSchema.statics.findSimilarByEmbedding = async function(embedding, limit = 20) {
  // In production, use ANN index (Faiss, Annoy, Milvus)
  // This is a simplified version using collaborative signals
  
  return this.find({
    'indexing.indexed': true
  })
  .sort({ 'signals.qualityScore': -1 })
  .limit(limit * 3) // Over-fetch for filtering
  .populate('content');
};

/**
 * Get candidates by topics
 */
recommendationMetadataSchema.statics.getCandidatesByTopics = async function(topics, limit = 50) {
  return this.find({
    'features.topics.name': { $in: topics }
  })
  .sort({ 'signals.qualityScore': -1, 'signals.freshness': -1 })
  .limit(limit)
  .populate('content');
};

/**
 * Get candidates by hashtags
 */
recommendationMetadataSchema.statics.getCandidatesByHashtags = async function(hashtags, limit = 50) {
  return this.find({
    'features.hashtags': { $in: hashtags }
  })
  .sort({ 'signals.engagementRate': -1 })
  .limit(limit)
  .populate('content');
};

/**
 * Bulk update signals from metrics
 */
recommendationMetadataSchema.statics.bulkUpdateSignals = async function(contentIds) {
  const ContentMetrics = require('./ContentMetrics');
  
  for (const contentId of contentIds) {
    const metadata = await this.findOne({ content: contentId });
    const metrics = await ContentMetrics.findOne({ content: contentId });
    
    if (metadata && metrics) {
      await metadata.updateSignals(metrics);
    }
  }
};

module.exports = mongoose.model('RecommendationMetadata', recommendationMetadataSchema);
