const NotificationService = require('../services/notificationService');

/**
 * Notification Controller
 * 
 * Handles HTTP requests for notification features
 */

exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, type, unreadOnly } = req.query;
    
    const result = await NotificationService.getUserNotifications(
      req.user._id,
      {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type,
        unreadOnly: unreadOnly === 'true'
      }
    );
    
    // Get unread count
    const unreadCount = await NotificationService.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        notifications: result || [],
        total: result ? result.length : 0,
        unread: unreadCount || 0
      }
    });
    
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      count
    });
    
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await NotificationService.markAsRead(
      notificationId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await NotificationService.deleteNotification(
      notificationId,
      req.user._id
    );
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await NotificationService.getNotificationSettings(
      req.user._id
    );
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await NotificationService.updateNotificationSettings(
      req.user._id,
      req.body
    );
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
