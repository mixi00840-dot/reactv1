const ModerationResult = require('../models/ModerationResult');
const ModerationQueue = require('../models/ModerationQueue');
const Content = require('../models/Content');
const Strike = require('../models/Strike');

/**
 * Automated Moderation Service
 * 
 * Integrates with AI moderation providers:
 * - Image/Video: AWS Rekognition, Google Cloud Vision, Sightengine
 * - Text: Perspective API (Google), Azure Content Moderator
 * - Audio: Custom speech-to-text + text moderation
 * 
 * This service provides a framework for plugging in real AI providers.
 * Current implementation uses rule-based placeholders for demo purposes.
 */

class ModerationService {
  constructor() {
    // Thresholds for auto-actions
    this.thresholds = {
      autoReject: 85,      // Auto-reject if confidence >= 85%
      autoFlag: 60,        // Auto-flag for review if confidence >= 60%
      autoApprove: 30      // Auto-approve if confidence < 30%
    };
    
    // Profanity word list (basic demo - use comprehensive list in production)
    this.profanityList = [
      'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard',
      'crap', 'dick', 'piss', 'cock', 'pussy'
      // Add more from profanity-check or bad-words npm packages
    ];
    
    // Hate speech keywords (demo - use ML models in production)
    this.hateSpeechKeywords = [
      'nazi', 'terrorist', 'kys', 'kill yourself',
      // Add more comprehensive patterns
    ];
  }

  /**
   * Moderate content (main entry point)
   */
  async moderateContent(contentId) {
    try {
      console.log(`🔍 Starting moderation for content: ${contentId}`);
      
      // Load content
      const content = await Content.findById(contentId)
        .populate('createdBy', 'username strikeCount');
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      // Check if already moderated
      const existing = await ModerationResult.findOne({ contentId });
      if (existing && existing.status !== 'pending') {
        console.log(`⏭️  Content already moderated: ${existing.status}`);
        return existing;
      }
      
      // Run moderation checks
      const startTime = Date.now();
      
      const results = {
        nsfw: await this.checkNSFW(content),
        violence: await this.checkViolence(content),
        hateSpeech: await this.checkHateSpeech(content),
        profanity: await this.checkProfanity(content),
        spam: await this.checkSpam(content),
        dangerous: await this.checkDangerous(content),
        misinformation: await this.checkMisinformation(content),
        copyright: await this.checkCopyright(content)
      };
      
      const processingTime = Date.now() - startTime;
      
      // Calculate overall decision
      const decision = this.makeDecision(results);
      
      // Create or update moderation result
      const moderationResult = await this.saveModerationResult(
        content,
        results,
        decision,
        processingTime
      );
      
      // Take action based on decision
      await this.takeAction(moderationResult, content);
      
      console.log(`✅ Moderation complete: ${decision.decision} (confidence: ${decision.confidence}%)`);
      
      return moderationResult;
      
    } catch (error) {
      console.error('❌ Moderation error:', error);
      throw error;
    }
  }

  /**
   * NSFW Detection (Image/Video)
   */
  async checkNSFW(content) {
    // TODO: Integrate with AWS Rekognition, Sightengine, or Google Vision
    // For now, use placeholder detection
    
    if (content.type !== 'video' && content.type !== 'image') {
      return { detected: false, confidence: 0, categories: {} };
    }
    
    // Placeholder: Random scoring for demo
    const hasNudity = Math.random() < 0.05; // 5% false positive for demo
    
    if (hasNudity) {
      return {
        detected: true,
        confidence: 75 + Math.random() * 20, // 75-95%
        categories: {
          nudity: 80,
          sexual: 70,
          suggestive: 60,
          racy: 50
        },
        provider: 'placeholder'
      };
    }
    
    return {
      detected: false,
      confidence: Math.random() * 20, // 0-20%
      categories: { nudity: 0, sexual: 0, suggestive: 0, racy: 0 },
      provider: 'placeholder'
    };
  }

  /**
   * Violence Detection
   */
  async checkViolence(content) {
    // TODO: Integrate with AWS Rekognition or Google Video Intelligence
    
    if (content.type !== 'video' && content.type !== 'image') {
      return { detected: false, confidence: 0, categories: {} };
    }
    
    // Placeholder detection
    const hasViolence = Math.random() < 0.03; // 3% for demo
    
    if (hasViolence) {
      return {
        detected: true,
        confidence: 70 + Math.random() * 25,
        categories: {
          gore: 75,
          weapons: 60,
          blood: 50,
          fighting: 65
        },
        provider: 'placeholder'
      };
    }
    
    return {
      detected: false,
      confidence: Math.random() * 15,
      categories: { gore: 0, weapons: 0, blood: 0, fighting: 0 },
      provider: 'placeholder'
    };
  }

  /**
   * Hate Speech Detection (Text/Audio)
   */
  async checkHateSpeech(content) {
    // TODO: Integrate with Perspective API, Azure Content Moderator
    
    const text = (content.caption || '').toLowerCase();
    
    // Check for hate speech keywords
    let detected = false;
    let matchCount = 0;
    
    for (const keyword of this.hateSpeechKeywords) {
      if (text.includes(keyword)) {
        detected = true;
        matchCount++;
      }
    }
    
    if (detected) {
      const confidence = Math.min(95, 60 + matchCount * 15);
      
      return {
        detected: true,
        confidence,
        categories: {
          racism: matchCount > 0 ? 70 : 0,
          sexism: 0,
          homophobia: 0,
          religious: 0,
          ableism: 0,
          general: confidence
        },
        toxicityScore: confidence,
        provider: 'rule-based'
      };
    }
    
    return {
      detected: false,
      confidence: Math.random() * 10,
      categories: { racism: 0, sexism: 0, homophobia: 0, religious: 0, ableism: 0, general: 0 },
      toxicityScore: 0,
      provider: 'rule-based'
    };
  }

  /**
   * Profanity Detection
   */
  async checkProfanity(content) {
    const text = (content.caption || '').toLowerCase();
    
    const detectedWords = [];
    let count = 0;
    
    for (const word of this.profanityList) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        count += matches.length;
        detectedWords.push(`${word[0]}***`); // Censored
      }
    }
    
    if (count > 0) {
      let severity = 'mild';
      if (count > 5) severity = 'severe';
      else if (count > 2) severity = 'moderate';
      
      return {
        detected: true,
        confidence: Math.min(100, 40 + count * 10),
        words: detectedWords,
        count,
        severity,
        provider: 'rule-based'
      };
    }
    
    return {
      detected: false,
      confidence: 0,
      words: [],
      count: 0,
      severity: 'mild',
      provider: 'rule-based'
    };
  }

  /**
   * Spam Detection
   */
  async checkSpam(content) {
    const text = content.caption || '';
    
    const indicators = {
      repetitiveText: this.isRepetitive(text),
      suspiciousLinks: this.hasSuspiciousLinks(text),
      massMentions: (text.match(/@/g) || []).length > 5,
      copiedContent: false // TODO: Implement hash-based duplicate detection
    };
    
    const detected = Object.values(indicators).some(v => v === true);
    
    if (detected) {
      return {
        detected: true,
        confidence: 60 + Math.random() * 30,
        indicators,
        linkCount: (text.match(/https?:\/\//g) || []).length,
        provider: 'rule-based'
      };
    }
    
    return {
      detected: false,
      confidence: Math.random() * 20,
      indicators,
      linkCount: 0,
      provider: 'rule-based'
    };
  }

  /**
   * Dangerous Content Detection
   */
  async checkDangerous(content) {
    const text = (content.caption || '').toLowerCase();
    
    // Keywords for dangerous content
    const dangerousKeywords = {
      selfHarm: ['suicide', 'self harm', 'kill myself', 'end my life'],
      drugs: ['cocaine', 'heroin', 'meth', 'buy drugs'],
      illegalActivity: ['sell weapons', 'buy guns illegally', 'hack account'],
      dangerousActs: ['dangerous challenge', 'extreme stunt']
    };
    
    let detected = false;
    const categories = { selfHarm: 0, drugs: 0, illegalActivity: 0, dangerousActs: 0 };
    
    for (const [category, keywords] of Object.entries(dangerousKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          detected = true;
          categories[category] = 80;
        }
      }
    }
    
    if (detected) {
      return {
        detected: true,
        confidence: 75 + Math.random() * 20,
        categories,
        provider: 'rule-based'
      };
    }
    
    return {
      detected: false,
      confidence: Math.random() * 10,
      categories,
      provider: 'rule-based'
    };
  }

  /**
   * Misinformation Detection
   */
  async checkMisinformation(content) {
    // TODO: Integrate with fact-checking APIs or ML models
    // Placeholder: Low confidence detection
    
    return {
      detected: false,
      confidence: Math.random() * 15,
      categories: {
        healthMisinfo: 0,
        conspiracy: 0,
        manipulatedMedia: 0
      },
      provider: 'placeholder'
    };
  }

  /**
   * Copyright Detection
   */
  async checkCopyright(content) {
    // TODO: Integrate with YouTube Content ID, Audible Magic, or custom fingerprinting
    
    return {
      detected: false,
      confidence: 0,
      matches: [],
      provider: 'placeholder'
    };
  }

  /**
   * Helper: Check if text is repetitive
   */
  isRepetitive(text) {
    if (!text || text.length < 20) return false;
    
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    // If less than 30% unique words, consider repetitive
    return uniqueWords.size / words.length < 0.3;
  }

  /**
   * Helper: Check for suspicious links
   */
  hasSuspiciousLinks(text) {
    const linkPattern = /https?:\/\/[^\s]+/gi;
    const links = text.match(linkPattern) || [];
    
    // Suspicious if more than 3 links
    if (links.length > 3) return true;
    
    // Check for URL shorteners or suspicious domains
    const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', 't.co'];
    return links.some(link => 
      suspiciousDomains.some(domain => link.includes(domain))
    );
  }

  /**
   * Make overall moderation decision
   */
  makeDecision(results) {
    // Calculate weighted confidence scores
    const weights = {
      nsfw: 0.25,
      violence: 0.25,
      hateSpeech: 0.20,
      dangerous: 0.20,
      profanity: 0.03,
      spam: 0.05,
      misinformation: 0.02,
      copyright: 0.00  // Handle separately
    };
    
    let overallConfidence = 0;
    let highestViolation = { type: null, confidence: 0 };
    
    for (const [type, result] of Object.entries(results)) {
      if (result.detected) {
        const weightedScore = result.confidence * (weights[type] || 0);
        overallConfidence += weightedScore;
        
        if (result.confidence > highestViolation.confidence) {
          highestViolation = { type, confidence: result.confidence };
        }
      }
    }
    
    // Cap at 100
    overallConfidence = Math.min(100, overallConfidence);
    
    // Make decision based on thresholds
    let decision = 'approve';
    
    if (overallConfidence >= this.thresholds.autoReject) {
      decision = 'reject';
    } else if (overallConfidence >= this.thresholds.autoFlag) {
      decision = 'flag';
    } else if (overallConfidence >= this.thresholds.autoApprove) {
      decision = 'review';
    }
    
    return {
      decision,
      confidence: Math.round(overallConfidence),
      highestViolation
    };
  }

  /**
   * Save moderation result to database
   */
  async saveModerationResult(content, results, decision, processingTime) {
    const moderationData = {
      contentId: content._id,
      creatorId: content.createdBy._id,
      status: decision.decision === 'approve' ? 'approved' : 
              decision.decision === 'reject' ? 'rejected' : 'pending',
      automated: {
        decision: decision.decision,
        confidence: decision.confidence,
        nsfw: results.nsfw,
        violence: results.violence,
        hateSpeech: results.hateSpeech,
        profanity: results.profanity,
        spam: results.spam,
        dangerous: results.dangerous,
        misinformation: results.misinformation,
        copyright: results.copyright,
        processedAt: new Date(),
        processingTime,
        models: ['placeholder'],
        version: '1.0.0'
      }
    };
    
    // Flag for manual review if needed
    if (decision.decision === 'flag' || decision.decision === 'review') {
      moderationData.manualReview = {
        required: true,
        completed: false
      };
    }
    
    const moderationResult = await ModerationResult.findOneAndUpdate(
      { contentId: content._id },
      moderationData,
      { upsert: true, new: true }
    );
    
    return moderationResult;
  }

  /**
   * Take action based on moderation decision
   */
  async takeAction(moderationResult, content) {
    const decision = moderationResult.automated.decision;
    
    switch (decision) {
      case 'approve':
        // Auto-approve content
        await content.updateOne({ 
          status: 'ready',
          moderationStatus: 'approved'
        });
        break;
        
      case 'reject':
        // Auto-reject content
        await content.updateOne({ 
          status: 'rejected',
          moderationStatus: 'rejected'
        });
        
        // Add to creator's strikes
        await this.addStrike(content.createdBy._id, content._id, 'automated_rejection');
        break;
        
      case 'flag':
      case 'review':
        // Add to moderation queue
        await this.addToQueue(moderationResult, content);
        
        // Hold content (don't publish yet)
        await content.updateOne({ 
          status: 'processing',
          moderationStatus: 'under_review'
        });
        break;
    }
  }

  /**
   * Add to moderation queue
   */
  async addToQueue(moderationResult, content) {
    // Get creator's strike count
    const strikeCount = await Strike.countDocuments({ 
      userId: content.createdBy._id,
      resolved: false
    });
    
    // Calculate risk factors
    const riskFactors = {
      automatedScore: moderationResult.automated.confidence,
      userReportCount: moderationResult.userReports?.count || 0,
      creatorStrikeCount: strikeCount,
      previousViolations: moderationResult.violations?.length || 0,
      viralityScore: 0  // TODO: Calculate from ContentMetrics
    };
    
    await ModerationQueue.addToQueue(
      content._id,
      moderationResult._id,
      content.createdBy._id,
      moderationResult.automated.confidence >= 85 ? 'high_risk_score' : 'automated_flag',
      riskFactors
    );
  }

  /**
   * Add strike to creator
   */
  async addStrike(userId, contentId, reason) {
    await Strike.create({
      userId,
      contentId,
      type: 'content_violation',
      reason,
      severity: 'medium',
      issuedBy: null  // System-issued
    });
  }
}

// Export singleton
module.exports = new ModerationService();
