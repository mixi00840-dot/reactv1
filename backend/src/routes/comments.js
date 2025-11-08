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

// ==================== ADMIN ENDPOINTS ====================
const { requireAdmin } = require('../middleware/adminMiddleware');

/**
 * @route   GET /api/comments/admin/all
 * @desc    Get all comments with filters for admin
 * @access  Admin
 */
router.get('/admin/all', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      contentType,
      page = 1, 
      limit = 20 
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      if (status === 'reported') {
        query.reportsCount = { $gt: 0 };
      } else if (status === 'pending') {
        query.status = 'pending';
      } else if (status === 'approved') {
        query.status = 'approved';
      } else if (status === 'blocked') {
        query.isBlocked = true;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } }
      ];
    }

    const comments = await Comment.find(query)
      .populate('userId', 'username fullName avatar isVerified email')
      .populate('contentId', 'title thumbnail type')
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
    console.error('Get admin comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

/**
 * @route   GET /api/comments/admin/stats
 * @desc    Get comment statistics for admin dashboard
 * @access  Admin
 */
router.get('/admin/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      totalComments,
      pendingComments,
      reportedComments,
      blockedComments,
      approvedComments,
      todayComments
    ] = await Promise.all([
      Comment.countDocuments(),
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ reportsCount: { $gt: 0 } }),
      Comment.countDocuments({ isBlocked: true }),
      Comment.countDocuments({ status: 'approved' }),
      Comment.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalComments,
        pending: pendingComments,
        reported: reportedComments,
        blocked: blockedComments,
        approved: approvedComments,
        today: todayComments
      }
    });

  } catch (error) {
    console.error('Get comment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

/**
 * @route   PUT /api/comments/admin/:id/approve
 * @desc    Approve a comment
 * @access  Admin
 */
router.put('/admin/:id/approve', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.status = 'approved';
    comment.isBlocked = false;
    await comment.save();

    res.json({
      success: true,
      data: { comment },
      message: 'Comment approved successfully'
    });

  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving comment'
    });
  }
});

/**
 * @route   PUT /api/comments/admin/:id/block
 * @desc    Block a comment
 * @access  Admin
 */
router.put('/admin/:id/block', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isBlocked = true;
    comment.status = 'blocked';
    await comment.save();

    res.json({
      success: true,
      data: { comment },
      message: 'Comment blocked successfully'
    });

  } catch (error) {
    console.error('Block comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking comment'
    });
  }
});

/**
 * @route   DELETE /api/comments/admin/:id
 * @desc    Delete comment as admin
 * @access  Admin
 */
router.delete('/admin/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
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
 * @route   POST /api/comments/admin/bulk-action
 * @desc    Perform bulk action on comments
 * @access  Admin
 */
router.post('/admin/bulk-action', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { action, commentIds } = req.body;

    if (!action || !commentIds || !Array.isArray(commentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    let updateData = {};
    switch (action) {
      case 'approve':
        updateData = { status: 'approved', isBlocked: false };
        break;
      case 'block':
        updateData = { status: 'blocked', isBlocked: true };
        break;
      case 'delete':
        await Comment.deleteMany({ _id: { $in: commentIds } });
        return res.json({
          success: true,
          message: `${commentIds.length} comments deleted successfully`
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Comment.updateMany(
      { _id: { $in: commentIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} comments updated successfully`
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk action'
    });
  }
});

module.exports = router;
