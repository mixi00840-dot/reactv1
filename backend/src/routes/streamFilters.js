const express = require('express');
const router = express.Router();
const streamFilterController = require('../controllers/streamFilterController');
const { authenticate } = require('../middleware/auth');

/**
 * Stream Filter Routes
 */

// Get available filters
router.get('/', authenticate, streamFilterController.getFilters);

// Get trending filters
router.get('/trending', authenticate, streamFilterController.getTrending);

// Get featured filters
router.get('/featured', authenticate, streamFilterController.getFeatured);

// Get filters by category
router.get('/category/:category', authenticate, streamFilterController.getByCategory);

// Search filters
router.get('/search', authenticate, streamFilterController.search);

// Apply filter to stream
router.post('/:filterId/apply', authenticate, streamFilterController.applyFilter);

// Unlock filter
router.post('/:filterId/unlock', authenticate, streamFilterController.unlockFilter);

// Favorite/unfavorite filter
router.post('/:filterId/favorite', authenticate, streamFilterController.favoriteFilter);

// Rate filter
router.post('/:filterId/rate', authenticate, streamFilterController.rateFilter);

// Create custom filter
router.post('/custom', authenticate, streamFilterController.createCustomFilter);

// Get user's favorite filters
router.get('/user/favorites', authenticate, streamFilterController.getUserFavorites);

// Get user's unlocked filters
router.get('/user/unlocked', authenticate, streamFilterController.getUserUnlocked);

module.exports = router;
