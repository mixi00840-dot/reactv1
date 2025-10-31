const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MessagingService = require('../services/messagingService');

/**
 * Socket.io Event Handlers
 * 
 * Handles real-time WebSocket events for messaging,
 * typing indicators, presence, and notifications.
 */

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user._id.toString();
    socket.user = user;
    next();
    
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(socketAuth);
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user's personal room
    socket.join(`user_${socket.userId}`);
    
    // Emit user online status
    io.emit('user:online', { userId: socket.userId });
    
    // Handle typing indicator
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId } = data;
        
        await MessagingService.setTyping(
          conversationId,
          socket.userId,
          true,
          io
        );
        
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });
    
    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId } = data;
        
        await MessagingService.setTyping(
          conversationId,
          socket.userId,
          false,
          io
        );
        
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });
    
    // Handle message read receipts
    socket.on('message:read', async (data) => {
      try {
        const { conversationId } = data;
        
        await MessagingService.markAsRead(
          conversationId,
          socket.userId,
          io
        );
        
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    });
    
    // Handle joining conversation rooms
    socket.on('conversation:join', (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    socket.on('conversation:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Handle user presence
    socket.on('presence:update', async (data) => {
      try {
        const { status } = data; // online, away, busy, offline
        
        // Update user status
        await User.findByIdAndUpdate(socket.userId, {
          'presence.status': status,
          'presence.lastSeen': new Date()
        });
        
        // Broadcast to friends/followers
        io.emit('user:presence', {
          userId: socket.userId,
          status
        });
        
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    });
    
    // Handle live stream events
    socket.on('stream:join', (data) => {
      const { streamId } = data;
      socket.join(`stream_${streamId}`);
      
      // Notify stream owner
      io.to(`stream_${streamId}`).emit('viewer:joined', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
    
    socket.on('stream:leave', (data) => {
      const { streamId } = data;
      socket.leave(`stream_${streamId}`);
      
      // Notify stream owner
      io.to(`stream_${streamId}`).emit('viewer:left', {
        userId: socket.userId
      });
    });
    
    socket.on('stream:comment', (data) => {
      const { streamId, text } = data;
      
      // Broadcast comment to all stream viewers
      io.to(`stream_${streamId}`).emit('stream:comment', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        text,
        timestamp: new Date()
      });
    });
    
    socket.on('stream:gift', (data) => {
      const { streamId, giftId, amount } = data;
      
      // Broadcast gift to all stream viewers
      io.to(`stream_${streamId}`).emit('stream:gift', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        giftId,
        amount,
        timestamp: new Date()
      });
    });
    
    // Handle story view events
    socket.on('story:viewing', (data) => {
      const { storyId, userId } = data;
      
      // Notify story owner
      io.to(`user_${userId}`).emit('story:viewed', {
        storyId,
        viewerId: socket.userId
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      try {
        // Update last seen
        await User.findByIdAndUpdate(socket.userId, {
          'presence.status': 'offline',
          'presence.lastSeen': new Date()
        });
        
        // Emit user offline status
        io.emit('user:offline', {
          userId: socket.userId,
          lastSeen: new Date()
        });
        
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
    
    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = { setupSocketHandlers };
