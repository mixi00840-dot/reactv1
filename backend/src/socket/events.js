/**
 * Socket.io Event Handlers (MongoDB Only)
 * Handles real-time WebSocket events for messaging,
 * typing indicators, presence, and notifications
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MessagingService = require('../services/messagingService');

/**
 * Socket authentication middleware
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user._id.toString();
    socket.user = user.toObject();
    next();
    
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

/**
 * Setup Socket.IO event handlers
 */
const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(socketAuth);
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user's personal room
    socket.join(`user_${socket.userId}`);
    
    // Emit user online status
    io.emit('user:online', { userId: socket.userId });
    
    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user:typing', {
        userId: socket.userId,
        conversationId
      });
    });
    
    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user:stopped_typing', {
        userId: socket.userId,
        conversationId
      });
    });
    
    // Handle message events
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text' } = data;
        
        // Create message using messaging service
        const message = await MessagingService.sendMessage({
          senderId: socket.userId,
          conversationId,
          content,
          type
        });
        
        // Emit to conversation participants
        io.to(`conversation_${conversationId}`).emit('message:new', message);
        
        // Send acknowledgment
        socket.emit('message:sent', { messageId: message._id });
      } catch (error) {
        socket.emit('message:error', { error: error.message });
      }
    });
    
    // Handle message read status
    socket.on('message:read', async (data) => {
      try {
        const { messageId, conversationId } = data;
        
        // Update read status
        await MessagingService.markAsRead(messageId, socket.userId);
        
        // Emit read status to conversation
        io.to(`conversation_${conversationId}`).emit('message:read_status', {
          messageId,
          userId: socket.userId,
          readAt: new Date()
        });
      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });
    
    // Join conversation room
    socket.on('conversation:join', (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      socket.emit('conversation:joined', { conversationId });
    });
    
    // Leave conversation room
    socket.on('conversation:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      socket.emit('conversation:left', { conversationId });
    });
    
    // Handle call events
    socket.on('call:initiate', (data) => {
      const { recipientId, callType, offer } = data;
      io.to(`user_${recipientId}`).emit('call:incoming', {
        callerId: socket.userId,
        callType,
        offer
      });
    });
    
    socket.on('call:answer', (data) => {
      const { callerId, answer } = data;
      io.to(`user_${callerId}`).emit('call:answered', {
        userId: socket.userId,
        answer
      });
    });
    
    socket.on('call:reject', (data) => {
      const { callerId } = data;
      io.to(`user_${callerId}`).emit('call:rejected', {
        userId: socket.userId
      });
    });
    
    socket.on('call:end', (data) => {
      const { otherUserId } = data;
      io.to(`user_${otherUserId}`).emit('call:ended', {
        userId: socket.userId
      });
    });
    
    // Handle ICE candidates for WebRTC
    socket.on('call:ice_candidate', (data) => {
      const { otherUserId, candidate } = data;
      io.to(`user_${otherUserId}`).emit('call:ice_candidate', {
        userId: socket.userId,
        candidate
      });
    });
    
    // Handle livestream events
    socket.on('livestream:join', (data) => {
      const { livestreamId } = data;
      socket.join(`livestream_${livestreamId}`);
      socket.emit('livestream:joined', { livestreamId });
      
      // Notify others of new viewer
      socket.to(`livestream_${livestreamId}`).emit('livestream:viewer_joined', {
        userId: socket.userId,
        viewerCount: io.sockets.adapter.rooms.get(`livestream_${livestreamId}`)?.size || 0
      });
    });
    
    socket.on('livestream:leave', (data) => {
      const { livestreamId } = data;
      socket.leave(`livestream_${livestreamId}`);
      
      // Notify others of viewer leaving
      socket.to(`livestream_${livestreamId}`).emit('livestream:viewer_left', {
        userId: socket.userId,
        viewerCount: io.sockets.adapter.rooms.get(`livestream_${livestreamId}`)?.size || 0
      });
    });
    
    socket.on('livestream:comment', (data) => {
      const { livestreamId, comment } = data;
      io.to(`livestream_${livestreamId}`).emit('livestream:new_comment', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        comment,
        timestamp: new Date()
      });
    });
    
    socket.on('livestream:gift', (data) => {
      const { livestreamId, gift } = data;
      io.to(`livestream_${livestreamId}`).emit('livestream:gift_received', {
        senderId: socket.userId,
        senderName: socket.user.username,
        gift,
        timestamp: new Date()
      });
    });
    
    // Handle presence
    socket.on('presence:update', (data) => {
      const { status } = data; // online, away, busy, offline
      socket.broadcast.emit('user:presence', {
        userId: socket.userId,
        status,
        lastSeen: new Date()
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Emit user offline status
      io.emit('user:offline', {
        userId: socket.userId,
        lastSeen: new Date()
      });
    });
  });
};

module.exports = {
  setupSocketHandlers,
  socketAuth
};
