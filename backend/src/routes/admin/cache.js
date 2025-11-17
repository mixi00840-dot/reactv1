/**
 * ADMIN CACHE & AI MONITORING ROUTES
 * 
 * Provides cache statistics and AI usage monitoring for the admin dashboard.
 * Frontend calls: 
 * - /api/admin/cache/stats
 * - /api/admin/ai/vertex-usage
 */

const express = require('express');
const router = express.Router();
const { verifyJWT, requireAdmin } = require('../../middleware/jwtAuth');
const redis = require('../../config/redis'); // Assuming redis client exists

// ===========================
// CACHE STATISTICS
// ===========================

/**
 * @route   GET /api/admin/cache/stats
 * @desc    Get Redis cache statistics
 * @access  Admin only
 */
router.get('/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Check if Redis is configured
    if (!redis || !redis.client) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          message: 'Redis cache is not configured',
          stats: {
            keys: 0,
            memory: 0,
            hits: 0,
            misses: 0,
            hitRate: 0
          }
        }
      });
    }

    // Get Redis info
    const info = await redis.client.info();
    const dbSize = await redis.client.dbSize();
    
    // Parse info string to extract key metrics
    const stats = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    }

    // Calculate hit rate
    const hits = parseInt(stats.keyspace_hits || 0);
    const misses = parseInt(stats.keyspace_misses || 0);
    const hitRate = (hits + misses) > 0 ? (hits / (hits + misses) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        enabled: true,
        stats: {
          keys: dbSize,
          memory: {
            used: stats.used_memory_human,
            peak: stats.used_memory_peak_human,
            percentage: stats.used_memory_rss_human
          },
          hits,
          misses,
          hitRate: parseFloat(hitRate),
          clients: {
            connected: parseInt(stats.connected_clients || 0),
            blocked: parseInt(stats.blocked_clients || 0)
          },
          operations: {
            opsPerSecond: parseInt(stats.instantaneous_ops_per_sec || 0),
            commandsProcessed: parseInt(stats.total_commands_processed || 0)
          },
          uptime: parseInt(stats.uptime_in_seconds || 0),
          version: stats.redis_version
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    
    // If Redis is down, return graceful response
    res.json({
      success: true,
      data: {
        enabled: false,
        error: error.message,
        message: 'Could not connect to Redis cache',
        stats: {
          keys: 0,
          memory: { used: '0B', peak: '0B' },
          hits: 0,
          misses: 0,
          hitRate: 0
        }
      }
    });
  }
});

/**
 * @route   POST /api/admin/cache/clear
 * @desc    Clear Redis cache
 * @access  Admin only
 */
router.post('/clear', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { pattern } = req.body;

    if (!redis || !redis.client) {
      return res.status(400).json({
        success: false,
        message: 'Redis cache is not configured'
      });
    }

    if (pattern && pattern !== '*') {
      // Clear specific pattern
      const keys = await redis.client.keys(pattern);
      if (keys.length > 0) {
        await redis.client.del(...keys);
      }
      
      res.json({
        success: true,
        message: `Cleared ${keys.length} keys matching pattern: ${pattern}`,
        data: { clearedKeys: keys.length }
      });
    } else {
      // Clear all cache
      await redis.client.flushDb();
      
      res.json({
        success: true,
        message: 'All cache cleared successfully',
        data: { clearedKeys: 'all' }
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

module.exports = router;
