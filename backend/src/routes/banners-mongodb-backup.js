const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { adminOnly, superAdminOnly } = require('../middleware/auth');

// Public routes
router.get('/', cmsController.getActiveBanners); // Get active banners (public)
router.get('/active', cmsController.getActiveBanners);
router.post('/:id/impression', cmsController.recordImpression || ((req, res) => res.json({ success: true })));

// Admin routes
router.post('/', adminOnly, cmsController.createBanner);
router.get('/:id', adminOnly, cmsController.getBanner);
router.put('/:id', adminOnly, cmsController.updateBanner);
router.delete('/:id', superAdminOnly, cmsController.deleteBanner);

module.exports = router;
