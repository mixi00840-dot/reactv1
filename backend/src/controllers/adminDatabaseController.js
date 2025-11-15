const mongoose = require('mongoose');

/**
 * Admin Database Controller
 * Provides real-time database monitoring, statistics, and management
 */

/**
 * Get database statistics
 */
exports.getDatabaseStats = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Get database stats
    const dbStats = await db.stats();
    
    // Get connection status
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      success: true,
      data: {
        connected: connectionState === 1,
        status: stateMap[connectionState],
        database: db.databaseName,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexSize: dbStats.indexSize,
        totalSize: dbStats.dataSize + dbStats.indexSize,
        documents: dbStats.objects,
        avgObjSize: dbStats.avgObjSize,
        indexes: dbStats.indexes,
        fsUsedSize: dbStats.fsUsedSize,
        fsTotalSize: dbStats.fsTotalSize
      }
    });

  } catch (error) {
    console.error('Get database stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching database statistics',
      error: error.message
    });
  }
};

/**
 * Get all collections with their statistics
 */
exports.getCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Get all collection names
    const collections = await db.listCollections().toArray();
    
    // Get stats for each collection
    const collectionsWithStats = await Promise.all(
      collections.map(async (col) => {
        try {
          const stats = await db.collection(col.name).stats();
          const indexes = await db.collection(col.name).indexes();
          
          return {
            name: col.name,
            type: col.type,
            documents: stats.count,
            size: stats.size,
            storageSize: stats.storageSize,
            avgDocSize: stats.avgObjSize || 0,
            indexes: indexes.length,
            indexSizes: stats.totalIndexSize || 0,
            capped: stats.capped || false
          };
        } catch (err) {
          console.error(`Error getting stats for ${col.name}:`, err);
          return {
            name: col.name,
            type: col.type,
            documents: 0,
            size: 0,
            storageSize: 0,
            avgDocSize: 0,
            indexes: 0,
            indexSizes: 0,
            capped: false,
            error: err.message
          };
        }
      })
    );

    // Sort by document count descending
    collectionsWithStats.sort((a, b) => b.documents - a.documents);

    res.json({
      success: true,
      data: collectionsWithStats
    });

  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collections',
      error: error.message
    });
  }
};

/**
 * Get database performance metrics
 */
exports.getPerformance = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Get server status for performance metrics
    const serverStatus = await db.admin().serverStatus();
    
    // Calculate operations per second
    const opcounters = serverStatus.opcounters;
    const totalOps = opcounters.insert + opcounters.query + opcounters.update + opcounters.delete;
    const uptime = serverStatus.uptime;
    const opsPerSecond = uptime > 0 ? (totalOps / uptime).toFixed(2) : 0;

    // Get connection info
    const connections = serverStatus.connections;

    res.json({
      success: true,
      data: {
        operations: {
          insert: opcounters.insert,
          query: opcounters.query,
          update: opcounters.update,
          delete: opcounters.delete,
          total: totalOps,
          perSecond: parseFloat(opsPerSecond)
        },
        connections: {
          current: connections.current,
          available: connections.available,
          totalCreated: connections.totalCreated,
          active: connections.active || 0
        },
        network: {
          bytesIn: serverStatus.network?.bytesIn || 0,
          bytesOut: serverStatus.network?.bytesOut || 0,
          numRequests: serverStatus.network?.numRequests || 0
        },
        uptime: uptime,
        version: serverStatus.version
      }
    });

  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance metrics',
      error: error.message
    });
  }
};

/**
 * Get slow queries
 */
exports.getSlowQueries = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { limit = 10 } = req.query;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Get profiling data (slow queries)
    const slowQueries = await db.collection('system.profile')
      .find({ millis: { $gt: 100 } }) // Queries taking more than 100ms
      .sort({ ts: -1 })
      .limit(parseInt(limit))
      .toArray();

    const formattedQueries = slowQueries.map(query => ({
      timestamp: query.ts,
      operation: query.op,
      namespace: query.ns,
      duration: query.millis,
      query: query.command,
      docsExamined: query.docsExamined,
      docsReturned: query.nreturned
    }));

    res.json({
      success: true,
      data: formattedQueries
    });

  } catch (error) {
    console.error('Get slow queries error:', error);
    // If profiling is not enabled, return empty array
    res.json({
      success: true,
      data: [],
      message: 'Database profiling not enabled or no slow queries found'
    });
  }
};

/**
 * Get collection indexes
 */
exports.getCollectionIndexes = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const indexes = await db.collection(collectionName).indexes();
    
    const formattedIndexes = indexes.map(index => ({
      name: index.name,
      keys: index.key,
      unique: index.unique || false,
      sparse: index.sparse || false,
      background: index.background || false,
      size: index.indexSizes?.[index.name] || 0
    }));

    res.json({
      success: true,
      data: formattedIndexes
    });

  } catch (error) {
    console.error('Get collection indexes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collection indexes',
      error: error.message
    });
  }
};

/**
 * Run database command
 */
exports.runCommand = async (req, res) => {
  try {
    const { command } = req.body;
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    // Whitelist of safe commands
    const safeCommands = [
      'ping',
      'listDatabases',
      'serverStatus',
      'dbStats',
      'collStats',
      'validate'
    ];

    const commandName = Object.keys(command)[0];
    if (!safeCommands.includes(commandName)) {
      return res.status(403).json({
        success: false,
        message: 'Command not allowed for security reasons'
      });
    }

    const result = await db.admin().command(command);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Run command error:', error);
    res.status(500).json({
      success: false,
      message: 'Error running database command',
      error: error.message
    });
  }
};

/**
 * Get database operations analytics
 */
exports.getOperationsAnalytics = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const serverStatus = await db.admin().serverStatus();
    const opcounters = serverStatus.opcounters;

    // Get latency statistics
    const latencyStats = serverStatus.opLatencies || {
      reads: { latency: 0, ops: 0 },
      writes: { latency: 0, ops: 0 },
      commands: { latency: 0, ops: 0 }
    };

    res.json({
      success: true,
      data: {
        operations: {
          reads: opcounters.query + opcounters.getmore,
          writes: opcounters.insert + opcounters.update + opcounters.delete,
          commands: opcounters.command
        },
        latency: {
          reads: latencyStats.reads.ops > 0 
            ? (latencyStats.reads.latency / latencyStats.reads.ops / 1000).toFixed(2) 
            : 0,
          writes: latencyStats.writes.ops > 0 
            ? (latencyStats.writes.latency / latencyStats.writes.ops / 1000).toFixed(2) 
            : 0,
          avgLatency: ((latencyStats.reads.latency + latencyStats.writes.latency) / 
            (latencyStats.reads.ops + latencyStats.writes.ops) / 1000).toFixed(2) || 0
        }
      }
    });

  } catch (error) {
    console.error('Get operations analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching operations analytics',
      error: error.message
    });
  }
};
