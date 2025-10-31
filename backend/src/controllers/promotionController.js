const { Coupon } = require('../models/Coupon');
const Product = require('../models/Product');
const { Category } = require('../models/Category');
const Store = require('../models/Store');
const User = require('../models/User');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class PromotionController {
  // Create promotional campaign with multiple coupons
  async createCampaign(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        name,
        description,
        type, // 'mass_discount', 'loyalty_program', 'seasonal', 'flash_sale', 'bulk_coupons'
        campaignConfig,
        targetAudience,
        schedule,
        coupons = []
      } = req.body;

      // Validate campaign configuration
      const validationResult = this.validateCampaignConfig(type, campaignConfig);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign configuration',
          errors: validationResult.errors
        });
      }

      let createdCoupons = [];
      let campaignUsers = [];

      // Handle different campaign types
      switch (type) {
        case 'bulk_coupons':
          createdCoupons = await this.createBulkCoupons(campaignConfig, req.user, session);
          break;

        case 'loyalty_program':
          createdCoupons = await this.createLoyaltyCoupons(campaignConfig, req.user, session);
          break;

        case 'seasonal':
          createdCoupons = await this.createSeasonalCoupons(campaignConfig, req.user, session);
          break;

        case 'flash_sale':
          createdCoupons = await this.createFlashSaleCoupons(campaignConfig, req.user, session);
          break;

        case 'mass_discount':
          createdCoupons = await this.createMassDiscountCoupons(campaignConfig, req.user, session);
          break;

        default:
          // Create custom coupons from provided array
          for (const couponData of coupons) {
            const coupon = new Coupon({
              ...couponData,
              createdBy: req.user._id,
              storeId: req.user.role === 'seller' ? 
                (await Store.findOne({ ownerId: req.user._id }))._id : 
                couponData.storeId
            });
            await coupon.save({ session });
            createdCoupons.push(coupon);
          }
          break;
      }

      // Get target audience
      if (targetAudience) {
        campaignUsers = await this.getTargetAudience(targetAudience, session);
      }

      // Create campaign metadata (could be stored in a separate Campaign model)
      const campaignData = {
        name,
        description,
        type,
        campaignConfig,
        targetAudience,
        schedule,
        createdCoupons: createdCoupons.map(c => c._id),
        createdBy: req.user._id,
        createdAt: new Date(),
        status: schedule?.startDate && new Date(schedule.startDate) > new Date() ? 'scheduled' : 'active'
      };

      // If this was a bulk campaign, send notifications/emails
      if (type === 'bulk_coupons' && campaignUsers.length > 0) {
        await this.sendCampaignNotifications(createdCoupons, campaignUsers, campaignData);
      }

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Promotional campaign created successfully',
        data: {
          campaign: campaignData,
          coupons: createdCoupons,
          targetUsers: campaignUsers.length,
          statistics: {
            totalCoupons: createdCoupons.length,
            estimatedReach: campaignUsers.length
          }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating promotional campaign',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Get promotional campaigns
  async getCampaigns(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate
      } = req.query;

      // Build aggregation pipeline to get campaign data
      let matchQuery = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      }

      // Get coupons that are part of campaigns (have campaign metadata)
      const campaignCoupons = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $match: {
            'campaignData.type': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$campaignData.id',
            name: { $first: '$campaignData.name' },
            type: { $first: '$campaignData.type' },
            status: { $first: '$campaignData.status' },
            createdAt: { $first: '$campaignData.createdAt' },
            totalCoupons: { $sum: 1 },
            activeCoupons: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            },
            totalUsage: { $sum: '$usage.used' },
            totalSavings: { $sum: '$analytics.totalSavings' }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);

      res.json({
        success: true,
        data: {
          campaigns: campaignCoupons,
          pagination: {
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching promotional campaigns',
        error: error.message
      });
    }
  }

  // Create flash sale
  async createFlashSale(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        name,
        description,
        discountPercentage,
        maxDiscountAmount,
        duration, // in hours
        targetProducts = [],
        targetCategories = [],
        maxUsagePerUser = 1,
        totalUsageLimit
      } = req.body;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + duration);

      // Generate unique flash sale code
      const flashCode = `FLASH${Date.now().toString().slice(-6)}`;

      // Create flash sale coupon
      const flashSaleCoupon = new Coupon({
        code: flashCode,
        name: name,
        description: description,
        type: 'percentage',
        discount: {
          value: discountPercentage,
          maxDiscountAmount: maxDiscountAmount,
          applyTo: targetProducts.length > 0 ? 'specific_products' : 'order_total'
        },
        conditions: {
          applicableProducts: targetProducts,
          applicableCategories: targetCategories,
          minOrderAmount: 0
        },
        usage: {
          limit: totalUsageLimit,
          perUser: maxUsagePerUser,
          used: 0,
          usedBy: []
        },
        validity: {
          startDate: startDate,
          endDate: endDate
        },
        status: 'active',
        isPublic: true,
        createdBy: req.user._id,
        storeId: req.user.role === 'seller' ? 
          (await Store.findOne({ ownerId: req.user._id }))._id : 
          null,
        campaignData: {
          type: 'flash_sale',
          name: name,
          duration: duration,
          createdAt: new Date()
        }
      });

      await flashSaleCoupon.save({ session });

      // Get potential customers to notify
      let targetUsers = [];
      if (targetProducts.length > 0) {
        // Find users who have these products in wishlist or cart
        targetUsers = await this.getUsersInterestedInProducts(targetProducts);
      } else {
        // Get recent active customers
        targetUsers = await this.getRecentActiveCustomers(100);
      }

      // Send flash sale notifications
      await this.sendFlashSaleNotifications(flashSaleCoupon, targetUsers);

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Flash sale created successfully',
        data: {
          flashSale: flashSaleCoupon,
          notificationsSent: targetUsers.length,
          validUntil: endDate
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating flash sale:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating flash sale',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Create loyalty rewards
  async createLoyaltyRewards(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        tierConfigs = [], // Array of tier configurations
        rewardType = 'percentage', // 'percentage', 'fixed_amount', 'free_shipping'
        validityPeriod = 30 // days
      } = req.body;

      const createdCoupons = [];

      // Get users and their order history for tier calculation
      const customers = await User.find({ role: 'customer' }).session(session);

      for (const customer of customers) {
        // Calculate customer tier based on order history
        const customerTier = await this.calculateCustomerTier(customer._id);
        
        // Find matching tier config
        const tierConfig = tierConfigs.find(config => 
          config.tierName === customerTier.tier
        );

        if (tierConfig) {
          // Create personalized loyalty coupon
          const loyaltyCode = `LOYAL${customer._id.toString().slice(-4)}${Date.now().toString().slice(-4)}`;
          
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + validityPeriod);

          const loyaltyCoupon = new Coupon({
            code: loyaltyCode,
            name: `Loyalty Reward - ${tierConfig.tierName}`,
            description: `Exclusive ${tierConfig.tierName} member discount`,
            type: rewardType,
            discount: {
              value: tierConfig.discountValue,
              maxDiscountAmount: tierConfig.maxDiscount,
              applyTo: 'order_total'
            },
            conditions: {
              eligibleUsers: [customer._id],
              minOrderAmount: tierConfig.minOrderAmount || 0
            },
            usage: {
              limit: 1,
              perUser: 1,
              used: 0,
              usedBy: []
            },
            validity: {
              startDate: new Date(),
              endDate: endDate
            },
            status: 'active',
            isPublic: false,
            createdBy: req.user._id,
            campaignData: {
              type: 'loyalty_program',
              tier: customerTier.tier,
              customerTierData: customerTier,
              createdAt: new Date()
            }
          });

          await loyaltyCoupon.save({ session });
          createdCoupons.push(loyaltyCoupon);
        }
      }

      // Send loyalty reward notifications
      await this.sendLoyaltyRewardNotifications(createdCoupons);

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Loyalty rewards created successfully',
        data: {
          totalRewards: createdCoupons.length,
          tierBreakdown: this.groupByTier(createdCoupons),
          validUntil: new Date(Date.now() + validityPeriod * 24 * 60 * 60 * 1000)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating loyalty rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating loyalty rewards',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Analyze promotion performance
  async getPromotionAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        type,
        storeId
      } = req.query;

      // Build match query
      let matchQuery = {};
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      matchQuery.createdAt = { $gte: start, $lte: end };

      if (type) {
        matchQuery['campaignData.type'] = type;
      }

      // Promotion performance analytics
      const promotionPerformance = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              type: '$campaignData.type',
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            totalCoupons: { $sum: 1 },
            totalUsage: { $sum: '$usage.used' },
            totalSavings: { $sum: '$analytics.totalSavings' },
            totalRevenue: { $sum: '$analytics.revenueGenerated' },
            averageUsageRate: {
              $avg: {
                $cond: [
                  { $gt: ['$usage.limit', 0] },
                  { $divide: ['$usage.used', '$usage.limit'] },
                  0
                ]
              }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      // Top performing promotions
      const topPromotions = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $project: {
            code: 1,
            name: 1,
            type: 1,
            'campaignData.type': 1,
            'usage.used': 1,
            'analytics.totalSavings': 1,
            'analytics.revenueGenerated': 1,
            roi: {
              $cond: [
                { $gt: ['$analytics.totalSavings', 0] },
                { $divide: ['$analytics.revenueGenerated', '$analytics.totalSavings'] },
                0
              ]
            }
          }
        },
        { $sort: { roi: -1 } },
        { $limit: 10 }
      ]);

      // Customer engagement metrics
      const engagementMetrics = await Coupon.aggregate([
        { $match: matchQuery },
        { $unwind: '$usage.usedBy' },
        {
          $group: {
            _id: '$usage.usedBy.user',
            couponsUsed: { $sum: 1 },
            totalSavings: { $sum: '$usage.usedBy.discountAmount' }
          }
        },
        {
          $group: {
            _id: null,
            uniqueUsers: { $sum: 1 },
            averageCouponsPerUser: { $avg: '$couponsUsed' },
            averageSavingsPerUser: { $avg: '$totalSavings' }
          }
        }
      ]);

      // Conversion rates by promotion type
      const conversionRates = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$campaignData.type',
            totalCoupons: { $sum: 1 },
            usedCoupons: {
              $sum: {
                $cond: [{ $gt: ['$usage.used', 0] }, 1, 0]
              }
            },
            conversionRate: {
              $avg: {
                $cond: [
                  { $gt: ['$usage.used', 0] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            period: { start, end },
            totalPromotions: promotionPerformance.reduce((sum, p) => sum + p.totalCoupons, 0),
            totalUsage: promotionPerformance.reduce((sum, p) => sum + p.totalUsage, 0),
            totalSavings: promotionPerformance.reduce((sum, p) => sum + p.totalSavings, 0),
            totalRevenue: promotionPerformance.reduce((sum, p) => sum + p.totalRevenue, 0)
          },
          performance: promotionPerformance,
          topPromotions,
          engagement: engagementMetrics[0] || {},
          conversionRates
        }
      });

    } catch (error) {
      console.error('Error fetching promotion analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching promotion analytics',
        error: error.message
      });
    }
  }

  // Send promotional emails/notifications
  async sendPromotionalNotifications(req, res) {
    try {
      const {
        couponIds,
        targetAudience,
        notificationType = 'email', // 'email', 'sms', 'push', 'all'
        customMessage
      } = req.body;

      // Get coupons
      const coupons = await Coupon.find({ _id: { $in: couponIds } })
        .populate('storeId', 'name');

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No valid coupons found'
        });
      }

      // Get target users
      const users = await this.getTargetAudience(targetAudience);

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No target users found'
        });
      }

      // Send notifications
      const notificationResults = await this.sendBulkNotifications(
        coupons,
        users,
        notificationType,
        customMessage
      );

      res.json({
        success: true,
        message: 'Promotional notifications sent successfully',
        data: {
          totalUsers: users.length,
          notifications: notificationResults,
          coupons: coupons.map(c => ({ id: c._id, code: c.code, name: c.name }))
        }
      });

    } catch (error) {
      console.error('Error sending promotional notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending promotional notifications',
        error: error.message
      });
    }
  }

  // Helper methods

  validateCampaignConfig(type, config) {
    const errors = [];

    switch (type) {
      case 'bulk_coupons':
        if (!config.count || config.count <= 0 || config.count > 1000) {
          errors.push('Bulk coupon count must be between 1-1000');
        }
        if (!config.discountValue || config.discountValue <= 0) {
          errors.push('Discount value is required');
        }
        break;

      case 'flash_sale':
        if (!config.duration || config.duration <= 0 || config.duration > 168) {
          errors.push('Flash sale duration must be between 1-168 hours');
        }
        break;

      case 'loyalty_program':
        if (!config.tiers || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          errors.push('Loyalty tiers configuration is required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async createBulkCoupons(config, user, session) {
    const coupons = [];
    const {
      count,
      prefix = 'BULK',
      discountType,
      discountValue,
      minOrderAmount,
      validityDays = 30
    } = config;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + validityDays);

    for (let i = 0; i < count; i++) {
      const code = `${prefix}${Date.now()}${i.toString().padStart(3, '0')}`;
      
      const coupon = new Coupon({
        code,
        name: `Bulk Discount ${i + 1}`,
        description: 'Promotional bulk discount',
        type: discountType,
        discount: { value: discountValue },
        conditions: { minOrderAmount },
        usage: { limit: 1, perUser: 1 },
        validity: { endDate },
        status: 'active',
        isPublic: true,
        createdBy: user._id,
        storeId: user.role === 'seller' ? 
          (await Store.findOne({ owner: user._id }).session(session))?._id : 
          null,
        campaignData: {
          type: 'bulk_coupons',
          batchId: Date.now(),
          createdAt: new Date()
        }
      });

      await coupon.save({ session });
      coupons.push(coupon);
    }

    return coupons;
  }

  async createLoyaltyCoupons(config, user, session) {
    // Implementation for loyalty program coupons
    return [];
  }

  async createSeasonalCoupons(config, user, session) {
    // Implementation for seasonal coupons
    return [];
  }

  async createFlashSaleCoupons(config, user, session) {
    // Implementation for flash sale coupons
    return [];
  }

  async createMassDiscountCoupons(config, user, session) {
    // Implementation for mass discount coupons
    return [];
  }

  async getTargetAudience(criteria, session = null) {
    let query = { role: 'customer' };

    if (criteria.customerType) {
      // Add customer type filtering logic
    }

    if (criteria.minOrderValue) {
      // Find customers with orders above minimum value
    }

    if (criteria.location) {
      // Add location-based filtering
    }

    return await User.find(query).session(session);
  }

  async calculateCustomerTier(customerId) {
    // Calculate customer tier based on order history
    const orders = await Order.find({ customer: customerId, status: 'delivered' });
    
    const totalSpent = orders.reduce((sum, order) => sum + order.totals.finalTotal, 0);
    const orderCount = orders.length;

    let tier = 'bronze';
    if (totalSpent >= 1000 && orderCount >= 10) {
      tier = 'gold';
    } else if (totalSpent >= 500 && orderCount >= 5) {
      tier = 'silver';
    }

    return {
      tier,
      totalSpent,
      orderCount,
      lastOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null
    };
  }

  async sendCampaignNotifications(coupons, users, campaignData) {
    // Implementation for sending campaign notifications
    console.log(`Sending notifications for campaign: ${campaignData.name} to ${users.length} users`);
  }

  async sendFlashSaleNotifications(coupon, users) {
    // Implementation for flash sale notifications
    console.log(`Sending flash sale notifications for ${coupon.code} to ${users.length} users`);
  }

  async sendLoyaltyRewardNotifications(coupons) {
    // Implementation for loyalty reward notifications
    console.log(`Sending loyalty reward notifications for ${coupons.length} coupons`);
  }

  async sendBulkNotifications(coupons, users, type, message) {
    // Implementation for bulk notifications
    return {
      sent: users.length,
      failed: 0,
      type: type
    };
  }

  async getUsersInterestedInProducts(productIds) {
    // Find users who have these products in wishlist or recently viewed
    return await User.find({ role: 'customer' }).limit(100);
  }

  async getRecentActiveCustomers(limit = 100) {
    // Get customers who made orders recently
    const recentOrders = await Order.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).distinct('customer');

    return await User.find({ 
      _id: { $in: recentOrders },
      role: 'customer' 
    }).limit(limit);
  }

  groupByTier(coupons) {
    return coupons.reduce((acc, coupon) => {
      const tier = coupon.campaignData?.tier || 'unknown';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = new PromotionController();
