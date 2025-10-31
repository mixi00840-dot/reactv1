const mongoose = require('mongoose');

/**
 * ContentRights Model
 * 
 * Manages audio rights, royalty tracking, and copyright enforcement
 * for music used in content. Includes audio fingerprinting, automated
 * detection, revenue sharing, and dispute resolution.
 * 
 * Key Features:
 * - Audio fingerprinting with similarity matching
 * - Automated royalty calculation and distribution
 * - Copyright claim and dispute management
 * - Strike system for repeat infringers
 * - Licensed music catalog with usage tracking
 * - Revenue sharing across multiple rights holders
 */

const contentRightsSchema = new mongoose.Schema({
  // Content Reference
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  // Audio Identification
  audioFingerprint: {
    type: String, // Chromaprint or similar fingerprint hash
    index: true
  },
  
  detectedMusic: [{
    soundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sound'
    },
    title: String,
    artist: String,
    matchConfidence: {
      type: Number,
      min: 0,
      max: 1
    }, // 0-1 similarity score
    startTime: Number, // seconds into video
    duration: Number, // seconds
    fingerprint: String
  }],
  
  // Rights Status
  status: {
    type: String,
    enum: [
      'pending_scan',      // Awaiting audio analysis
      'clear',             // No copyrighted music detected
      'licensed',          // Using licensed/royalty-free music
      'claimed',           // Copyright claim filed
      'disputed',          // Creator disputed claim
      'monetized_shared',  // Revenue sharing active
      'blocked',           // Content blocked due to rights
      'muted'             // Audio track removed
    ],
    default: 'pending_scan',
    index: true
  },
  
  // Copyright Claims
  claims: [{
    claimId: {
      type: String,
      unique: true,
      sparse: true
    },
    
    rightsHolder: {
      name: String,
      contactEmail: String,
      organizationId: mongoose.Schema.Types.ObjectId
    },
    
    claimedMusic: {
      title: String,
      artist: String,
      isrc: String, // International Standard Recording Code
      catalog: String
    },
    
    claimType: {
      type: String,
      enum: ['audio', 'composition', 'both']
    },
    
    action: {
      type: String,
      enum: ['monetize', 'track', 'block', 'mute'],
      default: 'monetize'
    },
    
    // Revenue Sharing (if monetized)
    revenueShare: {
      rightsHolderPercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      creatorPercentage: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    
    territories: [String], // ISO country codes, empty = worldwide
    
    claimDate: {
      type: Date,
      default: Date.now
    },
    
    status: {
      type: String,
      enum: ['active', 'disputed', 'released', 'expired'],
      default: 'active'
    },
    
    automated: {
      type: Boolean,
      default: true
    }
  }],
  
  // Disputes
  disputes: [{
    disputeId: String,
    claimId: String,
    
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    reason: {
      type: String,
      enum: [
        'public_domain',
        'fair_use',
        'licensed',
        'original_content',
        'misidentified',
        'other'
      ],
      required: true
    },
    
    explanation: String,
    
    supportingDocuments: [{
      type: String,
      url: String,
      uploadDate: Date
    }],
    
    status: {
      type: String,
      enum: ['pending', 'under_review', 'upheld', 'rejected'],
      default: 'pending'
    },
    
    resolution: {
      decision: String,
      reason: String,
      decidedBy: mongoose.Schema.Types.ObjectId,
      decidedAt: Date
    },
    
    filedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Licensed Music Usage
  license: {
    soundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sound'
    },
    
    licenseType: {
      type: String,
      enum: ['platform_library', 'creator_uploaded', 'third_party', 'royalty_free']
    },
    
    terms: {
      attribution: Boolean,
      commercial: Boolean,
      modifications: Boolean,
      territory: [String]
    },
    
    licensor: String,
    licenseUrl: String,
    expiresAt: Date
  },
  
  // Royalty Tracking
  royalties: {
    totalEarned: {
      type: Number,
      default: 0
    },
    
    totalPaidOut: {
      type: Number,
      default: 0
    },
    
    pendingPayout: {
      type: Number,
      default: 0
    },
    
    lastCalculatedAt: Date,
    
    payouts: [{
      payoutId: String,
      rightsHolderId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        start: Date,
        end: Date
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed']
      },
      paidAt: Date
    }]
  },
  
  // Enforcement Actions
  enforcement: {
    strikes: {
      type: Number,
      default: 0
    },
    
    actions: [{
      actionType: {
        type: String,
        enum: ['warning', 'content_blocked', 'audio_muted', 'account_strike', 'account_suspended']
      },
      reason: String,
      claimId: String,
      takenAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }],
    
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'denied']
    }
  },
  
  // Analytics
  usageStats: {
    views: {
      type: Number,
      default: 0
    },
    
    monetizableViews: {
      type: Number,
      default: 0
    },
    
    estimatedRevenue: {
      type: Number,
      default: 0
    },
    
    lastUpdated: Date
  },
  
  // Audit Trail
  scanHistory: [{
    scannedAt: Date,
    method: String, // 'fingerprint', 'metadata', 'manual'
    detections: Number,
    processingTime: Number // milliseconds
  }],
  
  notes: String

}, {
  timestamps: true
});

// Indexes for efficient querying
contentRightsSchema.index({ status: 1, createdAt: -1 });
contentRightsSchema.index({ 'claims.rightsHolder.organizationId': 1 });
contentRightsSchema.index({ 'claims.status': 1 });
contentRightsSchema.index({ 'disputes.status': 1 });
contentRightsSchema.index({ audioFingerprint: 1 });

// ============= INSTANCE METHODS =============

/**
 * Add a copyright claim to content
 */
contentRightsSchema.methods.addClaim = async function(claimData) {
  const claimId = `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const claim = {
    claimId,
    rightsHolder: claimData.rightsHolder,
    claimedMusic: claimData.claimedMusic,
    claimType: claimData.claimType || 'audio',
    action: claimData.action || 'monetize',
    territories: claimData.territories || [],
    automated: claimData.automated !== false
  };
  
  // Set revenue sharing if monetizing
  if (claim.action === 'monetize') {
    claim.revenueShare = {
      rightsHolderPercentage: claimData.rightsHolderPercentage || 50,
      creatorPercentage: claimData.creatorPercentage || 50
    };
  }
  
  this.claims.push(claim);
  
  // Update status based on action
  if (claim.action === 'block') {
    this.status = 'blocked';
  } else if (claim.action === 'mute') {
    this.status = 'muted';
  } else if (claim.action === 'monetize') {
    this.status = 'monetized_shared';
  } else {
    this.status = 'claimed';
  }
  
  await this.save();
  
  return claim;
};

/**
 * File a dispute against a claim
 */
contentRightsSchema.methods.fileDispute = async function(claimId, disputeData) {
  const claim = this.claims.find(c => c.claimId === claimId);
  if (!claim) {
    throw new Error('Claim not found');
  }
  
  const disputeId = `DISPUTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const dispute = {
    disputeId,
    claimId,
    disputedBy: disputeData.disputedBy,
    reason: disputeData.reason,
    explanation: disputeData.explanation,
    supportingDocuments: disputeData.supportingDocuments || []
  };
  
  this.disputes.push(dispute);
  claim.status = 'disputed';
  this.status = 'disputed';
  
  await this.save();
  
  return dispute;
};

/**
 * Resolve a dispute
 */
contentRightsSchema.methods.resolveDispute = async function(disputeId, resolution) {
  const dispute = this.disputes.find(d => d.disputeId === disputeId);
  if (!dispute) {
    throw new Error('Dispute not found');
  }
  
  dispute.status = resolution.upheld ? 'upheld' : 'rejected';
  dispute.resolution = {
    decision: resolution.decision,
    reason: resolution.reason,
    decidedBy: resolution.decidedBy,
    decidedAt: new Date()
  };
  
  const claim = this.claims.find(c => c.claimId === dispute.claimId);
  
  if (resolution.upheld) {
    // Dispute upheld - release claim
    if (claim) {
      claim.status = 'released';
    }
    this.status = 'clear';
  } else {
    // Dispute rejected - restore claim
    if (claim) {
      claim.status = 'active';
      
      if (claim.action === 'block') {
        this.status = 'blocked';
      } else if (claim.action === 'mute') {
        this.status = 'muted';
      } else if (claim.action === 'monetize') {
        this.status = 'monetized_shared';
      }
    }
    
    // Issue strike for false dispute
    this.enforcement.strikes += 1;
    this.enforcement.actions.push({
      actionType: 'account_strike',
      reason: 'False copyright dispute',
      claimId: dispute.claimId
    });
  }
  
  await this.save();
  
  return dispute;
};

/**
 * Calculate royalties based on views and revenue share
 */
contentRightsSchema.methods.calculateRoyalties = async function(viewRevenue) {
  const activeClaims = this.claims.filter(c => c.status === 'active' && c.action === 'monetize');
  
  if (activeClaims.length === 0) {
    return { totalEarned: 0, distributions: [] };
  }
  
  const distributions = [];
  let totalRightsHolderShare = 0;
  
  for (const claim of activeClaims) {
    const rightsHolderAmount = viewRevenue * (claim.revenueShare.rightsHolderPercentage / 100);
    
    distributions.push({
      claimId: claim.claimId,
      rightsHolderId: claim.rightsHolder.organizationId,
      rightsHolderName: claim.rightsHolder.name,
      amount: rightsHolderAmount,
      percentage: claim.revenueShare.rightsHolderPercentage
    });
    
    totalRightsHolderShare += rightsHolderAmount;
  }
  
  // Update totals
  this.royalties.totalEarned += totalRightsHolderShare;
  this.royalties.pendingPayout += totalRightsHolderShare;
  this.royalties.lastCalculatedAt = new Date();
  
  await this.save();
  
  return {
    totalEarned: totalRightsHolderShare,
    creatorShare: viewRevenue - totalRightsHolderShare,
    distributions
  };
};

/**
 * Process royalty payout
 */
contentRightsSchema.methods.processPayout = async function(payoutData) {
  const payout = {
    payoutId: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    rightsHolderId: payoutData.rightsHolderId,
    amount: payoutData.amount,
    currency: payoutData.currency || 'USD',
    period: payoutData.period,
    status: 'completed',
    paidAt: new Date()
  };
  
  this.royalties.payouts.push(payout);
  this.royalties.totalPaidOut += payoutData.amount;
  this.royalties.pendingPayout -= payoutData.amount;
  
  await this.save();
  
  return payout;
};

/**
 * Update usage statistics
 */
contentRightsSchema.methods.updateUsageStats = async function(views, monetizableViews, revenue) {
  this.usageStats.views = views;
  this.usageStats.monetizableViews = monetizableViews;
  this.usageStats.estimatedRevenue = revenue;
  this.usageStats.lastUpdated = new Date();
  
  await this.save();
};

/**
 * Check if content can be monetized
 */
contentRightsSchema.methods.canMonetize = function() {
  if (this.status === 'blocked' || this.status === 'muted') {
    return false;
  }
  
  if (this.enforcement.strikes >= 3) {
    return false;
  }
  
  return true;
};

// ============= STATIC METHODS =============

/**
 * Find content by audio fingerprint
 */
contentRightsSchema.statics.findByFingerprint = async function(fingerprint, threshold = 0.85) {
  // In production, use specialized fingerprint matching algorithm
  // This is a simplified version
  return this.find({
    audioFingerprint: { $exists: true }
  }).then(results => {
    return results.filter(result => {
      // Simplified similarity check - replace with actual algorithm
      const similarity = calculateFingerprintSimilarity(fingerprint, result.audioFingerprint);
      return similarity >= threshold;
    });
  });
};

/**
 * Get pending claims for review
 */
contentRightsSchema.statics.getPendingClaims = async function(limit = 50) {
  return this.find({
    'claims.status': 'active',
    'claims.automated': true
  })
  .populate('content', 'title creator views')
  .sort({ 'claims.claimDate': 1 })
  .limit(limit);
};

/**
 * Get active disputes
 */
contentRightsSchema.statics.getActiveDisputes = async function(status = 'pending') {
  return this.find({
    'disputes.status': status
  })
  .populate('content', 'title creator')
  .populate('disputes.disputedBy', 'username email')
  .sort({ 'disputes.filedAt': 1 });
};

/**
 * Get royalty report for rights holder
 */
contentRightsSchema.statics.getRoyaltyReport = async function(rightsHolderId, startDate, endDate) {
  const rights = await this.find({
    'claims.rightsHolder.organizationId': rightsHolderId,
    'claims.status': 'active',
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('content', 'title views createdAt');
  
  const summary = {
    totalContent: rights.length,
    totalViews: 0,
    totalEarned: 0,
    totalPaid: 0,
    pendingPayout: 0,
    contentList: []
  };
  
  for (const right of rights) {
    summary.totalViews += right.usageStats.views;
    summary.totalEarned += right.royalties.totalEarned;
    summary.totalPaid += right.royalties.totalPaidOut;
    summary.pendingPayout += right.royalties.pendingPayout;
    
    summary.contentList.push({
      contentId: right.content._id,
      title: right.content.title,
      views: right.usageStats.views,
      earned: right.royalties.totalEarned,
      paid: right.royalties.totalPaidOut
    });
  }
  
  return summary;
};

// Helper function for fingerprint similarity (placeholder)
function calculateFingerprintSimilarity(fp1, fp2) {
  if (!fp1 || !fp2) return 0;
  
  // Placeholder - in production use chromaprint matching or similar
  // This should compare audio fingerprint hashes and return 0-1 similarity
  const matches = fp1.split('').filter((char, i) => char === fp2[i]).length;
  return matches / Math.max(fp1.length, fp2.length);
}

module.exports = mongoose.model('ContentRights', contentRightsSchema);
