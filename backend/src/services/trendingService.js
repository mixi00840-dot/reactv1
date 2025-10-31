const TrendingRecord = require('../models/TrendingRecord');
const ContentMetrics = require('../models/ContentMetrics');
const Content = require('../models/Content');
const ViewEvent = require('../models/ViewEvent');

/**
 * Trending Service
 * 
 * Manages trending content detection, explore feed generation,
 * and geographic/category-based trending.
 */

class TrendingService {
  /**
   * Update trending records for content
   */
  static async updateTrending(contentId, options = {}) {
    try {
      const {
        timeWindows = ['24h', '7d'],
        detectGeographic = true,
        detectCategory = true
      } = options;
      
      // Get content metrics
      const metrics = await ContentMetrics.findOne({ content: contentId });
      if (!metrics) return null;
      
      const content = await Content.findById(contentId);
      if (!content || content.status !== 'published') return null;
      
      const results = [];
      
      // Update global trending for each time window
      for (const window of timeWindows) {
        const result = await this.updateGlobalTrending(content, metrics, window);
        if (result) results.push(result);
      }
      
      // Update geographic trending
      if (detectGeographic && metrics.demographics.topCountries.length > 0) {
        for (const country of metrics.demographics.topCountries.slice(0, 3)) {
          const result = await this.updateGeographicTrending(content, metrics, country.code);
          if (result) results.push(result);
        }
      }
      
      // Update category trending
      if (detectCategory && content.category) {
        const result = await this.updateCategoryTrending(content, metrics, content.category);
        if (result) results.push(result);
      }
      
      // Update hashtag trending
      if (content.hashtags && content.hashtags.length > 0) {
        for (const hashtag of content.hashtags.slice(0, 3)) {
          const result = await this.updateHashtagTrending(content, metrics, hashtag);
          if (result) results.push(result);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error updating trending:', error);
      throw error;
    }
  }
  
  /**
   * Update global trending record
   */
  static async updateGlobalTrending(content, metrics, timeWindow) {
    const query = {
      content: content._id,
      trendingType: 'global',
      timeWindow
    };
    
    let record = await TrendingRecord.findOne(query);
    
    // Check if content qualifies for trending
    const minViews = this.getMinViewsForWindow(timeWindow);
    if (metrics.totalViews < minViews) {
      return null;
    }
    
    if (!record) {
      record = new TrendingRecord({
        ...query,
        period: {
          startedAt: new Date(),
          expiresAt: this.getExpirationDate(timeWindow)
        }
      });
    }
    
    // Update metrics
    const currentMetrics = {
      views: this.getViewsForWindow(metrics, timeWindow),
      likes: metrics.totalLikes,
      shares: metrics.totalShares,
      comments: metrics.totalComments
    };
    
    await record.updateMetrics(currentMetrics);
    await record.addToHistory();
    
    return record;
  }
  
  /**
   * Update geographic trending
   */
  static async updateGeographicTrending(content, metrics, countryCode) {
    const query = {
      content: content._id,
      trendingType: 'geographic',
      'geography.country': countryCode
    };
    
    let record = await TrendingRecord.findOne(query);
    
    if (!record) {
      record = new TrendingRecord({
        content: content._id,
        trendingType: 'geographic',
        geography: { country: countryCode },
        timeWindow: '24h',
        period: {
          startedAt: new Date(),
          expiresAt: this.getExpirationDate('24h')
        }
      });
    }
    
    // Get country-specific views
    const countryData = metrics.demographics.topCountries.find(c => c.code === countryCode);
    const countryViews = countryData ? countryData.views : 0;
    
    await record.updateMetrics({
      views: countryViews,
      likes: Math.floor(metrics.totalLikes * (countryData?.percentage || 0) / 100),
      shares: Math.floor(metrics.totalShares * (countryData?.percentage || 0) / 100),
      comments: Math.floor(metrics.totalComments * (countryData?.percentage || 0) / 100)
    });
    
    return record;
  }
  
  /**
   * Update category trending
   */
  static async updateCategoryTrending(content, metrics, category) {
    const query = {
      content: content._id,
      trendingType: 'category',
      category
    };
    
    let record = await TrendingRecord.findOne(query);
    
    if (!record) {
      record = new TrendingRecord({
        ...query,
        timeWindow: '24h',
        period: {
          startedAt: new Date(),
          expiresAt: this.getExpirationDate('24h')
        }
      });
    }
    
    await record.updateMetrics({
      views: metrics.totalViews,
      likes: metrics.totalLikes,
      shares: metrics.totalShares,
      comments: metrics.totalComments
    });
    
    return record;
  }
  
  /**
   * Update hashtag trending
   */
  static async updateHashtagTrending(content, metrics, hashtag) {
    const query = {
      content: content._id,
      trendingType: 'hashtag',
      hashtag: hashtag.toLowerCase()
    };
    
    let record = await TrendingRecord.findOne(query);
    
    if (!record) {
      record = new TrendingRecord({
        ...query,
        timeWindow: '24h',
        period: {
          startedAt: new Date(),
          expiresAt: this.getExpirationDate('24h')
        }
      });
    }
    
    await record.updateMetrics({
      views: metrics.totalViews,
      likes: metrics.totalLikes,
      shares: metrics.totalShares,
      comments: metrics.totalComments
    });
    
    return record;
  }
  
  /**
   * Generate Explore feed
   */
  static async generateExploreFeed(userId, options = {}) {
    const {
      limit = 20,
      categories = [],
      includeGlobal = true,
      includeGeographic = false,
      country = null
    } = options;
    
    const exploreFeed = [];
    
    // Get global trending
    if (includeGlobal) {
      const globalTrending = await TrendingRecord.getGlobalTrending('24h', Math.floor(limit / 2));
      exploreFeed.push(...globalTrending.map(record => ({
        ...record.toObject(),
        exploreType: 'global_trending'
      })));
    }
    
    // Get geographic trending
    if (includeGeographic && country) {
      const geoTrending = await TrendingRecord.getTrendingByCountry(country, Math.floor(limit / 4));
      exploreFeed.push(...geoTrending.map(record => ({
        ...record.toObject(),
        exploreType: 'local_trending'
      })));
    }
    
    // Get category trending
    if (categories.length > 0) {
      for (const category of categories) {
        const categoryTrending = await TrendingRecord.getTrendingByCategory(category, 5);
        exploreFeed.push(...categoryTrending.map(record => ({
          ...record.toObject(),
          exploreType: 'category_trending',
          categoryName: category
        })));
      }
    }
    
    // Get featured content
    const featured = await TrendingRecord.getFeatured(5);
    exploreFeed.push(...featured.map(record => ({
      ...record.toObject(),
      exploreType: 'featured'
    })));
    
    // Deduplicate by content ID
    const seen = new Set();
    const deduped = exploreFeed.filter(item => {
      const contentId = item.content._id.toString();
      if (seen.has(contentId)) return false;
      seen.add(contentId);
      return true;
    });
    
    // Sort by score and take top N
    deduped.sort((a, b) => b.scores.overall - a.scores.overall);
    
    return {
      feed: deduped.slice(0, limit),
      count: deduped.length,
      timestamp: new Date()
    };
  }
  
  /**
   * Get trending hashtags
   */
  static async getTrendingHashtags(limit = 20) {
    const hashtags = await TrendingRecord.aggregate([
      {
        $match: {
          trendingType: 'hashtag',
          status: { $in: ['trending', 'peak', 'rising'] },
          'period.expiresAt': { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$hashtag',
          totalScore: { $sum: '$scores.overall' },
          contentCount: { $sum: 1 },
          totalViews: { $sum: '$metrics.current.views' },
          avgScore: { $avg: '$scores.overall' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit }
    ]);
    
    return hashtags.map(h => ({
      hashtag: h._id,
      score: h.avgScore,
      contentCount: h.contentCount,
      views: h.totalViews
    }));
  }
  
  /**
   * Batch update trending for all eligible content
   */
  static async batchUpdateTrending(options = {}) {
    const { limit = 100, minViews = 100 } = options;
    
    // Get content with sufficient views
    const eligibleContent = await ContentMetrics.find({
      totalViews: { $gte: minViews },
      lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ totalViews: -1 })
    .limit(limit)
    .select('content');
    
    const results = [];
    
    for (const metrics of eligibleContent) {
      try {
        const result = await this.updateTrending(metrics.content);
        if (result) results.push(...result);
      } catch (error) {
        console.error(`Error updating trending for ${metrics.content}:`, error);
      }
    }
    
    return {
      processed: eligibleContent.length,
      updated: results.length,
      results
    };
  }
  
  /**
   * Helper: Get minimum views for time window
   */
  static getMinViewsForWindow(timeWindow) {
    const thresholds = {
      '1h': 100,
      '6h': 500,
      '24h': 1000,
      '7d': 5000,
      '30d': 10000
    };
    
    return thresholds[timeWindow] || 1000;
  }
  
  /**
   * Helper: Get views for specific time window
   */
  static getViewsForWindow(metrics, timeWindow) {
    const mapping = {
      '1h': metrics.viewsLastHour,
      '6h': metrics.viewsLast6Hours,
      '24h': metrics.viewsLast24Hours,
      '7d': metrics.viewsLast7Days,
      '30d': metrics.viewsLast30Days
    };
    
    return mapping[timeWindow] || metrics.totalViews;
  }
  
  /**
   * Helper: Get expiration date for time window
   */
  static getExpirationDate(timeWindow) {
    const durations = {
      '1h': 2 * 60 * 60 * 1000,      // Expire after 2 hours
      '6h': 12 * 60 * 60 * 1000,     // Expire after 12 hours
      '24h': 48 * 60 * 60 * 1000,    // Expire after 48 hours
      '7d': 14 * 24 * 60 * 60 * 1000, // Expire after 14 days
      '30d': 60 * 24 * 60 * 60 * 1000 // Expire after 60 days
    };
    
    const duration = durations[timeWindow] || durations['24h'];
    return new Date(Date.now() + duration);
  }
}

module.exports = TrendingService;
