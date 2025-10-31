const aiTaggingService = require('../services/aiTaggingService');
const aiModerationService = require('../services/aiModerationService');

/**
 * AI Controller
 * Handles AI tagging and moderation endpoints
 */

// AI Tagging Endpoints

exports.processContent = async (req, res) => {
  try {
    const { contentType, contentId, contentUrl } = req.body;
    
    const result = await aiTaggingService.processContent(contentType, contentId, contentUrl);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContentTags = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    const result = await aiTaggingService.getTagsForContent(contentType, contentId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchByKeywords = async (req, res) => {
  try {
    const { keywords, contentType } = req.query;
    const keywordArray = keywords.split(',').map(k => k.trim());
    
    const result = await aiTaggingService.searchByKeywords(keywordArray, contentType);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrendingTags = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await aiTaggingService.getTrendingTags(parseInt(days));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContentNeedingReview = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const result = await aiTaggingService.getContentNeedingReview(parseInt(limit));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addTagCorrection = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { field, oldValue, newValue } = req.body;
    const userId = req.user._id;
    
    const result = await aiTaggingService.addCorrection(tagId, field, oldValue, newValue, userId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markTagReviewed = async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user._id;
    
    const result = await aiTaggingService.markReviewed(tagId, userId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AI Moderation Endpoints

exports.moderateContent = async (req, res) => {
  try {
    const { contentType, contentId, contentOwner, contentUrl } = req.body;
    
    const result = await aiModerationService.moderateContent(contentType, contentId, contentOwner, contentUrl);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContentModeration = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    const result = await aiModerationService.getModerationForContent(contentType, contentId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContentForReview = async (req, res) => {
  try {
    const { priority } = req.query;
    
    const result = await aiModerationService.getContentNeedingReview(priority);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFlaggedContent = async (req, res) => {
  try {
    const { type } = req.params;
    
    const result = await aiModerationService.getFlaggedContent(type);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitModerationReview = async (req, res) => {
  try {
    const { moderationId } = req.params;
    const { decision, notes } = req.body;
    const reviewerId = req.user._id;
    
    const result = await aiModerationService.submitReview(moderationId, reviewerId, decision, notes);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitAppeal = async (req, res) => {
  try {
    const { moderationId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    const result = await aiModerationService.submitAppeal(moderationId, userId, reason);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewAppeal = async (req, res) => {
  try {
    const { moderationId, appealIndex } = req.params;
    const { decision, decisionReason } = req.body;
    const reviewerId = req.user._id;
    
    const result = await aiModerationService.reviewAppeal(
      moderationId,
      parseInt(appealIndex),
      reviewerId,
      decision,
      decisionReason
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingAppeals = async (req, res) => {
  try {
    const result = await aiModerationService.getPendingAppeals();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getModerationStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await aiModerationService.getModerationStats(parseInt(days));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserViolations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await aiModerationService.getUserViolations(userId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getModerationDashboard = async (req, res) => {
  try {
    const result = await aiModerationService.getDashboardStats();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
