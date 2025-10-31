const mongoose = require('mongoose');

/**
 * AI Moderation Model
 * 
 * Automated content moderation using AI/ML to detect
 * inappropriate content, toxic behavior, and policy violations.
 */

const aiModerationSchema = new mongoose.Schema({
  moderationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Content Reference
  contentType: {
    type: String,
    enum: ['video', 'image', 'audio', 'text', 'comment', 'livestream', 'message', 'profile'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  contentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // NSFW Detection
  nsfwDetection: {
    isNSFW: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    categories: [{
      category: {
        type: String,
        enum: ['nudity', 'sexual', 'violence', 'gore', 'drugs', 'weapons', 'hate_symbols']
      },
      confidence: Number,
      timestamp: Number, // For videos
      frames: [Number] // Frame numbers where detected
    }],
    detectedRegions: [{
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      category: String,
      confidence: Number
    }]
  },
  
  // Toxicity Detection (for text/comments)
  toxicityDetection: {
    isToxic: { type: Boolean, default: false },
    toxicityScore: { type: Number, min: 0, max: 1, default: 0 },
    categories: [{
      category: {
        type: String,
        enum: ['harassment', 'hate_speech', 'profanity', 'sexual_harassment', 'threats', 'bullying', 'spam']
      },
      score: Number
    }],
    detectedPhrases: [{
      phrase: String,
      category: String,
      severity: { type: String, enum: ['low', 'medium', 'high', 'severe'] }
    }],
    sentiment: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
    }
  },
  
  // Spam Detection
  spamDetection: {
    isSpam: { type: Boolean, default: false },
    spamScore: { type: Number, min: 0, max: 1, default: 0 },
    indicators: [{
      indicator: String, // e.g., 'repetitive_text', 'suspicious_links', 'mass_posting'
      confidence: Number
    }],
    suspiciousLinks: [{
      url: String,
      category: String, // phishing, malware, scam, etc.
      trustScore: Number
    }]
  },
  
  // Violence & Gore Detection
  violenceDetection: {
    hasViolence: { type: Boolean, default: false },
    violenceScore: { type: Number, min: 0, max: 1, default: 0 },
    types: [{
      type: String, // physical_violence, weapons, blood, gore
      confidence: Number,
      timestamp: Number,
      severity: { type: String, enum: ['mild', 'moderate', 'severe', 'extreme'] }
    }]
  },
  
  // Copyright/IP Detection
  copyrightDetection: {
    hasCopyright: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    matches: [{
      source: String,
      matchType: String, // video, audio, image, text
      confidence: Number,
      timestamp: Number,
      duration: Number,
      copyrightOwner: String,
      reference: String
    }]
  },
  
  // Misinformation Detection
  misinformationDetection: {
    isMisinformation: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    categories: [{
      category: String, // fake_news, conspiracy, medical_misinfo, political_misinfo
      confidence: Number
    }],
    factCheckResults: [{
      claim: String,
      verdict: String, // true, false, misleading, unverified
      source: String,
      checkedAt: Date
    }]
  },
  
  // Underage Content Detection
  minorSafetyDetection: {
    hasMinors: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    concerns: [{
      concern: String, // inappropriate_context, exploitation_risk, privacy_violation
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      confidence: Number
    }]
  },
  
  // Overall Risk Assessment
  riskAssessment: {
    overallRiskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: {
      type: String,
      enum: ['safe', 'low_risk', 'medium_risk', 'high_risk', 'critical'],
      default: 'safe'
    },
    primaryConcerns: [String],
    recommendedAction: {
      type: String,
      enum: ['allow', 'flag', 'review', 'restrict', 'remove', 'ban_user'],
      default: 'allow'
    }
  },
  
  // Automated Actions Taken
  automatedActions: [{
    action: {
      type: String,
      enum: ['flagged', 'hidden', 'removed', 'age_restricted', 'geographic_blocked', 'demonetized']
    },
    reason: String,
    appliedAt: { type: Date, default: Date.now },
    reversible: { type: Boolean, default: true }
  }],
  
  // Human Review
  humanReview: {
    required: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewDecision: {
      type: String,
      enum: ['approved', 'rejected', 'modified', 'escalated']
    },
    reviewNotes: String,
    agreedWithAI: Boolean
  },
  
  // Appeals
  appeals: [{
    appealedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealedAt: { type: Date, default: Date.now },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'accepted', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: String,
    decisionReason: String
  }],
  
  // AI Model Info
  aiModel: {
    name: String,
    version: String,
    provider: String,
    processedAt: { type: Date, default: Date.now }
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'under_review'],
    default: 'pending'
  },
  processingTime: Number,
  errorMessage: String,
  
  // Confidence Metrics
  overallConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  
  // User History Context
  userHistory: {
    previousViolations: Number,
    violationTypes: [String],
    accountAge: Number, // days
    contentCount: Number,
    reportCount: Number,
    strikes: Number
  },
  
  // Notification Status
  notificationSent: {
    toUser: { type: Boolean, default: false },
    toModerators: { type: Boolean, default: false },
    sentAt: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
aiModerationSchema.index({ contentType: 1, contentId: 1 });
aiModerationSchema.index({ contentOwner: 1 });
aiModerationSchema.index({ status: 1 });
aiModerationSchema.index({ 'riskAssessment.riskLevel': 1 });
aiModerationSchema.index({ 'riskAssessment.recommendedAction': 1 });
aiModerationSchema.index({ 'humanReview.required': 1, 'humanReview.priority': -1 });
aiModerationSchema.index({ 'nsfwDetection.isNSFW': 1 });
aiModerationSchema.index({ 'toxicityDetection.isToxic': 1 });
aiModerationSchema.index({ 'spamDetection.isSpam': 1 });
aiModerationSchema.index({ createdAt: -1 });

// Virtual for content reference
aiModerationSchema.virtual('content', {
  refPath: 'contentType',
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

// Instance Methods

/**
 * Calculate overall risk score
 */
aiModerationSchema.methods.calculateRiskScore = function() {
  let riskScore = 0;
  const weights = {
    nsfw: 30,
    toxicity: 25,
    violence: 30,
    spam: 10,
    copyright: 15,
    misinformation: 20,
    minorSafety: 40
  };
  
  // NSFW risk
  if (this.nsfwDetection.isNSFW) {
    riskScore += weights.nsfw * this.nsfwDetection.confidence;
  }
  
  // Toxicity risk
  if (this.toxicityDetection.isToxic) {
    riskScore += weights.toxicity * this.toxicityDetection.toxicityScore;
  }
  
  // Violence risk
  if (this.violenceDetection.hasViolence) {
    riskScore += weights.violence * this.violenceDetection.violenceScore;
  }
  
  // Spam risk
  if (this.spamDetection.isSpam) {
    riskScore += weights.spam * this.spamDetection.spamScore;
  }
  
  // Copyright risk
  if (this.copyrightDetection.hasCopyright) {
    riskScore += weights.copyright * this.copyrightDetection.confidence;
  }
  
  // Misinformation risk
  if (this.misinformationDetection.isMisinformation) {
    riskScore += weights.misinformation * this.misinformationDetection.confidence;
  }
  
  // Minor safety risk (highest weight)
  if (this.minorSafetyDetection.hasMinors) {
    const criticalConcerns = this.minorSafetyDetection.concerns.filter(c => c.severity === 'critical').length;
    if (criticalConcerns > 0) {
      riskScore += weights.minorSafety;
    } else {
      riskScore += weights.minorSafety * this.minorSafetyDetection.confidence;
    }
  }
  
  // Normalize to 0-100
  this.riskAssessment.overallRiskScore = Math.min(100, riskScore);
  
  // Determine risk level
  if (this.riskAssessment.overallRiskScore >= 80) {
    this.riskAssessment.riskLevel = 'critical';
  } else if (this.riskAssessment.overallRiskScore >= 60) {
    this.riskAssessment.riskLevel = 'high_risk';
  } else if (this.riskAssessment.overallRiskScore >= 40) {
    this.riskAssessment.riskLevel = 'medium_risk';
  } else if (this.riskAssessment.overallRiskScore >= 20) {
    this.riskAssessment.riskLevel = 'low_risk';
  } else {
    this.riskAssessment.riskLevel = 'safe';
  }
  
  // Determine recommended action
  this.determineRecommendedAction();
  
  return this.riskAssessment.overallRiskScore;
};

/**
 * Determine recommended action based on risk
 */
aiModerationSchema.methods.determineRecommendedAction = function() {
  const riskScore = this.riskAssessment.overallRiskScore;
  const userStrikes = this.userHistory.strikes || 0;
  
  // Critical content - immediate removal
  if (this.minorSafetyDetection.concerns.some(c => c.severity === 'critical')) {
    this.riskAssessment.recommendedAction = 'ban_user';
    this.humanReview.required = true;
    this.humanReview.priority = 'urgent';
  }
  // Very high risk
  else if (riskScore >= 80) {
    this.riskAssessment.recommendedAction = userStrikes >= 2 ? 'ban_user' : 'remove';
    this.humanReview.required = true;
    this.humanReview.priority = 'high';
  }
  // High risk
  else if (riskScore >= 60) {
    this.riskAssessment.recommendedAction = 'remove';
    this.humanReview.required = true;
    this.humanReview.priority = 'medium';
  }
  // Medium risk
  else if (riskScore >= 40) {
    this.riskAssessment.recommendedAction = 'restrict';
    this.humanReview.required = true;
    this.humanReview.priority = 'low';
  }
  // Low risk
  else if (riskScore >= 20) {
    this.riskAssessment.recommendedAction = 'flag';
    this.humanReview.required = false;
  }
  // Safe
  else {
    this.riskAssessment.recommendedAction = 'allow';
    this.humanReview.required = false;
  }
};

/**
 * Add automated action
 */
aiModerationSchema.methods.addAutomatedAction = function(action, reason) {
  this.automatedActions.push({
    action,
    reason,
    reversible: action !== 'removed'
  });
  return this.save();
};

/**
 * Submit appeal
 */
aiModerationSchema.methods.submitAppeal = function(userId, reason) {
  this.appeals.push({
    appealedBy: userId,
    reason,
    status: 'pending'
  });
  return this.save();
};

/**
 * Mark for human review
 */
aiModerationSchema.methods.markForReview = function(priority = 'medium') {
  this.humanReview.required = true;
  this.humanReview.priority = priority;
  this.status = 'under_review';
  return this.save();
};

// Static Methods

/**
 * Get moderation for content
 */
aiModerationSchema.statics.getModerationForContent = function(contentType, contentId) {
  return this.findOne({ contentType, contentId })
    .populate('contentOwner', 'username fullName email')
    .populate('humanReview.reviewedBy', 'username fullName');
};

/**
 * Get content needing review
 */
aiModerationSchema.statics.getContentNeedingReview = function(priority = null) {
  const query = { 'humanReview.required': true, status: 'under_review' };
  if (priority) {
    query['humanReview.priority'] = priority;
  }
  
  return this.find(query)
    .sort({ 'humanReview.priority': -1, createdAt: 1 })
    .populate('contentOwner', 'username fullName')
    .populate('content');
};

/**
 * Get flagged content by type
 */
aiModerationSchema.statics.getFlaggedContent = function(violationType) {
  const query = { status: 'completed' };
  
  switch (violationType) {
    case 'nsfw':
      query['nsfwDetection.isNSFW'] = true;
      break;
    case 'toxic':
      query['toxicityDetection.isToxic'] = true;
      break;
    case 'spam':
      query['spamDetection.isSpam'] = true;
      break;
    case 'violence':
      query['violenceDetection.hasViolence'] = true;
      break;
    case 'copyright':
      query['copyrightDetection.hasCopyright'] = true;
      break;
  }
  
  return this.find(query)
    .sort({ 'riskAssessment.overallRiskScore': -1 })
    .populate('contentOwner', 'username fullName');
};

/**
 * Get user violation history
 */
aiModerationSchema.statics.getUserViolations = function(userId) {
  return this.find({
    contentOwner: userId,
    'riskAssessment.riskLevel': { $in: ['high_risk', 'critical'] }
  }).sort({ createdAt: -1 });
};

/**
 * Get moderation statistics
 */
aiModerationSchema.statics.getModerationStats = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: date },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalModerated: { $sum: 1 },
        nsfwCount: {
          $sum: { $cond: ['$nsfwDetection.isNSFW', 1, 0] }
        },
        toxicCount: {
          $sum: { $cond: ['$toxicityDetection.isToxic', 1, 0] }
        },
        spamCount: {
          $sum: { $cond: ['$spamDetection.isSpam', 1, 0] }
        },
        violenceCount: {
          $sum: { $cond: ['$violenceDetection.hasViolence', 1, 0] }
        },
        avgRiskScore: { $avg: '$riskAssessment.overallRiskScore' },
        avgProcessingTime: { $avg: '$processingTime' },
        reviewRequired: {
          $sum: { $cond: ['$humanReview.required', 1, 0] }
        }
      }
    }
  ]);
};

/**
 * Get pending appeals
 */
aiModerationSchema.statics.getPendingAppeals = function() {
  return this.find({
    'appeals.status': 'pending'
  })
    .populate('contentOwner', 'username fullName email')
    .sort({ 'appeals.appealedAt': 1 });
};

const AIModeration = mongoose.model('AIModeration', aiModerationSchema);

module.exports = AIModeration;
