const AIModeration = require('../models/AIModeration');
const User = require('../models/User');

/**
 * AI Moderation Service
 * 
 * Handles automated content moderation using AI/ML to detect
 * inappropriate content, toxic behavior, and policy violations.
 */

class AIModerationService {
  /**
   * Moderate content automatically
   * @param {String} contentType - Type of content
   * @param {ObjectId} contentId - Content ID
   * @param {ObjectId} contentOwner - Owner user ID
   * @param {String} contentUrl - URL to content
   * @returns {Object} Moderation result
   */
  async moderateContent(contentType, contentId, contentOwner, contentUrl) {
    try {
      const startTime = Date.now();
      
      // Check if already moderated
      let moderation = await AIModeration.findOne({ contentType, contentId });
      
      if (!moderation) {
        moderation = new AIModeration({
          contentType,
          contentId,
          contentOwner,
          status: 'processing'
        });
      } else if (moderation.status === 'completed') {
        return { success: true, moderation };
      } else {
        moderation.status = 'processing';
      }
      
      // Get user history for context
      const userHistory = await this._getUserHistory(contentOwner);
      moderation.userHistory = userHistory;
      
      await moderation.save();
      
      // Run AI moderation checks
      const results = await this._runModerationAnalysis(contentType, contentUrl);
      
      // Update moderation with results
      moderation.nsfwDetection = results.nsfwDetection;
      moderation.toxicityDetection = results.toxicityDetection;
      moderation.spamDetection = results.spamDetection;
      moderation.violenceDetection = results.violenceDetection;
      moderation.copyrightDetection = results.copyrightDetection;
      moderation.misinformationDetection = results.misinformationDetection;
      moderation.minorSafetyDetection = results.minorSafetyDetection;
      moderation.aiModel = results.aiModel;
      
      // Calculate risk score and determine action
      moderation.calculateRiskScore();
      
      // Apply automated actions if needed
      await this._applyAutomatedActions(moderation);
      
      // Processing completed
      moderation.status = 'completed';
      moderation.processingTime = Date.now() - startTime;
      
      await moderation.save();
      
      // Send notifications if needed
      await this._sendNotifications(moderation);
      
      return {
        success: true,
        moderation,
        action: moderation.riskAssessment.recommendedAction,
        riskLevel: moderation.riskAssessment.riskLevel
      };
      
    } catch (error) {
      console.error('AI moderation error:', error);
      
      if (moderation) {
        moderation.status = 'failed';
        moderation.errorMessage = error.message;
        await moderation.save();
      }
      
      throw error;
    }
  }
  
  /**
   * Get user's violation history
   * @private
   */
  async _getUserHistory(userId) {
    const violations = await AIModeration.getUserViolations(userId);
    
    const violationTypes = new Set();
    violations.forEach(v => {
      if (v.nsfwDetection.isNSFW) violationTypes.add('nsfw');
      if (v.toxicityDetection.isToxic) violationTypes.add('toxic');
      if (v.spamDetection.isSpam) violationTypes.add('spam');
      if (v.violenceDetection.hasViolence) violationTypes.add('violence');
    });
    
    const user = await User.findById(userId);
    const accountAge = user ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      previousViolations: violations.length,
      violationTypes: Array.from(violationTypes),
      accountAge,
      contentCount: user?.stats?.totalPosts || 0,
      reportCount: user?.stats?.reportCount || 0,
      strikes: user?.strikes || 0
    };
  }
  
  /**
   * Run AI moderation analysis (simulated)
   * @private
   */
  async _runModerationAnalysis(contentType, contentUrl) {
    // In production, integrate with:
    // - OpenAI Moderation API
    // - Perspective API (toxicity)
    // - AWS Rekognition (NSFW, violence)
    // - Google SafeSearch
    // - Microsoft Content Moderator
    // - Custom ML models
    
    const results = {
      nsfwDetection: {
        isNSFW: false,
        confidence: 0.05,
        categories: [],
        detectedRegions: []
      },
      toxicityDetection: {
        isToxic: false,
        toxicityScore: 0.08,
        categories: [],
        detectedPhrases: [],
        sentiment: 'neutral'
      },
      spamDetection: {
        isSpam: false,
        spamScore: 0.03,
        indicators: [],
        suspiciousLinks: []
      },
      violenceDetection: {
        hasViolence: false,
        violenceScore: 0.02,
        types: []
      },
      copyrightDetection: {
        hasCopyright: false,
        confidence: 0.01,
        matches: []
      },
      misinformationDetection: {
        isMisinformation: false,
        confidence: 0.02,
        categories: [],
        factCheckResults: []
      },
      minorSafetyDetection: {
        hasMinors: false,
        confidence: 0.0,
        concerns: []
      },
      aiModel: {
        name: 'MixilloModeration',
        version: '1.0.0',
        provider: 'internal'
      }
    };
    
    // Simulate some random detection for testing
    const randomCheck = Math.random();
    
    if (randomCheck > 0.95) {
      // Simulate NSFW detection (5% chance)
      results.nsfwDetection = {
        isNSFW: true,
        confidence: 0.85,
        categories: [
          { category: 'nudity', confidence: 0.85, timestamp: 0, frames: [10, 25, 40] }
        ],
        detectedRegions: [
          { x: 100, y: 200, width: 150, height: 200, category: 'nudity', confidence: 0.85 }
        ]
      };
    } else if (randomCheck > 0.90) {
      // Simulate toxicity detection (5% chance)
      results.toxicityDetection = {
        isToxic: true,
        toxicityScore: 0.78,
        categories: [
          { category: 'profanity', score: 0.78 }
        ],
        detectedPhrases: [
          { phrase: 'offensive language', category: 'profanity', severity: 'medium' }
        ],
        sentiment: 'negative'
      };
    } else if (randomCheck > 0.85) {
      // Simulate spam detection (5% chance)
      results.spamDetection = {
        isSpam: true,
        spamScore: 0.82,
        indicators: [
          { indicator: 'repetitive_text', confidence: 0.82 }
        ],
        suspiciousLinks: [
          { url: 'http://suspicious-site.com', category: 'scam', trustScore: 0.15 }
        ]
      };
    }
    
    return results;
  }
  
  /**
   * Apply automated actions based on risk assessment
   * @private
   */
  async _applyAutomatedActions(moderation) {
    const action = moderation.riskAssessment.recommendedAction;
    const riskLevel = moderation.riskAssessment.riskLevel;
    
    switch (action) {
      case 'remove':
        await moderation.addAutomatedAction('removed', `High risk content (${riskLevel})`);
        // In production: Actually remove or hide the content
        break;
        
      case 'restrict':
        await moderation.addAutomatedAction('age_restricted', `Medium risk content (${riskLevel})`);
        // In production: Add age restriction or geographic blocks
        break;
        
      case 'flag':
        await moderation.addAutomatedAction('flagged', `Low risk content flagged for tracking (${riskLevel})`);
        break;
        
      case 'ban_user':
        await moderation.addAutomatedAction('removed', `Critical violation - user ban recommended`);
        // In production: Trigger user ban workflow
        break;
    }
  }
  
  /**
   * Send notifications for moderation actions
   * @private
   */
  async _sendNotifications(moderation) {
    const riskLevel = moderation.riskAssessment.riskLevel;
    
    // Notify user if action was taken
    if (['high_risk', 'critical'].includes(riskLevel)) {
      moderation.notificationSent.toUser = true;
      // In production: Send actual notification via Socket.io or email
    }
    
    // Notify moderators if human review needed
    if (moderation.humanReview.required) {
      moderation.notificationSent.toModerators = true;
      // In production: Notify moderation team
    }
    
    moderation.notificationSent.sentAt = new Date();
    await moderation.save();
  }
  
  /**
   * Get moderation for content
   */
  async getModerationForContent(contentType, contentId) {
    const moderation = await AIModeration.getModerationForContent(contentType, contentId);
    return { success: true, moderation };
  }
  
  /**
   * Get content needing human review
   */
  async getContentNeedingReview(priority = null) {
    const content = await AIModeration.getContentNeedingReview(priority);
    return { success: true, content, count: content.length };
  }
  
  /**
   * Get flagged content by violation type
   */
  async getFlaggedContent(violationType) {
    const content = await AIModeration.getFlaggedContent(violationType);
    return { success: true, content, count: content.length };
  }
  
  /**
   * Submit human review decision
   */
  async submitReview(moderationId, reviewerId, decision, notes) {
    const moderation = await AIModeration.findOne({ moderationId });
    
    if (!moderation) {
      throw new Error('Moderation not found');
    }
    
    moderation.humanReview.reviewedBy = reviewerId;
    moderation.humanReview.reviewedAt = new Date();
    moderation.humanReview.reviewDecision = decision;
    moderation.humanReview.reviewNotes = notes;
    
    // Check if reviewer agreed with AI
    const aiAction = moderation.riskAssessment.recommendedAction;
    moderation.humanReview.agreedWithAI = (
      (decision === 'approved' && aiAction === 'allow') ||
      (decision === 'rejected' && ['remove', 'ban_user'].includes(aiAction))
    );
    
    moderation.humanReview.required = false;
    moderation.status = 'completed';
    
    await moderation.save();
    
    return { success: true, moderation };
  }
  
  /**
   * Submit appeal
   */
  async submitAppeal(moderationId, userId, reason) {
    const moderation = await AIModeration.findOne({ moderationId });
    
    if (!moderation) {
      throw new Error('Moderation not found');
    }
    
    await moderation.submitAppeal(userId, reason);
    
    return { success: true, moderation };
  }
  
  /**
   * Review appeal
   */
  async reviewAppeal(moderationId, appealIndex, reviewerId, decision, decisionReason) {
    const moderation = await AIModeration.findOne({ moderationId });
    
    if (!moderation) {
      throw new Error('Moderation not found');
    }
    
    if (!moderation.appeals[appealIndex]) {
      throw new Error('Appeal not found');
    }
    
    moderation.appeals[appealIndex].status = decision === 'accepted' ? 'accepted' : 'rejected';
    moderation.appeals[appealIndex].reviewedBy = reviewerId;
    moderation.appeals[appealIndex].reviewedAt = new Date();
    moderation.appeals[appealIndex].decision = decision;
    moderation.appeals[appealIndex].decisionReason = decisionReason;
    
    // If appeal accepted, reverse some automated actions
    if (decision === 'accepted') {
      const reversibleActions = moderation.automatedActions.filter(a => a.reversible);
      // In production: Actually reverse the actions
    }
    
    await moderation.save();
    
    return { success: true, moderation };
  }
  
  /**
   * Get pending appeals
   */
  async getPendingAppeals() {
    const appeals = await AIModeration.getPendingAppeals();
    return { success: true, appeals, count: appeals.length };
  }
  
  /**
   * Get moderation statistics
   */
  async getModerationStats(days = 30) {
    const stats = await AIModeration.getModerationStats(days);
    return { success: true, stats: stats[0] || {} };
  }
  
  /**
   * Get user violations
   */
  async getUserViolations(userId) {
    const violations = await AIModeration.getUserViolations(userId);
    return { success: true, violations, count: violations.length };
  }
  
  /**
   * Batch moderate multiple content items
   */
  async batchModerate(contentItems) {
    const results = [];
    
    for (const item of contentItems) {
      try {
        const result = await this.moderateContent(
          item.contentType,
          item.contentId,
          item.contentOwner,
          item.contentUrl
        );
        results.push({ ...item, success: true, result });
      } catch (error) {
        results.push({ ...item, success: false, error: error.message });
      }
    }
    
    return {
      success: true,
      moderated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
  
  /**
   * Mark for human review
   */
  async markForReview(moderationId, priority = 'medium') {
    const moderation = await AIModeration.findOne({ moderationId });
    
    if (!moderation) {
      throw new Error('Moderation not found');
    }
    
    await moderation.markForReview(priority);
    
    return { success: true, moderation };
  }
  
  /**
   * Get moderation dashboard stats
   */
  async getDashboardStats() {
    const stats = await AIModeration.getModerationStats(30);
    const needsReview = await AIModeration.getContentNeedingReview();
    const pendingAppeals = await AIModeration.getPendingAppeals();
    
    return {
      success: true,
      stats: {
        last30Days: stats[0] || {},
        needsReview: needsReview.length,
        pendingAppeals: pendingAppeals.length
      }
    };
  }
}

module.exports = new AIModerationService();
