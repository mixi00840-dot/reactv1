const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Stories Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stories API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/stories
 * @desc    Get all active stories (from followed users)
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const Follow = require('../models/Follow');

    // Get followed users
    const follows = await Follow.find({ followerId: userId }).distinct('followingId');
    const userIds = [userId, ...follows]; // Include own stories

    // Get active stories
    const stories = await Story.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          expiresAt: { $gt: new Date() },
          isArchived: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$userId',
          stories: { $push: '$$ROOT' },
          latestStory: { $first: '$createdAt' },
          totalStories: { $sum: 1 },
          hasViewed: { $first: '$viewers' }
        }
      },
      {
        $sort: { latestStory: -1 }
      }
    ]);

    // Populate user data
    for (let story of stories) {
      const user = await User.findById(story._id).select('username fullName avatar isVerified');
      story.user = user;
    }

    res.json({
      success: true,
      data: { stories }
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stories'
    });
  }
});

/**
 * @route   POST /api/stories
 * @desc    Create new story
 * @access  Private
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { type, mediaUrl, thumbnailUrl, caption, duration, musicId } = req.body;
    const userId = req.userId;

    const story = new Story({
      userId,
      type,
      mediaUrl,
      thumbnailUrl,
      caption,
      duration: duration || 5,
      musicId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.save();

    res.status(201).json({
      success: true,
      data: { story },
      message: 'Story created successfully'
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating story',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stories/:id
 * @desc    Get story by ID
 * @access  Private
 */
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('userId', 'username fullName avatar isVerified');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or expired'
      });
    }

    // Check if expired
    if (story.expiresAt < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Story has expired'
      });
    }

    res.json({
      success: true,
      data: { story }
    });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching story'
    });
  }
});

/**
 * @route   POST /api/stories/:id/view
 * @desc    Record story view
 * @access  Private
 */
router.post('/:id/view', verifyJWT, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    await story.addViewer(req.userId);

    res.json({
      success: true,
      data: { viewsCount: story.viewsCount },
      message: 'View recorded'
    });

  } catch (error) {
    console.error('Record story view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording view'
    });
  }
});

/**
 * @route   DELETE /api/stories/:id
 * @desc    Delete story
 * @access  Private (Story owner)
 */
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check ownership
    if (!story.userId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting story'
    });
  }
});

module.exports = router;
