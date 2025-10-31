const { Language } = require('../models/Language');
const { Translation } = require('../models/Translation');
const { AuditLog } = require('../models/AuditLog');

// @desc    Get all languages
// @route   GET /api/languages
// @access  Public
exports.getLanguages = async (req, res) => {
  try {
    const { enabled, status, withProgress } = req.query;
    
    const query = {};
    if (enabled !== undefined) query.enabled = enabled === 'true';
    if (status) query.status = status;
    
    let languages = await Language.find(query)
      .sort({ priority: -1, name: 1 })
      .populate('lastModifiedBy', 'fullName avatar')
      .lean();
    
    // Calculate progress if requested
    if (withProgress === 'true') {
      for (const lang of languages) {
        const total = await Translation.countDocuments({ status: 'active' });
        const translated = await Translation.countDocuments({
          [`translations.${lang.code}`]: { $exists: true, $ne: '' },
          status: 'active'
        });
        
        lang.progress = {
          total,
          translated,
          percentage: total > 0 ? Math.round((translated / total) * 100) : 0
        };
      }
    }
    
    res.json({
      success: true,
      data: languages,
      total: languages.length
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
};

// @desc    Get language by code
// @route   GET /api/languages/:code
// @access  Public
exports.getLanguage = async (req, res) => {
  try {
    const language = await Language.findOne({ code: req.params.code.toUpperCase() })
      .populate('lastModifiedBy', 'fullName avatar');
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }
    
    // Calculate progress
    const total = await Translation.countDocuments({ status: 'active' });
    const translated = await Translation.countDocuments({
      [`translations.${language.code}`]: { $exists: true, $ne: '' },
      status: 'active'
    });
    
    const languageData = language.toObject();
    languageData.progress = {
      total,
      translated,
      percentage: total > 0 ? Math.round((translated / total) * 100) : 0
    };
    
    res.json({
      success: true,
      data: languageData
    });
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch language',
      error: error.message
    });
  }
};

// @desc    Create language
// @route   POST /api/languages
// @access  Admin
exports.createLanguage = async (req, res) => {
  try {
    const {
      code, name, nativeName, direction, region, locale,
      dateFormat, timeFormat, numberFormat, currency,
      flag, priority
    } = req.body;
    
    // Check if language already exists
    const existing = await Language.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Language with this code already exists'
      });
    }
    
    const language = await Language.create({
      code: code.toUpperCase(),
      name,
      nativeName,
      direction: direction || 'ltr',
      region,
      locale,
      dateFormat,
      timeFormat,
      numberFormat,
      currency,
      flag,
      priority: priority || 0,
      lastModifiedBy: req.user._id,
      lastModifiedAt: Date.now()
    });
    
    // Log creation
    await AuditLog.logChange({
      entityType: 'language',
      entityId: language._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created language: ${language.name} (${language.code})`,
      severity: 'medium'
    });
    
    res.status(201).json({
      success: true,
      message: 'Language created successfully',
      data: language
    });
  } catch (error) {
    console.error('Create language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create language',
      error: error.message
    });
  }
};

// @desc    Update language
// @route   PUT /api/languages/:code
// @access  Admin
exports.updateLanguage = async (req, res) => {
  try {
    const language = await Language.findOne({ code: req.params.code.toUpperCase() });
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }
    
    const oldData = language.toObject();
    
    // Update fields
    const updateFields = [
      'name', 'nativeName', 'direction', 'region', 'locale',
      'dateFormat', 'timeFormat', 'numberFormat', 'currency',
      'flag', 'priority', 'enabled', 'isDefault'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        language[field] = req.body[field];
      }
    });
    
    language.lastModifiedBy = req.user._id;
    language.lastModifiedAt = Date.now();
    
    await language.save();
    
    // Log update
    await AuditLog.logChange({
      entityType: 'language',
      entityId: language._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated language: ${language.name} (${language.code})`,
      oldValue: oldData,
      newValue: language.toObject(),
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Language updated successfully',
      data: language
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language',
      error: error.message
    });
  }
};

// @desc    Delete language
// @route   DELETE /api/languages/:code
// @access  SuperAdmin
exports.deleteLanguage = async (req, res) => {
  try {
    const language = await Language.findOne({ code: req.params.code.toUpperCase() });
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }
    
    if (language.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default language'
      });
    }
    
    await language.deleteOne();
    
    // Log deletion
    await AuditLog.logChange({
      entityType: 'language',
      entityId: language._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted language: ${language.name} (${language.code})`,
      severity: 'high',
      snapshot: language.toObject()
    });
    
    res.json({
      success: true,
      message: 'Language deleted successfully'
    });
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete language',
      error: error.message
    });
  }
};

// @desc    Publish language pack
// @route   POST /api/languages/:code/publish
// @access  Admin
exports.publishLanguage = async (req, res) => {
  try {
    const language = await Language.findOne({ code: req.params.code.toUpperCase() });
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }
    
    await language.publish(req.user._id);
    
    // Emit WebSocket event for cache invalidation
    if (req.app.get('io')) {
      req.app.get('io').emit('language:published', {
        code: language.code,
        version: language.version
      });
    }
    
    res.json({
      success: true,
      message: 'Language pack published successfully',
      data: {
        code: language.code,
        version: language.version,
        publishedAt: language.lastPublishedAt
      }
    });
  } catch (error) {
    console.error('Publish language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish language',
      error: error.message
    });
  }
};

// @desc    Get language pack (translations) for Flutter
// @route   GET /api/languages/packs/:languageCode
// @access  Public
exports.getLanguagePack = async (req, res) => {
  try {
    const { languageCode } = req.params;
    const { version, category } = req.query;
    
    const language = await Language.findOne({
      code: languageCode.toUpperCase(),
      enabled: true
    });
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found or not enabled'
      });
    }
    
    // Check version for caching
    if (version && parseInt(version) === language.version) {
      return res.status(304).end(); // Not modified
    }
    
    // Get translations
    const pack = await Translation.getLanguagePack(languageCode.toUpperCase(), { category });
    
    // Set cache headers
    res.setHeader('ETag', `"${language.version}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.json({
      success: true,
      data: {
        language: {
          code: language.code,
          name: language.name,
          direction: language.direction,
          version: language.version
        },
        translations: pack,
        meta: {
          totalKeys: Object.keys(pack).length,
          generatedAt: Date.now()
        }
      }
    });
  } catch (error) {
    console.error('Get language pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch language pack',
      error: error.message
    });
  }
};

// @desc    Update language progress
// @route   POST /api/languages/:code/update-progress
// @access  Admin
exports.updateLanguageProgress = async (req, res) => {
  try {
    const language = await Language.findOne({ code: req.params.code.toUpperCase() });
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }
    
    await language.updateProgress();
    
    res.json({
      success: true,
      message: 'Language progress updated',
      data: {
        code: language.code,
        progress: language.translationProgress
      }
    });
  } catch (error) {
    console.error('Update language progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language progress',
      error: error.message
    });
  }
};

// @desc    Get default language
// @route   GET /api/languages/default
// @access  Public
exports.getDefaultLanguage = async (req, res) => {
  try {
    const language = await Language.getDefault();
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'No default language configured'
      });
    }
    
    res.json({
      success: true,
      data: language
    });
  } catch (error) {
    console.error('Get default language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default language',
      error: error.message
    });
  }
};
