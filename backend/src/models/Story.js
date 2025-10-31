const mongoose = require('mongoose');

/**
 * Story Model
 * 
 * 24-hour temporary content (Instagram Stories style) with views,
 * reactions, and privacy controls.
 */

const storySchema = new mongoose.Schema({
  storyId: {
    type: String,
    unique: true,
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Story type
  type: {
    type: String,
    enum: ['image', 'video', 'text'],
    required: true
  },
  
  // Media content
  media: {
    url: String,
    thumbnailUrl: String,
    key: String,
    mimeType: String,
    width: Number,
    height: Number,
    duration: Number, // For video
    size: Number
  },
  
  // Text story
  text: {
    content: String,
    backgroundColor: String,
    textColor: String,
    fontSize: String,
    alignment: String
  },
  
  // Caption
  caption: String,
  
  // Mentions
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      x: Number,
      y: Number
    }
  }],
  
  // Link sticker
  link: {
    url: String,
    title: String
  },
  
  // Location
  location: {
    name: String,
    latitude: Number,
    longitude: Number
  },
  
  // Music
  music: {
    title: String,
    artist: String,
    url: String
  },
  
  // Privacy settings
  visibility: {
    type: String,
    enum: ['public', 'friends', 'close_friends', 'custom'],
    default: 'public'
  },
  
  allowedViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  hiddenFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Interactions
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number // How long they watched (seconds)
  }],
  
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  
  // Story expires after 24 hours
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'deleted'],
    default: 'active'
  },
  
  // Highlights (saved stories)
  savedToHighlight: {
    type: Boolean,
    default: false
  },
  highlightId: String
  
}, {
  timestamps: true
});

// Indexes
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }); // TTL index
storySchema.index({ status: 1, expiresAt: 1 });
storySchema.index({ 'views.user': 1 });

// TTL index to auto-delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save: Generate storyId and set expiresAt
storySchema.pre('save', function(next) {
  if (!this.storyId) {
    this.storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!this.expiresAt) {
    // Stories expire after 24 hours
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method: Add view
storySchema.methods.addView = async function(userId, duration = 0) {
  const alreadyViewed = this.views.some(v => v.user.toString() === userId.toString());
  
  if (!alreadyViewed) {
    this.views.push({ user: userId, duration });
    this.stats.views += 1;
    await this.save();
  }
  
  return this;
};

// Method: Add reaction
storySchema.methods.addReaction = async function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  this.stats.reactions = this.reactions.length;
  await this.save();
  
  return this;
};

// Method: Add reply
storySchema.methods.addReply = async function(userId, text) {
  this.replies.push({ user: userId, text });
  this.stats.replies = this.replies.length;
  await this.save();
  
  return this;
};

// Method: Check if user can view
storySchema.methods.canView = function(userId) {
  // Story owner can always view
  if (this.user.toString() === userId.toString()) {
    return true;
  }
  
  // Check if hidden from user
  if (this.hiddenFrom.some(id => id.toString() === userId.toString())) {
    return false;
  }
  
  // Check visibility settings
  if (this.visibility === 'public') {
    return true;
  }
  
  if (this.visibility === 'custom') {
    return this.allowedViewers.some(id => id.toString() === userId.toString());
  }
  
  // For friends and close_friends, would need to check relationship
  // This is simplified - implement based on your friendship model
  return false;
};

// Method: Save to highlight
storySchema.methods.saveToHighlight = async function(highlightId) {
  this.savedToHighlight = true;
  this.highlightId = highlightId;
  await this.save();
  return this;
};

// Static: Get user's active stories
storySchema.statics.getUserStories = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: 1 })
    .populate('user', 'username avatar fullName');
};

// Static: Get stories feed for user
storySchema.statics.getStoriesFeed = async function(userId, limit = 50) {
  // Get stories from followed users
  // This is simplified - implement based on your follow model
  return this.aggregate([
    {
      $match: {
        status: 'active',
        expiresAt: { $gt: new Date() },
        user: { $ne: userId }
      }
    },
    {
      $group: {
        _id: '$user',
        stories: { $push: '$$ROOT' },
        latestStory: { $max: '$createdAt' },
        hasUnviewed: {
          $sum: {
            $cond: [
              { $not: { $in: [userId, '$views.user'] } },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { hasUnviewed: -1, latestStory: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user: {
          _id: 1,
          username: 1,
          avatar: 1,
          fullName: 1
        },
        stories: 1,
        hasUnviewed: 1,
        latestStory: 1
      }
    }
  ]);
};

// Static: Mark expired stories
storySchema.statics.markExpired = async function() {
  return this.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() },
      savedToHighlight: false
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('Story', storySchema);
