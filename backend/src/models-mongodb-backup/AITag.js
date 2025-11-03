const mongoose = require('mongoose');

/**
 * AI Content Tagging Model
 * 
 * Automatically tags content using AI/ML for categorization,
 * search optimization, and content discovery.
 */

const aiTagSchema = new mongoose.Schema({
  tagId: {
    type: String,
    required: true,
    unique: true,
    default: () => `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Content Reference
  contentType: {
    type: String,
    enum: ['video', 'image', 'audio', 'livestream', 'story', 'product'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  
  // AI-Generated Tags
  categories: [{
    name: String,
    confidence: { type: Number, min: 0, max: 1 }, // 0-1 confidence score
    source: { type: String, enum: ['ai', 'manual', 'hybrid'], default: 'ai' }
  }],
  
  // Object Detection
  objects: [{
    label: String,
    confidence: { type: Number, min: 0, max: 1 },
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    timestamp: Number // For video, timestamp in seconds
  }],
  
  // Scene Analysis
  scenes: [{
    sceneType: String, // indoor, outdoor, nature, urban, etc.
    timestamp: Number, // For video
    duration: Number,
    confidence: Number,
    description: String,
    dominantColors: [String],
    mood: String // happy, sad, energetic, calm, etc.
  }],
  
  // Text Recognition (OCR)
  textContent: [{
    text: String,
    language: String,
    confidence: Number,
    location: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    timestamp: Number // For video
  }],
  
  // Audio Analysis (for videos)
  audioFeatures: {
    hasMusic: Boolean,
    musicGenre: [String],
    hasSpeech: Boolean,
    language: String,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed']
    },
    emotions: [{
      emotion: String,
      confidence: Number,
      timestamp: Number
    }],
    transcription: String
  },
  
  // Visual Features
  visualFeatures: {
    dominantColors: [{
      color: String, // hex code
      percentage: Number
    }],
    brightness: { type: Number, min: 0, max: 100 },
    contrast: { type: Number, min: 0, max: 100 },
    sharpness: { type: Number, min: 0, max: 100 },
    isBlurry: Boolean,
    hasWatermark: Boolean,
    aspectRatio: String,
    resolution: {
      width: Number,
      height: Number
    }
  },
  
  // Face Detection & Analysis
  faces: [{
    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'unknown'] },
    emotions: [{
      emotion: String,
      confidence: Number
    }],
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    landmarks: mongoose.Schema.Types.Mixed, // Facial landmarks
    timestamp: Number // For video
  }],
  
  // Content Classification
  classification: {
    contentRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'unrated'],
      default: 'unrated'
    },
    isNSFW: { type: Boolean, default: false },
    nsfwScore: { type: Number, min: 0, max: 1, default: 0 },
    isSpam: { type: Boolean, default: false },
    spamScore: { type: Number, min: 0, max: 1, default: 0 },
    quality: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    qualityScore: { type: Number, min: 0, max: 100 }
  },
  
  // Search Optimization
  searchKeywords: [String],
  suggestedTags: [String],
  relatedTopics: [String],
  
  // AI Model Info
  aiModel: {
    name: String,
    version: String,
    provider: String, // e.g., 'tensorflow', 'aws-rekognition', 'google-vision'
    processedAt: { type: Date, default: Date.now }
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
    default: 'pending'
  },
  processingTime: Number, // in milliseconds
  errorMessage: String,
  
  // Manual Review & Corrections
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  manualCorrections: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    correctedAt: { type: Date, default: Date.now },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Confidence Metrics
  overallConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  needsReview: {
    type: Boolean,
    default: false
  },
  
  // Usage Stats
  stats: {
    searchImpact: { type: Number, default: 0 }, // How much this improved searchability
    clickThroughRate: { type: Number, default: 0 },
    engagementBoost: { type: Number, default: 0 }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
aiTagSchema.index({ contentType: 1, contentId: 1 });
aiTagSchema.index({ status: 1 });
aiTagSchema.index({ 'classification.isNSFW': 1 });
aiTagSchema.index({ 'classification.isSpam': 1 });
aiTagSchema.index({ searchKeywords: 1 });
aiTagSchema.index({ 'categories.name': 1 });
aiTagSchema.index({ needsReview: 1 });
aiTagSchema.index({ createdAt: -1 });

// Virtual for content reference
aiTagSchema.virtual('content', {
  refPath: 'contentType',
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

// Instance Methods

/**
 * Calculate overall confidence score
 */
aiTagSchema.methods.calculateConfidence = function() {
  const scores = [];
  
  // Category confidence
  if (this.categories && this.categories.length > 0) {
    const avgCategoryConfidence = this.categories.reduce((sum, cat) => sum + cat.confidence, 0) / this.categories.length;
    scores.push(avgCategoryConfidence);
  }
  
  // Object detection confidence
  if (this.objects && this.objects.length > 0) {
    const avgObjectConfidence = this.objects.reduce((sum, obj) => sum + obj.confidence, 0) / this.objects.length;
    scores.push(avgObjectConfidence);
  }
  
  // Scene analysis confidence
  if (this.scenes && this.scenes.length > 0) {
    const avgSceneConfidence = this.scenes.reduce((sum, scene) => sum + scene.confidence, 0) / this.scenes.length;
    scores.push(avgSceneConfidence);
  }
  
  // Calculate average
  if (scores.length > 0) {
    this.overallConfidence = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  // Flag for review if confidence is low
  this.needsReview = this.overallConfidence < 0.6;
  
  return this.overallConfidence;
};

/**
 * Add manual correction
 */
aiTagSchema.methods.addCorrection = function(field, oldValue, newValue, userId) {
  this.manualCorrections.push({
    field,
    oldValue,
    newValue,
    correctedBy: userId
  });
  
  // Update the field
  if (field.includes('.')) {
    const parts = field.split('.');
    let obj = this;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = newValue;
  } else {
    this[field] = newValue;
  }
  
  return this.save();
};

/**
 * Mark as reviewed
 */
aiTagSchema.methods.markReviewed = function(userId) {
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.needsReview = false;
  return this.save();
};

/**
 * Generate search keywords from all tags
 */
aiTagSchema.methods.generateSearchKeywords = function() {
  const keywords = new Set();
  
  // Add categories
  if (this.categories) {
    this.categories.forEach(cat => {
      keywords.add(cat.name.toLowerCase());
    });
  }
  
  // Add objects
  if (this.objects) {
    this.objects.forEach(obj => {
      keywords.add(obj.label.toLowerCase());
    });
  }
  
  // Add scene types
  if (this.scenes) {
    this.scenes.forEach(scene => {
      keywords.add(scene.sceneType.toLowerCase());
      if (scene.mood) keywords.add(scene.mood.toLowerCase());
    });
  }
  
  // Add text content
  if (this.textContent) {
    this.textContent.forEach(text => {
      text.text.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 3) keywords.add(word);
      });
    });
  }
  
  // Add audio features
  if (this.audioFeatures && this.audioFeatures.musicGenre) {
    this.audioFeatures.musicGenre.forEach(genre => {
      keywords.add(genre.toLowerCase());
    });
  }
  
  this.searchKeywords = Array.from(keywords);
  return this.searchKeywords;
};

// Static Methods

/**
 * Get tags for content
 */
aiTagSchema.statics.getTagsForContent = function(contentType, contentId) {
  return this.findOne({ contentType, contentId })
    .populate('reviewedBy', 'username fullName');
};

/**
 * Get content needing review
 */
aiTagSchema.statics.getContentNeedingReview = function(limit = 50) {
  return this.find({ needsReview: true, status: 'completed' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('content');
};

/**
 * Get NSFW content
 */
aiTagSchema.statics.getNSFWContent = function(minScore = 0.7) {
  return this.find({
    'classification.isNSFW': true,
    'classification.nsfwScore': { $gte: minScore }
  }).populate('content');
};

/**
 * Get spam content
 */
aiTagSchema.statics.getSpamContent = function(minScore = 0.7) {
  return this.find({
    'classification.isSpam': true,
    'classification.spamScore': { $gte: minScore }
  }).populate('content');
};

/**
 * Search by keywords
 */
aiTagSchema.statics.searchByKeywords = function(keywords, contentType = null) {
  const query = {
    searchKeywords: { $in: keywords.map(k => k.toLowerCase()) }
  };
  
  if (contentType) {
    query.contentType = contentType;
  }
  
  return this.find(query)
    .sort({ overallConfidence: -1 })
    .populate('content');
};

/**
 * Get trending tags
 */
aiTagSchema.statics.getTrendingTags = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: date },
        status: 'completed'
      }
    },
    {
      $unwind: '$categories'
    },
    {
      $group: {
        _id: '$categories.name',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$categories.confidence' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 50
    }
  ]);
};

/**
 * Get processing statistics
 */
aiTagSchema.statics.getProcessingStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

const AITag = mongoose.model('AITag', aiTagSchema);

module.exports = AITag;
