const http = require('http');
const socketIO = require('socket.io');

console.log('🚀 Starting Mixillo API server...');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Port: ${process.env.PORT || 5000}, Host: ${process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'}`);
console.log(`🗄️  Database: MongoDB`);

// Import MongoDB app (not Firestore!)
const app = require('./app-with-mongodb');

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

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
try {
  console.log('🔌 Setting up Socket.IO handlers...');
  const { setupSocketHandlers } = require('./socket/events');
  const setupWebRTCHandlers = require('./socket/webrtc');
  
  setupSocketHandlers(io);
  setupWebRTCHandlers(io);
  
  // Make io accessible to routes
  app.set('io', io);
  console.log('✅ Socket.IO handlers configured');
} catch (error) {
  console.error('❌ Error setting up Socket.IO:', error.message);
}

// Initialize cron jobs only when explicitly enabled
if (process.env.ENABLE_CRON === 'true') {
  console.log('⏰ Initializing cron jobs...');
  try {
    const { initializeTrendingCron } = require('./jobs/trendingCalculation');
    const { initializeStoryCleanup } = require('./jobs/storyCleanup');
    const { scheduledContentJob, livestreamReminderJob } = require('./jobs/scheduledContentJob');
    
    initializeTrendingCron();
    initializeStoryCleanup();
    
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
  console.log(`🎉 Server startup complete!`);
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

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { server, io };