const mongoose = require('mongoose');

/**
 * Multi-Host Session Model
 * 
 * Handles collaborative live streaming with multiple hosts
 * (co-hosting, panel shows, interviews, etc.)
 */

const multiHostSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Primary host (creator)
  primaryHost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // All hosts in the session
  hosts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'co-host', 'guest'],
      default: 'co-host'
    },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream'
    },
    joinedAt: Date,
    leftAt: Date,
    
    // Audio/video settings
    settings: {
      audioEnabled: {
        type: Boolean,
        default: true
      },
      videoEnabled: {
        type: Boolean,
        default: true
      },
      micMuted: {
        type: Boolean,
        default: false
      },
      cameraMuted: {
        type: Boolean,
        default: false
      }
    },
    
    // Position in grid layout
    position: {
      type: Number,
      default: 0
    },
    
    status: {
      type: String,
      enum: ['invited', 'joined', 'left', 'kicked', 'connection-lost'],
      default: 'invited'
    }
  }],
  
  // Maximum number of hosts
  maxHosts: {
    type: Number,
    default: 4,
    max: 9 // 3x3 grid maximum
  },
  
  // Session type
  type: {
    type: String,
    enum: ['co-host', 'panel', 'interview', 'battle', 'collaboration'],
    default: 'co-host'
  },
  
  // Layout configuration
  layout: {
    type: {
      type: String,
      enum: ['grid', 'spotlight', 'sidebar', 'picture-in-picture'],
      default: 'grid'
    },
    spotlightUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Session status
  status: {
    type: String,
    enum: ['pending', 'active', 'ended', 'cancelled'],
    default: 'pending'
  },
  
  // Permissions
  permissions: {
    anyoneCanRequest: {
      type: Boolean,
      default: false
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    hostCanInvite: {
      type: Boolean,
      default: true
    },
    hostCanKick: {
      type: Boolean,
      default: true
    }
  },
  
  // Pending invitations
  invitations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  }],
  
  // Join requests
  requests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Time tracking
  startedAt: Date,
  endedAt: Date,
  
  // Statistics
  stats: {
    totalViewers: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    totalGifts: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true
});

// Indexes
multiHostSessionSchema.index({ sessionId: 1 });
multiHostSessionSchema.index({ primaryHost: 1, status: 1 });
multiHostSessionSchema.index({ 'hosts.user': 1, status: 1 });
multiHostSessionSchema.index({ status: 1, createdAt: -1 });

// Generate unique session ID
multiHostSessionSchema.pre('save', async function(next) {
  if (!this.sessionId) {
    this.sessionId = `MULTI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Methods

/**
 * Start the session
 */
multiHostSessionSchema.methods.startSession = async function() {
  this.status = 'active';
  this.startedAt = new Date();
  await this.save();
  
  return this;
};

/**
 * End the session
 */
multiHostSessionSchema.methods.endSession = async function() {
  this.status = 'ended';
  this.endedAt = new Date();
  
  if (this.startedAt) {
    this.stats.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  
  await this.save();
  
  return this;
};

/**
 * Invite user to join
 */
multiHostSessionSchema.methods.inviteUser = async function(userId, invitedBy) {
  // Check if already invited or is host
  const alreadyInvited = this.invitations.some(
    inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
  );
  
  const isHost = this.hosts.some(
    host => host.user.toString() === userId.toString()
  );
  
  if (alreadyInvited || isHost) {
    throw new Error('User already invited or is a host');
  }
  
  // Check max hosts
  if (this.hosts.length >= this.maxHosts) {
    throw new Error('Maximum number of hosts reached');
  }
  
  this.invitations.push({
    user: userId,
    invitedBy,
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    status: 'pending'
  });
  
  await this.save();
  
  return this;
};

/**
 * Accept invitation and join
 */
multiHostSessionSchema.methods.acceptInvitation = async function(userId) {
  const invitation = this.invitations.find(
    inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
  );
  
  if (!invitation) {
    throw new Error('No pending invitation found');
  }
  
  if (new Date() > invitation.expiresAt) {
    invitation.status = 'expired';
    await this.save();
    throw new Error('Invitation expired');
  }
  
  invitation.status = 'accepted';
  
  // Add to hosts
  this.hosts.push({
    user: userId,
    role: 'co-host',
    joinedAt: new Date(),
    status: 'joined',
    position: this.hosts.length
  });
  
  await this.save();
  
  return this;
};

/**
 * Add host to session
 */
multiHostSessionSchema.methods.addHost = async function(userId, role = 'co-host', streamId = null) {
  // Check max hosts
  if (this.hosts.length >= this.maxHosts) {
    throw new Error('Maximum number of hosts reached');
  }
  
  // Check if already a host
  const isHost = this.hosts.some(
    host => host.user.toString() === userId.toString() && !host.leftAt
  );
  
  if (isHost) {
    throw new Error('User is already a host');
  }
  
  this.hosts.push({
    user: userId,
    role,
    stream: streamId,
    joinedAt: new Date(),
    status: 'joined',
    position: this.hosts.length
  });
  
  await this.save();
  
  return this;
};

/**
 * Remove host from session
 */
multiHostSessionSchema.methods.removeHost = async function(userId) {
  const host = this.hosts.find(
    h => h.user.toString() === userId.toString() && h.status === 'joined'
  );
  
  if (!host) {
    throw new Error('Host not found');
  }
  
  host.status = 'left';
  host.leftAt = new Date();
  
  await this.save();
  
  return this;
};

/**
 * Kick host from session
 */
multiHostSessionSchema.methods.kickHost = async function(userId) {
  const host = this.hosts.find(
    h => h.user.toString() === userId.toString() && h.status === 'joined'
  );
  
  if (!host) {
    throw new Error('Host not found');
  }
  
  host.status = 'kicked';
  host.leftAt = new Date();
  
  await this.save();
  
  return this;
};

/**
 * Update host settings
 */
multiHostSessionSchema.methods.updateHostSettings = async function(userId, settings) {
  const host = this.hosts.find(
    h => h.user.toString() === userId.toString() && h.status === 'joined'
  );
  
  if (!host) {
    throw new Error('Host not found');
  }
  
  host.settings = { ...host.settings, ...settings };
  
  await this.save();
  
  return this;
};

/**
 * Change layout
 */
multiHostSessionSchema.methods.changeLayout = async function(layoutType, spotlightUser = null) {
  this.layout.type = layoutType;
  
  if (layoutType === 'spotlight' && spotlightUser) {
    this.layout.spotlightUser = spotlightUser;
  }
  
  await this.save();
  
  return this;
};

// Statics

/**
 * Get active multi-host sessions
 */
multiHostSessionSchema.statics.getActiveSessions = async function(limit = 20) {
  return this.find({ status: 'active' })
    .populate('primaryHost', 'username avatar fullName')
    .populate('hosts.user', 'username avatar')
    .sort({ startedAt: -1 })
    .limit(limit);
};

/**
 * Get user's sessions
 */
multiHostSessionSchema.statics.getUserSessions = async function(userId, status = null) {
  const query = {
    $or: [
      { primaryHost: userId },
      { 'hosts.user': userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('primaryHost', 'username avatar')
    .populate('hosts.user', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(50);
};

module.exports = mongoose.model('MultiHostSession', multiHostSessionSchema);
