/**
 * Transcode Worker Starter
 * Starts video processing workers
 * 
 * Usage: node src/workers/transcodeWorker.js [concurrency]
 * Example: node src/workers/transcodeWorker.js 2
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { createTranscodeWorker } = require('../services/transcodeQueue');

// Get concurrency from args or default to 2
const concurrency = parseInt(process.argv[2]) || 2;

console.log('🚀 Starting Transcode Worker...');
console.log(`⚙️  Concurrency: ${concurrency}`);
console.log(`📦 MongoDB: ${process.env.MONGODB_URI}`);
console.log(`🔴 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start worker
    const worker = createTranscodeWorker(concurrency);
    
    console.log(`✅ Transcode worker started with concurrency ${concurrency}`);
    console.log('⏳ Waiting for jobs...\n');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down worker...');
      await worker.close();
      await mongoose.connection.close();
      console.log('✅ Worker shutdown complete');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      await worker.close();
      await mongoose.connection.close();
      console.log('✅ Worker shutdown complete');
      process.exit(0);
    });
    
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});
