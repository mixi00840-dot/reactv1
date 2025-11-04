const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// ========== BANNERS ==========
// Public
router.get('/banners', cmsController.getBanners);

// Protected (admin only)
router.post('/banners', authMiddleware, cmsController.createBanner);
router.put('/banners/:id', authMiddleware, cmsController.updateBanner);
router.delete('/banners/:id', authMiddleware, cmsController.deleteBanner);

// ========== PAGES ==========
// Public
router.get('/pages', cmsController.getPages);
router.get('/pages/:id', cmsController.getPage);

// Protected (admin only)
router.post('/pages', authMiddleware, cmsController.createPage);
router.put('/pages/:id', authMiddleware, cmsController.updatePage);
router.delete('/pages/:id', authMiddleware, cmsController.deletePage);

// ========== THEMES ==========
// Public
router.get('/themes', cmsController.getThemes);
router.get('/themes/active', cmsController.getActiveTheme);

// Protected (admin only)
router.post('/themes/:id/activate', authMiddleware, cmsController.activateTheme);

module.exports = router;
