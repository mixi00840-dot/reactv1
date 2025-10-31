const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');

/**
 * Upload Routes - Presigned URLs for Direct Client Uploads
 * All routes require authentication
 */

// Generate presigned URL for single file upload
router.post('/presigned-url', authMiddleware, uploadController.generatePresignedUrl);

// Generate multipart upload URLs for large files
router.post('/multipart', authMiddleware, uploadController.generateMultipartUpload);

// Confirm upload complete (triggers processing)
router.post('/:contentId/confirm', authMiddleware, uploadController.confirmUpload);

// Update upload progress (for multipart)
router.post('/:contentId/progress', authMiddleware, uploadController.updateProgress);

// Get upload status
router.get('/:contentId/status', authMiddleware, uploadController.getUploadStatus);

// Cancel upload
router.delete('/:contentId', authMiddleware, uploadController.cancelUpload);

// Generate download URL (presigned GET)
router.post('/download-url', authMiddleware, uploadController.generateDownloadUrl);

// Get upload configuration
router.get('/config', authMiddleware, uploadController.getConfig);

module.exports = router;
