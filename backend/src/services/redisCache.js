const Redis = require('ioredis');

/**
 * Redis Cache Service
 * 
 * Provides caching for:
 * - Personalized feeds (5-min TTL)
 * - User profiles (30-min TTL)
 * - Trending content (5-min TTL)
 * - Video metadata (1-hour TTL)
 */

class RedisCacheService {
  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || '10.167.115.67',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    };

    // TLS for Redis Cloud
    if (process.env.REDIS_TLS === 'true') {
      redisConfig.tls = {};
    }

    this.client = new Redis(redisConfig);
    this.isConnected = false;

    // Connection events
    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️  Redis connection closed');
      this.isConnected = false;
    });

    // Connect
    this.client.connect().catch(err => {
      console.error('❌ Redis connection failed:', err.message);
    });

    // TTL configurations (in seconds)
    this.TTL = {
      FEED: 300,           // 5 minutes
      USER_PROFILE: 1800,  // 30 minutes
      TRENDING: 300,       // 5 minutes
      VIDEO_META: 3600,    // 1 hour
      USER_PREFS: 3600,    // 1 hour
      SEARCH: 600          // 10 minutes
    };
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.isConnected;
  }

  /**
   * Generate cache key
   */
  key(prefix, ...parts) {
    return `mixillo:${prefix}:${parts.join(':')}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      if (!value) return null;
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;
      
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      if (!this.isConnected) return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      if (!this.isConnected) return false;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  }

  /**
   * Cache user's personalized feed
   */
  async cacheFeed(userId, feed, ttl = this.TTL.FEED) {
    const key = this.key('feed', userId);
    return await this.set(key, feed, ttl);
  }

  /**
   * Get cached feed
   */
  async getFeed(userId) {
    const key = this.key('feed', userId);
    return await this.get(key);
  }

  /**
   * Invalidate user's feed cache
   */
  async invalidateFeed(userId) {
    const key = this.key('feed', userId);
    return await this.del(key);
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile, ttl = this.TTL.USER_PROFILE) {
    const key = this.key('user', userId);
    return await this.set(key, profile, ttl);
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    const key = this.key('user', userId);
    return await this.get(key);
  }

  /**
   * Invalidate user profile cache
   */
  async invalidateUserProfile(userId) {
    const key = this.key('user', userId);
    return await this.del(key);
  }

  /**
   * Cache trending content
   */
  async cacheTrending(content, ttl = this.TTL.TRENDING) {
    const key = this.key('trending', 'global');
    return await this.set(key, content, ttl);
  }

  /**
   * Get cached trending content
   */
  async getTrending() {
    const key = this.key('trending', 'global');
    return await this.get(key);
  }

  /**
   * Cache video metadata
   */
  async cacheVideo(videoId, metadata, ttl = this.TTL.VIDEO_META) {
    const key = this.key('video', videoId);
    return await this.set(key, metadata, ttl);
  }

  /**
   * Get cached video metadata
   */
  async getVideo(videoId) {
    const key = this.key('video', videoId);
    return await this.get(key);
  }

  /**
   * Cache user preferences (for feed ranking)
   */
  async cacheUserPrefs(userId, preferences, ttl = this.TTL.USER_PREFS) {
    const key = this.key('prefs', userId);
    return await this.set(key, preferences, ttl);
  }

  /**
   * Get cached user preferences
   */
  async getUserPrefs(userId) {
    const key = this.key('prefs', userId);
    return await this.get(key);
  }

  /**
   * Cache search results
   */
  async cacheSearch(query, results, ttl = this.TTL.SEARCH) {
    const key = this.key('search', query);
    return await this.set(key, results, ttl);
  }

  /**
   * Get cached search results
   */
  async getSearch(query) {
    const key = this.key('search', query);
    return await this.get(key);
  }

  /**
   * Increment counter (for rate limiting, analytics)
   */
  async incr(key, ttl = 3600) {
    try {
      if (!this.isConnected) return 0;
      
      const value = await this.client.incr(key);
      if (value === 1) {
        // First increment, set TTL
        await this.client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  /**
   * Get counter value
   */
  async getCount(key) {
    try {
      if (!this.isConnected) return 0;
      
      const value = await this.client.get(key);
      return parseInt(value) || 0;
    } catch (error) {
      console.error('Redis getCount error:', error);
      return 0;
    }
  }

  /**
   * Add to sorted set (for leaderboards, trending)
   */
  async zadd(key, score, member, ttl) {
    try {
      if (!this.isConnected) return false;
      
      await this.client.zadd(key, score, member);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return true;
    } catch (error) {
      console.error('Redis zadd error:', error);
      return false;
    }
  }

  /**
   * Get top members from sorted set
   */
  async zrevrange(key, start, stop) {
    try {
      if (!this.isConnected) return [];
      
      return await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    } catch (error) {
      console.error('Redis zrevrange error:', error);
      return [];
    }
  }

  /**
   * Cache trending hashtags
   */
  async cacheTrendingHashtags(hashtags, ttl = this.TTL.TRENDING) {
    const key = this.key('trending', 'hashtags');
    return await this.set(key, hashtags, ttl);
  }

  /**
   * Get cached trending hashtags
   */
  async getTrendingHashtags() {
    const key = this.key('trending', 'hashtags');
    return await this.get(key);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Not connected to Redis' };
      }
      
      await this.client.ping();
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Get cache stats
   */
  async getStats() {
    try {
      if (!this.isConnected) return null;
      
      const info = await this.client.info('stats');
      const memory = await this.client.info('memory');
      
      return {
        connected: this.isConnected,
        info,
        memory
      };
    } catch (error) {
      console.error('Redis getStats error:', error);
      return null;
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

// Singleton instance
let cacheService = null;

/**
 * Get cache service instance
 */
function getCache() {
  if (!cacheService) {
    cacheService = new RedisCacheService();
  }
  return cacheService;
}

module.exports = getCache();
module.exports.RedisCacheService = RedisCacheService;
