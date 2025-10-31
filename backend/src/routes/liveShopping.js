const express = require('express');
const router = express.Router();
const liveShoppingController = require('../controllers/liveShoppingController');
const { authenticate } = require('../middleware/auth');

/**
 * Live Shopping Routes
 */

// Create shopping session
router.post('/', authenticate, liveShoppingController.createSession);

// Start session
router.post('/:sessionId/start', authenticate, liveShoppingController.startSession);

// Add product
router.post('/:sessionId/products', authenticate, liveShoppingController.addProduct);

// Pin product
router.post('/:sessionId/products/pin', authenticate, liveShoppingController.pinProduct);

// Track interaction
router.post('/:sessionId/interactions', authenticate, liveShoppingController.trackInteraction);

// Place order
router.post('/:sessionId/orders', authenticate, liveShoppingController.placeOrder);

// Create voucher
router.post('/:sessionId/vouchers', authenticate, liveShoppingController.createVoucher);

// Use voucher
router.post('/:sessionId/vouchers/use', authenticate, liveShoppingController.useVoucher);

// End session
router.post('/:sessionId/end', authenticate, liveShoppingController.endSession);

// Get session details
router.get('/:sessionId', authenticate, liveShoppingController.getSession);

// Get session analytics
router.get('/:sessionId/analytics', authenticate, liveShoppingController.getAnalytics);

// Get active sessions
router.get('/active/list', authenticate, liveShoppingController.getActiveSessions);

// Get top sessions
router.get('/top/performers', authenticate, liveShoppingController.getTopSessions);

module.exports = router;
