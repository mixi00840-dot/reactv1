const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Messaging Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Messaging API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/messaging/conversations
 * @desc    Get user conversations
 * @access  Private
 */
router.get('/conversations', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    const conversations = await Conversation.getUserConversations(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Conversation.countDocuments({ participants: userId });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
});

/**
 * @route   GET /api/messaging/conversations/:id/messages
 * @desc    Get conversation messages
 * @access  Private
 */
router.get('/conversations/:id/messages', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { id } = req.params;
    const userId = req.userId;
    const skip = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.some(p => p.equals(userId))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages
    const messages = await Message.find({ 
      conversationId: id,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate('senderId', 'username fullName avatar');

    const total = await Message.countDocuments({ conversationId: id, isDeleted: false });

    // Mark conversation as read
    await conversation.markAsRead(userId);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

/**
 * @route   POST /api/messaging/send
 * @desc    Send message
 * @access  Private
 */
router.post('/send', verifyJWT, async (req, res) => {
  try {
    const { recipientId, text, type = 'text', mediaUrl, giftId } = req.body;
    const senderId = req.userId;

    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findBetweenUsers(senderId, recipientId);

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        type: 'private',
        participantStatus: [
          { userId: senderId, unreadCount: 0 },
          { userId: recipientId, unreadCount: 0 }
        ]
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      type,
      text,
      mediaUrl,
      giftId
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = {
      text: text || `Sent a ${type}`,
      senderId,
      type,
      timestamp: new Date()
    };
    conversation.messagesCount += 1;
    await conversation.incrementUnread(recipientId);
    await conversation.save();

    // Populate sender data
    await message.populate('senderId', 'username fullName avatar');

    // TODO: Send push notification to recipient

    res.status(201).json({
      success: true,
      data: { message },
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/messaging/messages/:id
 * @desc    Delete message
 * @access  Private
 */
router.delete('/messages/:id', verifyJWT, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check ownership
    if (!message.senderId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.userId;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
});

module.exports = router;

