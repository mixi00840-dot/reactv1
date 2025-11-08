const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const { setupSocketHandlers } = require('./socket/events');
const setupWebRTCHandlers = require('./socket/webrtc');
const { initializeTrendingCron } = require('./jobs/trendingCalculation');
const { initializeStoryCleanup } = require('./jobs/storyCleanup');
const { scheduledContentJob, livestreamReminderJob } = require('./jobs/scheduledContentJob');

const PORT = process.env.PORT || 5000;

// Bind host: allow override via HOST env, default to 0.0.0.0 in production
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');

console.log('🚀 Starting Mixillo API server...');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Port: ${PORT}, Host: ${HOST}`);
console.log(`📅 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
console.log('⚡ Initializing Socket.IO...');
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup Socket.io event handlers
console.log('🔌 Setting up Socket.IO handlers...');
setupSocketHandlers(io);

// Setup WebRTC socket handlers
setupWebRTCHandlers(io);

// Make io accessible to routes
app.set('io', io);

// Initialize cron jobs only when explicitly enabled via env
const cronEnabled = process.env.ENABLE_CRON === 'true' || process.env.CRON_ENABLED === 'true';
if (cronEnabled) {
  console.log('⏰ Initializing cron jobs (ENABLE_CRON=true)...');
  try {
    initializeTrendingCron();
    initializeStoryCleanup();
    
    // Phase 15: Initialize scheduling cron jobs
    scheduledContentJob.start();
    livestreamReminderJob.start();
    console.log('📅 Scheduled content processor initialized');
    console.log('🔔 Livestream reminder service initialized');
  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error.message);
  }
} else {
  console.log('⏰ Cron jobs disabled (set ENABLE_CRON=true to enable)');
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Mixillo API server running on ${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`⚡ WebSocket server ready`);
  console.log(`⏰ Cron jobs initialized`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// More lenient error handling - log but don't crash immediately for unhandled promises
// This allows the server to stay up for health checks even if MongoDB connection fails initially
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  // Only exit in non-production or if it's a critical error
  if (process.env.NODE_ENV !== 'production' || err.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit - let the server stay up for health checks
  // MongoDB connection errors should be handled gracefully in app.js
});

module.exports = { server, io };
