const CreatorEarnings = require('../models/CreatorEarnings');
const AdCampaign = require('../models/AdCampaign');
const CreatorSubscription = require('../models/CreatorSubscription');
const SubscriptionTier = require('../models/SubscriptionTier');

/**
 * Monetization Service
 * 
 * Handles creator earnings, ad campaigns, and subscription management.
 */

class MonetizationService {
  /**
   * Create or update earnings record for period
   */
  async recordEarnings(creatorId, period, earningsData) {
    try {
      let earnings = await CreatorEarnings.findOne({
        creator: creatorId,
        'period.startDate': period.startDate,
        'period.endDate': period.endDate
      });
      
      if (!earnings) {
        earnings = new CreatorEarnings({
          creator: creatorId,
          period,
          status: 'draft'
        });
      }
      
      // Update earnings data
      if (earningsData.viewEarnings) {
        earnings.viewEarnings = {
          ...earnings.viewEarnings,
          ...earningsData.viewEarnings
        };
      }
      
      if (earningsData.giftEarnings) {
        earnings.giftEarnings = {
          ...earnings.giftEarnings,
          ...earningsData.giftEarnings
        };
      }
      
      if (earningsData.subscriptionEarnings) {
        earnings.subscriptionEarnings = {
          ...earnings.subscriptionEarnings,
          ...earningsData.subscriptionEarnings
        };
      }
      
      if (earningsData.adRevenue) {
        earnings.adRevenue = {
          ...earnings.adRevenue,
          ...earningsData.adRevenue
        };
      }
      
      if (earningsData.shoppingEarnings) {
        earnings.shoppingEarnings = {
          ...earnings.shoppingEarnings,
          ...earningsData.shoppingEarnings
        };
      }
      
      if (earningsData.affiliateEarnings) {
        earnings.affiliateEarnings = {
          ...earnings.affiliateEarnings,
          ...earningsData.affiliateEarnings
        };
      }
      
      if (earningsData.bonusEarnings) {
        earnings.bonusEarnings.breakdown.push(...earningsData.bonusEarnings.breakdown);
        earnings.bonusEarnings.amount = earnings.bonusEarnings.breakdown.reduce(
          (sum, b) => sum + b.amount, 0
        );
      }
      
      // Calculate totals
      earnings.calculateTotalEarnings();
      earnings.calculateMetrics();
      
      await earnings.save();
      
      return { success: true, earnings };
      
    } catch (error) {
      console.error('Record earnings error:', error);
      throw error;
    }
  }
  
  /**
   * Finalize earnings for payout
   */
  async finalizeEarnings(earningsId) {
    const earnings = await CreatorEarnings.findOne({ earningsId });
    
    if (!earnings) {
      throw new Error('Earnings not found');
    }
    
    await earnings.finalize();
    
    return { success: true, earnings };
  }
  
  /**
   * Process payout
   */
  async processPayout(earningsId, transactionId, paymentMethod) {
    const earnings = await CreatorEarnings.findOne({ earningsId });
    
    if (!earnings) {
      throw new Error('Earnings not found');
    }
    
    if (earnings.status !== 'finalized') {
      throw new Error('Earnings must be finalized before payout');
    }
    
    await earnings.markPaid(transactionId, paymentMethod);
    
    return { success: true, earnings };
  }
  
  /**
   * Get creator earnings for period
   */
  async getCreatorEarnings(creatorId, startDate, endDate) {
    const earnings = await CreatorEarnings.getCreatorEarnings(creatorId, startDate, endDate);
    return { success: true, earnings };
  }
  
  /**
   * Get pending payouts
   */
  async getPendingPayouts() {
    const payouts = await CreatorEarnings.getPendingPayouts();
    return { success: true, payouts, count: payouts.length };
  }
  
  /**
   * Get top earners
   */
  async getTopEarners(period = 'monthly', limit = 50) {
    const earners = await CreatorEarnings.getTopEarners(period, limit);
    return { success: true, earners };
  }
  
  /**
   * Calculate creator tier
   */
  async calculateCreatorTier(creatorId) {
    // Get last month earnings
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const earnings = await CreatorEarnings.getCreatorEarnings(creatorId, startDate, endDate);
    
    if (!earnings) {
      return { tier: 'bronze', multiplier: 1.0 };
    }
    
    const totalEarnings = earnings.summary.netEarnings;
    const subscribers = earnings.subscriptionEarnings.totalSubscribers;
    
    // Calculate consistency (how many months creator has been active)
    const allEarnings = await CreatorEarnings.find({
      creator: creatorId,
      status: { $in: ['finalized', 'paid'] }
    }).sort({ 'period.startDate': -1 }).limit(12);
    
    const consistency = allEarnings.length / 12; // 0 to 1
    
    const tierInfo = CreatorEarnings.calculateCreatorTier(totalEarnings, subscribers, consistency);
    
    return { success: true, ...tierInfo };
  }
  
  // Ad Campaign Methods
  
  /**
   * Create ad campaign
   */
  async createAdCampaign(advertiserId, campaignData) {
    const campaign = new AdCampaign({
      advertiser: advertiserId,
      ...campaignData,
      status: 'draft'
    });
    
    await campaign.save();
    
    return { success: true, campaign };
  }
  
  /**
   * Update ad campaign
   */
  async updateAdCampaign(campaignId, updates) {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Only allow updates if not active
    if (campaign.status === 'active' && !updates.pause) {
      throw new Error('Cannot update active campaign. Pause it first.');
    }
    
    Object.assign(campaign, updates);
    await campaign.save();
    
    return { success: true, campaign };
  }
  
  /**
   * Approve ad campaign
   */
  async approveAdCampaign(campaignId, reviewerId, notes = '') {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    campaign.status = 'approved';
    campaign.approval = {
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      complianceNotes: notes
    };
    
    await campaign.save();
    
    return { success: true, campaign };
  }
  
  /**
   * Start ad campaign
   */
  async startAdCampaign(campaignId) {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    if (campaign.status !== 'approved') {
      throw new Error('Campaign must be approved before starting');
    }
    
    campaign.status = 'active';
    await campaign.save();
    
    return { success: true, campaign };
  }
  
  /**
   * Get active campaigns for content
   */
  async getActiveCampaigns(targeting = {}) {
    const campaigns = await AdCampaign.getActiveCampaigns(targeting);
    return { success: true, campaigns };
  }
  
  /**
   * Record ad impression
   */
  async recordAdImpression(campaignId, isUnique = false) {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    await campaign.recordImpression(isUnique);
    
    return { success: true, campaign };
  }
  
  /**
   * Record ad click
   */
  async recordAdClick(campaignId, isUnique = false) {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    await campaign.recordClick(isUnique);
    
    return { success: true, campaign };
  }
  
  /**
   * Record ad conversion
   */
  async recordAdConversion(campaignId) {
    const campaign = await AdCampaign.findOne({ campaignId });
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    await campaign.recordConversion();
    
    return { success: true, campaign };
  }
  
  // Subscription Methods
  
  /**
   * Create subscription tier
   */
  async createSubscriptionTier(creatorId, tierData) {
    const tier = new SubscriptionTier({
      creator: creatorId,
      ...tierData
    });
    
    await tier.save();
    
    return { success: true, tier };
  }
  
  /**
   * Get creator tiers
   */
  async getCreatorTiers(creatorId, activeOnly = true) {
    const tiers = await SubscriptionTier.getCreatorTiers(creatorId, activeOnly);
    return { success: true, tiers };
  }
  
  /**
   * Subscribe to creator
   */
  async subscribe(subscriberId, creatorId, tierId, paymentInfo) {
    // Get tier
    const tier = await SubscriptionTier.findOne({ tierId });
    
    if (!tier) {
      throw new Error('Subscription tier not found');
    }
    
    if (!tier.isAvailable()) {
      throw new Error('Subscription tier not available');
    }
    
    // Check if already subscribed
    const existing = await CreatorSubscription.findOne({
      subscriber: subscriberId,
      creator: creatorId,
      status: 'active'
    });
    
    if (existing) {
      throw new Error('Already subscribed to this creator');
    }
    
    // Create subscription
    const subscription = new CreatorSubscription({
      creator: creatorId,
      subscriber: subscriberId,
      tier: tier.level,
      tierDetails: {
        name: tier.name,
        description: tier.description,
        price: tier.pricing.monthly,
        currency: tier.pricing.currency,
        benefits: tier.getBenefitSummary(),
        accessLevel: tier.level
      },
      payment: paymentInfo,
      status: 'active'
    });
    
    subscription.calculateNextBillingDate();
    await subscription.save();
    
    // Update tier stats
    await tier.addSubscriber();
    
    return { success: true, subscription };
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason, cancelledBy = 'subscriber', feedback = '') {
    const subscription = await CreatorSubscription.findOne({ subscriptionId });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    await subscription.cancel(reason, cancelledBy, feedback);
    
    // Update tier stats
    const tier = await SubscriptionTier.findOne({
      creator: subscription.creator,
      level: subscription.tier
    });
    
    if (tier) {
      await tier.removeSubscriber(true);
    }
    
    return { success: true, subscription };
  }
  
  /**
   * Process subscription renewal
   */
  async renewSubscription(subscriptionId, paymentResult) {
    const subscription = await CreatorSubscription.findOne({ subscriptionId });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    await subscription.processPayment(paymentResult);
    
    return { success: true, subscription };
  }
  
  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userId, status = 'active') {
    const subscriptions = await CreatorSubscription.getUserSubscriptions(userId, status);
    return { success: true, subscriptions };
  }
  
  /**
   * Get subscriptions due for renewal
   */
  async getSubscriptionsDueForRenewal(days = 3) {
    const subscriptions = await CreatorSubscription.getDueForRenewal(days);
    return { success: true, subscriptions };
  }
  
  /**
   * Calculate MRR for creator
   */
  async calculateMRR(creatorId) {
    const mrr = await CreatorSubscription.calculateMRR(creatorId);
    return { success: true, mrr };
  }
  
  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(creatorId) {
    const stats = await CreatorSubscription.getCreatorStats(creatorId);
    const tierStats = await SubscriptionTier.getTierStats(creatorId);
    const mrr = await CreatorSubscription.calculateMRR(creatorId);
    
    return {
      success: true,
      stats: {
        tiers: stats,
        overall: tierStats[0] || {},
        mrr
      }
    };
  }
  
  /**
   * Get monetization dashboard for creator
   */
  async getCreatorDashboard(creatorId) {
    // Get current month earnings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const earnings = await CreatorEarnings.getCreatorEarnings(creatorId, monthStart, monthEnd);
    const subscriptions = await CreatorSubscription.getCreatorSubscriptions(creatorId, 'active');
    const mrr = await CreatorSubscription.calculateMRR(creatorId);
    const tierInfo = await this.calculateCreatorTier(creatorId);
    
    return {
      success: true,
      dashboard: {
        earnings: earnings || {},
        subscriptions: {
          active: subscriptions.length,
          mrr
        },
        tier: tierInfo
      }
    };
  }
}

module.exports = new MonetizationService();
