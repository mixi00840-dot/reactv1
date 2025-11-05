const express = require('express');
const router = express.Router();
const { authenticate, adminMiddleware } = require('../middleware/auth');
const storiesHelpers = require('../utils/storiesHelpers');

/**
 * Story Routes - Firestore Implementation
 * All routes require authentication
 */

// Get stories statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await storiesHelpers.getStoriesStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting stories stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all active stories
router.get('/', async (req, res) => {
  try {
    const { limit = 100, status = 'active' } = req.query;
    const stories = await storiesHelpers.getAllActiveStories({ 
      limit: parseInt(limit),
      status
    });
    res.json({ success: true, data: { stories, count: stories.length } });
  } catch (error) {
    console.error('Error getting active stories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create story
router.post('/', authenticate, async (req, res) => {
  try {
    const story = await storiesHelpers.createStory({
      userId: req.user.uid,
      ...req.body
    });
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stories feed (following users)
router.get('/feed', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    // Get user's following list from Firestore
    const userDoc = await require('./database').collection('users').doc(req.user.uid).get();
    const following = userDoc.data()?.following || [];
    
    const stories = await storiesHelpers.getStoriesFeed(req.user.uid, following, { limit: parseInt(limit) });
    res.json({ success: true, data: { stories } });
  } catch (error) {
    console.error('Error getting stories feed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user stories
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const stories = await storiesHelpers.getUserStories(userId, { limit: parseInt(limit) });
    res.json({ success: true, data: { stories } });
  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// View story
router.post('/:storyId/view', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    await storiesHelpers.viewStory(storyId, req.user.uid);
    res.json({ success: true, message: 'Story viewed' });
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add reaction to story
router.post('/:storyId/reactions', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { type } = req.body;
    const result = await storiesHelpers.addReaction(storyId, req.user.uid, type);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reply to story
router.post('/:storyId/replies', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { message } = req.body;
    const result = await storiesHelpers.replyToStory(storyId, req.user.uid, message);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get story viewers
router.get('/:storyId/viewers', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    const viewers = await storiesHelpers.getStoryViewers(storyId);
    res.json({ success: true, data: { viewers } });
  } catch (error) {
    console.error('Error getting story viewers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save story to highlight
router.post('/:storyId/highlight', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { name } = req.body;
    const result = await storiesHelpers.saveToHighlight(storyId, req.user.uid, name);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving to highlight:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete story
router.delete('/:storyId', authenticate, async (req, res) => {
  try {
    const { storyId } = req.params;
    await storiesHelpers.deleteStory(storyId);
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== Admin Routes ====================

// Get story cleanup statistics (Admin only)
router.get('/admin/cleanup/stats', authenticate, adminMiddleware, async (req, res) => {
  try {
    const stats = await storiesHelpers.getCleanupStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manually trigger story cleanup (Admin only)
router.post('/admin/cleanup/trigger', authenticate, adminMiddleware, async (req, res) => {
  try {
    const result = await storiesHelpers.manualCleanup();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error triggering cleanup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
