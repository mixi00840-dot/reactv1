const express = require('express');
const router = express.Router();

/**
 * Configuration Routes
 * Returns app configuration for Flutter client
 */

/**
 * @route   GET /api/config/cloudinary
 * @desc    Get Cloudinary configuration for uploads
 * @access  Public
 */
router.get('/cloudinary', (req, res) => {
  try {
    const cloudinaryConfig = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'mixillo',
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'mixillo_unsigned',
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'mixillo'}/upload`,
      apiKey: process.env.CLOUDINARY_API_KEY, // Optional, for signed uploads
      folder: 'videos',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['mp4', 'mov', 'avi', 'mkv'],
    };

    res.json({
      success: true,
      data: cloudinaryConfig,
      message: 'Cloudinary configuration retrieved'
    });

  } catch (error) {
    console.error('Get Cloudinary config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Cloudinary configuration'
    });
  }
});

/**
 * @route   GET /api/config/upload
 * @desc    Get upload configuration (compression, limits, etc)
 * @access  Public
 */
router.get('/upload', (req, res) => {
  try {
    const uploadConfig = {
      maxVideoSize: 100 * 1024 * 1024, // 100MB
      maxVideoDuration: 600, // 10 minutes in seconds
      compressionEnabled: true,
      compressionQuality: 'medium', // low, medium, high
      allowedFormats: ['mp4', 'mov', 'avi', 'mkv'],
      thumbnailCount: 5,
      retryAttempts: 3,
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
    };

    res.json({
      success: true,
      data: uploadConfig,
      message: 'Upload configuration retrieved'
    });

  } catch (error) {
    console.error('Get upload config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upload configuration'
    });
  }
});

/**
 * @route   GET /api/config/camera
 * @desc    Get camera feature configuration
 * @access  Public
 */
router.get('/camera', (req, res) => {
  try {
    const cameraConfig = {
      modes: {
        live: { enabled: true, maxDuration: 7200 }, // 2 hours
        video15s: { enabled: true, maxDuration: 15 },
        video60s: { enabled: true, maxDuration: 60 },
        video10m: { enabled: true, maxDuration: 600 },
        photo: { enabled: true }
      },
      features: {
        beauty: true,
        filters: true,
        effects: true,
        stickers: true,
        timer: true,
        flash: true,
        zoom: true,
        speedControl: true,
        multiSegment: true
      },
      limits: {
        maxSegments: 10,
        minSegmentDuration: 1,
        maxZoom: 8.0
      }
    };

    res.json({
      success: true,
      data: cameraConfig,
      message: 'Camera configuration retrieved'
    });

  } catch (error) {
    console.error('Get camera config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching camera configuration'
    });
  }
});

/**
 * @route   GET /api/config/ai
 * @desc    Get AI services configuration (Vertex AI, etc)
 * @access  Private
 */
router.get('/ai', (req, res) => {
  try {
    const aiConfig = {
      vertexAI: {
        enabled: !!process.env.GOOGLE_CLOUD_PROJECT,
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.VERTEX_AI_LOCATION || 'us-central1',
        features: {
          autoCaptions: true,
          hashtagSuggestions: true,
              contentModeration: true,
          objectDetection: false
        }
      },
      speechToText: {
        enabled: true,
        languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'],
        defaultLanguage: 'en-US'
      }
    };

    res.json({
      success: true,
      data: aiConfig,
      message: 'AI configuration retrieved'
    });

  } catch (error) {
    console.error('Get AI config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI configuration'
    });
  }
});

module.exports = router;
