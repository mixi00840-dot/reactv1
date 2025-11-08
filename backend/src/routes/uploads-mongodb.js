const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyJWT } = require('../middleware/jwtAuth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');
const UploadSession = require('../models/UploadSession');
const Content = require('../models/Content');

/**
 * Uploads Routes - MongoDB Implementation
 * File upload with Cloudinary/GCS support
 */

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Uploads API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   POST /api/uploads/presigned-url
 * @desc    Generate presigned URL for direct upload
 * @access  Private
 */
router.post('/presigned-url', verifyJWT, validationRules.fileUpload(), handleValidationErrors, async (req, res) => {
  try {
    const { filename, contentType, fileSize } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Filename and contentType are required'
      });
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileKey = `uploads/${req.user.id}/${timestamp}-${randomStr}-${filename}`;

    // Create upload session
    const uploadSession = new UploadSession({
      userId: req.user.id,
      fileKey,
      filename,
      contentType,
      fileSize: parseInt(fileSize) || 0,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    await uploadSession.save();

    // For now, return a direct upload URL (Cloudinary implementation pending)
    // TODO: Integrate with Cloudinary or GCS for actual presigned URLs
    const uploadUrl = `${process.env.CLOUDINARY_UPLOAD_URL || 'https://api.cloudinary.com/v1_1/mixillo/upload'}`;

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        sessionId: uploadSession._id,
        expiresAt: uploadSession.expiresAt,
        // Cloudinary params (if using Cloudinary)
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'mixillo_unsigned',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'mixillo'
      },
      message: 'Presigned URL generated'
    });

  } catch (error) {
    console.error('Generate presigned URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating presigned URL',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/uploads/complete
 * @desc    Mark upload as complete and create content record
 * @access  Private
 */
router.post('/complete', verifyJWT, async (req, res) => {
  try {
    const { sessionId, fileUrl, thumbnail, duration, width, height } = req.body;

    if (!sessionId || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'SessionId and fileUrl are required'
      });
    }

    // Find upload session
    const session = await UploadSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found'
      });
    }

    if (!session.userId.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this upload'
      });
    }

    // Create content record
    const content = new Content({
      userId: req.user.id,
      type: session.contentType.startsWith('video') ? 'video' : 'image',
      videoUrl: fileUrl,
      thumbnailUrl: thumbnail,
      duration: duration || 0,
      width: width || 0,
      height: height || 0,
      status: 'pending', // Pending moderation
      fileKey: session.fileKey,
      fileSize: session.fileSize
    });

    await content.save();

    // Update session
    session.status = 'completed';
    session.contentId = content._id;
    session.completedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        content,
        session
      },
      message: 'Upload completed successfully'
    });

  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing upload',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/uploads
 * @desc    Get user uploads
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };
    if (status) query.status = status;

    const uploads = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching uploads'
    });
  }
});

module.exports = router;

