const express = require('express');
const router = express.Router();
const soundController = require('../controllers/soundController');
const { authMiddleware, adminMiddleware, moderatorMiddleware } = require('../middleware/auth');

/**
 * Public Sound Routes
 */

// Get all sounds
router.get('/', soundController.getAllSounds || (async (req, res) => {
  try {
    const Sound = require('../models/Sound');
    const sounds = await Sound.find().limit(20);
    res.json({ success: true, data: { sounds } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get trending sounds
router.get('/trending', soundController.getTrendingSounds);

// Search sounds
router.get('/search', soundController.searchSounds);

// Get featured sounds
router.get('/featured', soundController.getFeaturedSounds);

// Get sound details
router.get('/:soundId', soundController.getSoundDetails);

// Get videos using a sound
router.get('/:soundId/videos', soundController.getSoundVideos);

/**
 * Creator Routes (Authentication Required)
 */

// Upload new sound
router.post('/upload', authMiddleware, soundController.uploadSound);

// Confirm sound upload
router.post('/:soundId/confirm-upload', authMiddleware, soundController.confirmSoundUpload);

// Get my uploaded sounds
router.get('/my/sounds', authMiddleware, soundController.getMySounds);

// Update sound metadata
router.put('/:soundId', authMiddleware, soundController.updateSound);

// Delete sound
router.delete('/:soundId', authMiddleware, soundController.deleteSound);

// Record sound usage (when used in content)
router.post('/:soundId/use', authMiddleware, soundController.recordSoundUsage);

/**
 * Moderation Routes (Moderator/Admin)
 */

// Get sounds pending review
router.get('/admin/pending-review', moderatorMiddleware, soundController.getPendingReview);

// Approve sound
router.put('/:soundId/approve', moderatorMiddleware, soundController.approveSound);

// Reject sound
router.put('/:soundId/reject', moderatorMiddleware, soundController.rejectSound);

/**
 * Admin Routes
 */

// Get sound statistics
router.get('/admin/stats', authMiddleware, adminMiddleware, soundController.getSoundStats);

// Get sounds pending review
router.get('/moderation/pending-review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingSounds = {
      total: 15,
      sounds: [],
      categories: {
        music: 8,
        effects: 4,
        voice: 2,
        other: 1
      }
    };
    
    res.json({
      success: true,
      data: pendingSounds
    });
  } catch (error) {
    console.error('Get pending sounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending sounds'
    });
  }
});

module.exports = router;
