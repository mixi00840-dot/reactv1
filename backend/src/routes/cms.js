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
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth');

// ==================== BANNERS ====================
router.get('/banners', adminOnly, getBanners);
router.get('/banners/active', getActiveBanners); // Public
router.get('/banners/:id', adminOnly, getBanner);
router.post('/banners', adminOnly, createBanner);
router.put('/banners/:id', adminOnly, updateBanner);
router.delete('/banners/:id', superAdminOnly, deleteBanner);
router.post('/banners/:id/impression', recordImpression); // Public
router.post('/banners/:id/click', recordClick); // Public

// ==================== PAGES ====================
router.get('/pages', getPages); // Public with filters
router.get('/pages/slug/:slug', getPageBySlug); // Public
router.get('/pages/:id', getPage); // Public
router.post('/pages', adminOnly, createPage);
router.put('/pages/:id', adminOnly, updatePage);
router.delete('/pages/:id', superAdminOnly, deletePage);
router.post('/pages/:id/publish', adminOnly, publishPage);

// ==================== THEMES ====================
router.get('/themes', getThemes); // Public
router.get('/themes/active', getActiveTheme); // Public
router.get('/themes/:id', getTheme); // Public
router.get('/themes/:id/css', getThemeCSS); // Public
router.post('/themes', adminOnly, createTheme);
router.put('/themes/:id', adminOnly, updateTheme);
router.delete('/themes/:id', superAdminOnly, deleteTheme);
router.post('/themes/:id/activate', adminOnly, activateTheme);

module.exports = router;
