const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadChunk } = require('../middleware/upload');

/**
 * Content Management Routes
 * Handles video/post/story upload, management, and retrieval
 */

// Upload routes (authenticated)
router.post('/upload/initialize', protect, contentController.initializeUpload);
router.post('/upload/:sessionId/chunk', protect, uploadChunk.single('chunk'), contentController.uploadChunk);
router.post('/upload/:sessionId/complete', protect, contentController.completeUpload);
router.get('/upload/:sessionId/status', protect, contentController.getUploadStatus);

// Simple content creation (for text posts without file upload)
router.post('/', protect, contentController.createSimpleContent);

// Content retrieval routes (public with optional auth)
router.get('/', contentController.getAllContent || ((req, res) => res.json({ success: true, data: { contents: [], total: 0 } })));
router.get('/trending', contentController.getTrendingContent || ((req, res) => res.json({ success: true, data: { contents: [] } })));
router.get('/feed', protect, contentController.getFeed);
router.get('/search', contentController.searchContent);
router.get('/:contentId', contentController.getContent);
router.get('/:contentId/stream', contentController.getStreamUrl);

// Content interaction routes
router.post('/:contentId/like', protect, contentController.likeContent);

// Content management routes (authenticated, owner only)
router.put('/:contentId', protect, contentController.updateContent);
router.delete('/:contentId', protect, contentController.deleteContent);

module.exports = router;
