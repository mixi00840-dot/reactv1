const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Service
 * 
 * Handles all notification types, push delivery,
 * email notifications, and notification management.
 */

class NotificationService {
  /**
   * Send notification
   */
  static async sendNotification(notificationData, io = null) {
    try {
      const notification = await Notification.create(notificationData);
      
      await notification.populate('actor', 'username avatar fullName');
      
      // Emit real-time notification
      if (io) {
        io.to(`user_${notification.user}`).emit('notification:new', notification);
      }
      
      // Schedule push notification
      await this.sendPushNotification(notification);
      
      // Schedule email if needed
      if (notificationData.priority === 'high' || notificationData.priority === 'urgent') {
        await this.sendEmailNotification(notification);
      }
      
      return notification;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
  
  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const notifications = await Notification.getUserNotifications(userId, options);
      return notifications;
      
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }
  
  /**
   * Get unread count
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.getUnreadCount(userId);
      return count;
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, io = null) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      await notification.markAsRead();
      
      // Emit real-time update
      if (io) {
        io.to(`user_${notification.user}`).emit('notification:read', {
          notificationId
        });
      }
      
      return notification;
      
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark all as read
   */
  static async markAllAsRead(userId, io = null) {
    try {
      const result = await Notification.markAllAsRead(userId);
      
      // Emit real-time update
      if (io) {
        io.to(`user_${userId}`).emit('notification:all-read');
      }
      
      return result;
      
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }
  
  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Check ownership
      if (notification.user.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      await Notification.findByIdAndDelete(notificationId);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
  
  /**
   * Send push notification
   */
  static async sendPushNotification(notification) {
    try {
      // Get user push tokens
      const user = await User.findById(notification.user);
      
      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        return;
      }
      
      // Check user notification settings
      if (!user.settings || !user.settings.notifications || !user.settings.notifications.push) {
        return;
      }
      
      // Here you would integrate with push notification service
      // (Firebase Cloud Messaging, Apple Push Notification service, etc.)
      
      // Mock implementation
      console.log('Sending push notification:', {
        tokens: user.pushTokens,
        title: notification.title,
        body: notification.body,
        image: notification.image,
        data: {
          notificationId: notification._id,
          actionUrl: notification.actionUrl
        }
      });
      
      // Mark as sent
      notification.pushSent = true;
      notification.pushSentAt = new Date();
      await notification.save();
      
      // Update delivered status
      await notification.markAsDelivered();
      
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
  
  /**
   * Send email notification
   */
  static async sendEmailNotification(notification) {
    try {
      // Get user email
      const user = await User.findById(notification.user);
      
      if (!user || !user.email) {
        return;
      }
      
      // Check user notification settings
      if (!user.settings || !user.settings.notifications || !user.settings.notifications.email) {
        return;
      }
      
      // Here you would integrate with email service
      // (SendGrid, AWS SES, Mailgun, etc.)
      
      // Mock implementation
      console.log('Sending email notification:', {
        to: user.email,
        subject: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl
      });
      
      // Mark as sent
      notification.emailSent = true;
      notification.emailSentAt = new Date();
      await notification.save();
      
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }
  
  /**
   * Create like notification
   */
  static async createLikeNotification(contentId, actorId, recipientId) {
    try {
      // Check if there's a recent like notification for same content
      const recentNotification = await Notification.findOne({
        user: recipientId,
        type: 'like',
        'relatedContent.contentId': contentId,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });
      
      // Use grouping to batch likes
      const groupKey = `like_${contentId}`;
      
      if (recentNotification) {
        // Update existing notification
        recentNotification.actor = actorId;
        recentNotification.read = false;
        recentNotification.createdAt = new Date();
        await recentNotification.save();
        return recentNotification;
      }
      
      // Create new notification
      return await Notification.createLikeNotification(contentId, actorId, recipientId);
      
    } catch (error) {
      console.error('Error creating like notification:', error);
      throw error;
    }
  }
  
  /**
   * Create follow notification
   */
  static async createFollowNotification(actorId, recipientId) {
    try {
      return await Notification.createFollowNotification(actorId, recipientId);
      
    } catch (error) {
      console.error('Error creating follow notification:', error);
      throw error;
    }
  }
  
  /**
   * Create system notification
   */
  static async createSystemNotification(userId, title, body, priority = 'normal') {
    try {
      return await this.sendNotification({
        user: userId,
        type: 'system',
        title,
        body,
        priority
      });
      
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }
  
  /**
   * Create announcement (broadcast to multiple users)
   */
  static async createAnnouncement(userIds, title, body, image = null, actionUrl = null) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.sendNotification({
          user: userId,
          type: 'announcement',
          title,
          body,
          image,
          actionUrl,
          priority: 'high'
        });
        
        notifications.push(notification);
      }
      
      return notifications;
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old notifications
   */
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const result = await Notification.deleteOldNotifications(daysOld);
      console.log(`Deleted ${result.deletedCount} old notifications`);
      
      return result;
      
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
  
  /**
   * Get notification settings
   */
  static async getNotificationSettings(userId) {
    try {
      const user = await User.findById(userId).select('settings.notifications');
      
      return user?.settings?.notifications || {
        push: true,
        email: true,
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        messages: true
      };
      
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }
  
  /**
   * Update notification settings
   */
  static async updateNotificationSettings(userId, settings) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.settings) {
        user.settings = {};
      }
      
      user.settings.notifications = {
        ...user.settings.notifications,
        ...settings
      };
      
      await user.save();
      
      return user.settings.notifications;
      
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
