const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Public settings (no auth)
router.get('/public', settingsController.getSettings);
router.get('/public/:key', settingsController.getSetting);

// Protected settings (admin only)
router.use(authMiddleware);
router.get('/', settingsController.getSettings);
router.get('/:key', settingsController.getSetting);
router.post('/', settingsController.upsertSetting);
router.put('/:key', settingsController.upsertSetting);
router.delete('/:key', settingsController.deleteSetting);
router.get('/category/:category', settingsController.getSettingsByCategory);
router.post('/bulk', settingsController.bulkUpdateSettings);

module.exports = router;
