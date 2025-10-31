const express = require('express');
const router = express.Router();
const {
  getLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  publishLanguage,
  getLanguagePack,
  updateLanguageProgress,
  getDefaultLanguage
} = require('../controllers/languageController');
const { adminOnly, superAdminOnly } = require('../middleware/auth');

// Public routes (for mobile clients and testing)
router.get('/packs/:languageCode', getLanguagePack);
router.get('/default', getDefaultLanguage);

// Get all languages (public with fallback)
router.get('/', async (req, res) => {
  try {
    const { Language } = require('../models/Language');
    const languages = await Language.find().select('name code nativeName isRTL isDefault status').limit(50);
    res.json({ success: true, data: { languages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes
router.get('/admin', adminOnly, getLanguages);
router.get('/:code', adminOnly, getLanguage);
router.post('/', adminOnly, createLanguage);
router.put('/:code', adminOnly, updateLanguage);
router.delete('/:code', superAdminOnly, deleteLanguage);
router.post('/:code/publish', adminOnly, publishLanguage);
router.post('/:code/update-progress', adminOnly, updateLanguageProgress);

module.exports = router;
