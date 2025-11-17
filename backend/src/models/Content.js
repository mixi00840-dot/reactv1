const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  // Creator
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Content Type
  type: {
    type: String,
    enum: ['video', 'image', 'text', 'live'],
    default: 'video',
    required: true
  },

  // Post Type - determines which tab/feed it appears in
  postType: {
    type: String,
    enum: ['feed', 'post'],
    default: 'feed'
  },

  // Media Files
  videoUrl: String,
  thumbnailUrl: String,
  imageUrls: [String],
  duration: Number, // in seconds

  // Content Details
  caption: {
    type: String,
    maxlength: 2200
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    name: String,
    latitude: Number,
    longitude: Number
  },

  // Audio/Sound
  soundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sound'
  },
  originalSound: {
    type: Boolean,
    default: false
  },

  // Privacy & Permissions
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowDuet: {
    type: Boolean,
    default: true
  },
  allowStitch: {
    type: Boolean,
    default: true
  },
  allowDownload: {
    type: Boolean,
    default: true
  },

  // Status & Moderation
  status: {
    type: String,
    enum: ['draft', 'processing', 'active', 'removed', 'reported', 'archived'],
    default: 'processing',
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,

  // Engagement Metrics (denormalized)
  viewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueViewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  sharesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  savesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  duetsCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Video Processing
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,
  qualities: [{
    resolution: String, // '1080p', '720p', '480p', '360p'
    url: String,
    size: Number, // bytes
    bitrate: Number
  }],

  // Analytics
  avgWatchTime: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  impressions: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0
  },

  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [String],

  // AI Features
  embeddings: {
    type: [Number],
    default: undefined,
    index: false // Don't index large arrays
  },
  moderationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  feedScore: {
    type: Number,
    default: 0,
    index: true // For efficient feed ranking
  },
  aiTags: [{
    type: String,
    lowercase: true
  }],
  aiCaption: String,

  // Related Content
  originalContentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  isDuet: {
    type: Boolean,
    default: false
  },
  isStitch: {
    type: Boolean,
    default: false
  },

  // Moderation
  reportCount: {
    type: Number,
    default: 0
  },
  moderationScore: Number,
  moderationFlags: [String],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,

  // Timestamps
  publishedAt: Date,
  scheduledFor: Date,
  lastViewedAt: Date,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes
ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ status: 1, publishedAt: -1 });
ContentSchema.index({ status: 1, viewsCount: -1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ publishedAt: -1 });
ContentSchema.index({ hashtags: 1 });
ContentSchema.index({ soundId: 1 });

// Text index for search
ContentSchema.index({
  caption: 'text',
  hashtags: 'text'
});

// Indexes for performance
ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ status: 1, createdAt: -1 });
ContentSchema.index({ hashtags: 1, createdAt: -1 });
ContentSchema.index({ 'soundId': 1 });
ContentSchema.index({ viewsCount: -1, likesCount: -1 }); // For trending
ContentSchema.index({ feedScore: -1, createdAt: -1 }); // For AI-ranked feed
ContentSchema.index({ moderationScore: 1 }); // For moderation filtering

// Virtual for engagement rate
ContentSchema.virtual('engagementRate').get(function() {
  if (this.viewsCount === 0) return 0;
  const engagement = this.likesCount + this.commentsCount + this.sharesCount;
  return ((engagement / this.viewsCount) * 100).toFixed(2);
});

// Virtual for is trending
ContentSchema.virtual('isTrending').get(function() {
  // Content is trending if it has high engagement in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo && this.viewsCount > 10000;
});

// Static method to find trending content
ContentSchema.statics.findTrending = function(limit = 20) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.find({
    status: 'active',
    createdAt: { $gte: oneDayAgo },
    viewsCount: { $gte: 1000 }
  })
  .sort({ viewsCount: -1, likesCount: -1 })
  .limit(limit)
  .populate('userId', 'username fullName avatar isVerified');
};

// Static method to find by hashtag
ContentSchema.statics.findByHashtag = function(hashtag, limit = 20) {
  return this.find({
    status: 'active',
    hashtags: hashtag.toLowerCase()
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'username fullName avatar isVerified');
};

// Method to increment view count
ContentSchema.methods.incrementViews = async function(isUnique = false) {
  this.viewsCount += 1;
  if (isUnique) {
    this.uniqueViewsCount += 1;
  }
  this.lastViewedAt = new Date();
  return this.save();
};

// Method to increment engagement
ContentSchema.methods.incrementEngagement = async function(type) {
  const field = `${type}Count`;
  if (this[field] !== undefined) {
    this[field] += 1;
    return this.save();
  }
};

const Content = mongoose.model('Content', ContentSchema);

module.exports = Content;

