const mongoose = require('mongoose');

/**
 * PK Battle Model
 * 
 * Handles competitive live streaming battles between two hosts
 * where viewers send gifts to help their favorite win.
 */

const pkBattleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Host 1 (initiator)
  host1: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    gifts: [{
      gift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gift'
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      value: Number,
      timestamp: Date
    }]
  },
  
  // Host 2 (challenger)
  host2: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    gifts: [{
      gift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gift'
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      value: Number,
      timestamp: Date
    }]
  },
  
  // Battle settings
  duration: {
    type: Number,
    default: 300, // 5 minutes in seconds
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Time tracking
  startedAt: Date,
  endsAt: Date,
  completedAt: Date,
  
  // Winner
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  stats: {
    totalGifts: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    peakViewers: {
      type: Number,
      default: 0
    }
  },
  
  // Viewers
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Battle rewards
  rewards: {
    winner: {
      coins: Number,
      badges: [String],
      experience: Number
    },
    loser: {
      coins: Number,
      experience: Number
    }
  }
  
}, {
  timestamps: true
});

// Indexes
pkBattleSchema.index({ battleId: 1 });
pkBattleSchema.index({ 'host1.user': 1, status: 1 });
pkBattleSchema.index({ 'host2.user': 1, status: 1 });
pkBattleSchema.index({ status: 1, createdAt: -1 });

// Generate unique battle ID
pkBattleSchema.pre('save', async function(next) {
  if (!this.battleId) {
    this.battleId = `PK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Methods

/**
 * Start the battle
 */
pkBattleSchema.methods.startBattle = async function() {
  this.status = 'active';
  this.startedAt = new Date();
  this.endsAt = new Date(Date.now() + this.duration * 1000);
  await this.save();
  
  return this;
};

/**
 * Add gift to host's score
 */
pkBattleSchema.methods.addGift = async function(hostNumber, giftData) {
  const host = hostNumber === 1 ? this.host1 : this.host2;
  
  host.gifts.push({
    gift: giftData.giftId,
    sender: giftData.senderId,
    amount: giftData.amount,
    value: giftData.value,
    timestamp: new Date()
  });
  
  host.score += giftData.value;
  
  this.stats.totalGifts += giftData.amount;
  this.stats.totalValue += giftData.value;
  
  await this.save();
  
  return this;
};

/**
 * Complete the battle and determine winner
 */
pkBattleSchema.methods.completeBattle = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Determine winner
  if (this.host1.score > this.host2.score) {
    this.winner = this.host1.user;
    
    // Set rewards
    this.rewards = {
      winner: {
        coins: Math.floor(this.host1.score * 0.1),
        badges: ['pk_winner'],
        experience: 500
      },
      loser: {
        coins: Math.floor(this.host2.score * 0.05),
        experience: 200
      }
    };
  } else if (this.host2.score > this.host1.score) {
    this.winner = this.host2.user;
    
    this.rewards = {
      winner: {
        coins: Math.floor(this.host2.score * 0.1),
        badges: ['pk_winner'],
        experience: 500
      },
      loser: {
        coins: Math.floor(this.host1.score * 0.05),
        experience: 200
      }
    };
  } else {
    // Draw - split rewards
    const splitCoins = Math.floor((this.host1.score + this.host2.score) * 0.075);
    this.rewards = {
      winner: {
        coins: splitCoins,
        experience: 350
      },
      loser: {
        coins: splitCoins,
        experience: 350
      }
    };
  }
  
  await this.save();
  
  return this;
};

/**
 * Cancel the battle
 */
pkBattleSchema.methods.cancelBattle = async function() {
  this.status = 'cancelled';
  await this.save();
  
  return this;
};

/**
 * Add viewer
 */
pkBattleSchema.methods.addViewer = async function(userId) {
  if (!this.viewers.includes(userId)) {
    this.viewers.push(userId);
    this.stats.uniqueViewers = this.viewers.length;
    
    // Update peak viewers
    if (this.viewers.length > this.stats.peakViewers) {
      this.stats.peakViewers = this.viewers.length;
    }
    
    await this.save();
  }
  
  return this;
};

// Statics

/**
 * Get active battles
 */
pkBattleSchema.statics.getActiveBattles = async function(limit = 20) {
  return this.find({ status: 'active' })
    .populate('host1.user', 'username avatar fullName')
    .populate('host2.user', 'username avatar fullName')
    .sort({ startedAt: -1 })
    .limit(limit);
};

/**
 * Get user's battle history
 */
pkBattleSchema.statics.getUserBattles = async function(userId, limit = 50) {
  return this.find({
    $or: [
      { 'host1.user': userId },
      { 'host2.user': userId }
    ],
    status: { $in: ['completed', 'cancelled'] }
  })
    .populate('host1.user', 'username avatar')
    .populate('host2.user', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Get leaderboard
 */
pkBattleSchema.statics.getLeaderboard = async function(timeRange = 'week') {
  const startDate = new Date();
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  
  const battles = await this.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $facet: {
        host1Wins: [
          {
            $match: {
              $expr: { $eq: ['$winner', '$host1.user'] }
            }
          },
          {
            $group: {
              _id: '$host1.user',
              wins: { $sum: 1 },
              totalScore: { $sum: '$host1.score' }
            }
          }
        ],
        host2Wins: [
          {
            $match: {
              $expr: { $eq: ['$winner', '$host2.user'] }
            }
          },
          {
            $group: {
              _id: '$host2.user',
              wins: { $sum: 1 },
              totalScore: { $sum: '$host2.score' }
            }
          }
        ]
      }
    },
    {
      $project: {
        combined: { $concatArrays: ['$host1Wins', '$host2Wins'] }
      }
    },
    { $unwind: '$combined' },
    {
      $group: {
        _id: '$combined._id',
        wins: { $sum: '$combined.wins' },
        totalScore: { $sum: '$combined.totalScore' }
      }
    },
    { $sort: { wins: -1, totalScore: -1 } },
    { $limit: 100 }
  ]);
  
  // Populate user data
  await this.populate(battles, {
    path: '_id',
    select: 'username avatar fullName'
  });
  
  return battles;
};

module.exports = mongoose.model('PKBattle', pkBattleSchema);
