const { PlatformAnalytics, UserAnalytics, EventTracking } = require('../models/AdvancedAnalytics');
const { UserCreditBalance } = require('../models/Credit');
const { GiftTransaction } = require('../models/Gift');
const User = require('../models/User');

// ============ Dashboard Analytics ============

// Get platform overview metrics
exports.getPlatformOverview = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const metrics = await PlatformAnalytics.getMetrics(start, end, period);
    
    // Get current day metrics
    const today = await PlatformAnalytics.findOne({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      },
      period: 'daily'
    });
    
    res.json({
      success: true,
      data: {
        summary: metrics,
        today: today || {},
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const dateFormat = groupBy === 'month' ? '%Y-%m' : 
                       groupBy === 'week' ? '%Y-W%U' : '%Y-%m-%d';
    
    const revenueData = await PlatformAnalytics.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          period: 'daily'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$date' }
          },
          totalRevenue: { $sum: '$revenue.total' },
          creditRevenue: { $sum: '$revenue.credits' },
          productRevenue: { $sum: '$revenue.products' },
          transactions: { $sum: '$transactions.completed' },
          avgOrderValue: { $avg: '$revenue.avgOrderValue' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Calculate growth rate
    const growth = revenueData.length > 1 ? 
      ((revenueData[revenueData.length - 1].totalRevenue - revenueData[0].totalRevenue) / revenueData[0].totalRevenue * 100) : 0;
    
    res.json({
      success: true,
      data: {
        revenue: revenueData,
        growth: growth.toFixed(2),
        period: { start, end, groupBy }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const userStats = await PlatformAnalytics.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          period: 'daily'
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $last: '$users.total' },
          newUsers: { $sum: '$users.new' },
          activeUsers: { $sum: '$users.active' },
          newSellers: { $sum: '$users.newSellers' },
          deletedUsers: { $sum: '$users.deleted' }
        }
      }
    ]);
    
    // Get user segments
    const segments = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user activity distribution
    const activityDistribution = await UserAnalytics.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$sessions.count', 10] }, 'highly_active',
              { $cond: [
                { $gte: ['$sessions.count', 5] }, 'active',
                { $cond: [
                  { $gte: ['$sessions.count', 1] }, 'occasional',
                  'inactive'
                ]}
              ]}
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        stats: userStats[0] || {},
        segments,
        activityDistribution,
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get gifting analytics
exports.getGiftingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const giftingStats = await PlatformAnalytics.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          period: 'daily'
        }
      },
      {
        $group: {
          _id: null,
          totalGiftsSent: { $sum: '$gifts.sent' },
          totalGiftValue: { $sum: '$gifts.totalValue' },
          avgGiftValue: { $avg: '$gifts.avgGiftValue' },
          uniqueSenders: { $sum: '$gifts.uniqueSenders' },
          uniqueReceivers: { $sum: '$gifts.uniqueReceivers' }
        }
      }
    ]);
    
    // Get top gifts
    const topGifts = await GiftTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'seen', 'thanked'] }
        }
      },
      {
        $group: {
          _id: '$gift',
          count: { $sum: '$quantity' },
          revenue: { $sum: '$totalCost' }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'gifts',
          localField: '_id',
          foreignField: '_id',
          as: 'giftDetails'
        }
      },
      {
        $unwind: '$giftDetails'
      },
      {
        $project: {
          name: '$giftDetails.displayName',
          icon: '$giftDetails.media.icon',
          count: 1,
          revenue: 1
        }
      }
    ]);
    
    // Daily trend
    const dailyTrend = await PlatformAnalytics.find({
      date: { $gte: start, $lte: end },
      period: 'daily'
    })
    .select('date gifts')
    .sort({ date: 1 });
    
    res.json({
      success: true,
      data: {
        stats: giftingStats[0] || {},
        topGifts,
        dailyTrend,
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get livestream analytics
exports.getLivestreamAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const streamStats = await PlatformAnalytics.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          period: 'daily'
        }
      },
      {
        $group: {
          _id: null,
          totalStreams: { $sum: '$livestreams.total' },
          completedStreams: { $sum: '$livestreams.completed' },
          totalViewers: { $sum: '$livestreams.totalViewers' },
          avgViewers: { $avg: '$livestreams.avgViewers' },
          totalDuration: { $sum: '$livestreams.totalDuration' },
          avgDuration: { $avg: '$livestreams.avgDuration' },
          giftsReceived: { $sum: '$livestreams.giftsReceived' }
        }
      }
    ]);
    
    // Stream trend
    const streamTrend = await PlatformAnalytics.find({
      date: { $gte: start, $lte: end },
      period: 'daily'
    })
    .select('date livestreams')
    .sort({ date: 1 });
    
    res.json({
      success: true,
      data: {
        stats: streamStats[0] || {},
        trend: streamTrend,
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ Individual User Analytics ============

// Get specific user analytics
exports.getUserInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Get user analytics history
    const analytics = await UserAnalytics.find({
      user: userId,
      date: { $gte: startDate }
    })
    .sort({ date: 1 });
    
    // Get user segment
    const segment = await UserAnalytics.getUserSegment(userId);
    
    // Get credit balance
    const creditBalance = await UserCreditBalance.findOne({ user: userId });
    
    // Calculate totals
    const totals = analytics.reduce((acc, day) => {
      acc.pageViews += day.activity.pageViews;
      acc.sessions += day.sessions.count;
      acc.totalSpent += day.shopping.totalSpent;
      acc.giftsSent += day.gifting.giftsSent;
      acc.giftsReceived += day.gifting.giftsReceived;
      return acc;
    }, {
      pageViews: 0,
      sessions: 0,
      totalSpent: 0,
      giftsSent: 0,
      giftsReceived: 0
    });
    
    res.json({
      success: true,
      data: {
        segment,
        totals,
        creditBalance: creditBalance ? {
          balance: creditBalance.balance,
          tier: creditBalance.tier,
          lifetime: creditBalance.lifetime
        } : null,
        history: analytics,
        period: { days, startDate }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ Event Tracking ============

// Track event
exports.trackEvent = async (req, res) => {
  try {
    const { eventType, relatedEntities, data, sessionId, device, location } = req.body;
    const userId = req.user ? req.user._id : null;
    
    const event = await EventTracking.trackEvent({
      eventType,
      user: userId,
      relatedEntities,
      data,
      sessionId,
      device: {
        ...device,
        userAgent: req.get('user-agent')
      },
      location: {
        ...location,
        ip: req.ip
      },
      metadata: {
        referrer: req.get('referrer'),
        path: req.path
      }
    });
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const { eventType, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await EventTracking.getEventStats(eventType, start, end);
    
    res.json({
      success: true,
      data: {
        eventType,
        stats,
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get real-time metrics
exports.getRealTimeMetrics = async (req, res) => {
  try {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
    
    // Count recent events
    const recentEvents = await EventTracking.aggregate([
      {
        $match: {
          timestamp: { $gte: last15Minutes }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Active users (users with events in last 15 min)
    const activeUsers = await EventTracking.distinct('user', {
      timestamp: { $gte: last15Minutes },
      user: { $ne: null }
    });
    
    // Recent purchases
    const recentPurchases = await EventTracking.countDocuments({
      eventType: 'product_purchase',
      timestamp: { $gte: last15Minutes }
    });
    
    // Recent gifts
    const recentGifts = await EventTracking.countDocuments({
      eventType: 'gift_send',
      timestamp: { $gte: last15Minutes }
    });
    
    res.json({
      success: true,
      data: {
        activeUsers: activeUsers.length,
        recentEvents,
        recentPurchases,
        recentGifts,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get trend analysis
exports.getTrendAnalysis = async (req, res) => {
  try {
    const { metric, days = 30 } = req.query;
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        message: 'Metric parameter is required'
      });
    }
    
    const trend = await PlatformAnalytics.getTrend(metric, parseInt(days));
    
    // Calculate trend direction
    const values = trend.map(t => {
      const keys = metric.split('.');
      let value = t;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    });
    
    const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const previousAvg = values.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    const changePercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100) : 0;
    
    res.json({
      success: true,
      data: {
        metric,
        trend,
        analysis: {
          recentAverage: recentAvg,
          previousAverage: previousAvg,
          changePercent: changePercent.toFixed(2),
          direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable'
        },
        period: { days }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    let data;
    
    switch(type) {
      case 'platform':
        data = await PlatformAnalytics.find({
          date: { $gte: start, $lte: end }
        }).sort({ date: 1 });
        break;
      case 'events':
        data = await EventTracking.find({
          timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: 1 });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }
    
    if (format === 'csv') {
      // Simple CSV export
      const csv = data.map(row => JSON.stringify(row)).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data,
      meta: {
        type,
        count: data.length,
        period: { start, end }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
