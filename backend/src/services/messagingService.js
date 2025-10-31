const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

/**
 * Messaging Service
 * 
 * Handles direct messaging, group chats, message delivery,
 * and real-time notifications.
 */

class MessagingService {
  /**
   * Send a message
   */
  static async sendMessage(senderId, recipientId, messageData, io = null) {
    try {
      // Get or create conversation
      const conversation = await Conversation.getOrCreateDirect(senderId, recipientId);
      
      // Create message
      const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        type: messageData.type || 'text',
        content: messageData.content,
        replyTo: messageData.replyTo
      });
      
      // Populate sender info
      await message.populate('sender', 'username avatar fullName');
      
      // Update conversation last message
      await conversation.updateLastMessage(message);
      
      // Mark as delivered
      message.status = 'delivered';
      await message.save();
      
      // Create notification for recipient
      await Notification.createMessageNotification(message._id, senderId, recipientId);
      
      // Emit real-time event
      if (io) {
        io.to(`user_${recipientId}`).emit('message:new', {
          conversation: conversation._id,
          message
        });
      }
      
      return { message, conversation };
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Send group message
   */
  static async sendGroupMessage(senderId, conversationId, messageData, io = null) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Check if sender is participant
      const isParticipant = conversation.participants.some(
        p => p.user.toString() === senderId.toString() && !p.leftAt
      );
      
      if (!isParticipant) {
        throw new Error('Not a conversation participant');
      }
      
      // Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        type: messageData.type || 'text',
        content: messageData.content,
        replyTo: messageData.replyTo
      });
      
      await message.populate('sender', 'username avatar fullName');
      
      // Update conversation
      await conversation.updateLastMessage(message);
      
      // Notify all participants except sender
      const recipients = conversation.participants
        .filter(p => p.user.toString() !== senderId.toString() && !p.leftAt)
        .map(p => p.user);
      
      for (const recipientId of recipients) {
        await Notification.createMessageNotification(message._id, senderId, recipientId);
        
        // Emit real-time event
        if (io) {
          io.to(`user_${recipientId}`).emit('message:new', {
            conversation: conversationId,
            message
          });
        }
      }
      
      return { message, conversation };
      
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation messages
   */
  static async getMessages(conversationId, userId, options = {}) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Check if user is participant
      const isParticipant = conversation.participants.some(
        p => p.user.toString() === userId.toString()
      );
      
      if (!isParticipant) {
        throw new Error('Not authorized');
      }
      
      const messages = await Message.getConversationMessages(conversationId, options);
      
      return messages;
      
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
  
  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId, userId, io = null) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Mark conversation as read
      await conversation.markAsRead(userId);
      
      // Mark all unread messages as read
      const unreadMessages = await Message.find({
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      });
      
      for (const message of unreadMessages) {
        await message.markAsRead(userId);
        
        // Notify sender
        if (io) {
          io.to(`user_${message.sender}`).emit('message:read', {
            conversationId,
            messageId: message._id,
            readBy: userId
          });
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }
  
  /**
   * Add reaction to message
   */
  static async addReaction(messageId, userId, emoji, io = null) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      await message.addReaction(userId, emoji);
      
      // Notify message sender
      if (message.sender.toString() !== userId.toString()) {
        if (io) {
          io.to(`user_${message.sender}`).emit('message:reaction', {
            messageId,
            userId,
            emoji
          });
        }
      }
      
      return message;
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }
  
  /**
   * Delete message
   */
  static async deleteMessage(messageId, userId, io = null) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Only sender can delete
      if (message.sender.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      await message.softDelete(userId);
      
      // Notify conversation participants
      const conversation = await Conversation.findById(message.conversation);
      
      if (io) {
        conversation.participants.forEach(p => {
          if (p.user.toString() !== userId.toString()) {
            io.to(`user_${p.user}`).emit('message:deleted', {
              conversationId: message.conversation,
              messageId
            });
          }
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
  
  /**
   * Set typing indicator
   */
  static async setTyping(conversationId, userId, isTyping, io = null) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      await conversation.setTyping(userId, isTyping);
      
      // Notify other participants
      if (io) {
        conversation.participants.forEach(p => {
          if (p.user.toString() !== userId.toString() && !p.leftAt) {
            io.to(`user_${p.user}`).emit('typing', {
              conversationId,
              userId,
              isTyping
            });
          }
        });
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error setting typing:', error);
      throw error;
    }
  }
  
  /**
   * Create group conversation
   */
  static async createGroup(creatorId, participantIds, groupData) {
    try {
      const allParticipants = [
        { user: creatorId, role: 'admin' },
        ...participantIds.map(id => ({ user: id, role: 'member' }))
      ];
      
      const conversation = await Conversation.create({
        type: 'group',
        participants: allParticipants,
        name: groupData.name,
        description: groupData.description,
        avatar: groupData.avatar
      });
      
      await conversation.populate('participants.user', 'username avatar fullName');
      
      return conversation;
      
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }
  
  /**
   * Get user conversations
   */
  static async getUserConversations(userId, options = {}) {
    try {
      const conversations = await Conversation.getUserConversations(userId, options);
      
      // Add unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.getUnreadCount(userId, conv._id);
          return {
            ...conv.toObject(),
            unreadCount
          };
        })
      );
      
      return conversationsWithUnread;
      
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }
  
  /**
   * Search messages
   */
  static async searchMessages(userId, query, options = {}) {
    try {
      const { limit = 50 } = options;
      
      // Get user's conversations
      const conversations = await Conversation.find({
        'participants.user': userId,
        'participants.leftAt': { $exists: false }
      }).select('_id');
      
      const conversationIds = conversations.map(c => c._id);
      
      // Search messages
      const messages = await Message.find({
        conversation: { $in: conversationIds },
        'content.text': { $regex: query, $options: 'i' },
        deleted: false
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'username avatar fullName')
        .populate('conversation', 'name type participants');
      
      return messages;
      
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = MessagingService;
