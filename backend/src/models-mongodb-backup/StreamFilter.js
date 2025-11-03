const mongoose = require('mongoose');

/**
 * Stream Filter Model
 * 
 * Handles beauty filters, AR effects, face filters,
 * and visual enhancements for live streams.
 */

const streamFilterSchema = new mongoose.Schema({
  filterId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Filter information
  name: {
    type: String,
    required: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: String,
  
  // Filter type
  type: {
    type: String,
    enum: [
      'beauty',           // Skin smoothing, face enhancement
      'makeup',           // Virtual makeup (lipstick, eyeshadow, etc.)
      'ar-effect',        // AR effects (masks, 3D objects)
      'face-shape',       // Face reshaping
      'color-filter',     // Color grading
      'background',       // Background replacement/blur
      'sticker',          // Animated stickers
      'text-overlay',     // Text effects
      'green-screen',     // Green screen effects
      'voice-changer'     // Voice effects
    ],
    required: true
  },
  
  // Category
  category: {
    type: String,
    enum: [
      'trending',
      'beauty',
      'funny',
      'animals',
      'holiday',
      'seasonal',
      'branded',
      'premium',
      'custom'
    ],
    default: 'beauty'
  },
  
  // Thumbnail/preview
  thumbnail: String,
  previewVideo: String,
  
  // Filter assets
  assets: {
    // Main filter file
    filterFile: String,
    
    // 3D models for AR
    models: [String],
    
    // Textures
    textures: [String],
    
    // Shaders
    shaders: [String],
    
    // Animation files
    animations: [String]
  },
  
  // Filter parameters
  parameters: {
    // Beauty filters
    beauty: {
      skinSmoothing: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      faceSlimming: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      eyeEnlargement: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      noseSlimming: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      brightness: {
        type: Number,
        min: -100,
        max: 100,
        default: 0
      },
      whitening: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    // Makeup
    makeup: {
      lipstick: {
        enabled: {
          type: Boolean,
          default: false
        },
        color: String,
        intensity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50
        }
      },
      eyeshadow: {
        enabled: {
          type: Boolean,
          default: false
        },
        color: String,
        intensity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50
        }
      },
      blush: {
        enabled: {
          type: Boolean,
          default: false
        },
        color: String,
        intensity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50
        }
      },
      eyeliner: {
        enabled: {
          type: Boolean,
          default: false
        },
        style: String,
        intensity: {
          type: Number,
          min: 0,
          max: 100,
          default: 50
        }
      }
    },
    
    // Color adjustment
    color: {
      saturation: {
        type: Number,
        min: -100,
        max: 100,
        default: 0
      },
      contrast: {
        type: Number,
        min: -100,
        max: 100,
        default: 0
      },
      temperature: {
        type: Number,
        min: -100,
        max: 100,
        default: 0
      },
      vignette: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    // Background
    background: {
      blur: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      replacement: {
        enabled: {
          type: Boolean,
          default: false
        },
        imageUrl: String,
        videoUrl: String
      }
    }
  },
  
  // Compatibility
  compatibility: {
    minVersion: String,
    platforms: [{
      type: String,
      enum: ['ios', 'android', 'web']
    }],
    deviceRequirements: {
      minRAM: Number,
      gpuRequired: Boolean,
      arKitRequired: Boolean,
      arCoreRequired: Boolean
    }
  },
  
  // Availability
  availability: {
    free: {
      type: Boolean,
      default: true
    },
    premium: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    },
    requiredLevel: {
      type: Number,
      default: 0
    },
    unlockConditions: [String]
  },
  
  // Creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  official: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected', 'active', 'inactive', 'deprecated'],
    default: 'draft'
  },
  
  // Usage statistics
  stats: {
    usageCount: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  
  // Tags for search
  tags: [String],
  
  // Featured/promoted
  featured: {
    type: Boolean,
    default: false
  },
  
  featuredUntil: Date,
  
  // Version
  version: {
    type: String,
    default: '1.0.0'
  }
  
}, {
  timestamps: true
});

// Indexes
streamFilterSchema.index({ filterId: 1 });
streamFilterSchema.index({ type: 1, category: 1 });
streamFilterSchema.index({ status: 1, featured: 1 });
streamFilterSchema.index({ tags: 1 });
streamFilterSchema.index({ 'stats.usageCount': -1 });
streamFilterSchema.index({ 'stats.favorites': -1 });

// Generate unique filter ID
streamFilterSchema.pre('save', async function(next) {
  if (!this.filterId) {
    this.filterId = `FLT-${this.type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  next();
});

// Methods

/**
 * Increment usage count
 */
streamFilterSchema.methods.incrementUsage = async function() {
  this.stats.usageCount++;
  await this.save();
  
  return this;
};

/**
 * Add to favorites
 */
streamFilterSchema.methods.addFavorite = async function() {
  this.stats.favorites++;
  await this.save();
  
  return this;
};

/**
 * Remove from favorites
 */
streamFilterSchema.methods.removeFavorite = async function() {
  if (this.stats.favorites > 0) {
    this.stats.favorites--;
    await this.save();
  }
  
  return this;
};

/**
 * Rate filter
 */
streamFilterSchema.methods.rate = async function(rating) {
  const totalRating = (this.stats.rating * this.stats.ratingCount) + rating;
  this.stats.ratingCount++;
  this.stats.rating = totalRating / this.stats.ratingCount;
  
  await this.save();
  
  return this;
};

// Statics

/**
 * Get trending filters
 */
streamFilterSchema.statics.getTrendingFilters = async function(type = null, limit = 20) {
  const query = { status: 'active' };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ 'stats.usageCount': -1 })
    .limit(limit);
};

/**
 * Get featured filters
 */
streamFilterSchema.statics.getFeaturedFilters = async function(limit = 10) {
  return this.find({
    status: 'active',
    featured: true,
    featuredUntil: { $gte: new Date() }
  })
    .sort({ 'stats.usageCount': -1 })
    .limit(limit);
};

/**
 * Get filters by category
 */
streamFilterSchema.statics.getByCategory = async function(category, limit = 50) {
  return this.find({
    status: 'active',
    category
  })
    .sort({ 'stats.usageCount': -1 })
    .limit(limit);
};

/**
 * Search filters
 */
streamFilterSchema.statics.searchFilters = async function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { displayName: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (filters.type) {
    searchQuery.type = filters.type;
  }
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.free !== undefined) {
    searchQuery['availability.free'] = filters.free;
  }
  
  return this.find(searchQuery)
    .sort({ 'stats.usageCount': -1 })
    .limit(filters.limit || 50);
};

module.exports = mongoose.model('StreamFilter', streamFilterSchema);
