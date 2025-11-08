const express = require('express');
const router = express.Router();
const Level = require('../models/Level');
const User = require('../models/User');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Levels & Badges Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Levels API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/admin/levels
 * @desc    Get all levels
 * @access  Admin
 */
router.get('/admin/levels', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const levels = await Level.find().sort({ level: 1 });

    res.json({
      success: true,
      data: { levels }
    });

  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching levels'
    });
  }
});

/**
 * @route   GET /api/admin/levels/stats
 * @desc    Get levels statistics
 * @access  Admin
 */
router.get('/admin/levels/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      totalLevels,
      maxLevel,
      activeUsers
    ] = await Promise.all([
      Level.countDocuments(),
      Level.findOne().sort({ level: -1 }).select('level'),
      User.countDocuments({ status: 'active' })
    ]);

    // Get user distribution across levels
    const usersByLevel = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalLevels,
        maxLevel: maxLevel?.level || 0,
        activeUsers,
        totalBadges: 0, // TODO: Implement badges
        usersByLevel
      }
    });

  } catch (error) {
    console.error('Get levels stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

/**
 * @route   POST /api/admin/levels
 * @desc    Create new level
 * @access  Admin
 */
router.post('/admin/levels', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { level, name, minXP, maxXP, rewards, icon, color } = req.body;

    // Check if level already exists
    const existing = await Level.findOne({ level });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Level already exists'
      });
    }

    const newLevel = new Level({
      level,
      name,
      minXP,
      maxXP,
      rewards,
      icon,
      color
    });

    await newLevel.save();

    res.json({
      success: true,
      data: { level: newLevel },
      message: 'Level created successfully'
    });

  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating level'
    });
  }
});

/**
 * @route   PUT /api/admin/levels/:id
 * @desc    Update level
 * @access  Admin
 */
router.put('/admin/levels/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name, minXP, maxXP, rewards, icon, color } = req.body;

    const level = await Level.findByIdAndUpdate(
      req.params.id,
      { name, minXP, maxXP, rewards, icon, color },
      { new: true }
    );

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      data: { level },
      message: 'Level updated successfully'
    });

  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating level'
    });
  }
});

/**
 * @route   DELETE /api/admin/levels/:id
 * @desc    Delete level
 * @access  Admin
 */
router.delete('/admin/levels/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const level = await Level.findByIdAndDelete(req.params.id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      message: 'Level deleted successfully'
    });

  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting level'
    });
  }
});

/**
 * @route   GET /api/admin/badges
 * @desc    Get all badges (placeholder)
 * @access  Admin
 */
router.get('/admin/badges', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // TODO: Implement Badge model and logic
    res.json({
      success: true,
      data: { badges: [] },
      message: 'Badges feature coming soon'
    });

  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching badges'
    });
  }
});

/**
 * @route   POST /api/admin/badges
 * @desc    Create new badge (placeholder)
 * @access  Admin
 */
router.post('/admin/badges', verifyJWT, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { badge: {} },
      message: 'Badges feature coming soon'
    });

  } catch (error) {
    console.error('Create badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating badge'
    });
  }
});

module.exports = router;
