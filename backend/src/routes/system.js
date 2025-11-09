const express = require('express');
const router = express.Router();
const os = require('os');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
const { getConnectionStatus } = require('../config/database');

// ===========================
// ADMIN ROUTES - SYSTEM MONITORING
// ===========================

// Get overall system health
router.get('/admin/system/health', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const mongoStatus = getConnectionStatus();
    
    const health = {
      status: mongoStatus.isConnected ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        loadAvg: os.loadavg()
      },
      database: {
        connected: mongoStatus.isConnected,
        name: mongoStatus.database,
        host: mongoStatus.host
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get system metrics
router.get('/admin/system/metrics', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    
    // Get current system metrics
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    
    // Calculate CPU percentage (simplified)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    
    const metrics = {
      cpu: {
        current: Math.min(cpuPercent, 100), // Cap at 100%
        average: os.loadavg()[0] * 10, // Rough estimate
        cores: os.cpus().length
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2),
        rss: memUsage.rss,
        external: memUsage.external
      },
      requests: {
        total: global.requestCount || 0,
        rate: global.requestRate || 0
      },
      errors: {
        total: global.errorCount || 0,
        rate: global.errorRate || 0
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get system logs (placeholder - would integrate with logging service)
router.get('/admin/system/logs', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { severity = 'all', limit = 50 } = req.query;
    
    // This is a placeholder. In production, integrate with:
    // - Google Cloud Logging
    // - Winston logger
    // - Or your logging service
    
    const logs = [];
    
    // Return empty for now - will be populated when logging service is integrated
    res.json({
      success: true,
      data: logs,
      message: 'Connect to Cloud Logging or Winston for detailed logs'
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get cost tracking (placeholder)
router.get('/admin/system/costs', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Placeholder for cost tracking
    // Would integrate with Google Cloud Billing API
    
    const costs = {
      currentMonth: 0,
      lastMonth: 0,
      breakdown: {
        cloudRun: 0,
        cloudStorage: 0,
        cloudBuild: 0,
        networking: 0
      },
      currency: 'USD',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: costs,
      message: 'Connect to Google Cloud Billing API for actual costs'
    });
  } catch (error) {
    console.error('Error fetching costs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Middleware to track requests (add to app.js)
router.use((req, res, next) => {
  if (!global.requestCount) global.requestCount = 0;
  global.requestCount++;
  next();
});

module.exports = router;
