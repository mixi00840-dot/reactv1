const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { protect } = require('../middleware/auth');

// For You personalized feed
router.get('/for-you', protect, feedController.getForYouFeed);

// User profile
router.get('/profile', protect, feedController.getUserProfile);
router.post('/preferences', protect, feedController.updatePreferences);

// Interactions
router.post('/interaction', protect, feedController.recordInteraction);
router.post('/not-interested/:contentId', protect, feedController.markNotInterested);

// A/B Testing
router.get('/experiment/:experimentId', protect, feedController.getExperimentalFeed);

// Analytics
router.get('/analytics', protect, feedController.getFeedAnalytics);

// Reset
router.post('/reset', protect, feedController.resetFeed);

module.exports = router;
