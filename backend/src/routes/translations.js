const express = require('express');
const router = express.Router();
const {
  getTranslations,
  getTranslation,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  setLanguageTranslation,
  verifyTranslation,
  importTranslations,
  exportTranslations,
  getTranslationStats,
  autoTranslate
} = require('../controllers/translationController');
const { adminOnly, superAdminOnly } = require('../middleware/auth');

// Public translation routes (accessible without auth for testing)
router.get('/', async (req, res) => {
  try {
    const { Translation } = require('../models/Translation');
    const { language } = req.query;
    const query = language ? { [`translations.${language}`]: { $exists: true } } : {};
    const translations = await Translation.find(query).limit(100);
    res.json({ success: true, data: { translations } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes require authentication
router.get('/admin', adminOnly, getTranslations);
router.get('/stats', adminOnly, getTranslationStats);
router.get('/export', adminOnly, exportTranslations);
router.post('/import', adminOnly, importTranslations);

router.get('/:key', adminOnly, getTranslation);
router.post('/', adminOnly, createTranslation);
router.put('/:key', adminOnly, updateTranslation);
router.delete('/:key', superAdminOnly, deleteTranslation);

// Language-specific translations
router.put('/:key/languages/:languageCode', adminOnly, setLanguageTranslation);
router.post('/:key/languages/:languageCode/verify', adminOnly, verifyTranslation);
router.post('/:key/auto-translate', adminOnly, autoTranslate);

module.exports = router;
