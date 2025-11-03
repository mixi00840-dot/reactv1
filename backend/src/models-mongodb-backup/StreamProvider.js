const mongoose = require('mongoose');

const streamProviderSchema = new mongoose.Schema({
  // Provider identification
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['zegocloud', 'agora', 'webrtc', 'custom'],
    index: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: String,
  
  // Provider status
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['active', 'maintenance', 'degraded', 'offline'],
    default: 'active'
  },
  
  // Provider priority for failover (lower = higher priority)
  priority: {
    type: Number,
    required: true,
    default: 0,
    index: true
  },
  
  // Configuration
  config: {
    // API credentials (encrypted in production)
    appId: {
      type: String,
      required: true
    },
    appKey: String,
    appSecret: {
      type: String,
      required: true
    },
    serverUrl: String,
    
    // Regional settings
    region: {
      type: String,
      enum: ['global', 'us', 'eu', 'asia', 'middle-east'],
      default: 'global'
    },
    
    // Protocol settings
    protocol: {
      type: String,
      enum: ['rtmp', 'webrtc', 'hls', 'flv'],
      default: 'webrtc'
    },
    
    // Quality settings
    maxResolution: {
      type: String,
      enum: ['480p', '720p', '1080p', '2k', '4k'],
      default: '1080p'
    },
    
    maxBitrate: Number, // kbps
    maxFrameRate: Number, // fps
    
    // Advanced features
    features: {
      recording: { type: Boolean, default: false },
      transcoding: { type: Boolean, default: false },
      beauty: { type: Boolean, default: false },
      virtualBackground: { type: Boolean, default: false },
      screenSharing: { type: Boolean, default: false },
      multiHost: { type: Boolean, default: false },
      chat: { type: Boolean, default: false },
      gifts: { type: Boolean, default: false }
    }
  },
  
  // Usage limits
  limits: {
    maxConcurrentStreams: {
      type: Number,
      default: 1000
    },
    maxViewersPerStream: {
      type: Number,
      default: 10000
    },
    maxStreamDuration: {
      type: Number,
      default: 14400 // 4 hours in seconds
    },
    monthlyMinutes: {
      type: Number,
      default: 100000
    },
    usedMinutes: {
      type: Number,
      default: 0
    }
  },
  
  // Health monitoring
  health: {
    lastCheck: Date,
    uptime: {
      type: Number,
      default: 100 // percentage
    },
    averageLatency: Number, // ms
    errorRate: {
      type: Number,
      default: 0 // percentage
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    totalStreams: {
      type: Number,
      default: 0
    },
    activeStreams: {
      type: Number,
      default: 0
    },
    totalViewers: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  
  // Cost tracking
  pricing: {
    perMinute: Number, // cost per streaming minute
    perViewer: Number, // cost per viewer
    monthlyFee: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Webhook configuration
  webhooks: {
    streamStarted: String,
    streamEnded: String,
    viewerJoined: String,
    viewerLeft: String,
    error: String
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
  
}, {
  timestamps: true
});

// Indexes for performance
streamProviderSchema.index({ enabled: 1, priority: 1 });
streamProviderSchema.index({ status: 1, enabled: 1 });

// Virtual for health status
streamProviderSchema.virtual('isHealthy').get(function() {
  return this.health.uptime >= 95 && 
         this.health.errorRate <= 5 &&
         this.health.consecutiveFailures < 3 &&
         this.status === 'active';
});

// Virtual for capacity available
streamProviderSchema.virtual('hasCapacity').get(function() {
  return this.stats.activeStreams < this.limits.maxConcurrentStreams &&
         this.limits.usedMinutes < this.limits.monthlyMinutes;
});

// Instance Methods

// Check provider health
streamProviderSchema.methods.checkHealth = async function() {
  try {
    // This would make actual API call to provider
    // For now, simulate health check
    const startTime = Date.now();
    
    // TODO: Implement actual provider-specific health check
    // await this.callProviderHealthEndpoint();
    
    const latency = Date.now() - startTime;
    
    this.health.lastCheck = Date.now();
    this.health.averageLatency = latency;
    this.health.consecutiveFailures = 0;
    this.health.errorRate = Math.max(0, this.health.errorRate - 1);
    this.health.uptime = Math.min(100, this.health.uptime + 0.1);
    
    if (this.status === 'degraded' && this.health.uptime >= 98) {
      this.status = 'active';
    }
    
    await this.save();
    
    return {
      healthy: this.isHealthy,
      latency,
      status: this.status
    };
  } catch (error) {
    this.health.consecutiveFailures += 1;
    this.health.errorRate = Math.min(100, this.health.errorRate + 5);
    this.health.uptime = Math.max(0, this.health.uptime - 5);
    
    if (this.health.consecutiveFailures >= 3) {
      this.status = 'offline';
    } else if (this.health.uptime < 95) {
      this.status = 'degraded';
    }
    
    await this.save();
    throw error;
  }
};

// Record stream usage
streamProviderSchema.methods.recordUsage = async function(durationMinutes, viewerCount) {
  this.stats.totalStreams += 1;
  this.stats.totalMinutes += durationMinutes;
  this.stats.totalViewers += viewerCount;
  this.stats.lastUsed = Date.now();
  this.limits.usedMinutes += durationMinutes;
  
  await this.save();
};

// Increment active streams
streamProviderSchema.methods.incrementActive = async function() {
  this.stats.activeStreams += 1;
  await this.save();
};

// Decrement active streams
streamProviderSchema.methods.decrementActive = async function() {
  this.stats.activeStreams = Math.max(0, this.stats.activeStreams - 1);
  await this.save();
};

// Reset monthly usage
streamProviderSchema.methods.resetMonthlyUsage = async function() {
  this.limits.usedMinutes = 0;
  await this.save();
};

// Static Methods

// Get best available provider
streamProviderSchema.statics.getBestProvider = async function(requirements = {}) {
  const providers = await this.find({
    enabled: true,
    status: { $in: ['active', 'degraded'] }
  }).sort({ priority: 1, 'health.uptime': -1 });
  
  for (const provider of providers) {
    // Check if provider meets requirements
    if (provider.hasCapacity && provider.isHealthy) {
      // Check feature requirements
      if (requirements.features) {
        const hasFeatures = Object.keys(requirements.features).every(
          feature => provider.config.features[feature] === true
        );
        if (!hasFeatures) continue;
      }
      
      return provider;
    }
  }
  
  // If no healthy provider found, return highest priority one
  return providers[0] || null;
};

// Get all healthy providers
streamProviderSchema.statics.getHealthyProviders = async function() {
  const providers = await this.find({
    enabled: true,
    status: 'active'
  }).sort({ priority: 1 });
  
  return providers.filter(p => p.isHealthy && p.hasCapacity);
};

// Run health checks on all providers
streamProviderSchema.statics.runHealthChecks = async function() {
  const providers = await this.find({ enabled: true });
  const results = [];
  
  for (const provider of providers) {
    try {
      const health = await provider.checkHealth();
      results.push({
        name: provider.name,
        healthy: health.healthy,
        latency: health.latency,
        status: health.status
      });
    } catch (error) {
      results.push({
        name: provider.name,
        healthy: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Get provider statistics
streamProviderSchema.statics.getStatistics = async function() {
  const providers = await this.find();
  
  return {
    total: providers.length,
    enabled: providers.filter(p => p.enabled).length,
    active: providers.filter(p => p.status === 'active').length,
    totalStreams: providers.reduce((sum, p) => sum + p.stats.totalStreams, 0),
    activeStreams: providers.reduce((sum, p) => sum + p.stats.activeStreams, 0),
    totalMinutes: providers.reduce((sum, p) => sum + p.stats.totalMinutes, 0),
    averageUptime: providers.reduce((sum, p) => sum + p.health.uptime, 0) / providers.length
  };
};

const StreamProvider = mongoose.model('StreamProvider', streamProviderSchema);

module.exports = { StreamProvider };
