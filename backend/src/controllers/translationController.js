const { Translation } = require('../models/Translation');
const { Language } = require('../models/Language');
const { AuditLog } = require('../models/AuditLog');

// @desc    Get all translations
// @route   GET /api/translations
// @access  Admin
exports.getTranslations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      category,
      status,
      languageCode
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    const result = await Translation.searchTranslations(search, {
      category,
      status,
      languageCode,
      limit: parseInt(limit),
      skip
    });
    
    res.json({
      success: true,
      data: result.translations,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translations',
      error: error.message
    });
  }
};

// @desc    Get translation by key
// @route   GET /api/translations/:key
// @access  Admin
exports.getTranslation = async (req, res) => {
  try {
    const translation = await Translation.findOne({ key: req.params.key })
      .populate('lastModifiedBy', 'fullName avatar')
      .populate('notes.author', 'fullName avatar');
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    res.json({
      success: true,
      data: translation
    });
  } catch (error) {
    console.error('Get translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation',
      error: error.message
    });
  }
};

// @desc    Create translation
// @route   POST /api/translations
// @access  Admin
exports.createTranslation = async (req, res) => {
  try {
    const {
      key, category, defaultText, description, context,
      variables, maxLength, minLength, tags, usage, screenshot
    } = req.body;
    
    // Check if key already exists
    const existing = await Translation.findOne({ key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Translation key already exists'
      });
    }
    
    const translation = await Translation.create({
      key,
      category,
      defaultText,
      description,
      context,
      variables,
      maxLength,
      minLength,
      tags,
      usage,
      screenshot,
      lastModifiedBy: req.user._id,
      lastModifiedAt: Date.now()
    });
    
    // Log creation
    await AuditLog.logChange({
      entityType: 'translation',
      entityId: translation._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created translation key: ${key}`,
      severity: 'low'
    });
    
    res.status(201).json({
      success: true,
      message: 'Translation created successfully',
      data: translation
    });
  } catch (error) {
    console.error('Create translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create translation',
      error: error.message
    });
  }
};

// @desc    Update translation
// @route   PUT /api/translations/:key
// @access  Admin
exports.updateTranslation = async (req, res) => {
  try {
    const translation = await Translation.findOne({ key: req.params.key });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    const oldData = translation.toObject();
    
    // Update fields
    const updateFields = [
      'defaultText', 'description', 'context', 'category',
      'variables', 'maxLength', 'minLength', 'tags', 'usage',
      'screenshot', 'status'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        translation[field] = req.body[field];
      }
    });
    
    translation.lastModifiedBy = req.user._id;
    translation.lastModifiedAt = Date.now();
    translation.version += 1;
    
    await translation.save();
    
    // Log update
    await AuditLog.logChange({
      entityType: 'translation',
      entityId: translation._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated translation: ${translation.key}`,
      oldValue: oldData,
      newValue: translation.toObject(),
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Translation updated successfully',
      data: translation
    });
  } catch (error) {
    console.error('Update translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update translation',
      error: error.message
    });
  }
};

// @desc    Delete translation
// @route   DELETE /api/translations/:key
// @access  SuperAdmin
exports.deleteTranslation = async (req, res) => {
  try {
    const translation = await Translation.findOne({ key: req.params.key });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    await translation.deleteOne();
    
    // Log deletion
    await AuditLog.logChange({
      entityType: 'translation',
      entityId: translation._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted translation: ${translation.key}`,
      severity: 'medium',
      snapshot: translation.toObject()
    });
    
    res.json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    console.error('Delete translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete translation',
      error: error.message
    });
  }
};

// @desc    Set translation for a language
// @route   PUT /api/translations/:key/languages/:languageCode
// @access  Admin
exports.setLanguageTranslation = async (req, res) => {
  try {
    const { key, languageCode } = req.params;
    const { text, verified, needsReview } = req.body;
    
    const translation = await Translation.findOne({ key });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    // Verify language exists
    const language = await Language.findOne({ code: languageCode.toUpperCase(), enabled: true });
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found or not enabled'
      });
    }
    
    await translation.setTranslation(
      languageCode.toUpperCase(),
      text,
      req.user._id,
      { verified, needsReview }
    );
    
    // Log translation
    await AuditLog.logChange({
      entityType: 'translation',
      entityId: translation._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      fieldName: `translation.${languageCode}`,
      description: `Set ${languageCode} translation for: ${key}`,
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Translation set successfully',
      data: {
        key: translation.key,
        languageCode: languageCode.toUpperCase(),
        text,
        status: translation.translationStatus.get(languageCode.toUpperCase())
      }
    });
  } catch (error) {
    console.error('Set language translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set translation',
      error: error.message
    });
  }
};

// @desc    Verify translation
// @route   POST /api/translations/:key/languages/:languageCode/verify
// @access  Admin
exports.verifyTranslation = async (req, res) => {
  try {
    const { key, languageCode } = req.params;
    
    const translation = await Translation.findOne({ key });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    await translation.verifyTranslation(languageCode.toUpperCase(), req.user._id);
    
    res.json({
      success: true,
      message: 'Translation verified successfully'
    });
  } catch (error) {
    console.error('Verify translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify translation',
      error: error.message
    });
  }
};

// @desc    Bulk import translations
// @route   POST /api/translations/import
// @access  Admin
exports.importTranslations = async (req, res) => {
  try {
    const { translations, languageCode, overwrite = false, verified = false } = req.body;
    
    if (!Array.isArray(translations)) {
      return res.status(400).json({
        success: false,
        message: 'Translations must be an array'
      });
    }
    
    // Add languageCode to each translation
    const translationsWithLang = translations.map(t => ({
      ...t,
      languageCode: languageCode.toUpperCase()
    }));
    
    const results = await Translation.importTranslations(
      translationsWithLang,
      req.user._id,
      { overwrite, verified }
    );
    
    // Log import
    await AuditLog.logChange({
      entityType: 'translation',
      action: 'import',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Imported ${results.created + results.updated} translations for ${languageCode}`,
      severity: 'medium',
      snapshot: results
    });
    
    res.json({
      success: true,
      message: 'Translations imported successfully',
      data: results
    });
  } catch (error) {
    console.error('Import translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import translations',
      error: error.message
    });
  }
};

// @desc    Export translations
// @route   GET /api/translations/export
// @access  Admin
exports.exportTranslations = async (req, res) => {
  try {
    const { languageCode, category, format = 'json', status = 'active' } = req.query;
    
    const query = { status };
    if (category) query.category = category;
    
    const translations = await Translation.find(query).lean();
    
    let exportData;
    
    if (languageCode) {
      // Export for specific language
      exportData = translations.map(t => ({
        key: t.key,
        category: t.category,
        defaultText: t.defaultText,
        translation: t.translations?.[languageCode.toUpperCase()] || '',
        description: t.description,
        context: t.context
      }));
    } else {
      // Export all languages
      exportData = translations.map(t => ({
        key: t.key,
        category: t.category,
        defaultText: t.defaultText,
        translations: Object.fromEntries(t.translations || new Map()),
        description: t.description
      }));
    }
    
    // Log export
    await AuditLog.logChange({
      entityType: 'translation',
      action: 'export',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Exported ${exportData.length} translations${languageCode ? ` for ${languageCode}` : ''}`,
      severity: 'low'
    });
    
    if (format === 'csv') {
      const fields = languageCode
        ? ['key', 'category', 'defaultText', 'translation', 'description']
        : ['key', 'category', 'defaultText', 'description'];
      
      const csv = [
        fields.join(','),
        ...exportData.map(item => fields.map(field => JSON.stringify(item[field] || '')).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=translations_${languageCode || 'all'}_${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=translations_${languageCode || 'all'}_${Date.now()}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export translations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export translations',
      error: error.message
    });
  }
};

// @desc    Get translation statistics
// @route   GET /api/translations/stats
// @access  Admin
exports.getTranslationStats = async (req, res) => {
  try {
    const { languageCode } = req.query;
    
    // Total translations
    const total = await Translation.countDocuments({ status: 'active' });
    
    // By category
    const byCategory = await Translation.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    let languageStats = {};
    
    if (languageCode) {
      const translated = await Translation.countDocuments({
        [`translations.${languageCode.toUpperCase()}`]: { $exists: true, $ne: '' },
        status: 'active'
      });
      
      const verified = await Translation.countDocuments({
        [`translationStatus.${languageCode.toUpperCase()}.status`]: 'verified',
        status: 'active'
      });
      
      const needsReview = await Translation.countDocuments({
        [`translationStatus.${languageCode.toUpperCase()}.needsReview`]: true,
        status: 'active'
      });
      
      languageStats = {
        total,
        translated,
        missing: total - translated,
        verified,
        needsReview,
        percentage: total > 0 ? Math.round((translated / total) * 100) : 0
      };
    }
    
    res.json({
      success: true,
      data: {
        total,
        byCategory,
        languageStats: languageCode ? languageStats : null
      }
    });
  } catch (error) {
    console.error('Get translation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation statistics',
      error: error.message
    });
  }
};

// @desc    Auto-translate using external provider
// @route   POST /api/translations/:key/auto-translate
// @access  Admin
exports.autoTranslate = async (req, res) => {
  try {
    const { key } = req.params;
    const { targetLanguages } = req.body; // Array of language codes
    
    const translation = await Translation.findOne({ key });
    
    if (!translation) {
      return res.status(404).json({
        success: false,
        message: 'Translation not found'
      });
    }
    
    // Check if auto-translate is enabled
    const { Setting } = require('../models/Setting');
    const autoTranslateEnabled = await Setting.getSetting('i18n', 'auto_translate_enabled');
    const apiKey = await Setting.getSetting('i18n', 'translation_provider_api_key');
    
    if (!autoTranslateEnabled || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Auto-translate is not enabled or API key is missing'
      });
    }
    
    // TODO: Implement actual Google Translate API call
    // For now, return placeholder
    const results = [];
    
    for (const langCode of targetLanguages) {
      // Placeholder - would call Google Translate API here
      const autoTranslatedText = `[AUTO] ${translation.defaultText}`;
      
      await translation.setTranslation(
        langCode.toUpperCase(),
        autoTranslatedText,
        req.user._id,
        { autoTranslated: true, needsReview: true }
      );
      
      results.push({
        languageCode: langCode.toUpperCase(),
        text: autoTranslatedText,
        status: 'auto'
      });
    }
    
    res.json({
      success: true,
      message: 'Auto-translation completed. Please review before publishing.',
      data: results
    });
  } catch (error) {
    console.error('Auto-translate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-translate',
      error: error.message
    });
  }
};
