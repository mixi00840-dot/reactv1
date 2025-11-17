/**
 * Redis Configuration
 * 
 * Optional Redis client for caching.
 * If Redis is not configured, the app runs without cache.
 */

const Redis = require('ioredis');

let client = null;
let isConnected = false;

// Only initialize Redis if REDIS_HOST is configured
if (process.env.REDIS_HOST) {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          console.log('⚠️  Redis max retry attempts reached');
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: false, // Disable ready check for Cloud Run
      lazyConnect: false,
      connectTimeout: 5000, // 5 second timeout
      commandTimeout: 5000
    };

    // TLS for Redis Cloud
    if (process.env.REDIS_TLS === 'true') {
      redisConfig.tls = {};
    }

    client = new Redis(redisConfig);

    client.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    client.on('error', (err) => {
      // Suppress connection refused errors (expected when Redis not available)
      if (!err.message.includes('ECONNREFUSED') && !err.message.includes('ETIMEDOUT')) {
        console.warn('⚠️  Redis error:', err.message);
      }
      isConnected = false;
    });

    client.on('close', () => {
      isConnected = false;
    });

  } catch (error) {
    console.log('ℹ️  Redis initialization failed, running without cache');
    client = null;
  }
} else {
  console.log('ℹ️  Redis not configured (REDIS_HOST not set), running without cache');
}

module.exports = {
  client,
  isConnected: () => isConnected,
  
  // Helper to safely execute Redis commands
  async safe(fn) {
    if (!client || !isConnected) {
      return null;
    }
    try {
      return await fn(client);
    } catch (error) {
      console.warn('⚠️  Redis command failed:', error.message);
      return null;
    }
  }
};
