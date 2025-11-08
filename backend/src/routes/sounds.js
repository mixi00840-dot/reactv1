const express = require('express');
const router = express.Router();
const Sound = require('../models/Sound');
const Content = require('../models/Content');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Sounds Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sounds API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/sounds
 * @desc    Get all sounds
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, genre, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };
    if (genre) query.genre = genre;

    if (search) {
      query.$text = { $search: search };
    }

    const sounds = await Sound.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { usageCount: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('uploadedBy', 'username fullName avatar');

    const total = await Sound.countDocuments(query);

    res.json({
      success: true,
      data: {
        sounds,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sounds'
    });
  }
});

/**
 * @route   GET /api/sounds/trending
 * @desc    Get trending sounds
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const sounds = await Sound.find({
      status: 'active',
      isTrending: true
    })
    .sort({ trendingScore: -1, usageCount: -1 })
    .limit(parseInt(limit))
    .populate('uploadedBy', 'username fullName avatar');

    res.json({
      success: true,
      data: { sounds }
    });

  } catch (error) {
    console.error('Get trending sounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending sounds'
    });
  }
});

/**
 * @route   GET /api/sounds/:id
 * @desc    Get sound by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const sound = await Sound.findById(req.params.id)
      .populate('uploadedBy', 'username fullName avatar isVerified');

    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Get usage count (number of content using this sound)
    const contentCount = await Content.countDocuments({
      soundId: sound._id,
      status: 'active'
    });

    const soundData = sound.toObject();
    soundData.contentCount = contentCount;

    res.json({
      success: true,
      data: { sound: soundData }
    });

  } catch (error) {
    console.error('Get sound error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sound'
    });
  }
});

/**
 * @route   POST /api/sounds
 * @desc    Upload new sound
 * @access  Private
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { title, artist, audioUrl, duration, genre } = req.body;

    const sound = new Sound({
      title,
      artist,
      audioUrl,
      duration,
      genre,
      uploadedBy: req.userId,
      isOriginal: true,
      status: 'pending' // Requires approval
    });

    await sound.save();

    res.status(201).json({
      success: true,
      data: { sound },
      message: 'Sound uploaded successfully. Pending approval.'
    });

  } catch (error) {
    console.error('Upload sound error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading sound',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sounds/:id/use
 * @desc    Increment sound usage count
 * @access  Public
 */
router.post('/:id/use', async (req, res) => {
  try {
    const sound = await Sound.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    res.json({
      success: true,
      data: { sound },
      message: 'Sound usage recorded'
    });

  } catch (error) {
    console.error('Use sound error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording sound usage'
    });
  }
});

module.exports = router;

