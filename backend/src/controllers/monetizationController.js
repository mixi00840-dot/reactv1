const monetizationService = require('../services/monetizationService');

/**
 * Monetization Controller
 * Handles creator earnings, subscriptions, and ad campaigns
 */

// Creator Earnings Endpoints

exports.recordEarnings = async (req, res) => {
  try {
    const { creatorId, period, earningsData } = req.body;
    
    const result = await monetizationService.recordEarnings(creatorId, period, earningsData);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorEarnings = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { startDate, endDate } = req.query;
    
    const result = await monetizationService.getCreatorEarnings(
      creatorId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.finalizeEarnings = async (req, res) => {
  try {
    const { earningsId } = req.params;
    
    const result = await monetizationService.finalizeEarnings(earningsId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processPayout = async (req, res) => {
  try {
    const { earningsId } = req.params;
    const { transactionId, paymentMethod } = req.body;
    
    const result = await monetizationService.processPayout(earningsId, transactionId, paymentMethod);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingPayouts = async (req, res) => {
  try {
    const result = await monetizationService.getPendingPayouts();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopEarners = async (req, res) => {
  try {
    const { period = 'monthly', limit = 50 } = req.query;
    
    const result = await monetizationService.getTopEarners(period, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorTier = async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    const result = await monetizationService.calculateCreatorTier(creatorId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ad Campaign Endpoints

exports.createAdCampaign = async (req, res) => {
  try {
    const advertiserId = req.user._id;
    const campaignData = req.body;
    
    const result = await monetizationService.createAdCampaign(advertiserId, campaignData);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAdCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;
    
    const result = await monetizationService.updateAdCampaign(campaignId, updates);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveAdCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { notes } = req.body;
    const reviewerId = req.user._id;
    
    const result = await monetizationService.approveAdCampaign(campaignId, reviewerId, notes);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startAdCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const result = await monetizationService.startAdCampaign(campaignId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveCampaigns = async (req, res) => {
  try {
    const targeting = req.query;
    
    const result = await monetizationService.getActiveCampaigns(targeting);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordAdImpression = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { isUnique = false } = req.body;
    
    const result = await monetizationService.recordAdImpression(campaignId, isUnique);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordAdClick = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { isUnique = false } = req.body;
    
    const result = await monetizationService.recordAdClick(campaignId, isUnique);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordAdConversion = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const result = await monetizationService.recordAdConversion(campaignId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subscription Endpoints

exports.createSubscriptionTier = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const tierData = req.body;
    
    const result = await monetizationService.createSubscriptionTier(creatorId, tierData);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorTiers = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { activeOnly = true } = req.query;
    
    const result = await monetizationService.getCreatorTiers(creatorId, activeOnly === 'true');
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const subscriberId = req.user._id;
    const { creatorId, tierId, paymentInfo } = req.body;
    
    const result = await monetizationService.subscribe(subscriberId, creatorId, tierId, paymentInfo);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason, feedback } = req.body;
    
    const result = await monetizationService.cancelSubscription(subscriptionId, reason, 'subscriber', feedback);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { paymentResult } = req.body;
    
    const result = await monetizationService.renewSubscription(subscriptionId, paymentResult);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = 'active' } = req.query;
    
    const result = await monetizationService.getUserSubscriptions(userId, status);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubscriptionsDueForRenewal = async (req, res) => {
  try {
    const { days = 3 } = req.query;
    
    const result = await monetizationService.getSubscriptionsDueForRenewal(parseInt(days));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.calculateMRR = async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    const result = await monetizationService.calculateMRR(creatorId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubscriptionStats = async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    const result = await monetizationService.getSubscriptionStats(creatorId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorDashboard = async (req, res) => {
  try {
    const creatorId = req.user._id;
    
    const result = await monetizationService.getCreatorDashboard(creatorId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
