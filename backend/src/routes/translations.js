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
const { adminOnly, superAdminOnly, authMiddleware } = require('../middleware/auth');

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
router.get('/admin', authMiddleware, adminOnly, getTranslations);
router.get('/stats', authMiddleware, adminOnly, getTranslationStats);
router.get('/export', authMiddleware, adminOnly, exportTranslations);
router.post('/import', authMiddleware, adminOnly, importTranslations);

router.get('/:key', authMiddleware, adminOnly, getTranslation);
router.post('/', authMiddleware, adminOnly, createTranslation);
router.put('/:key', authMiddleware, adminOnly, updateTranslation);
router.delete('/:key', authMiddleware, superAdminOnly, deleteTranslation);

// Language-specific translations
router.put('/:key/languages/:languageCode', authMiddleware, adminOnly, setLanguageTranslation);
router.post('/:key/languages/:languageCode/verify', authMiddleware, adminOnly, verifyTranslation);
router.post('/:key/auto-translate', authMiddleware, adminOnly, autoTranslate);

// Legacy compatibility – allow body-provided key
router.post('/auto-translate', authMiddleware, adminOnly, (req, res) => {
  const { key } = req.body || {};

  if (!key) {
    return res.status(400).json({
      success: false,
      message: 'Translation key is required for auto-translate'
    });
  }

  req.params = { ...(req.params || {}), key };
  return autoTranslate(req, res);
});

module.exports = router;
