const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { adminOnly, superAdminOnly } = require('../middleware/auth');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
const Banner = require('../models/Banner');

// Public routes
router.get('/', cmsController.getActiveBanners); // Get active banners (public)
router.get('/active', cmsController.getActiveBanners);
router.post('/:id/impression', cmsController.recordImpression || ((req, res) => res.json({ success: true })));

// Admin routes - MongoDB implementation
/**
 * @route   GET /api/admin/banners
 * @desc    Get all banners for admin
 * @access  Admin
 */
router.get('/admin/banners', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: { banners }
    });

  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banners'
    });
  }
});

/**
 * @route   GET /api/admin/banners/stats
 * @desc    Get banner statistics
 * @access  Admin
 */
router.get('/admin/banners/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      total,
      active,
      totalClicks
    ] = await Promise.all([
      Banner.countDocuments(),
      Banner.countDocuments({ isActive: true }),
      Banner.aggregate([
        { $group: { _id: null, total: { $sum: '$clicksCount' } } }
      ])
    ]);

    const avgCTR = total > 0 ? (totalClicks[0]?.total || 0) / total : 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        totalClicks: totalClicks[0]?.total || 0,
        avgCTR: avgCTR.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get banner stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banner stats'
    });
  }
});

/**
 * @route   POST /api/admin/banners
 * @desc    Create new banner
 * @access  Admin
 */
router.post('/admin/banners', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, type, isActive, sortOrder } = req.body;

    const banner = new Banner({
      title,
      imageUrl,
      linkUrl,
      type,
      isActive,
      sortOrder
    });

    await banner.save();

    res.json({
      success: true,
      data: { banner },
      message: 'Banner created successfully'
    });

  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating banner'
    });
  }
});

/**
 * @route   PUT /api/admin/banners/:id
 * @desc    Update banner
 * @access  Admin
 */
router.put('/admin/banners/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { title, imageUrl, linkUrl, type, isActive, sortOrder } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { title, imageUrl, linkUrl, type, isActive, sortOrder },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: { banner },
      message: 'Banner updated successfully'
    });

  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating banner'
    });
  }
});

/**
 * @route   DELETE /api/admin/banners/:id
 * @desc    Delete banner
 * @access  Admin
 */
router.delete('/admin/banners/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting banner'
    });
  }
});

/**
 * @route   PATCH /api/admin/banners/:id/toggle
 * @desc    Toggle banner active status
 * @access  Admin
 */
router.patch('/admin/banners/:id/toggle', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: { banner },
      message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Toggle banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling banner'
    });
  }
});

// Legacy admin routes (old middleware)
router.post('/', adminOnly, cmsController.createBanner);
router.get('/:id', adminOnly, cmsController.getBanner);
router.put('/:id', adminOnly, cmsController.updateBanner);
router.delete('/:id', superAdminOnly, cmsController.deleteBanner);

module.exports = router;

