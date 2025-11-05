const express = require('express');
const router = express.Router();
const {
  // Banners
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  recordImpression,
  recordClick,
  
  // Pages
  getPages,
  getPage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  
  // Themes
  getThemes,
  getTheme,
  getActiveTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  activateTheme,
  getThemeCSS
} = require('../controllers/cmsController');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'CMS API is operational' });
});

// Get CMS overview (root endpoint - public)
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        banners: [],
        pages: [],
        themes: []
      }
    });
  } catch (error) {
    console.error('Error getting CMS overview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== BANNERS ====================
router.get('/banners', verifyFirebaseToken, requireAdmin, getBanners);
router.get('/banners/active', getActiveBanners); // Public
router.get('/banners/:id', verifyFirebaseToken, requireAdmin, getBanner);
router.post('/banners', verifyFirebaseToken, requireAdmin, createBanner);
router.put('/banners/:id', verifyFirebaseToken, requireAdmin, updateBanner);
router.delete('/banners/:id', verifyFirebaseToken, requireAdmin, deleteBanner);
router.post('/banners/:id/impression', recordImpression); // Public
router.post('/banners/:id/click', recordClick); // Public

// ==================== PAGES ====================
router.get('/pages', getPages); // Public with filters
router.get('/pages/slug/:slug', getPageBySlug); // Public
router.get('/pages/:id', getPage); // Public
router.post('/pages', verifyFirebaseToken, requireAdmin, createPage);
router.put('/pages/:id', verifyFirebaseToken, requireAdmin, updatePage);
router.delete('/pages/:id', verifyFirebaseToken, requireAdmin, deletePage);
router.post('/pages/:id/publish', verifyFirebaseToken, requireAdmin, publishPage);

// ==================== THEMES ====================
router.get('/themes', getThemes); // Public
router.get('/themes/active', getActiveTheme); // Public
router.get('/themes/:id', getTheme); // Public
router.get('/themes/:id/css', getThemeCSS); // Public
router.post('/themes', verifyFirebaseToken, requireAdmin, createTheme);
router.put('/themes/:id', verifyFirebaseToken, requireAdmin, updateTheme);
router.delete('/themes/:id', verifyFirebaseToken, requireAdmin, deleteTheme);
router.post('/themes/:id/activate', verifyFirebaseToken, requireAdmin, activateTheme);

module.exports = router;
