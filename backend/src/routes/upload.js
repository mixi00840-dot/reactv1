const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');

/**
 * Upload Routes - Presigned URLs for Direct Client Uploads
 * All routes require authentication
 */

// Simple upload endpoint for admin dashboard (override the controller one)
router.post('/presigned-url', authMiddleware, async (req, res) => {
  try {
    const { fileName, fileSize, mimeType, contentType } = req.body;
    
    // Generate a simple presigned URL response
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        uploadId,
        presignedUrl: `https://mixillo-uploads.s3.amazonaws.com/${uploadId}`,
        fileName,
        fileSize,
        mimeType,
        expiresIn: 3600, // 1 hour
        fields: {
          key: uploadId,
          'Content-Type': mimeType,
          bucket: 'mixillo-uploads'
        }
      }
    });
  } catch (error) {
    console.error('Upload presigned URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating upload URL'
    });
  }
});

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
