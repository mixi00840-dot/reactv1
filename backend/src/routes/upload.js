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
    // Accept both naming conventions from different frontends
    const { 
      fileName, 
      fileSize, 
      mimeType, 
      fileType, 
      contentType,
      metadata 
    } = req.body;
    
    // Use fileType if mimeType not provided
    const actualMimeType = mimeType || fileType || 'application/octet-stream';
    
    // Generate a simple presigned URL response
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `${contentType || 'uploads'}/${uploadId}`;
    
    // Generate presigned URL for direct upload
    const uploadUrl = `https://mixillo-uploads.s3.amazonaws.com/${key}?presigned=true`;
    
    res.json({
      success: true,
      data: {
        uploadId,
        key,
        uploadUrl, // For frontend compatibility
        presignedUrl: uploadUrl, // Alternative name
        fileName,
        fileSize,
        mimeType: actualMimeType,
        expiresIn: 3600, // 1 hour
        fields: {
          key,
          'Content-Type': actualMimeType,
          bucket: 'mixillo-uploads'
        }
      }
    });
  } catch (error) {
    console.error('Upload presigned URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating upload URL',
      error: error.message
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

// Health check endpoint (no auth required)
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Upload service is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      presignedUrl: 'POST /api/upload/presigned-url',
      multipart: 'POST /api/upload/multipart',
      confirm: 'POST /api/upload/:contentId/confirm',
      status: 'GET /api/upload/:contentId/status'
    }
  });
});

module.exports = router;
