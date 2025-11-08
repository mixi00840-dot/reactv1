const ScheduledContent = require('../models/ScheduledContent');
const Content = require('../models/Content');
const Livestream = require('../models/Livestream');
const Story = require('../models/Story');
const notificationService = require('./notificationService');

class SchedulingService {
  async scheduleContent(userId, contentData, scheduledFor) {
    try {
      const scheduledContent = new ScheduledContent({
        creator: userId,
        contentType: contentData.contentType,
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
        content: contentData,
        timezone: contentData.timezone || 'UTC'
      });

      await scheduledContent.save();

      console.log(`Content scheduled for ${scheduledFor} by user ${userId}`);

      return scheduledContent;
    } catch (error) {
      console.error('Error scheduling content:', error);
      throw error;
    }
  }

  async scheduleLivestream(userId, livestreamData, scheduledFor) {
    try {
      const scheduledContent = new ScheduledContent({
        creator: userId,
        contentType: 'livestream',
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
        livestreamConfig: {
          streamTitle: livestreamData.title,
          streamDescription: livestreamData.description,
          streamKey: livestreamData.streamKey,
          notifyFollowers: livestreamData.notifyFollowers !== false
        },
        timezone: livestreamData.timezone || 'UTC'
      });

      await scheduledContent.save();

      console.log(`Livestream scheduled for ${scheduledFor} by user ${userId}`);

      return scheduledContent;
    } catch (error) {
      console.error('Error scheduling livestream:', error);
      throw error;
    }
  }

  async processScheduledContent() {
    try {
      const now = new Date();

      // Find content scheduled for now or past
      const scheduledItems = await ScheduledContent.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).populate('creator', 'username followers');

      console.log(`Processing ${scheduledItems.length} scheduled items...`);

      for (const item of scheduledItems) {
        try {
          // Mark as publishing
          item.status = 'publishing';
          await item.save();

          let publishedContent;

          switch (item.contentType) {
            case 'video':
              publishedContent = await this.publishVideo(item);
              break;
            case 'livestream':
              publishedContent = await this.startScheduledLivestream(item);
              break;
            case 'story':
              publishedContent = await this.publishStory(item);
              break;
            case 'post':
              publishedContent = await this.publishPost(item);
              break;
            default:
              throw new Error(`Unknown content type: ${item.contentType}`);
          }

          // Update status
          item.status = 'published';
          item.publishedContentId = publishedContent._id;
          item.publishedAt = new Date();
          await item.save();

          console.log(`Published scheduled ${item.contentType} ${publishedContent._id}`);

        } catch (error) {
          console.error(`Error publishing scheduled content ${item._id}:`, error);
          
          item.status = 'failed';
          item.error = error.message;
          item.retryCount += 1;
          await item.save();

          // Retry logic
          if (item.retryCount < 3) {
            console.log(`Will retry publishing ${item._id}...`);
            item.status = 'scheduled';
            item.scheduledFor = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
            await item.save();
          }
        }
      }

      return {
        processed: scheduledItems.length,
        successful: scheduledItems.filter(i => i.status === 'published').length,
        failed: scheduledItems.filter(i => i.status === 'failed').length
      };

    } catch (error) {
      console.error('Error processing scheduled content:', error);
      throw error;
    }
  }

  async publishVideo(scheduledItem) {
    const { content } = scheduledItem;

    const video = new Content({
      creator: scheduledItem.creator._id,
      title: content.title,
      description: content.description,
      videoUrl: content.videoUrl,
      thumbnailUrl: content.thumbnailUrl,
      tags: content.tags || [],
      category: content.category,
      visibility: content.visibility || 'public',
      allowComments: content.allowComments !== false,
      allowDuet: content.allowDuet !== false,
      status: 'active',
      scheduledPublish: true
    });

    await video.save();

    // Notify followers if public
    if (content.visibility === 'public') {
      await this.notifyFollowers(scheduledItem.creator, 'video', video);
    }

    return video;
  }

  async startScheduledLivestream(scheduledItem) {
    const { livestreamConfig } = scheduledItem;

    const livestream = new Livestream({
      host: scheduledItem.creator._id,
      title: livestreamConfig.streamTitle,
      description: livestreamConfig.streamDescription,
      streamKey: livestreamConfig.streamKey,
      status: 'live',
      isScheduled: true,
      startedAt: new Date()
    });

    await livestream.save();

    // Notify followers about livestream
    if (livestreamConfig.notifyFollowers) {
      await this.notifyFollowers(scheduledItem.creator, 'livestream', livestream);
    }

    return livestream;
  }

  async publishStory(scheduledItem) {
    const { content } = scheduledItem;

    const story = new Story({
      user: scheduledItem.creator._id,
      mediaUrl: content.videoUrl || content.imageUrl,
      mediaType: content.videoUrl ? 'video' : 'image',
      caption: content.description,
      visibility: content.visibility || 'public'
    });

    await story.save();

    return story;
  }

  async publishPost(scheduledItem) {
    const { content } = scheduledItem;

    const post = new Content({
      creator: scheduledItem.creator._id,
      title: content.title,
      description: content.description,
      type: 'post',
      visibility: content.visibility || 'public',
      status: 'active'
    });

    await post.save();

    return post;
  }

  async notifyFollowers(creator, contentType, content) {
    try {
      if (!creator.followers || creator.followers.length === 0) {
        return;
      }

      let message = '';
      let link = '';

      switch (contentType) {
        case 'video':
          message = `${creator.username} just posted a new video!`;
          link = `/content/${content._id}`;
          break;
        case 'livestream':
          message = `${creator.username} is now live! Join the stream!`;
          link = `/livestream/${content._id}`;
          break;
        case 'story':
          message = `${creator.username} posted a new story`;
          link = `/stories/${creator._id}`;
          break;
        default:
          message = `${creator.username} posted something new`;
      }

      // Send notifications to followers
      await notificationService.sendBulkNotifications({
        recipients: creator.followers,
        title: 'New Content',
        message: message,
        link: link,
        type: 'new_content'
      });

    } catch (error) {
      console.error('Error notifying followers:', error);
    }
  }

  async sendScheduledReminders() {
    try {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const now = new Date();

      // Find livestreams scheduled in the next hour
      const upcomingStreams = await ScheduledContent.find({
        contentType: 'livestream',
        status: 'scheduled',
        scheduledFor: { $gte: now, $lte: oneHourFromNow },
        'livestreamConfig.reminderSent': false,
        'livestreamConfig.notifyFollowers': true
      }).populate('creator', 'username followers');

      console.log(`Sending reminders for ${upcomingStreams.length} upcoming streams...`);

      for (const stream of upcomingStreams) {
        try {
          await this.notifyFollowers(
            stream.creator,
            'livestream_reminder',
            {
              title: stream.livestreamConfig.streamTitle,
              scheduledFor: stream.scheduledFor
            }
          );

          stream.livestreamConfig.reminderSent = true;
          await stream.save();

        } catch (error) {
          console.error(`Error sending reminder for stream ${stream._id}:`, error);
        }
      }

      return { remindersSent: upcomingStreams.length };

    } catch (error) {
      console.error('Error sending scheduled reminders:', error);
      throw error;
    }
  }

  async getScheduledContent(userId, options = {}) {
    try {
      const query = { creator: userId };

      if (options.status) {
        query.status = options.status;
      }

      if (options.contentType) {
        query.contentType = options.contentType;
      }

      const scheduledItems = await ScheduledContent.find(query)
        .sort({ scheduledFor: 1 })
        .limit(options.limit || 50);

      return scheduledItems;

    } catch (error) {
      console.error('Error getting scheduled content:', error);
      throw error;
    }
  }

  async cancelScheduledContent(scheduledId, userId) {
    try {
      const scheduledItem = await ScheduledContent.findOne({
        _id: scheduledId,
        creator: userId
      });

      if (!scheduledItem) {
        throw new Error('Scheduled content not found');
      }

      if (scheduledItem.status === 'published') {
        throw new Error('Cannot cancel already published content');
      }

      scheduledItem.status = 'cancelled';
      await scheduledItem.save();

      console.log(`Cancelled scheduled content ${scheduledId}`);

      return scheduledItem;

    } catch (error) {
      console.error('Error cancelling scheduled content:', error);
      throw error;
    }
  }
}

module.exports = new SchedulingService();
