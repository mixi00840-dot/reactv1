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
    // Check if Redis is configured
    const redisEnabled = process.env.REDIS_ENABLED !== 'false' && process.env.REDIS_HOST;
    
    if (!redisEnabled) {
      console.log('ℹ️  Redis disabled - Running without cache (set REDIS_HOST to enable)');
      this.client = null;
      this.isConnected = false;
      this.disabled = true;
      
      // Initialize TTL configurations even when disabled
      this.TTL = {
        FEED: 300,           // 5 minutes
        USER_PROFILE: 1800,  // 30 minutes
        TRENDING: 300,       // 5 minutes
        VIDEO_META: 3600,    // 1 hour
        USER_PREFS: 3600,    // 1 hour
        SEARCH: 600          // 10 minutes
      };
      this.metrics = this.initializeMetrics();
      return;
    }

    this.disabled = false;
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        // Stop retrying after 5 attempts
        if (times > 5) {
          console.log('⚠️  Redis max retry attempts reached, running without cache');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000 // 10 second connection timeout
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
      // Only log the error, don't spam logs
      if (!err.message.includes('ETIMEDOUT') && !err.message.includes('ECONNREFUSED')) {
        console.error('❌ Redis error:', err.message);
      }
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️  Redis connection closed');
      this.isConnected = false;
    });

    // Connect
    this.client.connect().catch(err => {
      console.log('⚠️  Redis connection failed, running without cache:', err.message);
      this.disabled = true;
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
    this.metrics = this.initializeMetrics();
  }

  initializeMetrics() {
    return {
      feedsCached: 0,
      profilesCached: 0,
      trendingCached: 0,
      videosCached: 0,
      preferencesCached: 0,
      searchesCached: 0,
      totalCached: 0
    };
  }

  recordMetric(type) {
    if (!this.metrics[type]) {
      this.metrics[type] = 0;
    }
    this.metrics[type] += 1;
    this.metrics.totalCached += 1;
  }

  parseInfo(infoString) {
    if (!infoString) return {};
    return infoString.split('\n').reduce((acc, line) => {
      if (!line || line.startsWith('#')) return acc;
      const [key, value] = line.split(':');
      if (value === undefined) return acc;
      const numeric = Number(value);
      acc[key] = Number.isNaN(numeric) ? value : numeric;
      return acc;
    }, {});
  }

  parseDbLine(line) {
    if (!line) return {};
    return line.split(',').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (value === undefined) return acc;
      const numeric = Number(value);
      acc[key] = Number.isNaN(numeric) ? value : numeric;
      return acc;
    }, {});
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return !this.disabled && this.isConnected;
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
      if (this.disabled || !this.isConnected) return null;
      
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
      if (this.disabled || !this.isConnected) return false;
      
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
      if (this.disabled || !this.isConnected) return false;
      
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
      if (this.disabled || !this.isConnected) return false;
      
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
    const success = await this.set(key, feed, ttl);
    if (success) this.recordMetric('feedsCached');
    return success;
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
    const success = await this.set(key, profile, ttl);
    if (success) this.recordMetric('profilesCached');
    return success;
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
    const success = await this.set(key, content, ttl);
    if (success) this.recordMetric('trendingCached');
    return success;
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
    const success = await this.set(key, metadata, ttl);
    if (success) this.recordMetric('videosCached');
    return success;
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
    const success = await this.set(key, preferences, ttl);
    if (success) this.recordMetric('preferencesCached');
    return success;
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
    const success = await this.set(key, results, ttl);
    if (success) this.recordMetric('searchesCached');
    return success;
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
    const success = await this.set(key, hashtags, ttl);
    if (success) this.recordMetric('trendingCached');
    return success;
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
      if (this.disabled) {
        return { status: 'disabled', connected: false, error: 'Redis disabled' };
      }

      if (!this.isConnected) {
        return { status: 'disconnected', connected: false, error: 'Not connected to Redis' };
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
      if (this.disabled) {
        return {
          connected: false,
          status: 'disabled',
          feedsCached: this.metrics.feedsCached,
          profilesCached: this.metrics.profilesCached,
          trendingCached: this.metrics.trendingCached,
          totalCached: this.metrics.totalCached
        };
      }

      if (!this.isConnected) {
        return {
          connected: false,
          status: 'disconnected',
          feedsCached: this.metrics.feedsCached,
          profilesCached: this.metrics.profilesCached,
          trendingCached: this.metrics.trendingCached,
          totalCached: this.metrics.totalCached
        };
      }

      const [statsInfo, memoryInfo, serverInfo, clientsInfo, keyspaceInfo] = await Promise.all([
        this.client.info('stats'),
        this.client.info('memory'),
        this.client.info('server'),
        this.client.info('clients'),
        this.client.info('keyspace')
      ]);

      const parsedStats = this.parseInfo(statsInfo);
      const parsedMemory = this.parseInfo(memoryInfo);
      const parsedServer = this.parseInfo(serverInfo);
      const parsedClients = this.parseInfo(clientsInfo);
      const parsedKeyspace = this.parseInfo(keyspaceInfo);
      const db0 = this.parseDbLine(parsedKeyspace.db0);

      const hits = parsedStats.keyspace_hits || 0;
      const misses = parsedStats.keyspace_misses || 0;
      const totalLookups = hits + misses;
      const hitRate = totalLookups > 0 ? (hits / totalLookups) * 100 : null;
      const missRate = hitRate !== null ? 100 - hitRate : null;

      return {
        connected: true,
        status: 'healthy',
        used_memory_human: parsedMemory.used_memory_human || 'N/A',
        used_memory_peak_human: parsedMemory.used_memory_peak_human || 'N/A',
        used_memory: parsedMemory.used_memory || 0,
        used_memory_peak: parsedMemory.used_memory_peak || 0,
        db0_keys: db0.keys || 0,
        db0_expires: db0.expires || 0,
        db0_avg_ttl: db0.avg_ttl || 0,
        keyspace_hits: hits,
        keyspace_misses: misses,
        hitRate,
        missRate,
        expired_keys: parsedStats.expired_keys || 0,
        evicted_keys: parsedStats.evicted_keys || 0,
        connected_clients: parsedClients.connected_clients || 0,
        uptime_in_seconds: parsedServer.uptime_in_seconds || 0,
        instantaneous_ops_per_sec: parsedStats.instantaneous_ops_per_sec || 0,
        avgResponseTime: parsedStats.instantaneous_ops_per_sec
          ? (1000 / parsedStats.instantaneous_ops_per_sec)
          : null,
        feedsCached: this.metrics.feedsCached,
        profilesCached: this.metrics.profilesCached,
        trendingCached: this.metrics.trendingCached,
        totalCached: this.metrics.totalCached
      };
    } catch (error) {
      console.error('Redis getStats error:', error);
      return {
        connected: false,
        status: 'error',
        error: error.message,
        feedsCached: this.metrics.feedsCached,
        profilesCached: this.metrics.profilesCached,
        trendingCached: this.metrics.trendingCached,
        totalCached: this.metrics.totalCached
      };
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
