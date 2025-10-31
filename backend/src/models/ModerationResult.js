const mongoose = require('mongoose');

/**
 * ModerationResult Model
 * 
 * Stores automated and manual moderation results for content.
 * Supports multi-model AI moderation with confidence scores.
 * 
 * Moderation Categories:
 * - NSFW: Adult content, nudity, sexual content
 * - Violence: Gore, weapons, violent acts
 * - Hate Speech: Discrimination, slurs, toxic language
 * - Profanity: Curse words, offensive language
 * - Spam: Repetitive content, suspicious links
 * - Dangerous: Self-harm, illegal activities, drugs
 * - Misinformation: False health claims, conspiracy theories
 * - Copyright: Potential copyright violations
 */

const moderationResultSchema = new mongoose.Schema({
  // Reference
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    unique: true,
    index: true
  },

  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Overall Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'under_review', 'appealed'],
    default: 'pending',
    required: true,
    index: true
  },

  // Automated Moderation Results
  automated: {
    // Overall decision
    decision: {
      type: String,
      enum: ['approve', 'reject', 'flag', 'review'],
      required: true
    },
    
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    // NSFW Detection
    nsfw: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      categories: {
        nudity: { type: Number, default: 0 },
        sexual: { type: Number, default: 0 },
        suggestive: { type: Number, default: 0 },
        racy: { type: Number, default: 0 }
      },
      provider: String  // 'sightengine', 'aws-rekognition', 'google-vision', etc.
    },

    // Violence Detection
    violence: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      categories: {
        gore: { type: Number, default: 0 },
        weapons: { type: Number, default: 0 },
        blood: { type: Number, default: 0 },
        fighting: { type: Number, default: 0 }
      },
      provider: String
    },

    // Hate Speech & Toxicity
    hateSpeech: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      categories: {
        racism: { type: Number, default: 0 },
        sexism: { type: Number, default: 0 },
        homophobia: { type: Number, default: 0 },
        religious: { type: Number, default: 0 },
        ableism: { type: Number, default: 0 },
        general: { type: Number, default: 0 }
      },
      toxicityScore: { type: Number, default: 0 },
      provider: String  // 'perspective-api', 'azure-text', 'custom-ml'
    },

    // Profanity Detection
    profanity: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      words: [String],  // Detected profane words (censored)
      count: { type: Number, default: 0 },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      provider: String
    },

    // Spam Detection
    spam: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      indicators: {
        repetitiveText: Boolean,
        suspiciousLinks: Boolean,
        massMentions: Boolean,
        copiedContent: Boolean
      },
      linkCount: { type: Number, default: 0 },
      provider: String
    },

    // Dangerous Content
    dangerous: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      categories: {
        selfHarm: { type: Number, default: 0 },
        drugs: { type: Number, default: 0 },
        illegalActivity: { type: Number, default: 0 },
        dangerousActs: { type: Number, default: 0 }
      },
      provider: String
    },

    // Misinformation Detection
    misinformation: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      categories: {
        healthMisinfo: { type: Number, default: 0 },
        conspiracy: { type: Number, default: 0 },
        manipulatedMedia: { type: Number, default: 0 }
      },
      provider: String
    },

    // Copyright Detection
    copyright: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 },
      matches: [{
        source: String,
        similarity: Number,
        owner: String,
        timestamp: Date
      }],
      provider: String  // 'youtube-contentid', 'audible-magic', 'custom'
    },

    // Processing metadata
    processedAt: Date,
    processingTime: Number,  // milliseconds
    models: [String],  // List of AI models used
    version: String    // Moderation system version
  },

  // Manual Review (Human Moderator)
  manualReview: {
    required: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    decision: {
      type: String,
      enum: ['approve', 'reject', 'escalate', 'pending']
    },
    
    reason: String,
    notes: String,
    categories: [String],  // Confirmed violation categories
    
    reviewedAt: Date,
    reviewTime: Number  // seconds spent reviewing
  },

  // Appeal Information
  appeal: {
    hasAppeal: { type: Boolean, default: false },
    
    appealedAt: Date,
    appealReason: String,
    appealNotes: String,
    
    appealReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    appealDecision: {
      type: String,
      enum: ['upheld', 'overturned', 'pending']
    },
    
    appealResolvedAt: Date,
    appealResolution: String
  },

  // Action Taken
  action: {
    type: {
      type: String,
      enum: ['none', 'warning', 'content_removed', 'age_restricted', 'shadowban', 'account_suspended'],
      default: 'none'
    },
    
    reason: String,
    
    appliedAt: Date,
    
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    expiresAt: Date,  // For temporary actions
    
    notified: { type: Boolean, default: false },
    notifiedAt: Date
  },

  // Violation History
  violations: [{
    category: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    detectedBy: {
      type: String,
      enum: ['automated', 'manual', 'user_report']
    },
    timestamp: { type: Date, default: Date.now }
  }],

  // User Reports
  userReports: {
    count: { type: Number, default: 0 },
    reasons: [{
      reason: String,
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: { type: Date, default: Date.now }
    }]
  },

  // Timestamps
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
  collection: 'moderationresults'
});

// Indexes for efficient queries
moderationResultSchema.index({ status: 1, createdAt: -1 });
moderationResultSchema.index({ 'automated.decision': 1, status: 1 });
moderationResultSchema.index({ 'manualReview.required': 1, 'manualReview.completed': 1 });
moderationResultSchema.index({ 'appeal.hasAppeal': 1, 'appeal.appealDecision': 1 });
moderationResultSchema.index({ creatorId: 1, status: 1 });

// Virtual: Is flagged
moderationResultSchema.virtual('isFlagged').get(function() {
  return this.status === 'flagged' || this.status === 'under_review';
});

// Virtual: Needs attention
moderationResultSchema.virtual('needsAttention').get(function() {
  return (this.manualReview.required && !this.manualReview.completed) ||
         (this.appeal.hasAppeal && this.appeal.appealDecision === 'pending');
});

// Virtual: High risk score
moderationResultSchema.virtual('riskScore').get(function() {
  let score = 0;
  
  // Weight different violations
  if (this.automated.nsfw.detected) score += this.automated.nsfw.confidence * 0.3;
  if (this.automated.violence.detected) score += this.automated.violence.confidence * 0.3;
  if (this.automated.hateSpeech.detected) score += this.automated.hateSpeech.confidence * 0.25;
  if (this.automated.dangerous.detected) score += this.automated.dangerous.confidence * 0.35;
  if (this.automated.spam.detected) score += this.automated.spam.confidence * 0.1;
  if (this.automated.profanity.detected) score += this.automated.profanity.confidence * 0.05;
  
  return Math.min(100, Math.round(score));
});

// Method: Approve content
moderationResultSchema.methods.approve = async function(reviewerId = null, notes = '') {
  this.status = 'approved';
  
  if (reviewerId) {
    this.manualReview.completed = true;
    this.manualReview.reviewer = reviewerId;
    this.manualReview.decision = 'approve';
    this.manualReview.notes = notes;
    this.manualReview.reviewedAt = new Date();
  }
  
  await this.save();
  
  // Update content status
  const Content = mongoose.model('Content');
  await Content.findByIdAndUpdate(this.contentId, { 
    status: 'ready',
    moderationStatus: 'approved'
  });
  
  return this;
};

// Method: Reject content
moderationResultSchema.methods.reject = async function(reviewerId, reason, categories = []) {
  this.status = 'rejected';
  
  this.manualReview.completed = true;
  this.manualReview.reviewer = reviewerId;
  this.manualReview.decision = 'reject';
  this.manualReview.reason = reason;
  this.manualReview.categories = categories;
  this.manualReview.reviewedAt = new Date();
  
  // Add violations
  categories.forEach(cat => {
    this.violations.push({
      category: cat,
      severity: 'high',
      detectedBy: 'manual'
    });
  });
  
  await this.save();
  
  // Update content status
  const Content = mongoose.model('Content');
  await Content.findByIdAndUpdate(this.contentId, { 
    status: 'rejected',
    moderationStatus: 'rejected'
  });
  
  // Apply action to creator (e.g., strike)
  await this.applyCreatorAction('content_removed', reason, reviewerId);
  
  return this;
};

// Method: Flag for review
moderationResultSchema.methods.flagForReview = async function(reason) {
  this.status = 'flagged';
  this.manualReview.required = true;
  this.manualReview.reason = reason;
  await this.save();
  return this;
};

// Method: Submit appeal
moderationResultSchema.methods.submitAppeal = async function(appealReason, appealNotes) {
  if (this.status !== 'rejected') {
    throw new Error('Can only appeal rejected content');
  }
  
  this.status = 'appealed';
  this.appeal.hasAppeal = true;
  this.appeal.appealedAt = new Date();
  this.appeal.appealReason = appealReason;
  this.appeal.appealNotes = appealNotes;
  this.appeal.appealDecision = 'pending';
  
  await this.save();
  return this;
};

// Method: Resolve appeal
moderationResultSchema.methods.resolveAppeal = async function(reviewerId, decision, resolution) {
  this.appeal.appealReviewer = reviewerId;
  this.appeal.appealDecision = decision;
  this.appeal.appealResolution = resolution;
  this.appeal.appealResolvedAt = new Date();
  
  if (decision === 'overturned') {
    await this.approve(reviewerId, `Appeal overturned: ${resolution}`);
  } else {
    this.status = 'rejected';
    await this.save();
  }
  
  return this;
};

// Method: Apply action to creator
moderationResultSchema.methods.applyCreatorAction = async function(actionType, reason, appliedBy) {
  this.action.type = actionType;
  this.action.reason = reason;
  this.action.appliedAt = new Date();
  this.action.appliedBy = appliedBy;
  
  // Set expiration for temporary actions
  if (actionType === 'shadowban' || actionType === 'account_suspended') {
    this.action.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  await this.save();
  
  // Apply to user's Strike model
  const Strike = mongoose.model('Strike');
  await Strike.create({
    userId: this.creatorId,
    contentId: this.contentId,
    type: actionType,
    reason: reason,
    issuedBy: appliedBy
  });
  
  return this;
};

// Static: Get pending reviews
moderationResultSchema.statics.getPendingReviews = async function(limit = 50) {
  return this.find({
    'manualReview.required': true,
    'manualReview.completed': false
  })
  .sort({ createdAt: 1 })  // FIFO
  .limit(limit)
  .populate('contentId', 'type caption media thumbnails')
  .populate('creatorId', 'username fullName avatar');
};

// Static: Get pending appeals
moderationResultSchema.statics.getPendingAppeals = async function(limit = 50) {
  return this.find({
    'appeal.hasAppeal': true,
    'appeal.appealDecision': 'pending'
  })
  .sort({ 'appeal.appealedAt': 1 })
  .limit(limit)
  .populate('contentId', 'type caption media thumbnails')
  .populate('creatorId', 'username fullName avatar');
};

// Static: Get high-risk content
moderationResultSchema.statics.getHighRisk = async function(threshold = 70, limit = 50) {
  const results = await this.find({
    status: { $in: ['pending', 'flagged'] }
  })
  .limit(limit * 2)  // Get more to filter
  .populate('contentId', 'type caption media thumbnails')
  .populate('creatorId', 'username fullName avatar');
  
  // Filter by risk score (virtual)
  return results
    .filter(r => r.riskScore >= threshold)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
};

// Static: Get moderation stats
moderationResultSchema.statics.getStats = async function(timeRange = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const automated = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$automated.decision',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$automated.confidence' }
      }
    }
  ]);
  
  return { stats, automated };
};

module.exports = mongoose.model('ModerationResult', moderationResultSchema);
