const mongoose = require('mongoose');

/**
 * ModerationQueue Model
 * 
 * Manages the queue of content items awaiting human review.
 * Prioritizes based on risk score, user reports, and urgency.
 * 
 * Queue Priority System:
 * 1. Critical (90-100): Immediate attention required
 * 2. High (70-89): Review within 1 hour
 * 3. Medium (40-69): Review within 6 hours
 * 4. Low (0-39): Review within 24 hours
 */

const moderationQueueSchema = new mongoose.Schema({
  // Reference
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    unique: true,
    index: true
  },

  moderationResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModerationResult',
    required: true,
    index: true
  },

  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Queue Status
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_review', 'completed', 'escalated', 'expired'],
    default: 'pending',
    required: true,
    index: true
  },

  // Priority (0-100, higher = more urgent)
  priority: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 50,
    index: true
  },

  priorityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  assignedAt: Date,

  // Review tracking
  reviewStartedAt: Date,
  reviewCompletedAt: Date,
  reviewDuration: Number,  // seconds

  // Reason for queue entry
  reason: {
    type: String,
    required: true,
    enum: [
      'high_risk_score',
      'user_reports',
      'automated_flag',
      'repeat_offender',
      'appeal_submitted',
      'manual_escalation',
      'random_audit'
    ]
  },

  // Risk factors
  riskFactors: {
    automatedScore: { type: Number, default: 0 },
    userReportCount: { type: Number, default: 0 },
    creatorStrikeCount: { type: Number, default: 0 },
    previousViolations: { type: Number, default: 0 },
    viralityScore: { type: Number, default: 0 }  // Prioritize viral content
  },

  // Auto-escalation
  autoEscalated: {
    type: Boolean,
    default: false
  },

  escalatedReason: String,
  escalatedAt: Date,

  // SLA tracking
  sla: {
    target: Date,        // Target completion time
    breached: { type: Boolean, default: false },
    breachedAt: Date
  },

  // Review notes
  notes: String,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'moderationqueue'
});

// Compound indexes for efficient queue processing
moderationQueueSchema.index({ status: 1, priority: -1, createdAt: 1 });
moderationQueueSchema.index({ status: 1, priorityLevel: 1, createdAt: 1 });
moderationQueueSchema.index({ assignedTo: 1, status: 1 });

// Virtual: Time in queue (minutes)
moderationQueueSchema.virtual('timeInQueue').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.round((now - created) / 1000 / 60);
});

// Virtual: Is SLA breached
moderationQueueSchema.virtual('isSLABreached').get(function() {
  if (!this.sla.target) return false;
  return new Date() > this.sla.target && this.status !== 'completed';
});

// Pre-save: Calculate priority and SLA
moderationQueueSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('riskFactors')) {
    this.calculatePriority();
    this.setSLA();
  }
  next();
});

// Method: Calculate priority score
moderationQueueSchema.methods.calculatePriority = function() {
  const factors = this.riskFactors;
  
  // Weighted calculation
  let score = 0;
  score += factors.automatedScore * 0.40;        // 40% weight
  score += factors.userReportCount * 5 * 0.25;   // 25% weight (5 points per report)
  score += factors.creatorStrikeCount * 10 * 0.15; // 15% weight
  score += factors.previousViolations * 8 * 0.10;  // 10% weight
  score += factors.viralityScore * 0.10;          // 10% weight
  
  // Cap at 100
  this.priority = Math.min(100, Math.round(score));
  
  // Set priority level
  if (this.priority >= 90) {
    this.priorityLevel = 'critical';
  } else if (this.priority >= 70) {
    this.priorityLevel = 'high';
  } else if (this.priority >= 40) {
    this.priorityLevel = 'medium';
  } else {
    this.priorityLevel = 'low';
  }
  
  return this.priority;
};

// Method: Set SLA target
moderationQueueSchema.methods.setSLA = function() {
  const now = new Date();
  let hoursToAdd = 24; // Default: 24 hours
  
  switch (this.priorityLevel) {
    case 'critical':
      hoursToAdd = 0.25; // 15 minutes
      break;
    case 'high':
      hoursToAdd = 1;
      break;
    case 'medium':
      hoursToAdd = 6;
      break;
    case 'low':
      hoursToAdd = 24;
      break;
  }
  
  this.sla.target = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  
  return this.sla.target;
};

// Method: Assign to moderator
moderationQueueSchema.methods.assign = async function(moderatorId) {
  this.status = 'assigned';
  this.assignedTo = moderatorId;
  this.assignedAt = new Date();
  await this.save();
  return this;
};

// Method: Start review
moderationQueueSchema.methods.startReview = async function() {
  this.status = 'in_review';
  this.reviewStartedAt = new Date();
  await this.save();
  return this;
};

// Method: Complete review
moderationQueueSchema.methods.complete = async function() {
  this.status = 'completed';
  this.reviewCompletedAt = new Date();
  
  if (this.reviewStartedAt) {
    const duration = (this.reviewCompletedAt - this.reviewStartedAt) / 1000;
    this.reviewDuration = Math.round(duration);
  }
  
  await this.save();
  return this;
};

// Method: Escalate
moderationQueueSchema.methods.escalate = async function(reason) {
  this.status = 'escalated';
  this.autoEscalated = true;
  this.escalatedReason = reason;
  this.escalatedAt = new Date();
  this.priority = Math.min(100, this.priority + 20); // Boost priority
  this.priorityLevel = 'critical';
  await this.save();
  return this;
};

// Method: Check and mark SLA breach
moderationQueueSchema.methods.checkSLA = async function() {
  if (this.isSLABreached && !this.sla.breached) {
    this.sla.breached = true;
    this.sla.breachedAt = new Date();
    
    // Auto-escalate on SLA breach
    if (this.priorityLevel !== 'critical') {
      await this.escalate('SLA breach');
    }
    
    await this.save();
  }
  
  return this.sla.breached;
};

// Static: Add to queue
moderationQueueSchema.statics.addToQueue = async function(contentId, moderationResultId, creatorId, reason, riskFactors = {}) {
  // Check if already in queue
  const existing = await this.findOne({ contentId, status: { $ne: 'completed' } });
  if (existing) {
    return existing;
  }
  
  const queueItem = await this.create({
    contentId,
    moderationResultId,
    creatorId,
    reason,
    riskFactors: {
      automatedScore: riskFactors.automatedScore || 0,
      userReportCount: riskFactors.userReportCount || 0,
      creatorStrikeCount: riskFactors.creatorStrikeCount || 0,
      previousViolations: riskFactors.previousViolations || 0,
      viralityScore: riskFactors.viralityScore || 0
    }
  });
  
  return queueItem;
};

// Static: Get next item for moderator
moderationQueueSchema.statics.getNext = async function(moderatorId = null) {
  const query = {
    status: 'pending'
  };
  
  // If moderator specified, also include items assigned to them
  if (moderatorId) {
    query.$or = [
      { status: 'pending' },
      { status: 'assigned', assignedTo: moderatorId }
    ];
  }
  
  const item = await this.findOne(query)
    .sort({ priority: -1, createdAt: 1 })  // High priority first, then FIFO
    .populate('contentId', 'type caption media thumbnails')
    .populate('creatorId', 'username fullName avatar strikeCount')
    .populate('moderationResultId');
  
  return item;
};

// Static: Get moderator's assigned items
moderationQueueSchema.statics.getAssigned = async function(moderatorId, limit = 20) {
  return this.find({
    assignedTo: moderatorId,
    status: { $in: ['assigned', 'in_review'] }
  })
  .sort({ priority: -1, assignedAt: 1 })
  .limit(limit)
  .populate('contentId', 'type caption media thumbnails')
  .populate('creatorId', 'username fullName avatar')
  .populate('moderationResultId');
};

// Static: Get queue statistics
moderationQueueSchema.statics.getQueueStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        status: { $ne: 'completed' }
      }
    },
    {
      $group: {
        _id: '$priorityLevel',
        count: { $sum: 1 },
        avgTimeInQueue: { $avg: { $subtract: [new Date(), '$createdAt'] } }
      }
    }
  ]);
  
  const slaBreached = await this.countDocuments({
    'sla.breached': true,
    status: { $ne: 'completed' }
  });
  
  const assigned = await this.countDocuments({ status: 'assigned' });
  const inReview = await this.countDocuments({ status: 'in_review' });
  const pending = await this.countDocuments({ status: 'pending' });
  
  return {
    byPriority: stats,
    slaBreached,
    assigned,
    inReview,
    pending,
    total: assigned + inReview + pending
  };
};

// Static: Check all SLAs (run periodically)
moderationQueueSchema.statics.checkAllSLAs = async function() {
  const items = await this.find({
    status: { $in: ['pending', 'assigned', 'in_review'] },
    'sla.breached': false
  });
  
  let breached = 0;
  
  for (const item of items) {
    const wasBreached = await item.checkSLA();
    if (wasBreached) breached++;
  }
  
  return { checked: items.length, breached };
};

// Static: Cleanup expired items (older than 30 days)
moderationQueueSchema.statics.cleanupOld = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.updateMany(
    {
      status: 'completed',
      updatedAt: { $lt: cutoffDate }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('ModerationQueue', moderationQueueSchema);
