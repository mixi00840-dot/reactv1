const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * AI Tagging Routes
 * Endpoints for AI-powered content tagging and analysis
 */

// Process content for AI tagging
router.post('/tagging/process', authMiddleware, aiController.processContent);

// Get tags for specific content
router.get('/tagging/:contentType/:contentId/tags', authMiddleware, aiController.getContentTags);

// Search content by AI keywords
router.get('/tagging/search', authMiddleware, aiController.searchByKeywords);

// Get trending tags
router.get('/tagging/trending', authMiddleware, aiController.getTrendingTags);

// Get content needing manual review
router.get('/tagging/review', adminMiddleware, aiController.getContentNeedingReview);

// Add manual correction to AI tag
router.post('/tagging/:tagId/correction', adminMiddleware, aiController.addTagCorrection);

// Mark tag as reviewed
router.post('/tagging/:tagId/reviewed', adminMiddleware, aiController.markTagReviewed);

/**
 * AI Moderation Routes
 * Endpoints for automated content moderation
 */

// Run AI moderation on content
router.post('/moderation/moderate', authMiddleware, aiController.moderateContent);

// Get moderation result for content
router.get('/moderation/:contentType/:contentId', authMiddleware, aiController.getContentModeration);

// Get content needing human review
router.get('/moderation/review', adminMiddleware, aiController.getContentForReview);

// Get flagged content by type
router.get('/moderation/flagged/:type', adminMiddleware, aiController.getFlaggedContent);

// Submit moderator review decision
router.post('/moderation/:moderationId/review', adminMiddleware, aiController.submitModerationReview);

// User submits appeal
router.post('/moderation/:moderationId/appeal', authMiddleware, aiController.submitAppeal);

// Review appeal decision
router.post('/moderation/:moderationId/appeal/:appealIndex', adminMiddleware, aiController.reviewAppeal);

// Get pending appeals
router.get('/moderation/appeals', adminMiddleware, aiController.getPendingAppeals);

// Get moderation statistics
router.get('/moderation/stats', adminMiddleware, aiController.getModerationStats);

// Get user's violation history
router.get('/moderation/users/:userId/violations', adminMiddleware, aiController.getUserViolations);

// Get comprehensive moderation dashboard
router.get('/moderation/dashboard', adminMiddleware, aiController.getModerationDashboard);

module.exports = router;
