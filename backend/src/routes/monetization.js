const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const GiftTransaction = require('../models/GiftTransaction');
const Subscription = require('../models/Subscription');

const revenueTypes = [
  'purchase',
  'coin_purchase',
  'subscription',
  'gift_received',
  'earning',
  'commission',
  'tip',
  'payout'
];

const parseLimit = (value, fallback = 50) => {
  const limit = parseInt(value, 10);
  if (Number.isNaN(limit) || limit <= 0) return fallback;
  return Math.min(limit, 200);
};

const formatRevenueChart = (docs, startDate, days) => {
  const chartMap = docs.reduce((acc, doc) => {
    acc[doc._id] = doc.revenue;
    return acc;
  }, {});

  const data = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    data.push({
      date: key,
      revenue: Number(chartMap[key] || 0)
    });
  }

  return data;
};

router.get(
  ['/mongodb/stats', '/admin/stats', '/stats'],
  adminMiddleware,
  async (req, res) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [
        totals,
        todayTotals,
        giftTotals,
        giftTodayTotals,
        subscriptionTotals,
        activeSubscriptions,
        newSubscriptionsToday,
        breakdown
      ] = await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              amount: { $gt: 0 },
              type: { $in: revenueTypes }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              amount: { $gt: 0 },
              type: { $in: revenueTypes },
              createdAt: { $gte: startOfDay }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        GiftTransaction.aggregate([
          { $match: { status: 'completed' } },
          {
            $group: {
              _id: null,
              totalValue: { $sum: '$totalCost' },
              creatorEarnings: { $sum: '$creatorEarnings' },
              platformFee: { $sum: '$platformFee' },
              totalGifts: { $sum: '$quantity' }
            }
          }
        ]),
        GiftTransaction.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: startOfDay }
            }
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: '$totalCost' },
              creatorEarnings: { $sum: '$creatorEarnings' },
              platformFee: { $sum: '$platformFee' },
              totalGifts: { $sum: '$quantity' }
            }
          }
        ]),
        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              amount: { $gt: 0 },
              type: 'subscription'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]),
        Subscription.countDocuments({ status: 'active' }),
        Subscription.countDocuments({
          status: 'active',
          createdAt: { $gte: startOfDay }
        }),
        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
              amount: { $gt: 0 },
              type: { $in: revenueTypes }
            }
          },
          {
            $group: {
              _id: '$type',
              revenue: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const totalsDoc = totals[0] || { totalRevenue: 0, totalTransactions: 0 };
      const todayDoc = todayTotals[0] || { totalRevenue: 0, totalTransactions: 0 };
      const giftDoc =
        giftTotals[0] || { totalValue: 0, creatorEarnings: 0, platformFee: 0, totalGifts: 0 };
      const giftTodayDoc = giftTodayTotals[0] || { totalValue: 0 };
      const subscriptionDoc =
        subscriptionTotals[0] || { totalRevenue: 0, totalTransactions: 0 };

      res.json({
        success: true,
        data: {
          totalRevenue: Number(totalsDoc.totalRevenue || 0),
          todayRevenue: Number(todayDoc.totalRevenue || 0),
          totalTransactions: totalsDoc.totalTransactions || 0,
          todayTransactions: todayDoc.totalTransactions || 0,
          giftRevenue: Number(giftDoc.totalValue || 0),
          giftRevenueToday: Number(giftTodayDoc.totalValue || 0),
          giftMetrics: {
            totalGifts: giftDoc.totalGifts || 0,
            creatorEarnings: Number(giftDoc.creatorEarnings || 0),
            platformFee: Number(giftDoc.platformFee || 0)
          },
          subscriptionRevenue: Number(subscriptionDoc.totalRevenue || 0),
          subscriptionTransactions: subscriptionDoc.totalTransactions || 0,
          activeSubscriptions,
          newSubscriptionsToday,
          breakdown: breakdown.map((doc) => ({
            type: doc._id,
            revenue: Number(doc.revenue || 0),
            count: doc.count || 0
          }))
        }
      });
    } catch (error) {
      console.error('Monetization stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load monetization statistics',
        error: error.message
      });
    }
  }
);

router.get(
  ['/mongodb/transactions', '/admin/transactions', '/transactions'],
  adminMiddleware,
  async (req, res) => {
    try {
      const { limit = 50, type } = req.query;
      const query = {
        status: { $in: ['completed', 'processing'] }
      };

      if (type && type !== 'all') {
        if (type === 'gifts') {
          query.type = { $in: ['gift_sent', 'gift_received', 'gift'] };
        } else if (type === 'subscriptions') {
          query.type = 'subscription';
        } else {
          query.type = type;
        }
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseLimit(limit))
        .populate('userId', 'username fullName avatar')
        .populate('relatedUserId', 'username fullName avatar')
        .lean({ getters: true });

      res.json({
        success: true,
        data: {
          transactions
        }
      });
    } catch (error) {
      console.error('Monetization transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load monetization transactions',
        error: error.message
      });
    }
  }
);

router.get(
  ['/mongodb/revenue-chart', '/admin/revenue-chart', '/revenue-chart'],
  adminMiddleware,
  async (req, res) => {
    try {
      const daysParam = parseInt(req.query.days, 10);
      const days = Number.isNaN(daysParam) || daysParam <= 0 ? 30 : Math.min(daysParam, 120);

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));

      const revenueDocs = await Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            amount: { $gt: 0 },
            type: { $in: revenueTypes },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: formatRevenueChart(revenueDocs, startDate, days)
      });
    } catch (error) {
      console.error('Monetization revenue chart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate revenue chart',
        error: error.message
      });
    }
  }
);

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
