const { Setting } = require('../models/Setting');
const { AuditLog } = require('../models/AuditLog');

// @desc    Get all settings (with optional category filter)
// @route   GET /api/settings
// @access  Admin or Public (for publicRead settings)
exports.getSettings = async (req, res) => {
  try {
    const { category, publicOnly, search, tags } = req.query;
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
    
    const query = { active: true };
    
    if (category) {
      query.category = category;
    }
    
    if (publicOnly === 'true' || !isAdmin) {
      query.publicRead = true;
    }
    
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { label: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    const settings = await Setting.find(query)
      .sort({ category: 1, key: 1 })
      .populate('lastModifiedBy', 'fullName avatar')
      .lean();
    
    // Process settings for response
    const processedSettings = settings.map(setting => ({
      ...setting,
      value: isAdmin ? (setting.encrypted ? decrypt(setting.value) : setting.value) : (setting.publicRead ? setting.value : undefined),
      maskedValue: setting.encrypted ? setting.value?.slice(0, 4) + '****' : undefined
    }));
    
    res.json({
      success: true,
      data: processedSettings,
      total: processedSettings.length
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// @desc    Get setting by category and key
// @route   GET /api/settings/:category/:key
// @access  Admin or Public (for publicRead settings)
exports.getSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
    
    const setting = await Setting.findOne({ category, key, active: true })
      .populate('lastModifiedBy', 'fullName avatar');
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    if (!setting.publicRead && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const value = setting.actualValue;
    
    res.json({
      success: true,
      data: {
        ...setting.toObject(),
        value: isAdmin ? value : (setting.publicRead ? value : undefined),
        maskedValue: setting.encrypted ? setting.getMaskedValue() : undefined
      }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting',
      error: error.message
    });
  }
};

// @desc    Get all settings grouped by category
// @route   GET /api/settings/grouped
// @access  Admin
exports.getSettingsGrouped = async (req, res) => {
  try {
    const settings = await Setting.find({ active: true })
      .sort({ category: 1, key: 1 })
      .populate('lastModifiedBy', 'fullName avatar')
      .lean();
    
    const grouped = {};
    
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      
      grouped[setting.category].push({
        ...setting,
        actualValue: setting.encrypted ? '(encrypted)' : setting.value,
        maskedValue: setting.encrypted ? setting.value?.slice(0, 4) + '****' : undefined
      });
    }
    
    res.json({
      success: true,
      data: grouped,
      categories: Object.keys(grouped)
    });
  } catch (error) {
    console.error('Get grouped settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grouped settings',
      error: error.message
    });
  }
};

// @desc    Create or update setting
// @route   PUT /api/settings/:category/:key
// @access  Admin
exports.updateSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const { value, label, description, type, encrypted, publicRead, validation, envKey, requiresRestart, tags } = req.body;
    
    // Get old setting for audit
    const oldSetting = await Setting.findOne({ category, key });
    const oldValue = oldSetting ? oldSetting.actualValue : null;
    
    // Update or create setting
    const setting = await Setting.setSetting(
      category,
      key,
      value,
      req.user._id,
      {
        label,
        description,
        type,
        encrypted,
        publicRead,
        validation,
        envKey,
        requiresRestart,
        tags
      }
    );
    
    // Log the change
    await AuditLog.logSettingChange(setting, oldValue, value, req.user._id, req);
    
    // Emit WebSocket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').emit('setting:updated', {
        category,
        key,
        version: setting.version,
        requiresRestart: setting.requiresRestart
      });
    }
    
    res.json({
      success: true,
      message: oldSetting ? 'Setting updated successfully' : 'Setting created successfully',
      data: {
        ...setting.toObject(),
        actualValue: setting.actualValue,
        maskedValue: setting.encrypted ? setting.getMaskedValue() : undefined
      }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
};

// @desc    Bulk update settings
// @route   PUT /api/settings/bulk
// @access  Admin
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { category, key, value }
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const item of settings) {
      try {
        const oldSetting = await Setting.findOne({ category: item.category, key: item.key });
        const oldValue = oldSetting ? oldSetting.actualValue : null;
        
        const setting = await Setting.setSetting(
          item.category,
          item.key,
          item.value,
          req.user._id,
          item.options || {}
        );
        
        await AuditLog.logSettingChange(setting, oldValue, item.value, req.user._id, req);
        
        results.push({ category: item.category, key: item.key, success: true });
      } catch (error) {
        errors.push({ category: item.category, key: item.key, error: error.message });
      }
    }
    
    // Emit WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('settings:bulk_updated', {
        count: results.length,
        categories: [...new Set(results.map(r => r.category))]
      });
    }
    
    res.json({
      success: true,
      message: `Updated ${results.length} settings`,
      data: { results, errors }
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update settings',
      error: error.message
    });
  }
};

// @desc    Delete setting
// @route   DELETE /api/settings/:category/:key
// @access  SuperAdmin only
exports.deleteSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const setting = await Setting.findOne({ category, key });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    // Soft delete (deactivate)
    setting.active = false;
    await setting.save();
    
    // Log the deletion
    await AuditLog.logChange({
      entityType: 'setting',
      entityId: setting._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      userRole: req.user.role,
      category: setting.category,
      fieldName: setting.key,
      oldValue: setting.actualValue,
      description: `Deleted setting ${category}.${key}`,
      severity: 'high',
      canRollback: true,
      rollbackData: setting.toObject()
    });
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting',
      error: error.message
    });
  }
};

// @desc    Get settings version (for cache validation)
// @route   GET /api/settings/version
// @access  Public
exports.getSettingsVersion = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = { active: true };
    if (category) query.category = category;
    
    const settings = await Setting.find(query).select('version').lean();
    
    // Calculate aggregate version hash
    const versionString = settings.map(s => s.version).join('-');
    const crypto = require('crypto');
    const versionHash = crypto.createHash('md5').update(versionString).digest('hex');
    
    res.json({
      success: true,
      data: {
        version: versionHash,
        count: settings.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Get settings version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings version',
      error: error.message
    });
  }
};

// @desc    Export settings
// @route   GET /api/settings/export
// @access  Admin
exports.exportSettings = async (req, res) => {
  try {
    const { category, format = 'json' } = req.query;
    
    const query = { active: true };
    if (category) query.category = category;
    
    const settings = await Setting.find(query).lean();
    
    // Process for export (decrypt values for admin)
    const { decrypt } = require('../models/Setting');
    const exportData = settings.map(setting => ({
      category: setting.category,
      key: setting.key,
      value: setting.encrypted ? decrypt(setting.value) : setting.value,
      label: setting.label,
      description: setting.description,
      type: setting.type,
      validation: setting.validation,
      publicRead: setting.publicRead,
      tags: setting.tags
    }));
    
    // Log export
    await AuditLog.logChange({
      entityType: 'setting',
      action: 'export',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Exported ${exportData.length} settings${category ? ` from category ${category}` : ''}`,
      severity: 'medium',
      ipAddress: req.ip
    });
    
    if (format === 'csv') {
      // Convert to CSV
      const fields = ['category', 'key', 'value', 'label', 'description', 'type'];
      const csv = [
        fields.join(','),
        ...exportData.map(item => fields.map(field => JSON.stringify(item[field] || '')).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=settings_${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=settings_${Date.now()}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: error.message
    });
  }
};

// @desc    Import settings
// @route   POST /api/settings/import
// @access  SuperAdmin
exports.importSettings = async (req, res) => {
  try {
    const { settings, overwrite = false } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array'
      });
    }
    
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };
    
    for (const item of settings) {
      try {
        const existing = await Setting.findOne({ category: item.category, key: item.key });
        
        if (existing && !overwrite) {
          results.skipped++;
          continue;
        }
        
        await Setting.setSetting(
          item.category,
          item.key,
          item.value,
          req.user._id,
          {
            label: item.label,
            description: item.description,
            type: item.type,
            encrypted: item.encrypted,
            publicRead: item.publicRead,
            validation: item.validation,
            tags: item.tags
          }
        );
        
        if (existing) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          category: item.category,
          key: item.key,
          error: error.message
        });
      }
    }
    
    // Log import
    await AuditLog.logChange({
      entityType: 'setting',
      action: 'import',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Imported settings: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      severity: 'high',
      snapshot: results
    });
    
    res.json({
      success: true,
      message: 'Settings imported successfully',
      data: results
    });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: error.message
    });
  }
};
