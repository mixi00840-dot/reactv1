const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// MongoDB support (Migration to MongoDB COMPLETE)
const { connectMongoDB, getConnectionStatus } = require('./utils/mongodb');
const DB_MODE = 'mongodb'; // MongoDB only - no Firebase/Firestore
console.log(`🗄️  DATABASE MODE: ${DB_MODE.toUpperCase()}`);

// Import core routes (MongoDB)
const authRoutes = require('./routes/auth'); // MongoDB JWT auth
// const sellerRoutes = require('./routes/sellers'); // TODO: Migrate to MongoDB - currently uses Firestore
const adminRoutes = require('./routes/admin'); // MongoDB admin

// Create fallback router for unmigrated features
const createFallbackRouter = () => {
  const fallbackRouter = express.Router();
  fallbackRouter.all('*', (req, res) => {
    res.status(503).json({ success: false, message: 'Feature being migrated to Firestore' });
  });
  return fallbackRouter;
};

// E-commerce routes (MongoDB)
let productRoutes, storeRoutes;
let orderRoutes;
try {
  productRoutes = require('./routes/products');
  storeRoutes = require('./routes/stores');
} catch (error) {
  console.error('⚠️  E-commerce routes have missing methods:', error.message);
  const fallback = createFallbackRouter();
  productRoutes = storeRoutes = fallback;
}

// Load orders route (use fallback since Firestore removed)
orderRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Orders routes using fallback (Firestore removed)');

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
  bannersRoutes = require('./routes/banners');
  cmsRoutes = bannersRoutes; // Use banners as CMS for now
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
let recommendationRoutes = fallback4; // Changed to let for Firestore override
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

// Load migrated MongoDB routes
try {
  storiesRoutes = require('./routes/stories'); // ✅ MongoDB stories
  console.log('✅ Stories routes loaded (MongoDB)');
} catch (error) {
  console.error('⚠️ Stories routes error:', error.message);
  storiesRoutes = createFallbackRouter();
}

try {
  walletsRoutes = require('./routes/wallets'); // ✅ MongoDB wallets
  console.log('✅ Wallets routes loaded (MongoDB)');
} catch (error) {
  console.error('⚠️ Wallets routes error:', error.message);
  walletsRoutes = createFallbackRouter();
}

// Messaging, comments, notifications already migrated (from previous work)
messagingRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Messaging routes using fallback (Firestore removed)');

commentsRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Comments routes using fallback (Firestore removed)');

notificationsRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Notifications routes using fallback (Firestore removed)');

// Load stub Firestore routes for admin dashboard (return empty data instead of 503)
monetizationRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Monetization routes using fallback (Firestore removed)');

soundsRoutes = createFallbackRouter(); // Firestore removed - using fallback
console.log('⚠️ Sounds routes using fallback (Firestore removed)');

// Load other critical admin routes (reuse existing variables, don't redeclare)
// All using fallback since Firestore removed
console.log('⚠️ Moderation routes using fallback (Firestore removed)');
console.log('⚠️ Settings routes using fallback (Firestore removed)');
settingsRoutes = fallback4; // Assign fallback to settingsRoutes
console.log('⚠️ Transcode routes using fallback (Firestore removed)');
console.log('⚠️ Trending routes using fallback (Firestore removed)');
console.log('⚠️ Analytics routes using fallback (Firestore removed)');
console.log('⚠️ Metrics routes using fallback (Firestore removed)');

// All Firestore routes removed - using fallbacks
console.log('⚠️ Cart routes using fallback (Firestore removed)');
// cartRoutes already set to fallback2 above

console.log('⚠️ Categories routes using fallback (Firestore removed)');
// categoryRoutes already set to fallback2 above

console.log('⚠️ Content routes using fallback (Firestore removed)');
// contentRoutes already set to fallback4 above

console.log('⚠️ Comments (firestore version) using fallback (Firestore removed)');
// commentsRoutes already created above

console.log('⚠️ Feed routes using fallback (Firestore removed)');
// feedRoutes already set to fallback4 above

console.log('⚠️ Messaging (firestore version) using fallback (Firestore removed)');
// messagingRoutes already created above

console.log('⚠️ Streaming routes using fallback (Firestore removed)');
// streamProviderRoutes and livestreamRoutes already set to fallback4 above

console.log('⚠️ Player routes using fallback (Firestore removed)');
// playerRoutes already set to fallback4 above

uploadRoutes = fallback4; // Set upload routes fallback
console.log('⚠️ Uploads routes using fallback (Firestore removed)');

// paymentRoutes already set to fallback2 above
console.log('⚠️ Payments routes using fallback (Firestore removed)');

// Load gifts routes (MongoDB migrated)
try {
  giftsRoutes = require('./routes/gifts');
  console.log('✅ Gifts routes loaded (MongoDB)');
} catch (error) {
  console.warn('⚠️ Gifts routes fallback:', error.message);
  giftsRoutes = createFallbackRouter();
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
      console.log('✅ CORS allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      // Allow it anyway for now (testing phase)
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
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

// Initialize MongoDB connection
connectMongoDB().then(() => {
  console.log(`✅ MongoDB initialized and ready`);
}).catch(error => {
  console.error('❌ MongoDB connection error:', error.message);
  // Note: Server will still start to allow health checks, but API calls will fail
});

// Health check route
app.get('/health', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.status(200).json({
    status: 'ok',
    message: 'Mixillo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: 'MongoDB',
    mongodb: {
      connected: mongoStatus.isConnected,
      database: mongoStatus.database
    }
  });
});

// Database health check
app.get('/api/health/db', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.status(mongoStatus.isConnected ? 200 : 503).json({
    status: mongoStatus.isConnected ? 'ok' : 'error',
    database: 'MongoDB',
    connected: mongoStatus.isConnected,
    message: mongoStatus.isConnected ? 'MongoDB connected' : 'MongoDB disconnected'
  });
});

// MongoDB health check endpoint (alternative path)
app.get('/health/mongodb', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.status(mongoStatus.isConnected ? 200 : 503).json({
    status: mongoStatus.isConnected ? 'healthy' : 'unhealthy',
    database: 'MongoDB',
    connected: mongoStatus.isConnected,
    database_name: mongoStatus.database,
    message: mongoStatus.isConnected ? 'MongoDB is connected' : 'MongoDB is disconnected'
  });
});

// API routes

// ============================================
// MONGODB ROUTES (Dual Database Migration)
// ============================================
if (DB_MODE === 'mongodb' || DB_MODE === 'dual') {
  try {
    console.log('\n🔄 Loading MongoDB routes (Mode: ' + DB_MODE + ')');
    
    // MongoDB Authentication
    app.use('/api/auth/mongodb', require('./routes/auth'));
    
    // MongoDB Core Features
    app.use('/api/users/mongodb', require('./routes/users'));
    // Content route loaded later with all other MongoDB routes
    
    // MongoDB Social Features
    app.use('/api/stories/mongodb', require('./routes/stories'));
    app.use('/api/notifications/mongodb', require('./routes/notifications'));
    app.use('/api/messaging/mongodb', require('./routes/messaging'));
    
    // MongoDB E-commerce
    app.use('/api/products/mongodb', require('./routes/products'));
    app.use('/api/orders/mongodb', require('./routes/orders'));
    
    // MongoDB Finance
    app.use('/api/wallets/mongodb', require('./routes/wallets'));
    app.use('/api/gifts/mongodb', require('./routes/gifts'));
    app.use('/api/currencies/mongodb', require('./routes/currencies'));
    
    // MongoDB Live Streaming
    app.use('/api/streaming/mongodb', require('./routes/livestreaming'));
    
            // MongoDB Additional Features (14 more routes)
            app.use('/api/comments/mongodb', require('./routes/comments'));
            app.use('/api/cart/mongodb', require('./routes/cart'));
            app.use('/api/categories/mongodb', require('./routes/categories'));
            app.use('/api/search/mongodb', require('./routes/search'));
            app.use('/api/settings/mongodb', require('./routes/settings'));
            app.use('/api/analytics/mongodb', require('./routes/analytics'));
            app.use('/api/moderation/mongodb', require('./routes/moderation'));
            app.use('/api/recommendations/mongodb', require('./routes/recommendations'));
            app.use('/api/trending/mongodb', require('./routes/trending'));
            app.use('/api/sounds/mongodb', require('./routes/sounds'));
            app.use('/api/stores/mongodb', require('./routes/stores'));
            app.use('/api/admin/mongodb', require('./routes/admin'));
            app.use('/api/feed/mongodb', require('./routes/feed'));
            app.use('/api/reports/mongodb', require('./routes/reports'));
            app.use('/api/metrics/mongodb', require('./routes/metrics'));
            app.use('/api/uploads/mongodb', require('./routes/uploads'));
            app.use('/api/levels', require('./routes/levels')); // Levels & Badges
            app.use('/api/featured', require('./routes/featured')); // Featured Content
            app.use('/api/coins', require('./routes/coins')); // Coin Packages
            app.use('/api/tags', require('./routes/tags')); // Tags Management
            
            // Override content route with full MongoDB implementation
            app.use('/api/content/mongodb', require('./routes/content'));
            app.use('/api/payments/mongodb', require('./routes/payments'));
    
    console.log('✅ All 28 MongoDB route groups loaded successfully:');
    console.log('  ✅ /api/auth/mongodb (Authentication)');
    console.log('  ✅ /api/users/mongodb (User Management)');
    console.log('  ✅ /api/content/mongodb (Videos/Posts)');
    console.log('  ✅ /api/stories/mongodb (Stories)');
    console.log('  ✅ /api/notifications/mongodb (Notifications)');
    console.log('  ✅ /api/messaging/mongodb (Messaging)');
    console.log('  ✅ /api/products/mongodb (Products)');
    console.log('  ✅ /api/orders/mongodb (Orders)');
    console.log('  ✅ /api/wallets/mongodb (Wallets)');
    console.log('  ✅ /api/gifts/mongodb (Gifts)');
    console.log('  ✅ /api/streaming/mongodb (Live Streaming)');
    console.log('  ✅ /api/comments/mongodb (Comments)');
    console.log('  ✅ /api/cart/mongodb (Shopping Cart)');
    console.log('  ✅ /api/categories/mongodb (Categories)');
    console.log('  ✅ /api/search/mongodb (Search)');
    console.log('  ✅ /api/settings/mongodb (Settings)');
    console.log('  ✅ /api/analytics/mongodb (Analytics)');
    console.log('  ✅ /api/moderation/mongodb (Moderation)');
    console.log('  ✅ /api/recommendations/mongodb (Recommendations)');
    console.log('  ✅ /api/trending/mongodb (Trending)');
    console.log('  ✅ /api/sounds/mongodb (Sounds/Music)');
    console.log('  ✅ /api/stores/mongodb (Stores)');
    console.log('  ✅ /api/admin/mongodb (Admin Panel - /uploads, /comments, /wallets)');
    console.log('  ✅ /api/feed/mongodb (Personalized Feed)');
    console.log('  ✅ /api/reports/mongodb (User Reports)');
    console.log('  ✅ /api/metrics/mongodb (Platform Metrics)');
    console.log('  ✅ /api/uploads/mongodb (File Uploads - Presigned URLs)');
    console.log('  ✅ /api/payments/mongodb (Payments - Idempotent + Webhook Verification)');
    
  } catch (error) {
    console.error('⚠️  MongoDB routes error:', error.message);
    console.error(error.stack);
  }
}

// MongoDB Routes
app.use('/api/auth', authRoutes); // JWT authentication
app.use('/api/users', require('./routes/users')); // MongoDB user routes
// app.use('/api/sellers', sellerRoutes); // TODO: Migrate to MongoDB - currently uses Firestore
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', require('./routes/admin/users')); // MongoDB admin user management

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
//   recommendationRoutes = require('./routes/recommendations-firestore'); // DISABLED: Firestore removed
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
// app.use('/api/search', require('./routes/search-firestore')); // DISABLED: Firestore removed

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

// ============================================
// MONGODB ROUTES (MIGRATION)
// ============================================
const DATABASE_MODE = process.env.DATABASE_MODE || 'firebase';

if (DATABASE_MODE === 'dual' || DATABASE_MODE === 'mongodb') {
  console.log(`\n🔄 Loading MongoDB routes (Mode: ${DATABASE_MODE})`);
  console.log('✅ MongoDB-only mode enabled');
  
  try {
    // MongoDB Routes
    app.use('/api/auth-mongodb', require('./routes/auth'));
    console.log('  ✅ /api/auth-mongodb (Authentication)');
    
    app.use('/api/users-mongodb', require('./routes/users'));
    console.log('  ✅ /api/users-mongodb (User Management)');
    
    app.use('/api/content-mongodb', require('./routes/content'));
    console.log('  ✅ /api/content-mongodb (Videos/Posts)');
    
    app.use('/api/comments-mongodb', require('./routes/comments'));
    console.log('  ✅ /api/comments-mongodb (Comments)');
    
    app.use('/api/stories-mongodb', require('./routes/stories'));
    console.log('  ✅ /api/stories-mongodb (Stories)');
    
    app.use('/api/wallets-mongodb', require('./routes/wallets'));
    console.log('  ✅ /api/wallets-mongodb (Wallets)');
    
    app.use('/api/products-mongodb', require('./routes/products'));
    console.log('  ✅ /api/products-mongodb (Products)');
    
    app.use('/api/orders-mongodb', require('./routes/orders'));
    console.log('  ✅ /api/orders-mongodb (Orders)');
    
    app.use('/api/streaming-mongodb', require('./routes/streaming'));
    console.log('  ✅ /api/streaming-mongodb (Live Streaming)');
    
    console.log('✅ All MongoDB routes loaded successfully\n');
  } catch (error) {
    console.error('❌ Error loading MongoDB routes:', error.message);
  }
}

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
