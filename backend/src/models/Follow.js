const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification settings
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We only need createdAt
});

// Compound index for uniqueness and queries
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, createdAt: -1 });
FollowSchema.index({ createdAt: -1 });

// Prevent self-follow
FollowSchema.pre('save', function(next) {
  if (this.followerId.equals(this.followingId)) {
    next(new Error('Users cannot follow themselves'));
  } else {
    next();
  }
});

// Static method to check if user follows another
FollowSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ followerId, followingId });
  return !!follow;
};

// Static method to get mutual followers
FollowSchema.statics.getMutualFollowers = async function(userId1, userId2) {
  const user1Followers = await this.find({ followingId: userId1 }).distinct('followerId');
  const user2Followers = await this.find({ followingId: userId2 }).distinct('followerId');
  
  return user1Followers.filter(id => user2Followers.some(id2 => id.equals(id2)));
};

const Follow = mongoose.model('Follow', FollowSchema);

module.exports = Follow;

