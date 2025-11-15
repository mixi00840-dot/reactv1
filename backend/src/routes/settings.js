const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const SystemSettings = require('../models/SystemSettings');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

const SECTION_KEYS = [
  'general',
  'email',
  'payment',
  'moderation',
  'features',
  'notifications',
  'security',
  'api-keys'
];

const buildDashboardSections = (settings) => {
  const baseStructure = SECTION_KEYS.reduce((acc, key) => {
    acc[key] = {};
    return acc;
  }, {});

  settings.forEach(setting => {
    const parts = setting.key.split('.');
    if (parts.length === 2) {
      const [section, key] = parts;
      if (baseStructure[section]) {
        baseStructure[section][key] = setting.value;
      }
    }
  });

  return baseStructure;
};

const respondWithSettings = (res, settings) => {
  const payload = Array.isArray(settings) ? settings : [settings];
  return res.json({
    success: true,
    data: { settings: payload },
    sections: buildDashboardSections(payload)
  });
};

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
 * @route   GET /api/settings/mongodb/public
 * @desc    Compatibility endpoint for legacy dashboard public settings
 * @access  Public
 */
router.get('/mongodb/public', async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });

    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: { settings: settingsObject },
      legacy: true
    });

  } catch (error) {
    console.error('Get public settings (legacy) error:', error);
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

    const settings = await Setting.find(query).populate('updatedBy', 'username fullName');

    respondWithSettings(res, settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

/**
 * @route   GET /api/settings/mongodb
 * @desc    Legacy endpoint used by dashboard for MongoDB settings
 * @access  Admin
 */
router.get('/mongodb', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Get all SystemSettings organized by category
    const categories = ['streaming', 'storage', 'ai', 'translation', 'payment', 'general'];
    const sections = {};

    for (const category of categories) {
      sections[category] = await SystemSettings.getCategorySettings(category);
    }

    // Also include environment-based API keys
    sections.apiKeys = {
      agora: {
        appId: process.env.AGORA_APP_ID || '',
        certificate: process.env.AGORA_APP_CERTIFICATE || '',
        enabled: !!(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE)
      },
      zegoCloud: {
        appId: process.env.ZEGO_APP_ID || '',
        appSign: process.env.ZEGO_APP_SIGN || '',
        enabled: !!(process.env.ZEGO_APP_ID && process.env.ZEGO_APP_SIGN)
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? '***configured' : '',
        enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
      },
      vertexAI: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        enabled: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      },
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER || '',
        enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
      }
    };

    res.json({
      success: true,
      sections,
      data: sections,
      legacy: true
    });
  } catch (error) {
    console.error('Get settings (legacy) error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

/**
 * @route   PUT /api/settings/mongodb/:section
 * @desc    Update settings for a specific section (legacy dashboard endpoint)
 * @access  Admin
 */
router.put('/mongodb/:section', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    // Map dashboard sections to SystemSettings categories
    const categoryMap = {
      general: 'general',
      email: 'general',
      payment: 'payment',
      moderation: 'ai',
      features: 'general',
      limits: 'general',
      apiKeys: 'streaming' // API keys can go to streaming or create new category
    };

    const category = categoryMap[section] || 'general';

    // Save each setting
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      try {
        await SystemSettings.setSetting(category, `${section}.${key}`, value, req.user._id);
        results.push({ key, success: true });
      } catch (err) {
        console.error(`Error saving ${section}.${key}:`, err);
        results.push({ key, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      results
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
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

/**
 * @route   PUT /api/settings/mongodb/:section
 * @desc    Legacy endpoint for updating section-based settings
 * @access  Admin
 */
router.put('/mongodb/:section', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const { settings: sectionSettings } = req.body;

    if (!SECTION_KEYS.includes(section) && !sectionSettings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings payload'
      });
    }

    if (sectionSettings && typeof sectionSettings === 'object') {
      const updates = [];

      for (const [key, value] of Object.entries(sectionSettings)) {
        const fullKey = `${section}.${key}`;
        const result = await Setting.setSetting(fullKey, value, {
          type: typeof value,
          category: section,
          updatedBy: req.userId
        });
        updates.push(result);
      }

      return res.json({
        success: true,
        data: { settings: updates },
        message: `${section} settings updated successfully`,
        legacy: true
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Settings object is required for legacy endpoint'
    });
  } catch (error) {
    console.error('Update legacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
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
    if (SECTION_KEYS.includes(req.params.key) && req.body.settings) {
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

