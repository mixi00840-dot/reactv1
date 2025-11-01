const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./utils/database');

// Import routes with error handling
let authRoutes, userRoutes, sellerRoutes, adminRoutes;
try {
  authRoutes = require('./routes/auth');
  userRoutes = require('./routes/users');
  sellerRoutes = require('./routes/sellers');
  adminRoutes = require('./routes/admin');
} catch (error) {
  console.error('Error loading core routes:', error.message);
  // Create fallback routes
  const express = require('express');
  const fallbackRouter = express.Router();
  fallbackRouter.get('*', (req, res) => {
    res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
  });
  authRoutes = userRoutes = sellerRoutes = adminRoutes = fallbackRouter;
}

// E-commerce routes with error handling
let productRoutes, storeRoutes, categoryRoutes, cartRoutes, orderRoutes, paymentRoutes, couponRoutes, shippingRoutes, customerServiceRoutes, analyticsRoutes;
try {
  productRoutes = require('./routes/products');
  storeRoutes = require('./routes/stores');
  categoryRoutes = require('./routes/categories');
  cartRoutes = require('./routes/cart');
  orderRoutes = require('./routes/orders');
  paymentRoutes = require('./routes/payments');
  couponRoutes = require('./routes/coupons');
  shippingRoutes = require('./routes/shipping');
  customerServiceRoutes = require('./routes/customerService');
  analyticsRoutes = require('./routes/analytics');
} catch (error) {
  console.error('Error loading e-commerce routes:', error.message);
  const express = require('express');
  const fallbackRouter = express.Router();
  fallbackRouter.get('*', (req, res) => {
    res.status(503).json({ success: false, message: 'E-commerce service temporarily unavailable' });
  });
  productRoutes = storeRoutes = categoryRoutes = cartRoutes = orderRoutes = paymentRoutes = couponRoutes = shippingRoutes = customerServiceRoutes = analyticsRoutes = fallbackRouter;
}

// Settings & Audit routes
const settingsRoutes = require('./routes/settings');
const auditLogsRoutes = require('./routes/auditLogs');

// i18n routes
const languageRoutes = require('./routes/languages');
const translationRoutes = require('./routes/translations');

// Streaming routes
const streamProviderRoutes = require('./routes/streamProviders');
const livestreamRoutes = require('./routes/livestreams');

// CMS routes
const cmsRoutes = require('./routes/cms');
const bannersRoutes = require('./routes/banners');

// Supporters routes
const supportersRoutes = require('./routes/supporters');

// Advanced Analytics routes
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');

// Content Management routes
const contentRoutes = require('./routes/content');

// Transcode Management routes
const transcodeRoutes = require('./routes/transcode');

// Metrics & Analytics routes
const metricsRoutes = require('./routes/metrics');

// Moderation routes
const moderationRoutes = require('./routes/moderation');

// Rights Management routes
const rightsRoutes = require('./routes/rights');

// Recommendation Engine routes
const recommendationRoutes = require('./routes/recommendations');

// Personalized Feed routes
const feedRoutes = require('./routes/feed');

// Trending & Explore routes
const trendingRoutes = require('./routes/trending');

// Player & Streaming routes
const playerRoutes = require('./routes/player');

// Phase 11: Social Features routes
const messagingRoutes = require('./routes/messaging');
const storiesRoutes = require('./routes/stories');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');

// Phase 12: Advanced Live Streaming routes
const pkBattlesRoutes = require('./routes/pkBattles');
const multiHostRoutes = require('./routes/multiHost');
const liveShoppingRoutes = require('./routes/liveShopping');
const streamFiltersRoutes = require('./routes/streamFilters');
const webrtcRoutes = require('./routes/webrtc');

// Phase 13: AI Services & Creator Monetization routes
const aiRoutes = require('./routes/ai');
const monetizationRoutes = require('./routes/monetization');

// Phase 14: Camera & Media Management routes
const uploadRoutes = require('./routes/upload');
const soundsRoutes = require('./routes/sounds');
const giftsRoutes = require('./routes/gifts');
const walletsRoutes = require('./routes/wallets');

// Phase 15: Advanced Features routes
// TODO: Fix videoQualityController exports issue - temporarily disabled
// const videoQualityRoutes = require('./routes/videoQuality');
// TODO: Fix schedulingController exports issue - temporarily disabled  
// const schedulingRoutes = require('./routes/scheduling');
const activityRoutes = require('./routes/activity');

const app = express();

// Trust proxy setting (fixes rate limiting warning)
app.set('trust proxy', 1);

// Connect to MongoDB asynchronously
(async () => {
  try {
    await connectDB();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    // Don't exit here, let the server start anyway for basic health checks
  }
})();

// Security middleware
app.use(helmet());

// CORS configuration to allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001',
  process.env.FRONTEND_URL,
  // Allow any Netlify domain for admin dashboard
  /^https:\/\/.*\.netlify\.app$/,
  // Allow any Vercel domain
  /^https:\/\/.*\.vercel\.app$/,
  // Allow any GitHub Pages domain
  /^https:\/\/.*\.github\.io$/
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Mixillo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    mongodb: 'connected'
  });
});

// Database health check
app.get('/api/health/db', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'error',
    database: states[dbState],
    message: dbState === 1 ? 'Database connection healthy' : 'Database connection issue'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);

// E-commerce API routes
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/support', customerServiceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Settings & Audit API routes
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

// i18n API routes
app.use('/api/languages', languageRoutes);
app.use('/api/translations', translationRoutes);

// Streaming API routes
app.use('/api/streaming/providers', streamProviderRoutes);
app.use('/api/streaming/livestreams', livestreamRoutes);

// CMS API routes
app.use('/api/cms', cmsRoutes);
app.use('/api/banners', bannersRoutes);

// Supporters API routes
app.use('/api/supporters', supportersRoutes);

// Advanced Analytics API routes
app.use('/api/analytics', advancedAnalyticsRoutes);

// Content Management API routes
app.use('/api/content', contentRoutes);

// Upload API routes
app.use('/api/uploads', uploadRoutes);

// Transcode Management API routes
app.use('/api/transcode', transcodeRoutes);

// Metrics & Analytics API routes
app.use('/api/metrics', metricsRoutes);

// Moderation API routes
app.use('/api/moderation', moderationRoutes);

// Rights Management API routes
app.use('/api/rights', rightsRoutes);

// Recommendation Engine API routes
app.use('/api/recommendations', recommendationRoutes);

// Personalized Feed API routes
app.use('/api/feed', feedRoutes);

// Trending & Explore API routes
app.use('/api/trending', trendingRoutes);

// Player & Streaming API routes
app.use('/api/player', playerRoutes);

// Phase 11: Social Features API routes
app.use('/api/messaging', messagingRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Phase 12: Advanced Live Streaming API routes
app.use('/api/pk-battles', pkBattlesRoutes);
app.use('/api/multihost', multiHostRoutes);
app.use('/api/live-shopping', liveShoppingRoutes);
app.use('/api/stream-filters', streamFiltersRoutes);
app.use('/api/webrtc', webrtcRoutes);

// Phase 13: AI Services & Creator Monetization API routes
app.use('/api/ai', aiRoutes);
app.use('/api/monetization', monetizationRoutes);

// Phase 14: Camera & Media Management API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/sounds', soundsRoutes);
app.use('/api/gifts', giftsRoutes);
app.use('/api/wallets', walletsRoutes);

// Phase 15: Advanced Features API routes
// TODO: Fix videoQualityController exports issue - temporarily disabled
// app.use('/api/video-quality', videoQualityRoutes);
// TODO: Fix schedulingController exports issue - temporarily disabled
// app.use('/api/scheduling', schedulingRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;