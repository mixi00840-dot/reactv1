const Story = require('../models/Story');
const Notification = require('../models/Notification');

/**
 * Story Service
 * 
 * Handles 24-hour temporary content (stories), views tracking,
 * reactions, replies, and privacy controls.
 */

class StoryService {
  /**
   * Create a story
   */
  static async createStory(userId, storyData) {
    try {
      const story = await Story.create({
        user: userId,
        type: storyData.type,
        media: storyData.media,
        text: storyData.text,
        mentions: storyData.mentions,
        link: storyData.link,
        location: storyData.location,
        music: storyData.music,
        visibility: storyData.visibility || 'public',
        allowedViewers: storyData.allowedViewers,
        hiddenFrom: storyData.hiddenFrom
      });
      
      await story.populate('user', 'username avatar fullName');
      
      // Notify mentioned users
      if (storyData.mentions && storyData.mentions.length > 0) {
        for (const mention of storyData.mentions) {
          await Notification.create({
            user: mention.user,
            type: 'mention',
            actor: userId,
            relatedContent: {
              contentType: 'Story',
              contentId: story._id
            },
            title: 'Story Mention',
            body: `@${story.user.username} mentioned you in their story`
          });
        }
      }
      
      return story;
      
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }
  
  /**
   * View a story
   */
  static async viewStory(storyId, viewerId, duration = 0) {
    try {
      const story = await Story.findById(storyId);
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Check if viewer can view
      const canView = await story.canView(viewerId);
      
      if (!canView) {
        throw new Error('Not authorized to view this story');
      }
      
      // Add view
      await story.addView(viewerId, duration);
      
      // Notify story owner (only for close friends/specific viewers)
      if (story.visibility !== 'public' && 
          story.user.toString() !== viewerId.toString()) {
        await Notification.create({
          user: story.user,
          type: 'story_view',
          actor: viewerId,
          relatedContent: {
            contentType: 'Story',
            contentId: story._id
          },
          title: 'Story View',
          body: 'Someone viewed your story'
        });
      }
      
      return story;
      
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }
  
  /**
   * Get user's stories
   */
  static async getUserStories(userId) {
    try {
      const stories = await Story.getUserStories(userId);
      return stories;
      
    } catch (error) {
      console.error('Error getting user stories:', error);
      throw error;
    }
  }
  
  /**
   * Get stories feed
   */
  static async getStoriesFeed(userId, limit = 50) {
    try {
      const stories = await Story.getStoriesFeed(userId, limit);
      return stories;
      
    } catch (error) {
      console.error('Error getting stories feed:', error);
      throw error;
    }
  }
  
  /**
   * Add reaction to story
   */
  static async addReaction(storyId, userId, emoji) {
    try {
      const story = await Story.findById(storyId);
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Check if viewer can view
      const canView = await story.canView(userId);
      
      if (!canView) {
        throw new Error('Not authorized');
      }
      
      await story.addReaction(userId, emoji);
      
      // Notify story owner
      if (story.user.toString() !== userId.toString()) {
        await Notification.create({
          user: story.user,
          type: 'story_reply',
          actor: userId,
          relatedContent: {
            contentType: 'Story',
            contentId: story._id
          },
          title: 'Story Reaction',
          body: `Reacted ${emoji} to your story`
        });
      }
      
      return story;
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }
  
  /**
   * Reply to story
   */
  static async replyToStory(storyId, userId, text) {
    try {
      const story = await Story.findById(storyId);
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Check if viewer can view
      const canView = await story.canView(userId);
      
      if (!canView) {
        throw new Error('Not authorized');
      }
      
      await story.addReply(userId, text);
      
      // Notify story owner
      if (story.user.toString() !== userId.toString()) {
        await Notification.create({
          user: story.user,
          type: 'story_reply',
          actor: userId,
          relatedContent: {
            contentType: 'Story',
            contentId: story._id
          },
          title: 'Story Reply',
          body: `Replied to your story: ${text.substring(0, 50)}`
        });
      }
      
      return story;
      
    } catch (error) {
      console.error('Error replying to story:', error);
      throw error;
    }
  }
  
  /**
   * Delete story
   */
  static async deleteStory(storyId, userId) {
    try {
      const story = await Story.findById(storyId);
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Only owner can delete
      if (story.user.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      await Story.findByIdAndDelete(storyId);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
  
  /**
   * Get story viewers
   */
  static async getStoryViewers(storyId, userId) {
    try {
      const story = await Story.findById(storyId)
        .populate('views.user', 'username avatar fullName');
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Only owner can see viewers
      if (story.user.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      return story.views;
      
    } catch (error) {
      console.error('Error getting story viewers:', error);
      throw error;
    }
  }
  
  /**
   * Save story to highlight
   */
  static async saveToHighlight(storyId, userId, highlightId) {
    try {
      const story = await Story.findById(storyId);
      
      if (!story) {
        throw new Error('Story not found');
      }
      
      // Only owner can save
      if (story.user.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      await story.saveToHighlight(highlightId);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error saving to highlight:', error);
      throw error;
    }
  }
  
  /**
   * Clean up expired stories
   */
  static async cleanupExpiredStories() {
    try {
      const result = await Story.markExpired();
      console.log(`Marked ${result.modifiedCount} stories as expired`);
      
      return result;
      
    } catch (error) {
      console.error('Error cleaning up expired stories:', error);
      throw error;
    }
  }
}

module.exports = StoryService;
