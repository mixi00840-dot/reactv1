const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  
  mediaUrl: {
    type: String,
    required: true
  },
  
  thumbnailUrl: String,
  
  duration: {
    type: Number,
    default: 5, // seconds
    min: 1,
    max: 60
  },
  
  caption: {
    type: String,
    maxlength: 200
  },
  
  // Background music
  musicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sound'
  },
  
  // Privacy
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Engagement
  viewsCount: {
    type: Number,
    default: 0
  },
  viewers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: Date
  }],
  
  // Status
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Auto-delete after 24 hours
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // Manual createdAt only
});

// Compound indexes
StorySchema.index({ userId: 1, expiresAt: 1 });
StorySchema.index({ createdAt: -1 });

// TTL Index - MongoDB will auto-delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Set expiry date before saving
StorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiry to 24 hours from now
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Static method to get active stories
StorySchema.statics.getActiveStories = function(userId) {
  return this.find({
    userId,
    expiresAt: { $gt: new Date() },
    isArchived: false
  })
  .sort({ createdAt: 1 });
};

// Method to add viewer
StorySchema.methods.addViewer = async function(viewerId) {
  const alreadyViewed = this.viewers.some(v => v.userId.equals(viewerId));
  
  if (!alreadyViewed) {
    this.viewers.push({
      userId: viewerId,
      viewedAt: new Date()
    });
    this.viewsCount += 1;
    return this.save();
  }
};

const Story = mongoose.model('Story', StorySchema);

module.exports = Story;

