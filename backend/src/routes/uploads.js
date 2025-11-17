const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { verifyJWT } = require('../middleware/jwtAuth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');
const UploadSession = require('../models/UploadSession');
const Content = require('../models/Content');
const SystemSettings = require('../models/SystemSettings');

/**
 * Uploads Routes - MongoDB Implementation
 * File upload with Cloudinary signed upload support
 */

// Configure Cloudinary (will be overridden by settings from DB)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mixillo',
  api_key: process.env.CLOUDINARY_API_KEY || '287216393992378',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kflDVBjiq-Jkc-IgDWlggtdc6Yw',
  secure: true
});

/**
 * Get Cloudinary settings from database or environment
 */
async function getCloudinarySettings() {
  try {
    const settings = await SystemSettings.findOne({ category: 'storage', provider: 'cloudinary' });
    if (settings && settings.config) {
      return {
        cloudName: settings.config.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: settings.config.apiKey || process.env.CLOUDINARY_API_KEY,
        apiSecret: settings.config.apiSecret || process.env.CLOUDINARY_API_SECRET,
        folder: settings.config.folder || 'mixillo/uploads',
        enabled: settings.isActive !== false
      };
    }
  } catch (error) {
    console.error('Error fetching Cloudinary settings:', error);
  }
  
  // Fallback to environment variables
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dlg6dnlj4',
    apiKey: process.env.CLOUDINARY_API_KEY || '287216393992378',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'kflDVBjiq-Jkc-IgDWlggtdc6Yw',
    folder: 'mixillo/uploads',
    enabled: true
  };
}

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
 * @route   POST /api/uploads/signature
 * @desc    Generate Cloudinary signature for signed upload
 * @access  Private (Admin or authenticated user)
 */
router.post('/signature', verifyJWT, async (req, res) => {
  try {
    const { folder, resourceType = 'auto', publicId } = req.body;
    
    // Get Cloudinary settings from database
    const cloudinarySettings = await getCloudinarySettings();
    
    if (!cloudinarySettings.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary uploads are currently disabled'
      });
    }

    // Update cloudinary config with DB settings
    cloudinary.config({
      cloud_name: cloudinarySettings.cloudName,
      api_key: cloudinarySettings.apiKey,
      api_secret: cloudinarySettings.apiSecret,
      secure: true
    });

    const timestamp = Math.round(Date.now() / 1000);
    const uploadFolder = folder || cloudinarySettings.folder || 'mixillo/uploads';
    
    // Parameters to sign - Cloudinary only signs specific params
    // DO NOT include resource_type in signature, it's a URL parameter
    const params = {
      timestamp,
      folder: uploadFolder,
      ...(publicId && { public_id: publicId })
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      cloudinarySettings.apiSecret
    );

    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: cloudinarySettings.cloudName,
        apiKey: cloudinarySettings.apiKey,
        folder: uploadFolder,
        resourceType // Return for URL construction, not signature
      },
      message: 'Upload signature generated'
    });

  } catch (error) {
    console.error('Generate signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating upload signature',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/uploads/presigned-url
 * @desc    Generate presigned URL for direct upload (legacy support)
 * @access  Private
 */
router.post('/presigned-url', verifyJWT, validationRules.fileUpload(), handleValidationErrors, async (req, res) => {
  try {
    const { filename, contentType, fileSize, folder } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Filename and contentType are required'
      });
    }

    // Get Cloudinary settings
    const cloudinarySettings = await getCloudinarySettings();
    
    if (!cloudinarySettings.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary uploads are currently disabled'
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

    // Generate signed parameters
    const uploadTimestamp = Math.round(Date.now() / 1000);
    const uploadFolder = folder || cloudinarySettings.folder || 'mixillo/uploads';
    
    const params = {
      timestamp: uploadTimestamp,
      folder: uploadFolder
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      cloudinarySettings.apiSecret
    );

    res.json({
      success: true,
      data: {
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinarySettings.cloudName}/auto/upload`,
        signature,
        timestamp: uploadTimestamp,
        apiKey: cloudinarySettings.apiKey,
        cloudName: cloudinarySettings.cloudName,
        folder: uploadFolder,
        fileKey,
        sessionId: uploadSession._id,
        expiresAt: uploadSession.expiresAt
      },
      message: 'Signed upload URL generated'
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

/**
 * @route   POST /api/uploads/:id/confirm
 * @desc    Alias for /complete - confirm upload completion
 * @access  Private
 */
router.post('/:id/confirm', verifyJWT, async (req, res) => {
  try {
    const { fileUrl, thumbnail, duration, width, height } = req.body;
    const sessionId = req.params.id;

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
    console.error('Confirm upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming upload',
      error: error.message
    });
  }
});

module.exports = router;

