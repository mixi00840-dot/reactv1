const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticate, adminMiddleware } = require('../middleware/auth');

/**
 * Story Routes
 * All routes require authentication
 */

// Get all active stories
router.get('/', authenticate, storyController.getAllActiveStories || (async (req, res) => {
  try {
    const Story = require('../models/Story');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
      createdAt: { $gte: twentyFourHoursAgo },
      status: 'active'
    }).limit(50);
    res.json({ success: true, data: { stories } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Create story
router.post('/', authenticate, storyController.createStory);

// Get stories feed (following users)
router.get('/feed', authenticate, storyController.getStoriesFeed);

// Get user stories
router.get('/user/:userId', authenticate, storyController.getUserStories);

// View story
router.post('/:storyId/view', authenticate, storyController.viewStory);

// Add reaction to story
router.post('/:storyId/reactions', authenticate, storyController.addReaction);

// Reply to story
router.post('/:storyId/replies', authenticate, storyController.replyToStory);

// Get story viewers
router.get('/:storyId/viewers', authenticate, storyController.getStoryViewers);

// Save story to highlight
router.post('/:storyId/highlight', authenticate, storyController.saveToHighlight);

// Delete story
router.delete('/:storyId', authenticate, storyController.deleteStory);

// ==================== Admin Routes ====================

// Get story cleanup statistics (Admin only)
router.get('/admin/cleanup/stats', authenticate, adminMiddleware, storyController.getCleanupStats);

// Manually trigger story cleanup (Admin only)
router.post('/admin/cleanup/trigger', authenticate, adminMiddleware, storyController.manualCleanup);

module.exports = router;
