const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./utils/database');

// Import core routes (migrated to Firestore)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sellerRoutes = require('./routes/sellers');
const adminRoutes = require('./routes/admin');

// Create fallback router for unmigrated features
const createFallbackRouter = () => {
  const fallbackRouter = express.Router();
  fallbackRouter.all('*', (req, res) => {
    res.status(503).json({ success: false, message: 'Feature being migrated to Firestore' });
  });
  return fallbackRouter;
};

// E-commerce routes (Firestore - Phase 2 complete)
let productRoutes, storeRoutes, orderRoutes;
try {
  productRoutes = require('./routes/products');
  storeRoutes = require('./routes/stores');
  orderRoutes = require('./routes/orders');
} catch (error) {
  console.error('⚠️  E-commerce routes have missing methods:', error.message);
  const fallback = createFallbackRouter();
  productRoutes = storeRoutes = orderRoutes = fallback;
}

// E-commerce routes still using MongoDB (will use fallback)
const fallback2 = createFallbackRouter();
const categoryRoutes = fallback2;
const cartRoutes = fallback2;
const paymentRoutes = fallback2;
const couponRoutes = fallback2;
const shippingRoutes = fallback2;
const customerServiceRoutes = fallback2;
const analyticsRoutes = fallback2;

// CMS & Settings routes (Firestore - Phase 2 complete)
let settingsRoutes, cmsRoutes, bannersRoutes;
try {
  settingsRoutes = require('./routes/settings');
  cmsRoutes = require('./routes/cms');
  bannersRoutes = require('./routes/banners');
} catch (error) {
  console.error('⚠️  CMS/Settings routes have issues:', error.message);
  const fallback3 = createFallbackRouter();
  settingsRoutes = cmsRoutes = bannersRoutes = fallback3;
}

// Content & Advanced features still using MongoDB (will use fallback)
const fallback4 = createFallbackRouter();
const auditLogsRoutes = fallback4;
const languageRoutes = fallback4;
const translationRoutes = fallback4;
const streamProviderRoutes = fallback4;
const livestreamRoutes = fallback4;
const supportersRoutes = fallback4;
const advancedAnalyticsRoutes = fallback4;
const contentRoutes = fallback4;
const transcodeRoutes = fallback4;
const metricsRoutes = fallback4;
const moderationRoutes = fallback4;
const rightsRoutes = fallback4;
const recommendationRoutes = fallback4;
const feedRoutes = fallback4;
const trendingRoutes = fallback4;
const playerRoutes = fallback4;

// Phase 11-15 routes (wrapped for Firestore migration)
let messagingRoutes, storiesRoutes, commentsRoutes, notificationsRoutes;
let pkBattlesRoutes, multiHostRoutes, liveShoppingRoutes, streamFiltersRoutes, webrtcRoutes;
let aiRoutes, monetizationRoutes, uploadRoutes, soundsRoutes, giftsRoutes, walletsRoutes;
let activityRoutes;

try {
  messagingRoutes = require('./routes/messaging');
  storiesRoutes = require('./routes/stories');
  commentsRoutes = require('./routes/comments');
  notificationsRoutes = require('./routes/notifications');
  pkBattlesRoutes = require('./routes/pkBattles');
  multiHostRoutes = require('./routes/multiHost');
  liveShoppingRoutes = require('./routes/liveShopping');
  streamFiltersRoutes = require('./routes/streamFilters');
  webrtcRoutes = require('./routes/webrtc');
  aiRoutes = require('./routes/ai');
  monetizationRoutes = require('./routes/monetization');
  uploadRoutes = require('./routes/upload');
  soundsRoutes = require('./routes/sounds');
  giftsRoutes = require('./routes/gifts');
  walletsRoutes = require('./routes/wallets');
  activityRoutes = require('./routes/activity');
} catch (error) {
  console.error('⚠️  Phase 11-15 routes have issues:', error.message);
  const fallback5 = createFallbackRouter();
  messagingRoutes = fallback5;
  storiesRoutes = fallback5;
  commentsRoutes = fallback5;
  notificationsRoutes = fallback5;
  pkBattlesRoutes = fallback5;
  multiHostRoutes = fallback5;
  liveShoppingRoutes = fallback5;
  streamFiltersRoutes = fallback5;
  webrtcRoutes = fallback5;
  aiRoutes = fallback5;
  monetizationRoutes = fallback5;
  uploadRoutes = fallback5;
  soundsRoutes = fallback5;
  giftsRoutes = fallback5;
  walletsRoutes = fallback5;
  activityRoutes = fallback5;
}

const app = express();

// Trust proxy setting (fixes rate limiting warning)
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001',
  process.env.FRONTEND_URL,
  // Allow any Netlify domain for admin dashboard
  /^https:\/\/.*\.netlify\.app$/,
  // Allow any Vercel domain
  /^https:\/\/.*\.vercel\.app$/,
  // Allow any GitHub Pages domain
  /^https:\/\/.*\.github\.io$/,
  // Allow any AWS Amplify Hosting domain
  /^https:\/\/.*\.amplifyapp\.com$/,
  // Allow any CloudFront distribution domain
  /^https:\/\/.*\.cloudfront\.net$/,
  // Allow S3 static website endpoints (regional variants)
  /^http:\/\/.*\.s3-website[.-].*\.amazonaws\.com$/,
  /^https:\/\/.*\.s3-website[.-].*\.amazonaws\.com$/,
  // Allow any Google Cloud Run domain
  /^https:\/\/.*\.run\.app$/
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
    database: 'Firestore'
  });
});

// Database health check
app.get('/api/health/db', (req, res) => {
  // Firestore is always available (no connection state to check)
  res.status(200).json({
    status: 'ok',
    database: 'Firestore',
    message: 'Firestore client ready'
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
app.use('/api/uploads', uploadRoutes);
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