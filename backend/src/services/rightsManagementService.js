const ContentRights = require('../models/ContentRights');
const Sound = require('../models/Sound');
const Content = require('../models/Content');
const Strike = require('../models/Strike');

/**
 * Rights Management Service
 * 
 * Handles audio fingerprinting, copyright detection, royalty calculation,
 * and automated enforcement for music rights in user-generated content.
 * 
 * Key Features:
 * - Audio fingerprinting and matching
 * - Automated copyright detection
 * - Royalty calculation and distribution
 * - Strike management for repeat infringers
 * - Batch processing for catalog matching
 */

class RightsManagementService {
  /**
   * Scan content for copyrighted audio
   */
  static async scanContent(contentId) {
    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new Error('Content not found');
      }
      
      const startTime = Date.now();
      
      // Generate audio fingerprint
      const fingerprint = await this.generateFingerprint(content.videoUrl);
      
      // Check against licensed music catalog
      const detections = await this.matchAgainstCatalog(fingerprint);
      
      // Create or update ContentRights record
      let rights = await ContentRights.findOne({ content: contentId });
      
      if (!rights) {
        rights = new ContentRights({
          content: contentId,
          audioFingerprint: fingerprint,
          status: detections.length > 0 ? 'claimed' : 'clear'
        });
      } else {
        rights.audioFingerprint = fingerprint;
      }
      
      // Add detected music
      rights.detectedMusic = detections;
      
      // Add scan to history
      rights.scanHistory.push({
        scannedAt: new Date(),
        method: 'fingerprint',
        detections: detections.length,
        processingTime: Date.now() - startTime
      });
      
      // Auto-file claims for detected music
      for (const detection of detections) {
        if (detection.matchConfidence >= 0.85) {
          await this.autoFileClaim(rights, detection);
        }
      }
      
      await rights.save();
      
      return {
        contentId,
        fingerprint,
        detections: detections.length,
        status: rights.status,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error scanning content:', error);
      throw error;
    }
  }
  
  /**
   * Generate audio fingerprint from video
   * In production, integrate with Chromaprint, AcoustID, or similar
   */
  static async generateFingerprint(videoUrl) {
    // Placeholder implementation
    // In production, this would:
    // 1. Extract audio track from video using FFmpeg
    // 2. Generate chromaprint fingerprint
    // 3. Return compact hash representation
    
    // Simulate fingerprint generation
    const mockFingerprint = Buffer.from(videoUrl).toString('base64').substring(0, 64);
    
    return mockFingerprint;
  }
  
  /**
   * Match fingerprint against licensed music catalog
   */
  static async matchAgainstCatalog(fingerprint) {
    // Get all sounds in catalog
    const catalogSounds = await Sound.find({
      copyrighted: true,
      fingerprint: { $exists: true }
    }).select('title artist fingerprint copyrightInfo');
    
    const matches = [];
    
    for (const sound of catalogSounds) {
      const similarity = this.calculateSimilarity(fingerprint, sound.fingerprint);
      
      if (similarity >= 0.75) {
        matches.push({
          soundId: sound._id,
          title: sound.title,
          artist: sound.artist,
          matchConfidence: similarity,
          startTime: 0, // In production, detect exact timestamp
          duration: 30,  // In production, detect exact duration
          fingerprint: sound.fingerprint
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Calculate similarity between two fingerprints
   */
  static calculateSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;
    
    // Simplified Hamming distance for demo
    // In production, use proper audio fingerprint matching (Chromaprint)
    let matches = 0;
    const len = Math.min(fp1.length, fp2.length);
    
    for (let i = 0; i < len; i++) {
      if (fp1[i] === fp2[i]) matches++;
    }
    
    return matches / Math.max(fp1.length, fp2.length);
  }
  
  /**
   * Automatically file copyright claim
   */
  static async autoFileClaim(rights, detection) {
    const sound = await Sound.findById(detection.soundId);
    if (!sound || !sound.copyrightInfo) {
      return null;
    }
    
    const claimData = {
      rightsHolder: {
        name: sound.copyrightInfo.owner || 'Unknown',
        contactEmail: sound.copyrightInfo.contactEmail,
        organizationId: sound.copyrightInfo.organizationId
      },
      claimedMusic: {
        title: sound.title,
        artist: sound.artist,
        isrc: sound.isrc,
        catalog: sound.copyrightInfo.catalogNumber
      },
      claimType: 'audio',
      action: sound.copyrightInfo.policy || 'monetize',
      rightsHolderPercentage: sound.copyrightInfo.revenueShare || 50,
      creatorPercentage: 100 - (sound.copyrightInfo.revenueShare || 50),
      territories: sound.copyrightInfo.territories || [],
      automated: true
    };
    
    const claim = await rights.addClaim(claimData);
    
    // Apply enforcement action if needed
    if (claim.action === 'block' || claim.action === 'mute') {
      await this.applyEnforcementAction(rights, claim);
    }
    
    return claim;
  }
  
  /**
   * Apply enforcement action to content
   */
  static async applyEnforcementAction(rights, claim) {
    const content = await Content.findById(rights.content);
    if (!content) return;
    
    if (claim.action === 'block') {
      content.status = 'blocked';
      content.blockReason = `Copyright claim by ${claim.rightsHolder.name}`;
      
      rights.enforcement.actions.push({
        actionType: 'content_blocked',
        reason: `Copyright infringement: ${claim.claimedMusic.title}`,
        claimId: claim.claimId
      });
      
      // Issue strike to creator
      await this.issueStrike(content.creator, {
        type: 'copyright',
        reason: `Used copyrighted music: ${claim.claimedMusic.title}`,
        contentId: content._id,
        claimId: claim.claimId
      });
      
      rights.enforcement.strikes += 1;
      
    } else if (claim.action === 'mute') {
      // In production, trigger audio removal from video
      content.audioRemoved = true;
      
      rights.enforcement.actions.push({
        actionType: 'audio_muted',
        reason: `Copyright infringement: ${claim.claimedMusic.title}`,
        claimId: claim.claimId
      });
    }
    
    await content.save();
    await rights.save();
  }
  
  /**
   * Issue copyright strike to user
   */
  static async issueStrike(userId, strikeData) {
    const strike = new Strike({
      user: userId,
      type: strikeData.type,
      reason: strikeData.reason,
      relatedContent: strikeData.contentId,
      severity: 'high',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      metadata: {
        claimId: strikeData.claimId
      }
    });
    
    await strike.save();
    
    // Check if user should be suspended (3 strikes)
    const activeStrikes = await Strike.countDocuments({
      user: userId,
      type: 'copyright',
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
    
    if (activeStrikes >= 3) {
      // Suspend user account
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        suspended: true,
        suspensionReason: 'Multiple copyright violations',
        suspendedUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
    }
    
    return strike;
  }
  
  /**
   * Calculate royalties for content
   */
  static async calculateRoyalties(contentId, views, revenue) {
    const rights = await ContentRights.findOne({ content: contentId });
    if (!rights) return null;
    
    // Update usage stats
    await rights.updateUsageStats(views, views, revenue);
    
    // Calculate revenue distribution
    const distribution = await rights.calculateRoyalties(revenue);
    
    return distribution;
  }
  
  /**
   * Process batch royalty payouts
   */
  static async processBatchPayouts(rightsHolderId, period) {
    const rights = await ContentRights.find({
      'claims.rightsHolder.organizationId': rightsHolderId,
      'claims.status': 'active',
      'royalties.pendingPayout': { $gt: 0 }
    });
    
    let totalPayout = 0;
    const payouts = [];
    
    for (const right of rights) {
      if (right.royalties.pendingPayout > 0) {
        const payout = await right.processPayout({
          rightsHolderId,
          amount: right.royalties.pendingPayout,
          period
        });
        
        totalPayout += payout.amount;
        payouts.push({
          contentId: right.content,
          payoutId: payout.payoutId,
          amount: payout.amount
        });
      }
    }
    
    return {
      rightsHolderId,
      totalPayout,
      payoutsProcessed: payouts.length,
      payouts
    };
  }
  
  /**
   * Validate music license for content
   */
  static async validateLicense(contentId, soundId) {
    const sound = await Sound.findById(soundId);
    if (!sound) {
      throw new Error('Sound not found');
    }
    
    // Check if sound is in platform library (royalty-free)
    if (sound.platformLibrary) {
      let rights = await ContentRights.findOne({ content: contentId });
      
      if (!rights) {
        rights = new ContentRights({
          content: contentId,
          status: 'licensed'
        });
      }
      
      rights.license = {
        soundId: sound._id,
        licenseType: 'platform_library',
        terms: {
          attribution: sound.attribution || false,
          commercial: true,
          modifications: true,
          territory: []
        },
        licensor: 'Platform',
        licenseUrl: sound.licenseUrl
      };
      
      await rights.save();
      
      return {
        valid: true,
        license: rights.license
      };
    }
    
    // Check if user has valid license
    if (sound.requiresLicense && !sound.copyrighted) {
      return {
        valid: false,
        reason: 'License required',
        licenseUrl: sound.licenseUrl
      };
    }
    
    return {
      valid: true,
      warnings: sound.copyrighted ? ['Copyrighted music - may be claimed'] : []
    };
  }
  
  /**
   * Get rights status for multiple contents
   */
  static async getBatchStatus(contentIds) {
    const rights = await ContentRights.find({
      content: { $in: contentIds }
    }).select('content status claims detectedMusic');
    
    const statusMap = {};
    
    for (const right of rights) {
      statusMap[right.content] = {
        status: right.status,
        claims: right.claims.length,
        detectedMusic: right.detectedMusic.length,
        canMonetize: right.canMonetize()
      };
    }
    
    // Add missing content
    for (const contentId of contentIds) {
      if (!statusMap[contentId]) {
        statusMap[contentId] = {
          status: 'pending_scan',
          claims: 0,
          detectedMusic: 0,
          canMonetize: true
        };
      }
    }
    
    return statusMap;
  }
  
  /**
   * Bulk scan content for copyright
   */
  static async bulkScan(contentIds, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < contentIds.length; i += batchSize) {
      const batch = contentIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(contentId => 
        this.scanContent(contentId).catch(error => ({
          contentId,
          error: error.message,
          success: false
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting
      if (i + batchSize < contentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
      total: contentIds.length,
      successful: results.filter(r => r.success !== false).length,
      failed: results.filter(r => r.success === false).length,
      results
    };
  }
}

module.exports = RightsManagementService;
