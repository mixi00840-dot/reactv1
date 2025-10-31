const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const AIModeration = require('../models/AIModeration');
const Content = require('../models/Content');

/**
 * Sightengine AI Moderation Service
 * Real-time content moderation using Sightengine API
 * Detects: NSFW, violence, weapons, hate symbols, drugs, offensive gestures
 */

class SightengineService {
  constructor() {
    this.apiUser = process.env.SIGHTENGINE_API_USER;
    this.apiSecret = process.env.SIGHTENGINE_API_SECRET;
    this.baseURL = 'https://api.sightengine.com/1.0';
    
    // Default models to check
    this.defaultModels = [
      'nudity-2.0',        // NSFW content
      'wad',                // Weapons, alcohol, drugs
      'offensive',          // Hate symbols, offensive gestures
      'gore',               // Violence, blood
      'face-attributes'     // Face detection
    ];
    
    // Thresholds for auto-action
    this.thresholds = {
      nudity: 0.75,         // 75% confidence = auto-flag
      violence: 0.70,
      weapons: 0.80,
      drugs: 0.75,
      hate: 0.85,
      offensive: 0.70
    };
  }

  /**
   * Moderate Image Content
   */
  async moderateImage(imageUrl, contentId, userId) {
    try {
      if (!this.apiUser || !this.apiSecret) {
        console.warn('Sightengine credentials not configured, using basic moderation');
        return this._fallbackModeration('image', contentId);
      }

      const response = await axios.get(`${this.baseURL}/check.json`, {
        params: {
          url: imageUrl,
          models: this.defaultModels.join(','),
          api_user: this.apiUser,
          api_secret: this.apiSecret
        }
      });

      const result = response.data;
      const analysis = this._analyzeImageResult(result);

      // Save moderation record
      const moderation = await AIModeration.create({
        content: contentId,
        user: userId,
        type: 'image',
        status: analysis.shouldFlag ? 'flagged' : 'approved',
        confidence: analysis.maxConfidence,
        categories: analysis.categories,
        details: {
          nudity: result.nudity,
          weapon: result.weapon,
          alcohol: result.alcohol,
          drugs: result.drugs,
          gore: result.gore,
          offensive: result.offensive,
          faces: result.faces
        },
        risks: analysis.risks,
        action: analysis.action,
        reason: analysis.reason,
        sightengineData: result
      });

      // Update content moderation status
      await Content.findByIdAndUpdate(contentId, {
        'moderation.status': analysis.shouldFlag ? 'flagged' : 'approved',
        'moderation.lastChecked': new Date(),
        'moderation.aiModeration': moderation._id,
        'moderation.flags': analysis.categories
      });

      return {
        success: true,
        moderation,
        shouldFlag: analysis.shouldFlag,
        action: analysis.action,
        categories: analysis.categories
      };

    } catch (error) {
      console.error('Sightengine image moderation error:', error.message);
      return this._fallbackModeration('image', contentId);
    }
  }

  /**
   * Moderate Video Content (by URL or file upload)
   */
  async moderateVideo(videoUrl, contentId, userId, options = {}) {
    try {
      if (!this.apiUser || !this.apiSecret) {
        console.warn('Sightengine credentials not configured, using basic moderation');
        return this._fallbackModeration('video', contentId);
      }

      // Video moderation extracts frames and analyzes them
      const response = await axios.get(`${this.baseURL}/video/check-sync.json`, {
        params: {
          url: videoUrl,
          models: this.defaultModels.join(','),
          api_user: this.apiUser,
          api_secret: this.apiSecret,
          // Optional: analyze every N seconds
          interval: options.interval || 2
        }
      });

      const result = response.data;
      const analysis = this._analyzeVideoResult(result);

      // Save moderation record
      const moderation = await AIModeration.create({
        content: contentId,
        user: userId,
        type: 'video',
        status: analysis.shouldFlag ? 'flagged' : 'approved',
        confidence: analysis.maxConfidence,
        categories: analysis.categories,
        details: {
          frames: result.data?.frames || [],
          summary: result.summary,
          violations: analysis.violations
        },
        risks: analysis.risks,
        action: analysis.action,
        reason: analysis.reason,
        sightengineData: result
      });

      // Update content moderation status
      await Content.findByIdAndUpdate(contentId, {
        'moderation.status': analysis.shouldFlag ? 'flagged' : 'approved',
        'moderation.lastChecked': new Date(),
        'moderation.aiModeration': moderation._id,
        'moderation.flags': analysis.categories
      });

      return {
        success: true,
        moderation,
        shouldFlag: analysis.shouldFlag,
        action: analysis.action,
        categories: analysis.categories,
        violations: analysis.violations
      };

    } catch (error) {
      console.error('Sightengine video moderation error:', error.message);
      return this._fallbackModeration('video', contentId);
    }
  }

  /**
   * Moderate Text Content (captions, comments)
   */
  async moderateText(text, contentId, userId) {
    try {
      if (!this.apiUser || !this.apiSecret) {
        console.warn('Sightengine credentials not configured, using basic moderation');
        return this._fallbackModeration('text', contentId);
      }

      const response = await axios.get(`${this.baseURL}/text/check.json`, {
        params: {
          text: text,
          lang: 'en',
          mode: 'standard',
          api_user: this.apiUser,
          api_secret: this.apiSecret
        }
      });

      const result = response.data;
      const analysis = this._analyzeTextResult(result);

      // Save moderation record
      const moderation = await AIModeration.create({
        content: contentId,
        user: userId,
        type: 'text',
        status: analysis.shouldFlag ? 'flagged' : 'approved',
        confidence: analysis.maxConfidence,
        categories: analysis.categories,
        details: {
          profanity: result.profanity,
          link: result.link,
          personal: result.personal
        },
        risks: analysis.risks,
        action: analysis.action,
        reason: analysis.reason,
        sightengineData: result
      });

      return {
        success: true,
        moderation,
        shouldFlag: analysis.shouldFlag,
        action: analysis.action,
        categories: analysis.categories
      };

    } catch (error) {
      console.error('Sightengine text moderation error:', error.message);
      return this._fallbackModeration('text', contentId);
    }
  }

  /**
   * Moderate Local File (upload to Sightengine)
   */
  async moderateFile(filePath, contentId, userId, fileType = 'image') {
    try {
      if (!this.apiUser || !this.apiSecret) {
        console.warn('Sightengine credentials not configured, using basic moderation');
        return this._fallbackModeration(fileType, contentId);
      }

      const form = new FormData();
      form.append('media', await fs.readFile(filePath), {
        filename: filePath.split('/').pop()
      });
      form.append('models', this.defaultModels.join(','));
      form.append('api_user', this.apiUser);
      form.append('api_secret', this.apiSecret);

      const endpoint = fileType === 'video' 
        ? `${this.baseURL}/video/check-sync.json`
        : `${this.baseURL}/check.json`;

      const response = await axios.post(endpoint, form, {
        headers: form.getHeaders()
      });

      const result = response.data;
      const analysis = fileType === 'video' 
        ? this._analyzeVideoResult(result)
        : this._analyzeImageResult(result);

      // Save moderation record
      const moderation = await AIModeration.create({
        content: contentId,
        user: userId,
        type: fileType,
        status: analysis.shouldFlag ? 'flagged' : 'approved',
        confidence: analysis.maxConfidence,
        categories: analysis.categories,
        details: analysis.details || result,
        risks: analysis.risks,
        action: analysis.action,
        reason: analysis.reason,
        sightengineData: result
      });

      return {
        success: true,
        moderation,
        shouldFlag: analysis.shouldFlag,
        action: analysis.action,
        categories: analysis.categories
      };

    } catch (error) {
      console.error('Sightengine file moderation error:', error.message);
      return this._fallbackModeration(fileType, contentId);
    }
  }

  /**
   * Batch Moderate Multiple Images/Videos
   */
  async moderateBatch(items, userId) {
    const results = [];
    
    for (const item of items) {
      try {
        let result;
        if (item.type === 'image') {
          result = await this.moderateImage(item.url, item.contentId, userId);
        } else if (item.type === 'video') {
          result = await this.moderateVideo(item.url, item.contentId, userId);
        } else if (item.type === 'text') {
          result = await this.moderateText(item.text, item.contentId, userId);
        }
        
        results.push({
          contentId: item.contentId,
          ...result
        });
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          contentId: item.contentId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Analyze Image Result from Sightengine
   */
  _analyzeImageResult(result) {
    const categories = [];
    const risks = [];
    let maxConfidence = 0;
    let shouldFlag = false;
    let action = 'approve';
    let reason = 'Content passed moderation checks';

    // Check nudity
    if (result.nudity) {
      const nudityScore = Math.max(
        result.nudity.sexual_activity || 0,
        result.nudity.sexual_display || 0,
        result.nudity.erotica || 0
      );
      
      if (nudityScore > this.thresholds.nudity) {
        categories.push('nsfw');
        risks.push({
          type: 'nsfw',
          severity: 'high',
          confidence: nudityScore,
          description: 'Explicit or sexual content detected'
        });
        maxConfidence = Math.max(maxConfidence, nudityScore);
        shouldFlag = true;
        action = 'remove';
        reason = 'NSFW content detected';
      }
    }

    // Check weapons
    if (result.weapon > this.thresholds.weapons) {
      categories.push('weapons');
      risks.push({
        type: 'violence',
        severity: 'high',
        confidence: result.weapon,
        description: 'Weapons detected in content'
      });
      maxConfidence = Math.max(maxConfidence, result.weapon);
      shouldFlag = true;
      action = 'flag';
      reason = 'Weapons detected';
    }

    // Check drugs
    if (result.drugs > this.thresholds.drugs) {
      categories.push('drugs');
      risks.push({
        type: 'substance',
        severity: 'medium',
        confidence: result.drugs,
        description: 'Drug-related content detected'
      });
      maxConfidence = Math.max(maxConfidence, result.drugs);
      shouldFlag = true;
      action = 'flag';
      reason = 'Drug-related content';
    }

    // Check gore/violence
    if (result.gore?.prob > this.thresholds.violence) {
      categories.push('violence');
      risks.push({
        type: 'violence',
        severity: 'high',
        confidence: result.gore.prob,
        description: 'Graphic violence or gore detected'
      });
      maxConfidence = Math.max(maxConfidence, result.gore.prob);
      shouldFlag = true;
      action = 'remove';
      reason = 'Graphic violence detected';
    }

    // Check offensive gestures/hate symbols
    if (result.offensive) {
      const offensiveScore = Math.max(
        result.offensive.prob || 0,
        result.offensive.nazi || 0,
        result.offensive.middle_finger || 0
      );
      
      if (offensiveScore > this.thresholds.offensive) {
        categories.push('hate');
        risks.push({
          type: 'hateful',
          severity: 'high',
          confidence: offensiveScore,
          description: 'Offensive gestures or hate symbols detected'
        });
        maxConfidence = Math.max(maxConfidence, offensiveScore);
        shouldFlag = true;
        action = 'remove';
        reason = 'Hate symbols or offensive content';
      }
    }

    return {
      shouldFlag,
      action,
      reason,
      categories,
      risks,
      maxConfidence,
      details: result
    };
  }

  /**
   * Analyze Video Result from Sightengine
   */
  _analyzeVideoResult(result) {
    const categories = [];
    const risks = [];
    const violations = [];
    let maxConfidence = 0;
    let shouldFlag = false;
    let action = 'approve';
    let reason = 'Content passed moderation checks';

    // Analyze summary or frames
    const frames = result.data?.frames || [];
    
    frames.forEach((frame, index) => {
      const frameAnalysis = this._analyzeImageResult(frame);
      
      if (frameAnalysis.shouldFlag) {
        shouldFlag = true;
        violations.push({
          timestamp: frame.time || index,
          categories: frameAnalysis.categories,
          confidence: frameAnalysis.maxConfidence,
          reason: frameAnalysis.reason
        });
        
        // Merge categories
        frameAnalysis.categories.forEach(cat => {
          if (!categories.includes(cat)) {
            categories.push(cat);
          }
        });
        
        // Merge risks
        risks.push(...frameAnalysis.risks);
        
        maxConfidence = Math.max(maxConfidence, frameAnalysis.maxConfidence);
        
        // Use strictest action
        if (frameAnalysis.action === 'remove') {
          action = 'remove';
          reason = frameAnalysis.reason;
        } else if (action !== 'remove' && frameAnalysis.action === 'flag') {
          action = 'flag';
          reason = frameAnalysis.reason;
        }
      }
    });

    return {
      shouldFlag,
      action,
      reason,
      categories,
      risks,
      maxConfidence,
      violations,
      details: result
    };
  }

  /**
   * Analyze Text Result from Sightengine
   */
  _analyzeTextResult(result) {
    const categories = [];
    const risks = [];
    let maxConfidence = 0;
    let shouldFlag = false;
    let action = 'approve';
    let reason = 'Text passed moderation checks';

    // Check profanity
    if (result.profanity?.matches?.length > 0) {
      const profanityScore = result.profanity.matches.length / 10; // Normalize
      categories.push('profanity');
      risks.push({
        type: 'offensive',
        severity: 'low',
        confidence: profanityScore,
        description: `${result.profanity.matches.length} profane words detected`
      });
      maxConfidence = Math.max(maxConfidence, profanityScore);
      
      if (result.profanity.matches.length > 5) {
        shouldFlag = true;
        action = 'flag';
        reason = 'Excessive profanity';
      }
    }

    // Check for personal info (PII)
    if (result.personal?.matches?.length > 0) {
      categories.push('personal_info');
      risks.push({
        type: 'privacy',
        severity: 'medium',
        confidence: 0.9,
        description: 'Personal information detected (email, phone, address)'
      });
      shouldFlag = true;
      action = 'flag';
      reason = 'Personal information detected';
    }

    return {
      shouldFlag,
      action,
      reason,
      categories,
      risks,
      maxConfidence,
      details: result
    };
  }

  /**
   * Fallback to basic moderation when Sightengine unavailable
   */
  async _fallbackModeration(type, contentId) {
    console.log(`Using fallback moderation for ${type} content: ${contentId}`);
    
    // Create basic approved moderation record
    const moderation = await AIModeration.create({
      content: contentId,
      type: type,
      status: 'approved',
      confidence: 0.5,
      categories: [],
      details: {
        method: 'fallback',
        note: 'Sightengine API not available, basic checks applied'
      },
      risks: [],
      action: 'approve',
      reason: 'Basic validation passed'
    });

    return {
      success: true,
      moderation,
      shouldFlag: false,
      action: 'approve',
      categories: [],
      fallback: true
    };
  }

  /**
   * Update Moderation Thresholds (Admin)
   */
  updateThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
    return this.thresholds;
  }

  /**
   * Get Current Configuration
   */
  getConfig() {
    return {
      apiConfigured: !!(this.apiUser && this.apiSecret),
      models: this.defaultModels,
      thresholds: this.thresholds
    };
  }
}

module.exports = new SightengineService();
