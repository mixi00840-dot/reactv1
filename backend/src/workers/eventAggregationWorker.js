require('dotenv').config();
const mongoose = require('mongoose');
const { eventAggregator } = require('../services/eventAggregator');

/**
 * Event Aggregation Worker
 * 
 * Periodically processes ViewEvents and aggregates them into ContentMetrics.
 * 
 * This worker should run continuously and perform:
 * - Event aggregation (every 1-5 minutes)
 * - Unique viewer updates (every hour)
 * - Full recalculation (daily)
 * 
 * Usage:
 *   node src/workers/eventAggregationWorker.js
 * 
 * Production deployment:
 *   PM2: pm2 start src/workers/eventAggregationWorker.js --name "metrics-worker"
 *   Docker: Include in docker-compose.yml as separate service
 */

// Configuration
const AGGREGATION_INTERVAL = parseInt(process.env.METRICS_AGGREGATION_INTERVAL) || 60000; // 1 minute default
const UNIQUE_VIEWERS_INTERVAL = 60 * 60 * 1000; // 1 hour
const FULL_RECALC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

console.log('🚀 Starting Event Aggregation Worker...');
console.log(`⚙️  Aggregation interval: ${AGGREGATION_INTERVAL / 1000}s`);
console.log(`📊 MongoDB URI: ${process.env.MONGO_URI}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Start periodic processing
  startAggregationLoop();
  startUniqueViewersUpdate();
  startFullRecalculation();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

/**
 * Main aggregation loop - runs every 1-5 minutes
 */
function startAggregationLoop() {
  console.log('🔄 Starting event aggregation loop...');
  
  // Process immediately on startup
  processEvents();

  // Then run periodically
  setInterval(() => {
    processEvents();
  }, AGGREGATION_INTERVAL);
}

/**
 * Unique viewers update - runs every hour
 */
function startUniqueViewersUpdate() {
  console.log('📊 Starting unique viewers update loop...');
  
  // Run first update after 5 minutes
  setTimeout(() => {
    updateUniqueViewers();
    
    // Then run every hour
    setInterval(() => {
      updateUniqueViewers();
    }, UNIQUE_VIEWERS_INTERVAL);
  }, 5 * 60 * 1000);
}

/**
 * Full recalculation - runs daily
 */
function startFullRecalculation() {
  console.log('🔄 Starting daily recalculation loop...');
  
  // Run first recalc after 10 minutes
  setTimeout(() => {
    fullRecalculation();
    
    // Then run daily
    setInterval(() => {
      fullRecalculation();
    }, FULL_RECALC_INTERVAL);
  }, 10 * 60 * 1000);
}

/**
 * Process events
 */
async function processEvents() {
  try {
    const startTime = Date.now();
    const result = await eventAggregator.processEvents();
    const duration = Date.now() - startTime;
    
    if (result.processed > 0) {
      console.log(`✅ Processed ${result.processed} events for ${result.contentCount} content items in ${duration}ms`);
    }
  } catch (error) {
    console.error('❌ Event processing error:', error);
  }
}

/**
 * Update unique viewers
 */
async function updateUniqueViewers() {
  try {
    console.log('📊 Updating unique viewers...');
    
    const ViewEvent = require('../models/ViewEvent');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get content IDs with recent views
    const recentContent = await ViewEvent.distinct('contentId', {
      timestamp: { $gte: oneDayAgo },
      eventType: 'view_start'
    });
    
    console.log(`📊 Found ${recentContent.length} content items with recent views`);
    
    await eventAggregator.batchUpdateUniqueViewers(recentContent);
    
    console.log('✅ Unique viewers update complete');
  } catch (error) {
    console.error('❌ Unique viewers update error:', error);
  }
}

/**
 * Full recalculation
 */
async function fullRecalculation() {
  try {
    console.log('🔄 Starting full metrics recalculation...');
    const startTime = Date.now();
    
    await eventAggregator.recalculateAllMetrics();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Full recalculation complete in ${Math.round(duration / 1000)}s`);
  } catch (error) {
    console.error('❌ Full recalculation error:', error);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down event aggregation worker...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

console.log('✅ Event aggregation worker started successfully');
