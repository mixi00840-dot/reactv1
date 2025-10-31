const MessagingService = require('../services/messagingService');

/**
 * Messaging Controller
 * 
 * Handles HTTP requests for messaging features
 */

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, type, content, replyTo } = req.body;
    const senderId = req.user._id;
    
    const result = await MessagingService.sendMessage(
      senderId,
      recipientId,
      { type, content, replyTo },
      req.app.get('io')
    );
    
    res.status(201).json({
      success: true,
      message: result.message,
      conversation: result.conversation
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.sendGroupMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type, content, replyTo } = req.body;
    const senderId = req.user._id;
    
    const result = await MessagingService.sendGroupMessage(
      senderId,
      conversationId,
      { type, content, replyTo },
      req.app.get('io')
    );
    
    res.status(201).json({
      success: true,
      message: result.message,
      conversation: result.conversation
    });
    
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    
    const messages = await MessagingService.getMessages(
      conversationId,
      req.user._id,
      { limit: parseInt(limit), before }
    );
    
    res.json({
      success: true,
      messages
    });
    
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await MessagingService.markAsRead(
      conversationId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    const message = await MessagingService.addReaction(
      messageId,
      req.user._id,
      emoji,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      message
    });
    
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await MessagingService.deleteMessage(
      messageId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { participantIds, name, description, avatar } = req.body;
    
    const conversation = await MessagingService.createGroup(
      req.user._id,
      participantIds,
      { name, description, avatar }
    );
    
    res.status(201).json({
      success: true,
      conversation
    });
    
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    
    const conversations = await MessagingService.getUserConversations(
      req.user._id,
      { limit: parseInt(limit), offset: parseInt(offset), type }
    );
    
    res.json({
      success: true,
      conversations
    });
    
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { query, limit = 50 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }
    
    const messages = await MessagingService.searchMessages(
      req.user._id,
      query,
      { limit: parseInt(limit) }
    );
    
    res.json({
      success: true,
      messages
    });
    
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
