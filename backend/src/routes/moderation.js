const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { protect, adminOnly, moderatorOnly } = require('../middleware/auth');

/**
 * Admin Routes
 * Moderation management and oversight
 */

// Trigger moderation for specific content
router.post('/moderate/:contentId', protect, adminOnly, moderationController.moderateContent);

// Get moderation result
router.get('/result/:contentId', protect, moderatorOnly, moderationController.getModerationResult);

// Get moderation queue
router.get('/queue', protect, moderatorOnly, moderationController.getQueue);

// Get next item for review
router.get('/queue/next', protect, moderatorOnly, moderationController.getNextItem);

// Review content (approve/reject/escalate)
router.post('/review/:queueId', protect, moderatorOnly, moderationController.reviewContent);

// Get queue statistics
router.get('/stats', protect, adminOnly, moderationController.getStats);

// Get pending appeals
router.get('/appeals', protect, adminOnly, moderationController.getPendingAppeals);

// Review appeal
router.post('/appeal/:contentId/review', protect, adminOnly, moderationController.reviewAppeal);

// Get high-risk content
router.get('/high-risk', protect, adminOnly, moderationController.getHighRisk);

// Get moderator's dashboard
router.get('/dashboard', protect, moderatorOnly, moderationController.getModeratorDashboard);

/**
 * Sightengine AI Moderation Routes
 * Real-time AI moderation using Sightengine API
 */

// Moderate image with Sightengine
router.post('/sightengine/image', protect, moderationController.moderateImageSightengine);

// Moderate video with Sightengine
router.post('/sightengine/video', protect, moderationController.moderateVideoSightengine);

// Moderate text with Sightengine
router.post('/sightengine/text', protect, moderationController.moderateTextSightengine);

// Batch moderate multiple items
router.post('/sightengine/batch', protect, adminOnly, moderationController.moderateBatchSightengine);

// Update Sightengine thresholds (admin)
router.put('/sightengine/thresholds', protect, adminOnly, moderationController.updateSightengineThresholds);

// Get Sightengine config
router.get('/sightengine/config', protect, adminOnly, moderationController.getSightengineConfig);

/**
 * Creator Routes
 * Content creators can appeal moderation decisions
 */

// Submit appeal for rejected content
router.post('/appeal/:contentId', protect, moderationController.submitAppeal);

module.exports = router;
