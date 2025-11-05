const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

/**
 * Messaging Routes
 * All routes require authentication
 */

// Send direct message
router.post('/send', verifyFirebaseToken, messagingController.sendMessage);

// Create group conversation
router.post('/groups', verifyFirebaseToken, messagingController.createGroup);

// Get user conversations
router.get('/conversations', verifyFirebaseToken, messagingController.getConversations);

// Send group message
router.post('/conversations/:conversationId/messages', verifyFirebaseToken, messagingController.sendGroupMessage);

// Get conversation messages
router.get('/conversations/:conversationId/messages', verifyFirebaseToken, messagingController.getMessages);

// Mark conversation as read
router.post('/conversations/:conversationId/read', verifyFirebaseToken, messagingController.markAsRead);

// Search messages
router.get('/search', verifyFirebaseToken, messagingController.searchMessages);

// Add reaction to message
router.post('/messages/:messageId/reactions', verifyFirebaseToken, messagingController.addReaction);

// Delete message
router.delete('/messages/:messageId', verifyFirebaseToken, messagingController.deleteMessage);

module.exports = router;
