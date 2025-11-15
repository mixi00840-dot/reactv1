const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Content = require('../models/Content');
const Transaction = require('../models/Transaction');
const Store = require('../models/Store');
const LiveStream = require('../models/LiveStream');
const Report = require('../models/Report');
const { adminAuth } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Parallel queries for better performance
    const [
      totalUsers,
      usersLastMonth,
      totalOrders,
      ordersLastMonth,
      totalRevenue,
      revenueLastMonth,
      totalProducts,
      activeContent,
      totalContent,
      pendingOrders,
      activeStores,
      liveStreams,
      pendingReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: lastMonth } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: lastMonth } }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: lastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.countDocuments(),
      Content.countDocuments({ status: 'approved' }),
      Content.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Store.countDocuments({ status: 'active' }),
      LiveStream.countDocuments({ status: 'live' }),
      Report.countDocuments({ status: 'pending' })
    ]);

    const currentRevenue = totalRevenue[0]?.total || 0;
    const lastMonthRevenue = revenueLastMonth[0]?.total || 0;

    // Calculate growth percentages
    const userGrowth = totalUsers > 0 
      ? Math.round(((totalUsers - (totalUsers - usersLastMonth)) / totalUsers) * 100)
      : 0;
    
    const orderGrowth = totalOrders > 0
      ? Math.round(((totalOrders - (totalOrders - ordersLastMonth)) / totalOrders) * 100)
      : 0;

    const revenueGrowth = currentRevenue > 0
      ? Math.round(((currentRevenue - lastMonthRevenue) / currentRevenue) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue: currentRevenue,
        totalProducts,
        activeContent,
        totalContent,
        pendingOrders,
        activeStores,
        liveStreams,
        pendingReports,
        userGrowth,
        orderGrowth,
        revenueGrowth,
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activities
router.get('/activities', adminAuth, async (req, res) => {
  try {
    // Get latest activities from multiple sources
    const [newUsers, newOrders, newContent, newReports] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username createdAt'),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username')
        .select('user totalAmount status createdAt'),
      Content.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('creator', 'username')
        .select('creator caption status createdAt'),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reporter', 'username')
        .select('reporter type status createdAt')
    ]);

    // Combine and format activities
    const activities = [
      ...newUsers.map(user => ({
        type: 'user',
        description: `New user ${user.username} signed up`,
        createdAt: user.createdAt
      })),
      ...newOrders.map(order => ({
        type: 'order',
        description: `New order from ${order.user?.username || 'Unknown'} - $${order.totalAmount}`,
        createdAt: order.createdAt
      })),
      ...newContent.map(content => ({
        type: 'content',
        description: `${content.creator?.username || 'Unknown'} posted new content`,
        createdAt: content.createdAt
      })),
      ...newReports.map(report => ({
        type: 'report',
        description: `${report.reporter?.username || 'Unknown'} filed a ${report.type} report`,
        createdAt: report.createdAt
      }))
    ];

    // Sort by date and limit to 20
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activities.slice(0, 20)
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
