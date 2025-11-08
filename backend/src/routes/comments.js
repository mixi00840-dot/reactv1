const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Content = require('../models/Content');
const Like = require('../models/Like');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Comments Routes - MongoDB Implementation
 * Standalone comments management API
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Comments API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/comments/
 * @desc    Get comments with query filters (for content, user, etc.)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { contentId, userId, status = 'approved', limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status };
    if (contentId) query.contentId = contentId;
    if (userId) query.userId = userId;

    const comments = await Comment.find(query)
      .populate('userId', 'username fullName avatar isVerified')
      .populate('contentId', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

/**
 * @route   GET /api/comments/:id
 * @desc    Get comment by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('userId', 'username fullName avatar isVerified')
      .populate('parentId');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: { comment }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comment'
    });
  }
});

/**
 * @route   GET /api/comments/:id/replies
 * @desc    Get comment replies
 * @access  Public
 */
router.get('/:id/replies', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const replies = await Comment.getReplies(req.params.id, parseInt(limit));

    res.json({
      success: true,
      data: { replies }
    });

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching replies'
    });
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private (Comment owner)
 */
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (!comment.userId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    comment.text = text;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    res.json({
      success: true,
      data: { comment },
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
});

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private (Comment owner or Admin)
 */
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership
    if (!comment.userId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update content comment count
    const content = await Content.findById(comment.contentId);
    if (content) {
      content.commentsCount = Math.max(0, content.commentsCount - 1);
      await content.save();
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
});

/**
 * @route   POST /api/comments/:id/like
 * @desc    Like or unlike a comment
 * @access  Private
 */
router.post('/:id/like', verifyJWT, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if already liked (Note: would need CommentLike model for proper implementation)
    // For now, just increment/decrement the count
    comment.likesCount += 1;
    await comment.save();

    res.json({
      success: true,
      data: { likesCount: comment.likesCount },
      message: 'Comment liked'
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking comment'
    });
  }
});

module.exports = router;
