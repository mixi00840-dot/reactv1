/**
 * ADMIN REALTIME STATS ROUTE
 * 
 * Provides real-time system statistics for the admin dashboard.
 * Frontend calls: /api/admin/realtime/stats
 * 
 * Returns live metrics including:
 * - Active users online
 * - Active livestreams
 * - Recent orders
 * - System performance
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const LiveStream = require('../../models/LiveStream');
const Order = require('../../models/Order');
const Content = require('../../models/Content');
const { verifyJWT, requireAdmin } = require('../../middleware/jwtAuth');
const os = require('os');

// Get real-time dashboard statistics
router.get('/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Parallel queries for real-time data
    const [
      activeUsers,
      activeLiveStreams,
      recentOrders,
      recentContent,
      ordersLast1Hour,
      ordersLast24Hours,
      contentLast1Hour,
      contentLast24Hours,
      usersOnline
    ] = await Promise.all([
      // Users active in last 5 minutes (based on lastActive field)
      User.countDocuments({ 
        lastActive: { $gte: last5Minutes }
      }),
      
      // Currently live streams
      LiveStream.countDocuments({ 
        status: 'live',
        endedAt: null
      }),
      
      // Recent orders (last 5 minutes)
      Order.countDocuments({ 
        createdAt: { $gte: last5Minutes }
      }),
      
      // Recent content uploads (last 5 minutes)
      Content.countDocuments({ 
        createdAt: { $gte: last5Minutes }
      }),
      
      // Orders in last hour
      Order.aggregate([
        { $match: { createdAt: { $gte: last1Hour } } },
        { 
          $group: { 
            _id: null, 
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          } 
        }
      ]),
      
      // Orders in last 24 hours
      Order.aggregate([
        { $match: { createdAt: { $gte: last24Hours } } },
        { 
          $group: { 
            _id: null, 
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          } 
        }
      ]),
      
      // Content in last hour
      Content.countDocuments({ createdAt: { $gte: last1Hour } }),
      
      // Content in last 24 hours
      Content.countDocuments({ createdAt: { $gte: last24Hours } }),
      
      // Users online (active in last 5 minutes)
      User.find({ 
        lastActive: { $gte: last5Minutes }
      })
      .select('username avatar role lastActive')
      .sort({ lastActive: -1 })
      .limit(10)
    ]);

    // Get live stream details
    const liveStreamDetails = await LiveStream.find({
      status: 'live',
      endedAt: null
    })
    .populate('creator', 'username avatar')
    .select('title viewerCount creator createdAt')
    .sort({ viewerCount: -1 })
    .limit(5);

    // Get recent order details
    const recentOrderDetails = await Order.find({
      createdAt: { $gte: last5Minutes }
    })
    .populate('user', 'username')
    .select('user totalAmount status createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // System metrics
    const memUsage = process.memoryUsage();
    const systemStats = {
      cpu: {
        usage: os.loadavg()[0] * 10, // Rough percentage
        cores: os.cpus().length
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
      },
      uptime: process.uptime()
    };

    const ordersLast1HourData = ordersLast1Hour[0] || { count: 0, revenue: 0 };
    const ordersLast24HoursData = ordersLast24Hours[0] || { count: 0, revenue: 0 };

    res.json({
      success: true,
      data: {
        realtime: {
          activeUsers,
          activeLiveStreams,
          recentOrders,
          recentContent,
          timestamp: new Date().toISOString()
        },
        hourly: {
          orders: ordersLast1HourData.count,
          revenue: ordersLast1HourData.revenue,
          content: contentLast1Hour
        },
        daily: {
          orders: ordersLast24HoursData.count,
          revenue: ordersLast24HoursData.revenue,
          content: contentLast24Hours
        },
        liveStreams: liveStreamDetails.map(stream => ({
          id: stream._id,
          title: stream.title,
          creator: stream.creator?.username || 'Unknown',
          viewers: stream.viewerCount || 0,
          duration: Math.floor((now - new Date(stream.createdAt)) / 1000 / 60) // minutes
        })),
        recentOrders: recentOrderDetails.map(order => ({
          id: order._id,
          user: order.user?.username || 'Unknown',
          amount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt
        })),
        onlineUsers: usersOnline.map(user => ({
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          lastActive: user.lastActive
        })),
        system: systemStats
      }
    });
  } catch (error) {
    console.error('Error fetching realtime stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
