const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Notifications Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, unreadOnly } = req.query;
    const userId = req.userId;

    const notifications = await Notification.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      unreadOnly: unreadOnly === 'true'
    });

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', verifyJWT, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check ownership
    if (!notification.userId.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: { notification },
      message: 'Marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', verifyJWT, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.userId);

    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all as read'
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread count
 * @access  Private
 */
router.get('/unread-count', verifyJWT, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.userId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
const { requireAdmin } = require('../middleware/jwtAuth');
const User = require('../models/User');

/**
 * @route   POST /api/notifications/admin/send
 * @desc    Send notification to users (Admin)
 * @access  Admin
 */
router.post('/admin/send', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      message, 
      recipientType, 
      targetUsers, 
      targetSegment, 
      link,
      type = 'system'
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let userIds = [];

    // Determine recipients
    if (recipientType === 'all') {
      const allUsers = await User.find({ role: 'user' }).select('_id');
      userIds = allUsers.map(u => u._id);
    } else if (recipientType === 'specific' && targetUsers) {
      userIds = targetUsers.split(',').map(id => id.trim());
    } else if (recipientType === 'segment') {
      let query = {};
      if (targetSegment === 'verified') {
        query.isVerified = true;
      } else if (targetSegment === 'creators') {
        query.role = 'creator';
      } else if (targetSegment === 'sellers') {
        query.isSeller = true;
      }
      const segmentUsers = await User.find(query).select('_id');
      userIds = segmentUsers.map(u => u._id);
    }

    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      link: link || undefined,
      metadata: {
        sentBy: req.userId,
        recipientType,
        targetSegment
      }
    }));

    const created = await Notification.insertMany(notifications);

    res.json({
      success: true,
      data: {
        sent: created.length,
        recipientType,
        targetSegment
      },
      message: `Notification sent to ${created.length} users`
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification'
    });
  }
});

/**
 * @route   GET /api/notifications/admin/history
 * @desc    Get notification history (Admin)
 * @access  Admin
 */
router.get('/admin/history', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const skip = (page - 1) * limit;

    let query = { 'metadata.sentBy': { $exists: true } };
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('metadata.sentBy', 'username email');

    // Group by message to get unique notification campaigns
    const uniqueNotifications = [];
    const seen = new Set();
    
    notifications.forEach(notif => {
      const key = `${notif.title}-${notif.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueNotifications.push(notif);
      }
    });

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications: uniqueNotifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history'
    });
  }
});

/**
 * @route   GET /api/notifications/admin/stats
 * @desc    Get notification statistics (Admin)
 * @access  Admin
 */
router.get('/admin/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      totalNotifications,
      todayNotifications,
      totalRead,
      totalUnread
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Notification.countDocuments({ isRead: true }),
      Notification.countDocuments({ isRead: false })
    ]);

    const readRate = totalNotifications > 0 
      ? ((totalRead / totalNotifications) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalSent: totalNotifications,
        sentToday: todayNotifications,
        delivered: totalRead,
        failed: totalUnread,
        readRate: parseFloat(readRate)
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

/**
 * @route   DELETE /api/notifications/admin/:id
 * @desc    Delete notification (Admin)
 * @access  Admin
 */
router.delete('/admin/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
});

module.exports = router;

