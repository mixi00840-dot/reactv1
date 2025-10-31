const CommentService = require('../services/commentService');

/**
 * Comment Controller
 * 
 * Handles HTTP requests for comment features
 */

exports.createComment = async (req, res) => {
  try {
    const { contentId, text, mentions, parentCommentId } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text required'
      });
    }
    
    const comment = await CommentService.createComment(
      req.user._id,
      contentId,
      text,
      mentions,
      parentCommentId
    );
    
    res.status(201).json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getContentComments = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { limit = 20, sort = 'top', parentOnly = true } = req.query;
    
    const comments = await CommentService.getContentComments(contentId, {
      limit: parseInt(limit),
      sort,
      parentOnly: parentOnly === 'true'
    });
    
    res.json({
      success: true,
      comments
    });
    
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 20 } = req.query;
    
    const replies = await CommentService.getCommentReplies(
      commentId,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      replies
    });
    
  } catch (error) {
    console.error('Error getting replies:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await CommentService.likeComment(
      commentId,
      req.user._id
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await CommentService.unlikeComment(
      commentId,
      req.user._id
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error unliking comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text required'
      });
    }
    
    const comment = await CommentService.editComment(
      commentId,
      req.user._id,
      text
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const isAdmin = req.user.role === 'admin';
    
    await CommentService.deleteComment(
      commentId,
      req.user._id,
      isAdmin
    );
    
    res.json({
      success: true,
      message: 'Comment deleted'
    });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.pinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await CommentService.pinComment(
      commentId,
      req.user._id
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error pinning comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unpinComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await CommentService.unpinComment(
      commentId,
      req.user._id
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error unpinning comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.flagComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Flag reason required'
      });
    }
    
    const comment = await CommentService.flagComment(
      commentId,
      req.user._id,
      reason
    );
    
    res.json({
      success: true,
      comment,
      message: 'Comment flagged for review'
    });
    
  } catch (error) {
    console.error('Error flagging comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const comments = await CommentService.getUserComments(
      userId,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      comments
    });
    
  } catch (error) {
    console.error('Error getting user comments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.moderateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status, moderationNote } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation status'
      });
    }
    
    const comment = await CommentService.moderateComment(
      commentId,
      req.user._id,
      status,
      moderationNote
    );
    
    res.json({
      success: true,
      comment
    });
    
  } catch (error) {
    console.error('Error moderating comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
