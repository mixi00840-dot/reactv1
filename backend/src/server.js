const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const { setupSocketHandlers } = require('./socket/events');
const setupWebRTCHandlers = require('./socket/webrtc');
const { initializeTrendingCron } = require('./jobs/trendingCalculation');
const { initializeStoryCleanup } = require('./jobs/storyCleanup');
const { scheduledContentJob, livestreamReminderJob } = require('./jobs/scheduledContentJob');

const PORT = process.env.PORT || 5000;

// Bind to all interfaces in production (required for Render)
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup Socket.io event handlers
setupSocketHandlers(io);

// Setup WebRTC socket handlers
setupWebRTCHandlers(io);

// Make io accessible to routes
app.set('io', io);

// Initialize cron jobs
initializeTrendingCron();
initializeStoryCleanup();

// Phase 15: Initialize scheduling cron jobs
scheduledContentJob.start();
livestreamReminderJob.start();
console.log('📅 Scheduled content processor initialized');
console.log('🔔 Livestream reminder service initialized');

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

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { server, io };
