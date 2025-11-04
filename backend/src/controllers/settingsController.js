/**
 * Settings Controller - Firestore Migration
 * Handles application settings
 */

const {
  findDocuments,
  findById,
  findOne,
  createDocument,
  updateById,
  deleteById
} = require('../utils/firestoreHelpers');

class SettingsController {
  // Get all settings
  async getSettings(req, res) {
    try {
      const { category, isPublic } = req.query;

      const filters = {};
      if (category) filters.category = category;
      
      // Non-admin users can only see public settings
      if (req.user.role !== 'admin') {
        filters.isPublic = true;
      } else if (isPublic !== undefined) {
        filters.isPublic = isPublic === 'true';
      }

      const settings = await findDocuments('settings', filters, {
        orderBy: 'key',
        direction: 'asc'
      });

      res.json({ success: true, data: { settings } });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
    }
  }

  // Get single setting by key
  async getSetting(req, res) {
    try {
      const { key } = req.params;
      const setting = await findOne('settings', { key });

      if (!setting) {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }

      // Check access
      if (!setting.isPublic && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, data: { setting } });
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ success: false, message: 'Error fetching setting', error: error.message });
    }
  }

  // Create or update setting
  async upsertSetting(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { key, value, category, description, isPublic, dataType } = req.body;

      // Check if setting exists
      const existing = await findOne('settings', { key });

      let setting;
      if (existing) {
        setting = await updateById('settings', existing.id, {
          value,
          category: category || existing.category,
          description: description || existing.description,
          isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
          dataType: dataType || existing.dataType
        });
      } else {
        setting = await createDocument('settings', {
          key,
          value,
          category: category || 'general',
          description: description || '',
          isPublic: isPublic !== undefined ? isPublic : true,
          dataType: dataType || 'string'
        });
      }

      res.json({ success: true, message: 'Setting saved successfully', data: { setting } });
    } catch (error) {
      console.error('Error saving setting:', error);
      res.status(500).json({ success: false, message: 'Error saving setting', error: error.message });
    }
  }

  // Delete setting
  async deleteSetting(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { key } = req.params;
      const setting = await findOne('settings', { key });

      if (!setting) {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }

      await deleteById('settings', setting.id);
      res.json({ success: true, message: 'Setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ success: false, message: 'Error deleting setting', error: error.message });
    }
  }

  // Get settings by category
  async getSettingsByCategory(req, res) {
    try {
      const { category } = req.params;

      const filters = { category };
      if (req.user.role !== 'admin') {
        filters.isPublic = true;
      }

      const settings = await findDocuments('settings', filters);

      res.json({ success: true, data: { settings } });
    } catch (error) {
      console.error('Error fetching settings by category:', error);
      res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
    }
  }

  // Bulk update settings
  async bulkUpdateSettings(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { settings } = req.body;

      if (!Array.isArray(settings)) {
        return res.status(400).json({ success: false, message: 'Settings must be an array' });
      }

      const results = [];
      for (let item of settings) {
        const existing = await findOne('settings', { key: item.key });
        if (existing) {
          await updateById('settings', existing.id, { value: item.value });
          results.push({ key: item.key, status: 'updated' });
        }
      }

      res.json({ success: true, message: 'Settings updated successfully', data: { results } });
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      res.status(500).json({ success: false, message: 'Error bulk updating settings', error: error.message });
    }
  }

  // Get settings grouped by category
  async getSettingsGrouped(req, res) {
    try {
      const settings = await findDocuments('settings', {});
      
      // Group by category
      const grouped = settings.reduce((acc, setting) => {
        const category = setting.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
      }, {});

      res.json({ success: true, data: { settings: grouped } });
    } catch (error) {
      console.error('Error fetching grouped settings:', error);
      res.status(500).json({ success: false, message: 'Error fetching grouped settings', error: error.message });
    }
  }

  // Update setting (alias for upsertSetting)
  async updateSetting(req, res) {
    return this.upsertSetting(req, res);
  }

  // Get settings version (for cache management)
  async getSettingsVersion(req, res) {
    try {
      // Get the most recently updated setting
      const settings = await findDocuments('settings', {});
      const latestUpdate = settings.reduce((latest, setting) => {
        const updatedAt = new Date(setting.updatedAt || setting.createdAt).getTime();
        return updatedAt > latest ? updatedAt : latest;
      }, 0);

      res.json({ 
        success: true, 
        data: { 
          version: latestUpdate,
          timestamp: new Date(latestUpdate).toISOString()
        } 
      });
    } catch (error) {
      console.error('Error fetching settings version:', error);
      res.status(500).json({ success: false, message: 'Error fetching settings version', error: error.message });
    }
  }

  // Export all settings
  async exportSettings(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const settings = await findDocuments('settings', {});
      
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.id,
        settings: settings.map(s => ({
          key: s.key,
          value: s.value,
          category: s.category,
          description: s.description,
          dataType: s.dataType,
          isPublic: s.isPublic
        }))
      };

      res.json({ success: true, data: exportData });
    } catch (error) {
      console.error('Error exporting settings:', error);
      res.status(500).json({ success: false, message: 'Error exporting settings', error: error.message });
    }
  }

  // Import settings
  async importSettings(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
      }

      const { settings, overwrite = false } = req.body;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ success: false, message: 'Settings array is required' });
      }

      const results = {
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      for (const setting of settings) {
        try {
          const { key, category = 'general' } = setting;
          const existing = await findOne('settings', { key, category });

          if (existing && !overwrite) {
            results.skipped++;
            continue;
          }

          const settingData = {
            ...setting,
            updatedAt: new Date().toISOString(),
            importedBy: req.user.id
          };

          if (existing) {
            await updateById('settings', existing.id, settingData);
          } else {
            settingData.createdAt = new Date().toISOString();
            await createDocument('settings', settingData);
          }

          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push({ key: setting.key, error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.failed} failed`,
        data: results
      });
    } catch (error) {
      console.error('Error importing settings:', error);
      res.status(500).json({ success: false, message: 'Error importing settings', error: error.message });
    }
  }
}

module.exports = new SettingsController();
