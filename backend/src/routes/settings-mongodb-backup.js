const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSetting,
  getSettingsGrouped,
  updateSetting,
  bulkUpdateSettings,
  deleteSetting,
  getSettingsVersion,
  exportSettings,
  importSettings
} = require('../controllers/settingsController');
const { protect, adminOnly, superAdminOnly, optionalAuthMiddleware } = require('../middleware/auth');

// Public routes
router.get('/version', getSettingsVersion);
router.get('/', optionalAuthMiddleware, getSettings); // Public can access publicRead settings
router.get('/:category/:key', optionalAuthMiddleware, getSetting); // Public can access publicRead settings

// Admin routes
router.get('/grouped', protect, adminOnly, getSettingsGrouped);
router.get('/export', protect, adminOnly, exportSettings);

// Admin write operations
router.put('/:category/:key', protect, adminOnly, updateSetting);
router.put('/bulk', protect, adminOnly, bulkUpdateSettings);

// SuperAdmin only
router.post('/import', protect, superAdminOnly, importSettings);
router.delete('/:category/:key', protect, superAdminOnly, deleteSetting);

module.exports = router;
