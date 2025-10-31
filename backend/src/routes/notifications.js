const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

/**
 * Notification Routes
 * All routes require authentication
 */

// Get notifications
router.get('/', authenticate, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Mark notification as read
router.post('/:notificationId/read', authenticate, notificationController.markAsRead);

// Mark all as read
router.post('/read-all', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

// Get notification settings
router.get('/settings', authenticate, notificationController.getSettings);

// Update notification settings
router.put('/settings', authenticate, notificationController.updateSettings);

module.exports = router;
