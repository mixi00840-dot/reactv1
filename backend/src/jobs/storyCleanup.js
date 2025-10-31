const cron = require('node-cron');
const Story = require('../models/Story');
const uploadService = require('../services/uploadService');

/**
 * Story Auto-Expiry Cleanup Job
 * 
 * Automatically deletes expired stories (>24 hours old):
 * - Removes story documents from database
 * - Deletes media files from S3/R2 storage
 * - Cleans up analytics data
 * - Preserves stories saved to highlights
 * 
 * Schedule: Runs every hour at minute 0
 */

class StoryCleanupJob {
  constructor() {
    this.isRunning = false;
    this.stats = {
      lastRun: null,
      totalStoriesDeleted: 0,
      totalFilesDeleted: 0,
      totalBytesSaved: 0,
      errors: []
    };
  }

  /**
   * Initialize the cron job
   */
  initialize() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      await this.executeCleanup();
    });

    console.log('✅ Story cleanup cron job initialized (runs hourly)');

    // Optional: Run on startup if configured
    if (process.env.RUN_STORY_CLEANUP_ON_STARTUP === 'true') {
      console.log('🔄 Running initial story cleanup...');
      setTimeout(() => this.executeCleanup(), 5000);
    }
  }

  /**
   * Execute the cleanup process
   */
  async executeCleanup() {
    if (this.isRunning) {
      console.log('⏭️  Story cleanup already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const cleanupStats = {
      storiesFound: 0,
      storiesDeleted: 0,
      filesDeleted: 0,
      bytesSaved: 0,
      errors: []
    };

    try {
      console.log('🧹 Starting story cleanup...');

      // Find all expired stories that are not saved to highlights
      const expiredStories = await Story.find({
        status: { $in: ['active', 'expired'] },
        expiresAt: { $lte: new Date() },
        savedToHighlight: false
      }).select('storyId user type media views reactions replies stats createdAt expiresAt');

      cleanupStats.storiesFound = expiredStories.length;

      if (expiredStories.length === 0) {
        console.log('✅ No expired stories to clean up');
        this.isRunning = false;
        return cleanupStats;
      }

      console.log(`📊 Found ${expiredStories.length} expired stories to clean up`);

      // Process stories in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < expiredStories.length; i += batchSize) {
        const batch = expiredStories.slice(i, i + batchSize);
        await this.processBatch(batch, cleanupStats);
      }

      // Update global stats
      this.stats.lastRun = new Date();
      this.stats.totalStoriesDeleted += cleanupStats.storiesDeleted;
      this.stats.totalFilesDeleted += cleanupStats.filesDeleted;
      this.stats.totalBytesSaved += cleanupStats.bytesSaved;
      this.stats.errors.push(...cleanupStats.errors);

      // Keep only last 100 errors
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Story cleanup completed in ${duration}s`);
      console.log(`   - Stories deleted: ${cleanupStats.storiesDeleted}`);
      console.log(`   - Files deleted: ${cleanupStats.filesDeleted}`);
      console.log(`   - Space saved: ${this.formatBytes(cleanupStats.bytesSaved)}`);
      console.log(`   - Errors: ${cleanupStats.errors.length}`);

    } catch (error) {
      console.error('❌ Story cleanup failed:', error);
      cleanupStats.errors.push({
        timestamp: new Date(),
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.isRunning = false;
    }

    return cleanupStats;
  }

  /**
   * Process a batch of stories
   */
  async processBatch(stories, stats) {
    for (const story of stories) {
      try {
        // Delete media file from storage if exists
        if (story.media && story.media.key) {
          try {
            await uploadService.deleteFile(story.media.key);
            stats.filesDeleted++;
            stats.bytesSaved += story.media.size || 0;
          } catch (error) {
            console.error(`Failed to delete file ${story.media.key}:`, error.message);
            stats.errors.push({
              timestamp: new Date(),
              storyId: story.storyId,
              error: `File deletion failed: ${error.message}`,
              key: story.media.key
            });
          }
        }

        // Delete thumbnail if exists
        if (story.media && story.media.thumbnailUrl) {
          const thumbnailKey = this.extractKeyFromUrl(story.media.thumbnailUrl);
          if (thumbnailKey) {
            try {
              await uploadService.deleteFile(thumbnailKey);
              stats.filesDeleted++;
            } catch (error) {
              console.error(`Failed to delete thumbnail ${thumbnailKey}:`, error.message);
            }
          }
        }

        // Delete the story document
        await Story.deleteOne({ _id: story._id });
        stats.storiesDeleted++;

        // Optional: Send notifications to viewers about expired story
        // This can be implemented based on your notification system
        // await this.notifyViewersStoryExpired(story);

      } catch (error) {
        console.error(`Failed to process story ${story.storyId}:`, error.message);
        stats.errors.push({
          timestamp: new Date(),
          storyId: story.storyId,
          error: error.message
        });
      }
    }
  }

  /**
   * Extract S3/R2 key from full URL
   */
  extractKeyFromUrl(url) {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      // Remove leading slash from pathname
      return urlObj.pathname.substring(1);
    } catch (error) {
      // If not a valid URL, might already be a key
      return url;
    }
  }

  /**
   * Optional: Notify viewers that a story has expired
   */
  async notifyViewersStoryExpired(story) {
    // Implementation depends on your notification system
    // Example structure:
    /*
    const viewerIds = story.views.map(v => v.user);
    const uniqueViewers = [...new Set(viewerIds.map(id => id.toString()))];
    
    for (const viewerId of uniqueViewers) {
      await notificationService.create({
        recipient: viewerId,
        type: 'story_expired',
        data: {
          storyId: story.storyId,
          userId: story.user,
          message: 'A story you viewed has expired'
        }
      });
    }
    */
  }

  /**
   * Mark expired stories (without deleting)
   * Useful for archival purposes
   */
  async markExpiredStories() {
    try {
      const result = await Story.updateMany(
        {
          status: 'active',
          expiresAt: { $lte: new Date() },
          savedToHighlight: false
        },
        {
          $set: { status: 'expired' }
        }
      );

      console.log(`Marked ${result.modifiedCount} stories as expired`);
      return result;
    } catch (error) {
      console.error('Failed to mark expired stories:', error);
      throw error;
    }
  }

  /**
   * Clean up old analytics data (optional)
   */
  async cleanupOldAnalytics(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Remove view/reaction/reply data from stories older than X days
      const result = await Story.updateMany(
        {
          createdAt: { $lte: cutoffDate }
        },
        {
          $set: {
            views: [],
            reactions: [],
            replies: []
          }
        }
      );

      console.log(`Cleaned analytics data from ${result.modifiedCount} old stories`);
      return result;
    } catch (error) {
      console.error('Failed to clean old analytics:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: this.stats.lastRun ? Date.now() - this.stats.lastRun.getTime() : 0
    };
  }

  /**
   * Manually trigger cleanup (for admin use)
   */
  async manualCleanup() {
    console.log('🔧 Manual story cleanup triggered');
    return await this.executeCleanup();
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const storyCleanupJob = new StoryCleanupJob();

/**
 * Initialize the story cleanup cron job
 */
function initializeStoryCleanup() {
  storyCleanupJob.initialize();
}

/**
 * Get cleanup statistics
 */
function getCleanupStats() {
  return storyCleanupJob.getStats();
}

/**
 * Manually trigger cleanup
 */
function triggerManualCleanup() {
  return storyCleanupJob.manualCleanup();
}

module.exports = {
  initializeStoryCleanup,
  getCleanupStats,
  triggerManualCleanup,
  storyCleanupJob
};
