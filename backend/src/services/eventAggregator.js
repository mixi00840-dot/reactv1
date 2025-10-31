const ViewEvent = require('../models/ViewEvent');
const ContentMetrics = require('../models/ContentMetrics');
const Content = require('../models/Content');

/**
 * Event Aggregation Service
 * 
 * Processes raw ViewEvents and aggregates them into ContentMetrics.
 * Runs periodically (every 1-5 minutes) to keep metrics up to date.
 * 
 * This service is crucial for:
 * - Real-time analytics
 * - Trending detection
 * - Recommendation engine data
 * - Creator insights
 */

class EventAggregator {
  constructor() {
    this.isProcessing = false;
    this.batchSize = 1000;
  }

  /**
   * Process unprocessed events and aggregate into metrics
   */
  async processEvents() {
    if (this.isProcessing) {
      console.log('⏭️  Event processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Starting event aggregation...');

    try {
      // Get unprocessed events
      const events = await ViewEvent.getUnprocessed(this.batchSize);
      
      if (events.length === 0) {
        console.log('✅ No events to process');
        return { processed: 0 };
      }

      console.log(`📊 Processing ${events.length} events...`);

      // Group events by contentId for efficient processing
      const eventsByContent = this.groupEventsByContent(events);

      let processedCount = 0;
      const contentIds = Object.keys(eventsByContent);

      for (const contentId of contentIds) {
        try {
          await this.aggregateContentEvents(contentId, eventsByContent[contentId]);
          processedCount += eventsByContent[contentId].length;
        } catch (error) {
          console.error(`❌ Error processing content ${contentId}:`, error.message);
        }
      }

      // Mark events as processed
      const eventIds = events.map(e => e._id);
      await ViewEvent.markProcessed(eventIds);

      console.log(`✅ Processed ${processedCount} events for ${contentIds.length} content items`);

      return {
        processed: processedCount,
        contentCount: contentIds.length
      };
    } catch (error) {
      console.error('❌ Event processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group events by contentId
   */
  groupEventsByContent(events) {
    return events.reduce((acc, event) => {
      const contentId = event.contentId.toString();
      if (!acc[contentId]) {
        acc[contentId] = [];
      }
      acc[contentId].push(event);
      return acc;
    }, {});
  }

  /**
   * Aggregate events for a specific content
   */
  async aggregateContentEvents(contentId, events) {
    // Get or create metrics
    const metrics = await ContentMetrics.getOrCreate(contentId);
    
    // Process each event type
    for (const event of events) {
      await this.processEvent(metrics, event);
    }

    // Recalculate derived metrics
    await metrics.recalculate();
    
    // Save metrics
    await metrics.save();
  }

  /**
   * Process individual event
   */
  async processEvent(metrics, event) {
    const now = new Date();
    const hour = now.getHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (event.eventType) {
      case 'impression':
        metrics.impressions.total++;
        break;

      case 'view_start':
        // Increment view counters
        metrics.views.total++;
        
        // Track source
        if (event.source?.type) {
          const sourceType = event.source.type;
          if (metrics.views[sourceType] !== undefined) {
            metrics.views[sourceType]++;
          } else {
            metrics.views.other++;
          }
        }

        // Track if it's a feed view (impression converted)
        metrics.impressions.feedViews++;

        // Track device
        if (event.device?.type) {
          const deviceType = event.device.type;
          if (metrics.devices[deviceType] !== undefined) {
            metrics.devices[deviceType]++;
          }
        }

        // Track platform
        if (event.device?.platform) {
          const platform = event.device.platform;
          if (metrics.platforms[platform] !== undefined) {
            metrics.platforms[platform]++;
          }
        }

        // Add to time distribution
        metrics.addHourlyData(hour, 1, 0);
        metrics.addDailyData(today, { views: 1, uniqueViewers: 0 });

        break;

      case 'view_progress':
        // Update watch time
        if (event.viewData?.watchTime) {
          metrics.watchTime.total += event.viewData.watchTime;
        }

        // Track completion buckets
        if (event.viewData?.completionPercent !== undefined) {
          const percent = event.viewData.completionPercent;
          if (percent >= 100) {
            metrics.completion.full++;
          } else if (percent >= 75) {
            metrics.completion.over75++;
          } else if (percent >= 50) {
            metrics.completion.over50++;
          } else if (percent >= 25) {
            metrics.completion.over25++;
          } else {
            metrics.completion.under25++;
          }
        }

        // Track loop plays
        if (event.viewData?.loopCount > 0) {
          metrics.rewatch.loopPlays += event.viewData.loopCount;
        }

        break;

      case 'view_complete':
        metrics.completion.full++;
        
        if (event.viewData?.totalWatchTime) {
          metrics.watchTime.total += event.viewData.totalWatchTime;
        }

        // Add to daily watch time
        metrics.addDailyData(today, { 
          watchTime: event.viewData?.totalWatchTime || 0 
        });

        break;

      case 'swipe_away':
        metrics.impressions.swipedAway++;
        break;

      case 'like':
        metrics.engagement.likes++;
        
        // Add to time distribution
        metrics.addHourlyData(hour, 0, 1);
        metrics.addDailyData(today, { likes: 1 });
        
        break;

      case 'unlike':
        if (metrics.engagement.likes > 0) {
          metrics.engagement.likes--;
        }
        break;

      case 'comment':
        metrics.engagement.comments++;
        
        metrics.addHourlyData(hour, 0, 1);
        metrics.addDailyData(today, { comments: 1 });
        
        break;

      case 'share':
        metrics.engagement.shares++;
        
        metrics.addHourlyData(hour, 0, 1);
        metrics.addDailyData(today, { shares: 1 });
        
        break;

      case 'save':
        metrics.engagement.saves++;
        metrics.addHourlyData(hour, 0, 1);
        break;

      case 'unsave':
        if (metrics.engagement.saves > 0) {
          metrics.engagement.saves--;
        }
        break;

      case 'report':
        metrics.interactions.reports++;
        break;

      case 'not_interested':
        metrics.interactions.notInterested++;
        break;

      case 'hide':
        metrics.interactions.hides++;
        break;

      case 'unfollow':
        metrics.interactions.unfollows++;
        break;

      default:
        // Unknown event type, log and skip
        console.warn(`⚠️  Unknown event type: ${event.eventType}`);
    }

    // Track demographics
    if (event.location?.country) {
      this.updateDemographics(metrics, 'topCountries', 'country', event.location.country);
    }

    if (event.location?.city && event.location?.country) {
      this.updateCityDemographics(metrics, event.location.city, event.location.country);
    }
  }

  /**
   * Update demographics array
   */
  updateDemographics(metrics, arrayName, keyField, value) {
    const array = metrics.demographics[arrayName];
    const existing = array.find(item => item[keyField] === value);

    if (existing) {
      existing.count++;
    } else {
      const newItem = { count: 1 };
      newItem[keyField] = value;
      array.push(newItem);
    }

    // Keep only top 20 and sort by count
    if (array.length > 20) {
      array.sort((a, b) => b.count - a.count);
      metrics.demographics[arrayName] = array.slice(0, 20);
    }
  }

  /**
   * Update city demographics
   */
  updateCityDemographics(metrics, city, country) {
    const existing = metrics.demographics.topCities.find(
      item => item.city === city && item.country === country
    );

    if (existing) {
      existing.count++;
    } else {
      metrics.demographics.topCities.push({ city, country, count: 1 });
    }

    // Keep only top 20
    if (metrics.demographics.topCities.length > 20) {
      metrics.demographics.topCities.sort((a, b) => b.count - a.count);
      metrics.demographics.topCities = metrics.demographics.topCities.slice(0, 20);
    }
  }

  /**
   * Calculate unique viewers from events
   * This is more expensive, so run periodically (e.g., every hour)
   */
  async updateUniqueViewers(contentId) {
    const uniqueUsers = await ViewEvent.distinct('userId', {
      contentId,
      eventType: 'view_start'
    });

    const metrics = await ContentMetrics.getOrCreate(contentId);
    metrics.views.unique = uniqueUsers.length;
    
    await metrics.save();

    return uniqueUsers.length;
  }

  /**
   * Batch update unique viewers for multiple content items
   */
  async batchUpdateUniqueViewers(contentIds) {
    console.log(`🔢 Updating unique viewers for ${contentIds.length} content items...`);

    for (const contentId of contentIds) {
      try {
        await this.updateUniqueViewers(contentId);
      } catch (error) {
        console.error(`❌ Error updating unique viewers for ${contentId}:`, error.message);
      }
    }

    console.log('✅ Unique viewers updated');
  }

  /**
   * Calculate average watch time (expensive, run hourly)
   */
  async updateAverageWatchTime(contentId) {
    const result = await ViewEvent.getAverageWatchTime(contentId);
    
    const metrics = await ContentMetrics.getOrCreate(contentId);
    metrics.watchTime.average = Math.round(result.avgWatchTime);
    
    await metrics.save();

    return result.avgWatchTime;
  }

  /**
   * Full metrics recalculation (run daily)
   */
  async recalculateAllMetrics(contentIds = null) {
    console.log('🔄 Starting full metrics recalculation...');

    // Get content IDs to process
    if (!contentIds) {
      const recentContent = await Content.find({
        status: 'ready',
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      }).select('_id');
      
      contentIds = recentContent.map(c => c._id);
    }

    console.log(`📊 Recalculating metrics for ${contentIds.length} content items...`);

    for (const contentId of contentIds) {
      try {
        const metrics = await ContentMetrics.getOrCreate(contentId);
        
        // Update unique viewers
        await this.updateUniqueViewers(contentId);
        
        // Update average watch time
        await this.updateAverageWatchTime(contentId);
        
        // Recalculate all derived metrics
        await metrics.recalculate();
        await metrics.save();
        
      } catch (error) {
        console.error(`❌ Error recalculating metrics for ${contentId}:`, error.message);
      }
    }

    console.log('✅ Full recalculation complete');
  }
}

// Singleton instance
const eventAggregator = new EventAggregator();

// Export both the class and singleton
module.exports = {
  EventAggregator,
  eventAggregator
};
