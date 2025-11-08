const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Settings Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Settings API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/settings/public
 * @desc    Get public settings
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });

    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: { settings: settingsObject }
    });

  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

/**
 * @route   GET /api/settings
 * @desc    Get all settings (including private)
 * @access  Admin
 */
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};
    if (category) query.category = category;

    const settings = await Setting.find(query)
      .populate('updatedBy', 'username fullName');

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

/**
 * @route   GET /api/settings/:key
 * @desc    Get setting by key
 * @access  Admin
 */
router.get('/:key', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: { setting }
    });

  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching setting'
    });
  }
});

/**
 * @route   PUT /api/settings/:key
 * @desc    Update setting
 * @access  Admin
 */
router.put('/:key', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { value, description, category, isPublic } = req.body;

    const setting = await Setting.setSetting(req.params.key, value, {
      type: typeof value,
      category,
      description,
      isPublic,
      updatedBy: req.userId
    });

    res.json({
      success: true,
      data: { setting },
      message: 'Setting updated successfully'
    });

  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
});

module.exports = router;

