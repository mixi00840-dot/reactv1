const StoryService = require('../services/storyService');

/**
 * Story Controller
 * 
 * Handles HTTP requests for story features
 */

exports.createStory = async (req, res) => {
  try {
    const { type, media, text, mentions, link, location, music, visibility, allowedViewers, hiddenFrom } = req.body;
    
    const story = await StoryService.createStory(req.user._id, {
      type,
      media,
      text,
      mentions,
      link,
      location,
      music,
      visibility,
      allowedViewers,
      hiddenFrom
    });
    
    res.status(201).json({
      success: true,
      story
    });
    
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { duration = 0 } = req.body;
    
    const story = await StoryService.viewStory(
      storyId,
      req.user._id,
      duration
    );
    
    res.json({
      success: true,
      story
    });
    
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stories = await StoryService.getUserStories(userId);
    
    res.json({
      success: true,
      stories
    });
    
  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStoriesFeed = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const stories = await StoryService.getStoriesFeed(
      req.user._id,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      stories
    });
    
  } catch (error) {
    console.error('Error getting stories feed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { emoji } = req.body;
    
    const story = await StoryService.addReaction(
      storyId,
      req.user._id,
      emoji
    );
    
    res.json({
      success: true,
      story
    });
    
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.replyToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Reply text required'
      });
    }
    
    const story = await StoryService.replyToStory(
      storyId,
      req.user._id,
      text
    );
    
    res.json({
      success: true,
      story
    });
    
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    await StoryService.deleteStory(storyId, req.user._id);
    
    res.json({
      success: true,
      message: 'Story deleted'
    });
    
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStoryViewers = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const viewers = await StoryService.getStoryViewers(
      storyId,
      req.user._id
    );
    
    res.json({
      success: true,
      viewers
    });
    
  } catch (error) {
    console.error('Error getting story viewers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.saveToHighlight = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { highlightId } = req.body;
    
    await StoryService.saveToHighlight(
      storyId,
      req.user._id,
      highlightId
    );
    
    res.json({
      success: true,
      message: 'Story saved to highlight'
    });
    
  } catch (error) {
    console.error('Error saving to highlight:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== Admin Cleanup Endpoints ====================

/**
 * Get story cleanup statistics (Admin only)
 */
exports.getCleanupStats = async (req, res) => {
  try {
    const { getCleanupStats } = require('../jobs/storyCleanup');
    const stats = getCleanupStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Manually trigger story cleanup (Admin only)
 */
exports.manualCleanup = async (req, res) => {
  try {
    const { triggerManualCleanup } = require('../jobs/storyCleanup');
    const results = await triggerManualCleanup();
    
    res.json({
      success: true,
      message: 'Story cleanup completed',
      results
    });
    
  } catch (error) {
    console.error('Error triggering manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
