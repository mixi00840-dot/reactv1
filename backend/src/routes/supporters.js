const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const supportersController = require('../controllers/supportersController');

// ============ Credit Package Routes ============

// Get all credit packages (public)
router.get('/packages', supportersController.getCreditPackages);

// Purchase credit package (authenticated)
router.post('/packages/purchase', protect, supportersController.purchaseCreditPackage);

// Get user credit balance (authenticated)
router.get('/balance', protect, supportersController.getUserCreditBalance);
router.get('/balance/:userId', protect, supportersController.getUserCreditBalance);

// Get credit transactions history (authenticated)
router.get('/transactions', protect, supportersController.getCreditTransactions);
router.get('/transactions/:userId', protect, supportersController.getCreditTransactions);

// ============ Gift Routes ============

// Get all gifts (public)
router.get('/gifts', supportersController.getGifts);

// Get gifts by category (public)
router.get('/gifts/category/:category', supportersController.getGiftsByCategory);

// Get featured gifts (public)
router.get('/gifts/featured', supportersController.getFeaturedGifts);

// Send gift (authenticated)
router.post('/gifts/send', protect, supportersController.sendGift);

// Get gift transactions (authenticated)
router.get('/gifts/transactions', protect, supportersController.getGiftTransactions);

// Get livestream gifts (public)
router.get('/gifts/livestream/:livestreamId', supportersController.getLivestreamGifts);

// Get top gifters for a user (public)
router.get('/gifts/top-gifters/:userId', supportersController.getTopGifters);

// Thank you for gift (authenticated)
router.post('/gifts/thankyou/:transactionId', protect, supportersController.thankYouForGift);

// ============ Leaderboard Routes ============

// Get gifting leaderboard (public)
router.get('/leaderboard/gifting', supportersController.getGiftingLeaderboard);

// Get top spenders leaderboard (public)
router.get('/leaderboard/spenders', supportersController.getTopSpenders);

// ============ Badge Routes ============

// Get all supporter badges (public)
router.get('/badges', supportersController.getSupporterBadges);

// Get user badges (public)
router.get('/badges/user', protect, supportersController.getUserBadges);
router.get('/badges/user/:userId', supportersController.getUserBadges);

// Award badge (admin)
router.post('/badges/award', protect, adminOnly, supportersController.awardBadge);

// ============ Tier Routes ============

// Get supporter tiers (public)
router.get('/tiers', supportersController.getSupporterTiers);

module.exports = router;
