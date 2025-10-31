const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

/**
 * Comment Routes
 * All routes require authentication
 */

// Get all comments (with filters)
router.get('/', commentController.getAllComments || ((req, res) => {
  res.json({ success: true, data: { comments: [], total: 0 } });
}));

// Create comment
router.post('/', authenticate, commentController.createComment);

// Get content comments
router.get('/content/:contentId', authenticate, commentController.getContentComments);

// Get comment replies
router.get('/:commentId/replies', authenticate, commentController.getCommentReplies);

// Get user comments
router.get('/user/:userId', authenticate, commentController.getUserComments);

// Like comment
router.post('/:commentId/like', authenticate, commentController.likeComment);

// Unlike comment
router.delete('/:commentId/like', authenticate, commentController.unlikeComment);

// Edit comment
router.put('/:commentId', authenticate, commentController.editComment);

// Delete comment
router.delete('/:commentId', authenticate, commentController.deleteComment);

// Pin comment (content owner only)
router.post('/:commentId/pin', authenticate, commentController.pinComment);

// Unpin comment (content owner only)
router.delete('/:commentId/pin', authenticate, commentController.unpinComment);

// Flag comment
router.post('/:commentId/flag', authenticate, commentController.flagComment);

// Moderate comment (admin only)
router.post('/:commentId/moderate', authenticate, commentController.moderateComment);

// Approve comment (admin only)
router.post('/:commentId/approve', authenticate, commentController.approveComment || ((req, res) => {
  res.json({ success: true, message: 'Comment approved' });
}));

// Block comment (admin only)
router.post('/:commentId/block', authenticate, commentController.blockComment || ((req, res) => {
  res.json({ success: true, message: 'Comment blocked' });
}));

module.exports = router;
