const uploadService = require('../services/uploadService');

/**
 * Upload Controller - Presigned URLs for Direct Client Uploads
 * Handles S3/R2 presigned URL generation and upload management
 */

/**
 * @route   POST /api/upload/presigned-url
 * @desc    Generate presigned URL for direct upload to S3/R2
 * @access  Private
 */
exports.generatePresignedUrl = async (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      mimeType,
      contentType,
      metadata
    } = req.body;

    if (!fileName || !fileSize || !mimeType || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName, fileSize, mimeType, and contentType are required'
      });
    }

    const result = await uploadService.generateUploadUrl({
      userId: req.user._id,
      fileName,
      fileSize,
      mimeType,
      contentType,
      metadata
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Generate presigned URL error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate upload URL',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/upload/multipart
 * @desc    Generate multipart upload URLs for large files
 * @access  Private
 */
exports.generateMultipartUpload = async (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      mimeType,
      contentType,
      chunkSize,
      metadata
    } = req.body;

    if (!fileName || !fileSize || !mimeType || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName, fileSize, mimeType, and contentType are required'
      });
    }

    const result = await uploadService.generateMultipartUpload({
      userId: req.user._id,
      fileName,
      fileSize,
      mimeType,
      contentType,
      chunkSize,
      metadata
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Generate multipart upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate multipart upload',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/upload/:contentId/confirm
 * @desc    Confirm upload complete and trigger processing
 * @access  Private
 */
exports.confirmUpload = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { caption, tags, hashtags, soundId, location, settings } = req.body;

    const result = await uploadService.confirmUpload(contentId, {
      caption,
      tags,
      hashtags,
      soundId,
      location,
      settings
    });

    res.json({
      success: true,
      message: 'Upload confirmed, processing started',
      data: result
    });

  } catch (error) {
    console.error('Confirm upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm upload',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/upload/:contentId/progress
 * @desc    Update upload progress (for multipart uploads)
 * @access  Private
 */
exports.updateProgress = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { uploadedChunks, totalChunks } = req.body;

    if (uploadedChunks === undefined || totalChunks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'uploadedChunks and totalChunks are required'
      });
    }

    const result = await uploadService.updateProgress(
      contentId,
      uploadedChunks,
      totalChunks
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update progress',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/upload/:contentId/status
 * @desc    Get upload status
 * @access  Private
 */
exports.getUploadStatus = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await uploadService.getUploadStatus(contentId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get upload status',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/upload/:contentId
 * @desc    Cancel upload and cleanup files
 * @access  Private
 */
exports.cancelUpload = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await uploadService.cancelUpload(contentId);

    res.json({
      success: true,
      message: 'Upload cancelled',
      data: result
    });

  } catch (error) {
    console.error('Cancel upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel upload',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/upload/download-url
 * @desc    Generate presigned download URL
 * @access  Private
 */
exports.generateDownloadUrl = async (req, res) => {
  try {
    const { key, expiresIn } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'key is required'
      });
    }

    const downloadUrl = await uploadService.generateDownloadUrl(key, expiresIn);

    res.json({
      success: true,
      data: { downloadUrl, expiresIn: expiresIn || 3600 }
    });

  } catch (error) {
    console.error('Generate download URL error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate download URL',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/upload/config
 * @desc    Get upload service configuration
 * @access  Private
 */
exports.getConfig = async (req, res) => {
  try {
    const config = uploadService.getConfig();

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get upload config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration',
      error: error.message
    });
  }
};
