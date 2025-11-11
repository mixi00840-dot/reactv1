/**
 * Socket Service
 * Helper functions to emit socket events from routes/controllers
 */

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize socket.io instance
   */
  initialize(io) {
    this.io = io;
    console.log('✅ Socket service initialized');
  }

  /**
   * Get socket.io instance
   */
  getIO() {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized');
      return null;
    }
    return this.io;
  }

  /**
   * Emit video like event
   */
  emitVideoLike(contentId, userId, isLiked, likesCount) {
    if (!this.io) return;
    
    this.io.to(`video_${contentId}`).emit('video:like', {
      contentId,
      userId,
      isLiked,
      likesCount,
      timestamp: new Date()
    });

    // Also emit globally for feed updates
    this.io.emit('interaction:like', {
      contentId,
      userId,
      isLiked,
      likesCount,
      timestamp: new Date()
    });
  }

  /**
   * Emit video comment event
   */
  emitVideoComment(contentId, comment, commentsCount) {
    if (!this.io) return;
    
    this.io.to(`video_${contentId}`).emit('video:comment', {
      contentId,
      comment,
      commentsCount,
      timestamp: new Date()
    });

    // Also emit globally
    this.io.emit('interaction:comment', {
      contentId,
      commentId: comment._id,
      commentsCount,
      timestamp: new Date()
    });
  }

  /**
   * Emit video view event
   */
  emitVideoView(contentId, viewsCount) {
    if (!this.io) return;
    
    this.io.to(`video_${contentId}`).emit('video:view', {
      contentId,
      viewsCount,
      timestamp: new Date()
    });
  }

  /**
   * Emit video share event
   */
  emitVideoShare(contentId, userId, sharesCount) {
    if (!this.io) return;
    
    this.io.to(`video_${contentId}`).emit('video:share', {
      contentId,
      userId,
      sharesCount,
      timestamp: new Date()
    });

    this.io.emit('interaction:share', {
      contentId,
      userId,
      sharesCount,
      timestamp: new Date()
    });
  }

  /**
   * Notify followers about new content
   */
  async notifyFollowersNewContent(userId, contentData) {
    if (!this.io) return 0;
    
    try {
      const User = require('../models/User');
      const followers = await User.find({ following: userId })
        .select('_id')
        .lean();
      
      followers.forEach(follower => {
        this.io.to(`feed_${follower._id}`).emit('feed:refresh', {
          type: 'new_content',
          ...contentData,
          timestamp: new Date()
        });
      });
      
      return followers.length;
    } catch (error) {
      console.error('Error notifying followers:', error);
      return 0;
    }
  }

  /**
   * Emit feed refresh event to specific user
   */
  emitFeedRefresh(userId, reason, data = {}) {
    if (!this.io) return;
    
    this.io.to(`feed_${userId}`).emit('feed:refresh', {
      type: reason,
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    if (!this.io) return;
    
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId, event, data) {
    if (!this.io) return;
    
    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Emit to specific room
   */
  emitToRoom(room, event, data) {
    if (!this.io) return;
    
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Get room statistics
   */
  getRoomStats(roomName) {
    if (!this.io) return { size: 0, connected: false };
    
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return {
      size: room ? room.size : 0,
      connected: room ? true : false
    };
  }

  /**
   * Get all connected clients count
   */
  getConnectedClientsCount() {
    if (!this.io) return 0;
    return this.io.sockets.sockets.size;
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
