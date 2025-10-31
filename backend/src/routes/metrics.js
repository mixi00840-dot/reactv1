const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * Event Tracking Routes
 * Public routes for tracking user interactions
 */

// Track single event
router.post('/events/track', protect, metricsController.trackEvent);

// Track batch events (offline sync)
router.post('/events/track-batch', protect, metricsController.trackBatchEvents);

/**
 * Content Metrics Routes
 */

// Get metrics for specific content
router.get('/content/:contentId', protect, metricsController.getContentMetrics);

// Get trending content
router.get('/trending', metricsController.getTrendingContent);

// Get top performing content
router.get('/top-performing', metricsController.getTopPerforming);

/**
 * Creator Analytics Routes
 * Protected routes for content creators
 */

// Get creator's aggregated analytics
router.get('/creator/analytics', protect, metricsController.getCreatorAnalytics);

// Get creator's content performance list
router.get('/creator/content', protect, metricsController.getCreatorContentPerformance);

/**
 * User Routes
 */

// Get user's watch history
router.get('/user/watch-history', protect, metricsController.getUserWatchHistory);

/**
 * Admin Routes
 * Admin-only routes for platform management
 */

// Manually trigger event processing
router.post('/admin/process-events', protect, adminOnly, metricsController.processEvents);

// Get platform-wide statistics
router.get('/admin/stats', protect, adminOnly, metricsController.getPlatformStats);

module.exports = router;
