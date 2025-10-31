const express = require('express');
const router = express.Router();
const trendingController = require('../controllers/trendingController');
const { protect, adminOnly } = require('../middleware/auth');

// Public trending endpoints
router.get('/global', trendingController.getGlobalTrending);
router.get('/country/:countryCode', trendingController.getTrendingByCountry);
router.get('/category/:category', trendingController.getTrendingByCategory);
router.get('/hashtag/:hashtag', trendingController.getTrendingByHashtag);
router.get('/hashtags', trendingController.getTrendingHashtags);
router.get('/featured', trendingController.getFeatured);
router.get('/explore', trendingController.getExploreFeed);

// Admin endpoints
router.post('/update/:contentId', protect, adminOnly, trendingController.updateTrending);
router.post('/batch-update', protect, adminOnly, trendingController.batchUpdate);
router.post('/:id/feature', protect, adminOnly, trendingController.featureContent);
router.post('/:id/pin', protect, adminOnly, trendingController.pinContent);
router.post('/:id/hide', protect, adminOnly, trendingController.hideContent);
router.get('/analytics', protect, adminOnly, trendingController.getTrendingAnalytics);

// Trending Algorithm Configuration (Admin)
router.get('/config', protect, adminOnly, trendingController.getTrendingConfig);
router.put('/config/weights', protect, adminOnly, trendingController.updateTrendingWeights);
router.put('/config/thresholds', protect, adminOnly, trendingController.updateTrendingThresholds);
router.get('/config/history', protect, adminOnly, trendingController.getTrendingConfigHistory);

// Calculate trending score (Admin/Testing)
router.post('/:contentId/calculate', protect, adminOnly, trendingController.calculateTrendingScore);

module.exports = router;
