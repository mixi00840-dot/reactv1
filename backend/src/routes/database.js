const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

// ===========================
// ADMIN ROUTES - DATABASE MONITORING
// ===========================

// Get database statistics
router.get('/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Get database stats
    const dbStats = await db.stats();
    
    // Get connection pool stats
    const connectionStats = {
      current: mongoose.connection.readyState,
      available: mongoose.connection.poolSize || 10
    };
    
    const stats = {
      connected: mongoose.connection.readyState === 1,
      database: db.databaseName,
      totalCollections: dbStats.collections,
      totalDocuments: dbStats.objects,
      dataSize: dbStats.dataSize,
      storageSize: dbStats.storageSize,
      indexSize: dbStats.indexSize,
      avgObjSize: dbStats.avgObjSize,
      connections: connectionStats,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all collections with their stats
router.get('/collections', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Get list of all collections
    const collectionsList = await db.listCollections().toArray();
    
    // Get stats for each collection
    const collectionsWithStats = await Promise.all(
      collectionsList.map(async (col) => {
        try {
          const stats = await db.collection(col.name).stats();
          return {
            name: col.name,
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            storageSize: stats.storageSize,
            indexes: stats.nindexes,
            indexSize: stats.totalIndexSize
          };
        } catch (error) {
          return {
            name: col.name,
            count: 0,
            size: 0,
            avgObjSize: 0,
            storageSize: 0,
            indexes: 0,
            indexSize: 0,
            error: 'Failed to fetch stats'
          };
        }
      })
    );
    
    // Sort by size (largest first)
    collectionsWithStats.sort((a, b) => b.size - a.size);
    
    res.json({
      success: true,
      data: collectionsWithStats
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get database performance metrics
router.get('/performance', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Get server status for performance metrics
    const serverStatus = await db.admin().serverStatus();
    
    const opcounters = serverStatus.opcounters || {};
    const connections = serverStatus.connections || {};
    const network = serverStatus.network || {};
    
    const performance = {
      opsPerSecond: (opcounters.insert || 0) + (opcounters.query || 0) + (opcounters.update || 0) + (opcounters.delete || 0),
      readOps: (opcounters.query || 0) + (opcounters.getmore || 0),
      writeOps: (opcounters.insert || 0) + (opcounters.update || 0) + (opcounters.delete || 0),
      connections: {
        current: connections.current || 0,
        available: connections.available || 0
      },
      network: {
        bytesIn: network.bytesIn || 0,
        bytesOut: network.bytesOut || 0,
        numRequests: network.numRequests || 0
      },
      uptime: serverStatus.uptime || 0,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching database performance:', error);
    // Return default values if serverStatus not available
    res.json({
      success: true,
      data: {
        opsPerSecond: 0,
        readOps: 0,
        writeOps: 0,
        avgLatency: 0,
        connections: {
          current: mongoose.connection.readyState === 1 ? 1 : 0,
          available: 10
        }
      }
    });
  }
});

// Get slow queries (requires profiling to be enabled)
router.get('/slow-queries', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Check if system.profile collection exists
    const collections = await db.listCollections({ name: 'system.profile' }).toArray();
    
    if (collections.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Database profiling not enabled. Enable with db.setProfilingLevel(1, 100)'
      });
    }
    
    // Get slow queries from system.profile
    const slowQueries = await db.collection('system.profile')
      .find({ 
        millis: { $gt: 100 } // Queries taking more than 100ms
      })
      .sort({ ts: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    const formatted = slowQueries.map(query => ({
      collection: query.ns?.split('.')[1] || 'unknown',
      operation: query.op,
      duration: query.millis,
      query: query.command || {},
      timestamp: query.ts,
      user: query.user
    }));
    
    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    res.json({
      success: true,
      data: [],
      message: 'Slow query monitoring not available'
    });
  }
});

// Enable database profiling (admin only)
router.post('/profiling', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { level = 1, slowMs = 100 } = req.body;
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Set profiling level
    // 0 = off, 1 = slow queries only, 2 = all queries
    await db.admin().command({
      profile: level,
      slowms: slowMs
    });
    
    res.json({
      success: true,
      message: `Database profiling ${level === 0 ? 'disabled' : 'enabled'}`,
      data: { level, slowMs }
    });
  } catch (error) {
    console.error('Error setting profiling:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get index information for a collection
router.get('/collections/:name/indexes', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    const indexes = await db.collection(name).indexes();
    
    res.json({
      success: true,
      data: indexes
    });
  } catch (error) {
    console.error('Error fetching indexes:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
