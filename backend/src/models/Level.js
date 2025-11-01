const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  minXP: {
    type: Number,
    required: true,
    min: 0
  },
  maxXP: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    maxlength: 200
  },
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i,
    default: '#007bff'
  },
  icon: {
    type: String,
    default: null
  },
  badge: {
    type: String,
    default: null
  },
  privileges: [{
    type: String,
    enum: [
      'basic_upload',
      'hd_upload',
      '4k_upload',
      'live_streaming',
      'multiple_streams',
      'custom_thumbnails',
      'advanced_analytics',
      'monetization',
      'verified_badge',
      'priority_support',
      'beta_features',
      'custom_effects',
      'collaboration_tools'
    ]
  }],
  rewards: {
    coins: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    gifts: [{ 
      giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift' },
      quantity: { type: Number, default: 1 }
    }],
    customization: {
      profileFrames: [String],
      chatBubbles: [String],
      entryEffects: [String]
    }
  },
  requirements: {
    videosPosted: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    viewsReceived: { type: Number, default: 0 },
    streamsCompleted: { type: Number, default: 0 },
    giftsReceived: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
levelSchema.index({ level: 1 });
levelSchema.index({ minXP: 1, maxXP: 1 });
levelSchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for XP range
levelSchema.virtual('xpRange').get(function() {
  return this.maxXP - this.minXP;
});

// Virtual for next level
levelSchema.virtual('nextLevel').get(function() {
  return this.level + 1;
});

// Methods
levelSchema.methods.canUserAccess = function(userXP) {
  return userXP >= this.minXP && userXP <= this.maxXP;
};

levelSchema.methods.getProgressToNext = function(userXP) {
  if (userXP < this.minXP) return 0;
  if (userXP >= this.maxXP) return 100;
  
  const progress = ((userXP - this.minXP) / (this.maxXP - this.minXP)) * 100;
  return Math.round(progress);
};

// Static methods
levelSchema.statics.getLevelByXP = function(xp) {
  return this.findOne({
    isActive: true,
    minXP: { $lte: xp },
    maxXP: { $gte: xp }
  });
};

levelSchema.statics.getNextLevel = function(currentLevel) {
  return this.findOne({
    isActive: true,
    level: currentLevel + 1
  });
};

levelSchema.statics.getAllActiveLevels = function() {
  return this.find({ isActive: true })
    .sort({ level: 1 });
};

levelSchema.statics.getLeaderboardLevels = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ level: -1 })
    .limit(limit);
};

// Pre-save middleware
levelSchema.pre('save', function(next) {
  // Ensure maxXP is greater than minXP
  if (this.maxXP <= this.minXP) {
    return next(new Error('maxXP must be greater than minXP'));
  }
  next();
});

// Pre-remove middleware
levelSchema.pre('remove', function(next) {
  // Don't allow deletion if users are at this level
  if (this.userCount > 0) {
    return next(new Error('Cannot delete level with active users'));
  }
  next();
});

module.exports = mongoose.model('Level', levelSchema);