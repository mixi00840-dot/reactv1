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

    // Transform to section-based structure for dashboard
    const sectioned = {
      general: {},
      email: {},
      payment: {},
      moderation: {},
      features: {},
      notifications: {},
      security: {},
      'api-keys': {}
    };
    
    settings.forEach(setting => {
      const parts = setting.key.split('.');
      if (parts.length === 2) {
        const [section, key] = parts;
        if (sectioned[section]) {
          sectioned[section][key] = setting.value;
        }
      }
    });

    res.json({
      success: true,
      data: { settings },
      sections: sectioned // Include structured version for dashboard
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
    // Check if key looks like a section (general, email, payment, etc.)
    const sectionKeys = ['general', 'email', 'payment', 'moderation', 'features', 'notifications', 'security', 'api-keys'];
    
    if (sectionKeys.includes(req.params.key) && req.body.settings) {
      // Bulk update for section
      const sectionData = req.body.settings;
      const updates = [];
      
      for (const [settingKey, settingValue] of Object.entries(sectionData)) {
        const fullKey = `${req.params.key}.${settingKey}`;
        const result = await Setting.setSetting(fullKey, settingValue, {
          type: typeof settingValue,
          category: req.params.key,
          updatedBy: req.userId
        });
        updates.push(result);
      }
      
      return res.json({
        success: true,
        data: { settings: updates },
        message: `${req.params.key} settings updated successfully`
      });
    }
    
    // Single key update
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

