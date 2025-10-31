const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * Creator Earnings Routes
 * Endpoints for managing creator earnings and payouts
 */

// Record earnings for a creator
router.post('/earnings/record', adminMiddleware, monetizationController.recordEarnings);

// Get creator earnings for date range
router.get('/earnings/creator/:creatorId', authMiddleware, monetizationController.getCreatorEarnings);

// Finalize earnings period
router.post('/earnings/:earningsId/finalize', adminMiddleware, monetizationController.finalizeEarnings);

// Process payout
router.post('/earnings/:earningsId/payout', adminMiddleware, monetizationController.processPayout);

// Get all pending payouts
router.get('/earnings/payouts/pending', adminMiddleware, monetizationController.getPendingPayouts);

// Get top earners leaderboard
router.get('/earnings/top', authMiddleware, monetizationController.getTopEarners);

// Get creator tier
router.get('/earnings/tier/:creatorId', authMiddleware, monetizationController.getCreatorTier);

/**
 * Ad Campaign Routes
 * Endpoints for managing advertising campaigns
 */

// Create new ad campaign
router.post('/ads/campaigns', authMiddleware, monetizationController.createAdCampaign);

// Update ad campaign
router.put('/ads/campaigns/:campaignId', authMiddleware, monetizationController.updateAdCampaign);

// Approve ad campaign (admin)
router.post('/ads/campaigns/:campaignId/approve', adminMiddleware, monetizationController.approveAdCampaign);

// Start ad campaign
router.post('/ads/campaigns/:campaignId/start', authMiddleware, monetizationController.startAdCampaign);

// Get active campaigns matching targeting
router.get('/ads/campaigns/active', authMiddleware, monetizationController.getActiveCampaigns);

// Record ad impression
router.post('/ads/campaigns/:campaignId/impression', authMiddleware, monetizationController.recordAdImpression);

// Record ad click
router.post('/ads/campaigns/:campaignId/click', authMiddleware, monetizationController.recordAdClick);

// Record ad conversion
router.post('/ads/campaigns/:campaignId/conversion', authMiddleware, monetizationController.recordAdConversion);

/**
 * Subscription Routes
 * Endpoints for managing creator subscriptions
 */

// Create subscription tier (creator)
router.post('/subscriptions/tiers', authMiddleware, monetizationController.createSubscriptionTier);

// Get creator's subscription tiers
router.get('/subscriptions/tiers/creator/:creatorId', authMiddleware, monetizationController.getCreatorTiers);

// Subscribe to creator
router.post('/subscriptions/subscribe', authMiddleware, monetizationController.subscribe);

// Cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', authMiddleware, monetizationController.cancelSubscription);

// Renew subscription
router.post('/subscriptions/:subscriptionId/renew', authMiddleware, monetizationController.renewSubscription);

// Get user's subscriptions
router.get('/subscriptions/my', authMiddleware, monetizationController.getUserSubscriptions);

// Get subscriptions due for renewal (admin)
router.get('/subscriptions/renewal', adminMiddleware, monetizationController.getSubscriptionsDueForRenewal);

// Calculate MRR for creator
router.get('/subscriptions/mrr/:creatorId', authMiddleware, monetizationController.calculateMRR);

// Get subscription stats for creator
router.get('/subscriptions/stats/:creatorId', authMiddleware, monetizationController.getSubscriptionStats);

/**
 * Creator Dashboard Route
 * Comprehensive dashboard for creators
 */

// Get creator dashboard with earnings, subscriptions, and analytics
router.get('/dashboard', authMiddleware, monetizationController.getCreatorDashboard);

module.exports = router;
