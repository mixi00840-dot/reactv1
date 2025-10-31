const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const analyticsController = require('../controllers/advancedAnalyticsController');

// ============ Dashboard Analytics (Admin Only) ============

// Get platform overview
router.get('/dashboard/overview', protect, adminOnly, analyticsController.getPlatformOverview);

// Get revenue analytics
router.get('/dashboard/revenue', protect, adminOnly, analyticsController.getRevenueAnalytics);

// Get user analytics
router.get('/dashboard/users', protect, adminOnly, analyticsController.getUserAnalytics);

// Get gifting analytics
router.get('/dashboard/gifting', protect, adminOnly, analyticsController.getGiftingAnalytics);

// Get livestream analytics
router.get('/dashboard/livestreams', protect, adminOnly, analyticsController.getLivestreamAnalytics);

// Get real-time metrics
router.get('/realtime', protect, adminOnly, analyticsController.getRealTimeMetrics);

// Get trend analysis
router.get('/trends', protect, adminOnly, analyticsController.getTrendAnalysis);

// ============ User Analytics ============

// Get specific user insights (admin or own data)
router.get('/users/:userId', protect, analyticsController.getUserInsights);

// ============ Event Tracking ============

// Track event (public with optional auth)
router.post('/events/track', analyticsController.trackEvent);

// Get event statistics (admin)
router.get('/events/stats', protect, adminOnly, analyticsController.getEventStats);

// ============ Export ============

// Export analytics data (admin)
router.get('/export', protect, adminOnly, analyticsController.exportAnalytics);

module.exports = router;
