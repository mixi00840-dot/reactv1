const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const db = require('../utils/database');

/**
 * Notifications Routes - Firestore Implementation
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Notifications API is operational (Firestore)' });
});

// Get notifications (root endpoint - requires auth)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id || req.user.uid;
    
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();
    
    const notifications = [];
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: notifications.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread-count', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid;
    
    const unreadSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();
    
    const unreadCount = unreadSnapshot.data().count || 0;
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.post('/:notificationId/read', verifyFirebaseToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id || req.user.uid;
    
    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    
    if (!notificationDoc.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    if (notificationDoc.data().userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    await notificationDoc.ref.update({
      read: true,
      readAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

