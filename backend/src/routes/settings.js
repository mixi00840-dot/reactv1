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

/**
 * MongoDB-style API Keys Routes (for backward compatibility with dashboard)
 * These routes map to the main settings routes but provide a structure
 * that matches the admin dashboard expectations
 */

/**
 * @route   GET /api/settings/mongodb/api-keys
 * @desc    Get all API keys settings (all integrations)
 * @access  Admin
 */
router.get('/mongodb/api-keys', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Get all settings in api-keys category
    const settings = await Setting.find({ 
      $or: [
        { category: 'api-keys' },
        { key: { $regex: /^(stripe|paypal|zegoCloud|agora|webrtc|cloudinary|aws|firebase|socketIO|redis|vertexAI|openai|fcm|twilio|sendgrid|mailgun|googleAnalytics|mixpanel|segment|google|facebook|apple|twitter|github|i18n|contentful|sanity|strapi)\./} }
      ]
    });

    // Transform to dashboard structure
    const settingsObject = {
      stripe: {},
      paypal: {},
      zegoCloud: {},
      agora: {},
      webrtc: {},
      cloudinary: {},
      aws: {},
      firebase: {},
      socketIO: {},
      redis: {},
      vertexAI: {},
      openai: {},
      fcm: {},
      twilio: {},
      sendgrid: {},
      mailgun: {},
      googleAnalytics: {},
      mixpanel: {},
      segment: {},
      google: {},
      facebook: {},
      apple: {},
      twitter: {},
      github: {},
      i18n: {},
      contentful: {},
      sanity: {},
      strapi: {}
    };
    
    settings.forEach(setting => {
      const parts = setting.key.split('.');
      if (parts.length >= 2) {
        const [service, ...keyParts] = parts;
        const key = keyParts.join('.');
        if (settingsObject[service]) {
          settingsObject[service][key] = setting.value;
        }
      }
    });

    res.json({
      success: true,
      settings: settingsObject
    });

  } catch (error) {
    console.error('Get API keys settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching API keys settings'
    });
  }
});

/**
 * @route   PUT /api/settings/mongodb/api-keys/:section
 * @desc    Update API keys for a specific section (streaming, payment, etc.)
 * @access  Admin
 */
router.put('/mongodb/api-keys/:section', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const { settings: sectionSettings } = req.body;

    if (!sectionSettings || typeof sectionSettings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const updates = [];
    
    for (const [key, value] of Object.entries(sectionSettings)) {
      const fullKey = `${section}.${key}`;
      const result = await Setting.setSetting(fullKey, value, {
        type: typeof value,
        category: 'api-keys',
        updatedBy: req.userId
      });
      updates.push(result);
    }
    
    res.json({
      success: true,
      data: { settings: updates },
      message: `${section} API keys updated successfully`
    });

  } catch (error) {
    console.error('Update API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating API keys',
      error: error.message
    });
  }
});

module.exports = router;

