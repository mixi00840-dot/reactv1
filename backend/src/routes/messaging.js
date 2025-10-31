const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { authenticate } = require('../middleware/auth');

/**
 * Messaging Routes
 * All routes require authentication
 */

// Send direct message
router.post('/send', authenticate, messagingController.sendMessage);

// Create group conversation
router.post('/groups', authenticate, messagingController.createGroup);

// Get user conversations
router.get('/conversations', authenticate, messagingController.getConversations);

// Send group message
router.post('/conversations/:conversationId/messages', authenticate, messagingController.sendGroupMessage);

// Get conversation messages
router.get('/conversations/:conversationId/messages', authenticate, messagingController.getMessages);

// Mark conversation as read
router.post('/conversations/:conversationId/read', authenticate, messagingController.markAsRead);

// Search messages
router.get('/search', authenticate, messagingController.searchMessages);

// Add reaction to message
router.post('/messages/:messageId/reactions', authenticate, messagingController.addReaction);

// Delete message
router.delete('/messages/:messageId', authenticate, messagingController.deleteMessage);

module.exports = router;
