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
const authFirebaseRoutes = require('./routes/authFirebase'); // New Firebase Auth routes
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
let productRoutes, storeRoutes;
let orderRoutes; // Will be set to Firestore version below
try {
  productRoutes = require('./routes/products');
  storeRoutes = require('./routes/stores');
} catch (error) {
  console.error('⚠️  E-commerce routes have missing methods:', error.message);
  const fallback = createFallbackRouter();
  productRoutes = storeRoutes = fallback;
}

// Load Firestore orders route
try {
  orderRoutes = require('./routes/orders-firestore');
  console.log('✅ Orders routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Orders routes error:', error.message);
  orderRoutes = createFallbackRouter();
}

// E-commerce routes still using MongoDB (will use fallback)
const fallback2 = createFallbackRouter();
let categoryRoutes = fallback2; // Changed to let for Firestore override
let cartRoutes = fallback2; // Changed to let for Firestore override
let paymentRoutes = fallback2; // Changed to let for Firestore override
const couponRoutes = fallback2;
const shippingRoutes = fallback2;
const customerServiceRoutes = fallback2;
let analyticsRoutes = fallback2; // Changed to let for Firestore override

// CMS & Settings routes (Firestore - Phase 2 complete)
let cmsRoutes, bannersRoutes;
let settingsRoutes; // Will be set by Firestore stub loader below
try {
  cmsRoutes = require('./routes/cms');
  bannersRoutes = require('./routes/banners');
} catch (error) {
  console.error('⚠️  CMS/Banners routes have issues:', error.message);
  const fallback3 = createFallbackRouter();
  cmsRoutes = bannersRoutes = fallback3;
}

// Content & Advanced features still using MongoDB (will use fallback)
const fallback4 = createFallbackRouter();
const auditLogsRoutes = fallback4;
const languageRoutes = fallback4;
const translationRoutes = fallback4;
let streamProviderRoutes = fallback4; // Changed to let for Firestore override (streaming)
let livestreamRoutes = fallback4; // Changed to let for Firestore override (streaming)
const supportersRoutes = fallback4;
const advancedAnalyticsRoutes = fallback4;
let contentRoutes = fallback4; // Changed to let for Firestore override
let transcodeRoutes = fallback4;  // Changed to let for Firestore override
let metricsRoutes = fallback4;     // Changed to let for Firestore override
let moderationRoutes = fallback4;  // Changed to let for Firestore override
const rightsRoutes = fallback4;
const recommendationRoutes = fallback4;
let feedRoutes = fallback4; // Changed to let for Firestore override
let trendingRoutes = fallback4;    // Changed to let for Firestore override
let playerRoutes = fallback4; // Changed to let for Firestore override

// Phase 11-15 routes (Firestore migration complete for critical routes)
let messagingRoutes, storiesRoutes, commentsRoutes, notificationsRoutes;
let pkBattlesRoutes, multiHostRoutes, liveShoppingRoutes, streamFiltersRoutes, webrtcRoutes;
let aiRoutes, monetizationRoutes, uploadRoutes, soundsRoutes, giftsRoutes, walletsRoutes;
let activityRoutes;

// Load Firestore routes for unmigrated features
let cartRoutes_firestore, categoriesRoutes_firestore, contentRoutes_firestore;
let commentsRoutes_firestore, feedRoutes_firestore, messagingRoutes_firestore;
let streamingRoutes_firestore, playerRoutes_firestore, uploadsRoutes_firestore, paymentsRoutes_firestore;

// Load migrated Firestore routes (these work without MongoDB)
try {
  storiesRoutes = require('./routes/stories'); // ✅ Migrated to Firestore
  console.log('✅ Stories routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Stories routes error:', error.message);
  storiesRoutes = createFallbackRouter();
}

try {
  walletsRoutes = require('./routes/wallets-firestore'); // ✅ Migrated to Firestore
  console.log('✅ Wallets routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Wallets routes error:', error.message);
  walletsRoutes = createFallbackRouter();
}

// Messaging, comments, notifications already migrated (from previous work)
try {
  messagingRoutes = require('./routes/messaging-firestore');
  console.log('✅ Messaging routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Messaging routes error:', error.message);
  messagingRoutes = createFallbackRouter();
}

try {
  commentsRoutes = require('./routes/comments-firestore');
  console.log('✅ Comments routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Comments routes error:', error.message);
  commentsRoutes = createFallbackRouter();
}

try {
  notificationsRoutes = require('./routes/notifications-firestore');
  console.log('✅ Notifications routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Notifications routes error:', error.message);
  notificationsRoutes = createFallbackRouter();
}

// Load stub Firestore routes for admin dashboard (return empty data instead of 503)
try {
  monetizationRoutes = require('./routes/monetization-firestore');
  console.log('✅ Monetization routes loaded (Firestore stub)');
} catch (error) {
  console.error('⚠️ Monetization routes error:', error.message);
  monetizationRoutes = createFallbackRouter();
}

try {
  soundsRoutes = require('./routes/sounds-firestore');
  console.log('✅ Sounds routes loaded (Firestore stub)');
} catch (error) {
  console.error('⚠️ Sounds routes error:', error.message);
  soundsRoutes = createFallbackRouter();
}

// Load other critical admin routes (reuse existing variables, don't redeclare)
// Load each route individually to prevent one failure from affecting others
try {
  moderationRoutes = require('./routes/moderation-firestore');
  console.log('✅ Moderation routes loaded');
} catch (error) {
  console.error('⚠️ Moderation routes error:', error.message);
}

try {
  settingsRoutes = require('./routes/settings-firestore');
  console.log('✅ Settings routes loaded');
} catch (error) {
  console.error('⚠️ Settings routes error:', error.message);
}

try {
  transcodeRoutes = require('./routes/transcode-firestore');
  console.log('✅ Transcode routes loaded');
} catch (error) {
  console.error('⚠️ Transcode routes error:', error.message);
}

try {
  trendingRoutes = require('./routes/trending-firestore');
  console.log('✅ Trending routes loaded');
} catch (error) {
  console.error('⚠️ Trending routes error:', error.message);
}

try {
  analyticsRoutes = require('./routes/analytics-firestore');
  console.log('✅ Analytics routes loaded');
} catch (error) {
  console.error('⚠️ Analytics routes error:', error.message);
}

try {
  metricsRoutes = require('./routes/metrics-firestore');
  console.log('✅ Metrics routes loaded');
} catch (error) {
  console.error('⚠️ Metrics routes error:', error.message);
}

// Load new Firestore routes for unmigrated features
try {
  cartRoutes = require('./routes/cart-firestore');
  console.log('✅ Cart routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Cart routes error:', error.message);
}

try {
  categoriesRoutes_firestore = require('./routes/categories-firestore');
  categoryRoutes = categoriesRoutes_firestore;
  console.log('✅ Categories routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Categories routes error:', error.message);
}

try {
  contentRoutes = require('./routes/content-firestore');
  console.log('✅ Content routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Content routes error:', error.message);
  console.error('⚠️ Content routes stack:', error.stack);
  // Keep fallback router if load fails
  contentRoutes = fallback4;
}

try {
  commentsRoutes_firestore = require('./routes/comments-firestore');
  commentsRoutes = commentsRoutes_firestore;
  console.log('✅ Comments routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Comments routes error:', error.message);
}

try {
  feedRoutes = require('./routes/feed-firestore');
  console.log('✅ Feed routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Feed routes error:', error.message);
  console.error('⚠️ Feed routes stack:', error.stack);
  // Keep fallback router if load fails
  feedRoutes = fallback4;
}

try {
  messagingRoutes_firestore = require('./routes/messaging-firestore');
  messagingRoutes = messagingRoutes_firestore;
  console.log('✅ Messaging routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Messaging routes error:', error.message);
}

try {
  streamingRoutes_firestore = require('./routes/streaming-firestore');
  streamProviderRoutes = streamingRoutes_firestore;
  livestreamRoutes = streamingRoutes_firestore;
  console.log('✅ Streaming routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Streaming routes error:', error.message);
}

try {
  playerRoutes = require('./routes/player-firestore');
  console.log('✅ Player routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Player routes error:', error.message);
}

try {
  uploadsRoutes_firestore = require('./routes/uploads-firestore');
  uploadRoutes = uploadsRoutes_firestore;
  console.log('✅ Uploads routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Uploads routes error:', error.message);
}

try {
  paymentsRoutes_firestore = require('./routes/payments-firestore');
  paymentRoutes = paymentsRoutes_firestore;
  console.log('✅ Payments routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Payments routes error:', error.message);
}

// Routes still needing full migration (return fallback 503)
const fallback5 = createFallbackRouter();
pkBattlesRoutes = fallback5;
multiHostRoutes = fallback5;
liveShoppingRoutes = fallback5;
streamFiltersRoutes = fallback5;
webrtcRoutes = fallback5;
aiRoutes = fallback5;
// uploadRoutes is set above from Firestore routes, don't overwrite
giftsRoutes = fallback5;
activityRoutes = fallback5;

const app = express();

// Trust proxy setting (fixes rate limiting warning)
app.set('trust proxy', 1);

// CORS configuration
// Production: Restrict to specific domains
// Development: Allow localhost and common hosting platforms
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction ? [
  // Production domains only
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  'https://mixillo.firebaseapp.com',
  'https://mixillo.web.app',
  // Add your production domains here
].filter(Boolean) : [
  // Development - allow localhost and common hosting platforms
  'http://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  // Allow Firebase Hosting domains
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
  // Allow common hosting platforms for development
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.github\.io$/,
  /^https:\/\/.*\.amplifyapp\.com$/,
  /^https:\/\/.*\.cloudfront\.net$/,
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

// Rate limiting (configurable for live testing)
const allowlist = (process.env.RATE_LIMIT_ALLOWLIST || '')
  .split(',')
  .map(ip => ip.trim())
  .filter(Boolean);

function isAllowlistedIp(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  if (!ip) return false;
  // Normalize IPv6-mapped IPv4 like ::ffff:1.2.3.4
  const normalized = typeof ip === 'string' && ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
  return allowlist.includes(normalized);
}

const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000)),
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAllowlistedIp(req)
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
app.use('/api/auth', authRoutes); // Legacy JWT auth (for backward compatibility)
app.use('/api/auth/firebase', authFirebaseRoutes); // New Firebase Auth routes
app.use('/api/users', require('./routes/users-firestore')); // Public user routes
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', require('./routes/admin/users')); // Admin user management

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

// Settings & Audit API routes (Firestore)
app.use('/api/settings', settingsRoutes); // ✅ Firestore stub
app.use('/api/audit-logs', auditLogsRoutes);

// i18n API routes
app.use('/api/languages', languageRoutes);
app.use('/api/translations', translationRoutes);

// Streaming API routes (Firestore)
app.use('/api/streaming', streamProviderRoutes); // Handles both /providers and /livestreams

// CMS API routes
app.use('/api/cms', cmsRoutes);
app.use('/api/banners', bannersRoutes);

// Supporters API routes
app.use('/api/supporters', supportersRoutes);

// Content Management API routes
app.use('/api/content', contentRoutes);

// Transcode Management API routes (Firestore)
app.use('/api/transcode', transcodeRoutes); // ✅ Firestore stub

// Metrics & Analytics API routes (Firestore)
app.use('/api/metrics', metricsRoutes); // ✅ Firestore stub

// Moderation API routes (Firestore)
app.use('/api/moderation', moderationRoutes); // ✅ Firestore stub

// Rights Management API routes
app.use('/api/rights', rightsRoutes);

// Recommendation Engine API routes (Firestore)
try {
  recommendationRoutes = require('./routes/recommendations-firestore');
  console.log('✅ Recommendations routes loaded (Firestore)');
} catch (error) {
  console.error('⚠️ Recommendations routes error:', error.message);
  console.error('⚠️ Recommendations routes stack:', error.stack);
  // Keep fallback router if load fails
  recommendationRoutes = fallback4;
}
app.use('/api/recommendations', recommendationRoutes);

// Personalized Feed API routes
app.use('/api/feed', feedRoutes);

// Search API routes (Firestore)
app.use('/api/search', require('./routes/search-firestore'));

// Trending & Explore API routes (Firestore)
app.use('/api/trending', trendingRoutes); // ✅ Firestore stub

// Player & Streaming API routes
app.use('/api/player', playerRoutes);

// Phase 11: Social Features API routes (Firestore)
app.use('/api/messaging', messagingRoutes); // ✅ Firestore
app.use('/api/stories', storiesRoutes); // ✅ Firestore
app.use('/api/comments', commentsRoutes); // ✅ Firestore
app.use('/api/notifications', notificationsRoutes); // ✅ Firestore

// Phase 12: Advanced Live Streaming API routes (TODO: migrate)
app.use('/api/pk-battles', pkBattlesRoutes);
app.use('/api/multihost', multiHostRoutes);
app.use('/api/live-shopping', liveShoppingRoutes);
app.use('/api/stream-filters', streamFiltersRoutes);
app.use('/api/webrtc', webrtcRoutes);

// Phase 13: AI Services & Creator Monetization API routes
app.use('/api/ai', aiRoutes);
app.use('/api/monetization', monetizationRoutes); // ✅ Firestore stub

// Phase 14: Camera & Media Management API routes
app.use('/api/uploads', uploadRoutes);
app.use('/api/sounds', soundsRoutes); // ✅ Firestore stub
app.use('/api/gifts', giftsRoutes);
app.use('/api/wallets', walletsRoutes); // ✅ Firestore

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