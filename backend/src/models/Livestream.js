const mongoose = require('mongoose');

const LivestreamSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic info
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    maxlength: 1000
  },
  
  thumbnailUrl: String,
  
  // Streaming technical details
  provider: {
    type: String,
    enum: ['agora', 'zegocloud', 'webrtc'],
    required: true
  },
  
  streamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  channelId: String,
  rtmpUrl: String,
  streamKey: String,
  hlsUrl: String,
  websocketUrl: String,
  
  // Stream type
  type: {
    type: String,
    enum: ['solo', 'pk_battle', '1v1', '2v2', 'multi_host', 'guest'],
    default: 'solo'
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'starting', 'live', 'paused', 'ended', 'failed'],
    default: 'starting',
    index: true
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
  
  // Participants (for multi-host streams)
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'guest', 'moderator'],
      default: 'guest'
    },
    joinedAt: Date,
    leftAt: Date,
    isMuted: { type: Boolean, default: false },
    isCameraOff: { type: Boolean, default: false }
  }],
  
  // Engagement metrics
  currentViewers: {
    type: Number,
    default: 0,
    min: 0
  },
  
  peakViewers: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  sharesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Gifts received during stream
  giftsReceived: [{
    giftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gift'
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: Number,
    value: Number,
    timestamp: Date
  }],
  
  totalGiftsValue: {
    type: Number,
    default: 0
  },
  
  // Chat
  chatRoomId: String,
  messagesCount: {
    type: Number,
    default: 0
  },
  
  // Features
  allowComments: {
    type: Boolean,
    default: true
  },
  
  allowGifts: {
    type: Boolean,
    default: true
  },
  
  allowSharing: {
    type: Boolean,
    default: true
  },
  
  // Recording
  isRecorded: {
    type: Boolean,
    default: false
  },
  
  recordingUrl: String,
  recordingDuration: Number, // seconds
  
  // Timestamps
  scheduledFor: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // seconds
  
  // Moderation
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  bannedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedAt: Date,
    reason: String
  }],
  
  // Analytics
  avgWatchTime: Number, // seconds
  totalWatchTime: Number, // seconds
  uniqueViewers: Number,
  returningViewers: Number,
  
  // Failure details
  failureReason: String,
  failureTimestamp: Date,
  
}, {
  timestamps: true
});

// Indexes
LivestreamSchema.index({ hostId: 1, status: 1 });
LivestreamSchema.index({ status: 1, startedAt: -1 });
LivestreamSchema.index({ streamId: 1 }, { unique: true });
LivestreamSchema.index({ createdAt: -1 });
LivestreamSchema.index({ 'participants.userId': 1 });

// Virtual for is currently live
LivestreamSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

// Virtual for engagement rate
LivestreamSchema.virtual('engagementRate').get(function() {
  if (this.totalViews === 0) return 0;
  const engagement = this.likesCount + (this.giftsReceived?.length || 0) + this.sharesCount;
  return ((engagement / this.totalViews) * 100).toFixed(2);
});

// Method to start livestream
LivestreamSchema.methods.start = async function() {
  this.status = 'live';
  this.startedAt = new Date();
  return this.save();
};

// Method to end livestream
LivestreamSchema.methods.end = async function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.duration = this.startedAt ? Math.floor((this.endedAt - this.startedAt) / 1000) : 0;
  return this.save();
};

// Method to update viewer count
LivestreamSchema.methods.updateViewers = async function(count) {
  this.currentViewers = count;
  if (count > this.peakViewers) {
    this.peakViewers = count;
  }
  return this.save();
};

// Method to add participant
LivestreamSchema.methods.addParticipant = async function(userId, role = 'guest') {
  const existing = this.participants.find(p => p.userId.equals(userId));
  if (!existing) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
    return this.save();
  }
};

// Static method to get live streams
LivestreamSchema.statics.getLiveStreams = function(limit = 50) {
  return this.find({ status: 'live', isPrivate: false })
    .sort({ currentViewers: -1, startedAt: -1 })
    .limit(limit)
    .populate('hostId', 'username fullName avatar isVerified')
    .populate('participants.userId', 'username fullName avatar');
};

// Static method to get scheduled streams
LivestreamSchema.statics.getScheduledStreams = function(userId) {
  return this.find({
    hostId: userId,
    status: 'scheduled',
    scheduledFor: { $gte: new Date() }
  })
  .sort({ scheduledFor: 1 });
};

// Prevent model overwrite error
const Livestream = mongoose.models.Livestream || mongoose.model('Livestream', LivestreamSchema);

module.exports = Livestream;

