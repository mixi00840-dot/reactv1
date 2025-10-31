const Comment = require('../models/Comment');
const Content = require('../models/Content');
const Notification = require('../models/Notification');

/**
 * Comment Service
 * 
 * Handles nested comments, replies, likes, mentions,
 * moderation, and threading.
 */

class CommentService {
  /**
   * Create a comment
   */
  static async createComment(userId, contentId, text, mentions = [], parentCommentId = null) {
    try {
      // Check if content exists
      const content = await Content.findById(contentId);
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      // If replying, check parent comment and depth
      let depth = 0;
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        
        if (!parentComment) {
          throw new Error('Parent comment not found');
        }
        
        if (parentComment.depth >= 5) {
          throw new Error('Maximum comment depth reached');
        }
        
        depth = parentComment.depth + 1;
      }
      
      // Create comment
      const comment = await Comment.create({
        content: contentId,
        user: userId,
        text,
        mentions,
        parentComment: parentCommentId,
        depth
      });
      
      await comment.populate('user', 'username avatar fullName');
      
      // Update reply count for parent
      if (parentCommentId) {
        await Comment.updateReplyCount(parentCommentId);
      }
      
      // Update content stats
      await Content.findByIdAndUpdate(contentId, {
        $inc: { 'stats.comments': 1 }
      });
      
      // Create notifications
      
      // Notify content owner
      if (content.user.toString() !== userId.toString()) {
        await Notification.createCommentNotification(
          comment._id,
          userId,
          content.user
        );
      }
      
      // Notify parent comment owner (if replying)
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment.user.toString() !== userId.toString()) {
          await Notification.create({
            user: parentComment.user,
            type: 'reply',
            actor: userId,
            relatedContent: {
              contentType: 'Comment',
              contentId: comment._id
            },
            title: 'Comment Reply',
            body: text.substring(0, 100)
          });
        }
      }
      
      // Notify mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          if (mentionedUserId.toString() !== userId.toString()) {
            await Notification.create({
              user: mentionedUserId,
              type: 'mention',
              actor: userId,
              relatedContent: {
                contentType: 'Comment',
                contentId: comment._id
              },
              title: 'Comment Mention',
              body: `mentioned you in a comment: ${text.substring(0, 100)}`
            });
          }
        }
      }
      
      return comment;
      
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }
  
  /**
   * Get content comments
   */
  static async getContentComments(contentId, options = {}) {
    try {
      const comments = await Comment.getContentComments(contentId, options);
      return comments;
      
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }
  
  /**
   * Get comment replies
   */
  static async getCommentReplies(commentId, limit = 20) {
    try {
      const replies = await Comment.getCommentReplies(commentId, limit);
      return replies;
      
    } catch (error) {
      console.error('Error getting replies:', error);
      throw error;
    }
  }
  
  /**
   * Like a comment
   */
  static async likeComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      await comment.addLike(userId);
      
      // Notify comment owner
      if (comment.user.toString() !== userId.toString()) {
        await Notification.create({
          user: comment.user,
          type: 'like',
          actor: userId,
          relatedContent: {
            contentType: 'Comment',
            contentId: comment._id
          },
          title: 'Comment Like',
          body: 'liked your comment'
        });
      }
      
      return comment;
      
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }
  
  /**
   * Unlike a comment
   */
  static async unlikeComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      await comment.removeLike(userId);
      
      return comment;
      
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  }
  
  /**
   * Edit a comment
   */
  static async editComment(commentId, userId, newText) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Only owner can edit
      if (comment.user.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      await comment.edit(newText);
      
      return comment;
      
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  }
  
  /**
   * Delete a comment
   */
  static async deleteComment(commentId, userId, isAdmin = false) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Check authorization
      const isOwner = comment.user.toString() === userId.toString();
      
      // Get content to check if user is content owner
      const content = await Content.findById(comment.content);
      const isContentOwner = content && content.user.toString() === userId.toString();
      
      if (!isOwner && !isContentOwner && !isAdmin) {
        throw new Error('Not authorized');
      }
      
      await comment.softDelete(userId);
      
      // Update content stats
      await Content.findByIdAndUpdate(comment.content, {
        $inc: { 'stats.comments': -1 }
      });
      
      // Update parent reply count
      if (comment.parentComment) {
        await Comment.updateReplyCount(comment.parentComment);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
  
  /**
   * Pin a comment
   */
  static async pinComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Check if user is content owner
      const content = await Content.findById(comment.content);
      
      if (content.user.toString() !== userId.toString()) {
        throw new Error('Only content owner can pin comments');
      }
      
      await comment.pin();
      
      return comment;
      
    } catch (error) {
      console.error('Error pinning comment:', error);
      throw error;
    }
  }
  
  /**
   * Unpin a comment
   */
  static async unpinComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Check if user is content owner
      const content = await Content.findById(comment.content);
      
      if (content.user.toString() !== userId.toString()) {
        throw new Error('Only content owner can unpin comments');
      }
      
      await comment.unpin();
      
      return comment;
      
    } catch (error) {
      console.error('Error unpinning comment:', error);
      throw error;
    }
  }
  
  /**
   * Flag a comment for moderation
   */
  static async flagComment(commentId, userId, reason) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      await comment.flag(userId, reason);
      
      return comment;
      
    } catch (error) {
      console.error('Error flagging comment:', error);
      throw error;
    }
  }
  
  /**
   * Get user comments
   */
  static async getUserComments(userId, limit = 50) {
    try {
      const comments = await Comment.getUserComments(userId, limit);
      return comments;
      
    } catch (error) {
      console.error('Error getting user comments:', error);
      throw error;
    }
  }
  
  /**
   * Moderate comment (admin)
   */
  static async moderateComment(commentId, moderatorId, status, moderationNote = null) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      comment.moderationStatus = status;
      comment.moderatedBy = moderatorId;
      comment.moderatedAt = new Date();
      
      if (moderationNote) {
        comment.moderationNote = moderationNote;
      }
      
      await comment.save();
      
      // Notify user if rejected
      if (status === 'rejected' || status === 'hidden') {
        await Notification.create({
          user: comment.user,
          type: 'moderation_warning',
          relatedContent: {
            contentType: 'Comment',
            contentId: comment._id
          },
          title: 'Comment Moderated',
          body: moderationNote || 'Your comment was removed by moderators',
          priority: 'high'
        });
      }
      
      return comment;
      
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  }
}

module.exports = CommentService;
