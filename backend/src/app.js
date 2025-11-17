const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// MongoDB connection
const { connectMongoDB, getConnectionStatus } = require('./utils/mongodb');
console.log('🗄️  DATABASE MODE: MONGODB');

const app = express();

// Trust proxy for Cloud Run
app.set('trust proxy', 1);

// ============================================
// CORS CONFIGURATION (FIXED)
// ============================================
const allowedOrigins = [
  // Flutter app (mobile - no origin)
  null,
  undefined,
  // Admin Dashboard - New Next.js App
  'https://admin-h7z7jg1bh-mixillo.vercel.app',
  'https://admin-9hqxherz6-mixillo.vercel.app',
  'https://admin-jggx36g20-mixillo.vercel.app',
  'https://admin-2n34mu7q9-mixillo.vercel.app',
  'https://admin-4wfbzub9f-mixillo.vercel.app',
  'https://admin-bik62iogq-mixillo.vercel.app',
  'https://admin-app-mixillo.vercel.app',
  // Admin Dashboard - Legacy
  'https://admin-dashboard-mixillo.vercel.app',
  'https://admin-dashboard-ljva3eivh-mixillo.vercel.app',
  'https://mixillo-admin.netlify.app',
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  // Hosting platforms
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
  /^https:\/\/.*\.amplifyapp\.com$/,
  /^https:\/\/.*\.run\.app$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Mobile apps and curl have no origin
    if (!origin) return callback(null, true);
    
    // Check allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === null || allowed === undefined) return !origin;
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed:', origin);
      callback(null, true);
    } else {
      const strict = String(process.env.CORS_STRICT || '').toLowerCase() === 'true';
      if (strict) {
        console.log('⛔ CORS blocked (strict mode):', origin);
        callback(new Error('Origin not allowed by CORS'));
      } else {
        console.log('⚠️  CORS not in allowlist (allowing anyway):', origin);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.options('*', cors());

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ============================================
// RATE LIMITING - PRODUCTION-READY CONFIGURATION
// ============================================

// Global API rate limiting (generous for dashboards, strict enough for security)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '2000'), // 2000 requests per 15min (admin needs high limit)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for:
    // 1. Admin routes (need high throughput for dashboards)
    // 2. Health checks
    // 3. Webhooks
    return req.path.startsWith('/admin/') || 
           req.path === '/health' ||
           req.path.includes('/webhooks/') ||
           req.path.includes('/realtime/');
  },
  // Custom key generator to handle proxies correctly
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});
app.use('/api', limiter);

// Auth endpoints - stricter but still reasonable
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '50'), // 50 login attempts per 15min
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});
app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize MongoDB
connectMongoDB().then(() => {
  console.log('✅ MongoDB connected');
}).catch(error => {
  console.error('❌ MongoDB connection error:', error.message);
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================
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

app.get('/api/health/db', (req, res) => {
  const mongoStatus = getConnectionStatus();
  res.status(mongoStatus.isConnected ? 200 : 503).json({
    status: mongoStatus.isConnected ? 'ok' : 'error',
    database: 'MongoDB',
    connected: mongoStatus.isConnected,
    message: mongoStatus.isConnected ? 'MongoDB connected' : 'MongoDB disconnected'
  });
});

// ============================================
// API ROUTES (CLEAN - NO DUPLICATES)
// ============================================

console.log('\n🔄 Loading API routes...\n');

// Authentication
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/auth/mongodb', authRoutes); // Compatibility for legacy dashboard client
console.log('✅ /api/auth (Authentication) + /api/auth/mongodb (Legacy Compatibility)');

// Users
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
console.log('✅ /api/users (User Management & Profile)');

// Admin
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
console.log('✅ /api/admin (Admin Panel)');

// Admin Dashboard Stats
try {
  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/admin/dashboard', dashboardRoutes);
  console.log('✅ /api/admin/dashboard (Dashboard Stats)');
} catch (error) {
  console.warn('⚠️  Dashboard routes skipped:', error.message);
}

// Admin Realtime Stats
try {
  const realtimeRoutes = require('./routes/admin/realtime');
  app.use('/api/admin/realtime', realtimeRoutes);
  console.log('✅ /api/admin/realtime (Real-time Statistics)');
} catch (error) {
  console.warn('⚠️  Realtime routes skipped:', error.message);
}

// Admin Cache Monitoring
try {
  const cacheRoutes = require('./routes/admin/cache');
  app.use('/api/admin/cache', cacheRoutes);
  console.log('✅ /api/admin/cache (Cache Statistics)');
} catch (error) {
  console.warn('⚠️  Cache routes skipped:', error.message);
}

// Admin AI Monitoring
try {
  const aiRoutes = require('./routes/admin/ai');
  app.use('/api/admin/ai', aiRoutes);
  console.log('✅ /api/admin/ai (AI Usage Monitoring)');
} catch (error) {
  console.warn('⚠️  AI monitoring routes skipped:', error.message);
}

// Admin User Management (separate routes)
const adminUsersRoutes = require('./routes/admin/users');
app.use('/api/admin/users', adminUsersRoutes);
console.log('✅ /api/admin/users (Admin User Management)');

// Admin Coin Packages (alias for /api/coins/admin/coin-packages)
try {
  const adminCoinPackagesRoutes = require('./routes/admin/coin-packages');
  app.use('/api/admin/coin-packages', adminCoinPackagesRoutes);
  console.log('✅ /api/admin/coin-packages (Coin Packages - Admin Alias)');
} catch (error) {
  console.warn('⚠️  Admin coin packages routes skipped:', error.message);
}

// Database Monitoring (Admin)
try {
  const databaseRoutes = require('./routes/database');
  app.use('/api/admin/database', databaseRoutes);
  app.use('/api/database/admin', databaseRoutes); // Alias for reversed path
  console.log('✅ /api/admin/database + /api/database/admin (Database Monitoring)');
} catch (error) {
  console.warn('⚠️  Database routes skipped:', error.message);
}

// Banners
try {
  const bannersRoutes = require('./routes/banners');
  app.use('/api/banners', bannersRoutes);
  console.log('✅ /api/banners');
} catch (error) {
  console.warn('⚠️  Banners routes skipped:', error.message);
}

// Content (Videos/Posts)
try {
  const contentRoutes = require('./routes/content');
  app.use('/api/content', contentRoutes);
  app.use('/api/posts', contentRoutes); // Alias for compatibility
  console.log('✅ /api/content (Videos/Posts) + /api/posts (alias)');
} catch (error) {
  console.warn('⚠️  Content routes skipped:', error.message);
}

// Comments
try {
  const commentsRoutes = require('./routes/comments');
  app.use('/api/comments', commentsRoutes);
  console.log('✅ /api/comments');
} catch (error) {
  console.warn('⚠️  Comments routes skipped:', error.message);
}

// Stories
try {
  const storiesRoutes = require('./routes/stories');
  app.use('/api/stories', storiesRoutes);
  console.log('✅ /api/stories');
} catch (error) {
  console.warn('⚠️  Stories routes skipped:', error.message);
}

// Notifications
try {
  const notificationsRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationsRoutes);
  console.log('✅ /api/notifications');
} catch (error) {
  console.warn('⚠️  Notifications routes skipped:', error.message);
}

// Messaging
try {
  const messagingRoutes = require('./routes/messaging');
  app.use('/api/messaging', messagingRoutes);
  console.log('✅ /api/messaging');
} catch (error) {
  console.warn('⚠️  Messaging routes skipped:', error.message);
}

// Wallets
try {
  const walletsRoutes = require('./routes/wallets');
  app.use('/api/wallets', walletsRoutes);
  app.use('/api/wallet', walletsRoutes); // Alias for singular form
  console.log('✅ /api/wallets + /api/wallet (alias)');
} catch (error) {
  console.warn('⚠️  Wallets routes skipped:', error.message);
}

// Gifts
try {
  const giftsRoutes = require('./routes/gifts');
  app.use('/api/gifts', giftsRoutes);
  console.log('✅ /api/gifts');
} catch (error) {
  console.warn('⚠️  Gifts routes skipped:', error.message);
}

// Coins
try {
  const coinsRoutes = require('./routes/coins');
  app.use('/api/coins', coinsRoutes);
  console.log('✅ /api/coins');
} catch (error) {
  console.warn('⚠️  Coins routes skipped:', error.message);
}

// Livestreaming
try {
  const livestreamingRoutes = require('./routes/livestreaming');
  app.use('/api/live', livestreamingRoutes);
  console.log('✅ /api/live (Livestreaming)');
} catch (error) {
  console.warn('⚠️  Livestreaming routes skipped:', error.message);
}

// Products
try {
  const productsRoutes = require('./routes/products');
  app.use('/api/products', productsRoutes);
  console.log('✅ /api/products');
} catch (error) {
  console.warn('⚠️  Products routes skipped:', error.message);
}

// Stores
try {
  const storesRoutes = require('./routes/stores');
  app.use('/api/stores', storesRoutes);
  console.log('✅ /api/stores');
} catch (error) {
  console.warn('⚠️  Stores routes skipped:', error.message);
}

// Cart
try {
  const cartRoutes = require('./routes/cart');
  app.use('/api/cart', cartRoutes);
  console.log('✅ /api/cart');
} catch (error) {
  console.warn('⚠️  Cart routes skipped:', error.message);
}

// Orders
try {
  const ordersRoutes = require('./routes/orders');
  app.use('/api/orders', ordersRoutes);
  console.log('✅ /api/orders');
} catch (error) {
  console.warn('⚠️  Orders routes skipped:', error.message);
}

// Payments
try {
  const paymentsRoutes = require('./routes/payments');
  app.use('/api/payments', paymentsRoutes);
  console.log('✅ /api/payments');
} catch (error) {
  console.warn('⚠️  Payments routes skipped:', error.message);
}

// Categories
try {
  const categoriesRoutes = require('./routes/categories');
  app.use('/api/categories', categoriesRoutes);
  console.log('✅ /api/categories');
} catch (error) {
  console.warn('⚠️  Categories routes skipped:', error.message);
}

// Analytics
try {
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
  console.log('✅ /api/analytics');
} catch (error) {
  console.warn('⚠️  Analytics routes skipped:', error.message);
}

// Feed
try {
  const feedRoutes = require('./routes/feed');
  app.use('/api/feed', feedRoutes);
  console.log('✅ /api/feed');
} catch (error) {
  console.warn('⚠️  Feed routes skipped:', error.message);
}

// Search
try {
  const searchRoutes = require('./routes/search');
  app.use('/api/search', searchRoutes);
  console.log('✅ /api/search');
} catch (error) {
  console.warn('⚠️  Search routes skipped:', error.message);
}

// Trending
try {
  const trendingRoutes = require('./routes/trending');
  app.use('/api/trending', trendingRoutes);
  console.log('✅ /api/trending');
} catch (error) {
  console.warn('⚠️  Trending routes skipped:', error.message);
}

// Streaming
try {
  const streamingRoutes = require('./routes/streaming');
  app.use('/api/streaming', streamingRoutes);
  console.log('✅ /api/streaming');
} catch (error) {
  console.warn('⚠️  Streaming routes skipped:', error.message);
}

// Uploads
try {
  const uploadsRoutes = require('./routes/uploads');
  app.use('/api/uploads', uploadsRoutes);
  console.log('✅ /api/uploads');
} catch (error) {
  console.warn('⚠️  Uploads routes skipped:', error.message);
}

// Sounds
try {
  const soundsRoutes = require('./routes/sounds');
  app.use('/api/sounds', soundsRoutes);
  console.log('✅ /api/sounds');
} catch (error) {
  console.warn('⚠️  Sounds routes skipped:', error.message);
}

// Levels & Badges
try {
  const levelsRoutes = require('./routes/levels');
  app.use('/api/levels', levelsRoutes);
  console.log('✅ /api/levels');
} catch (error) {
  console.warn('⚠️  Levels routes skipped:', error.message);
}

// Featured Content
try {
  const featuredRoutes = require('./routes/featured');
  app.use('/api/featured', featuredRoutes);
  console.log('✅ /api/featured');
} catch (error) {
  console.warn('⚠️  Featured routes skipped:', error.message);
}

// Reports
try {
  const reportsRoutes = require('./routes/reports');
  app.use('/api/reports', reportsRoutes);
  console.log('✅ /api/reports');
} catch (error) {
  console.warn('⚠️  Reports routes skipped:', error.message);
}

// Moderation
try {
  const moderationRoutes = require('./routes/moderation');
  app.use('/api/moderation', moderationRoutes);
  console.log('✅ /api/moderation');
} catch (error) {
  console.warn('⚠️  Moderation routes skipped:', error.message);
}

// Settings
try {
  const settingsRoutes = require('./routes/settings');
  app.use('/api/settings', settingsRoutes);
  console.log('✅ /api/settings');
} catch (error) {
  console.warn('⚠️  Settings routes skipped:', error.message);
}

// Explorer (Admin)
try {
  const explorerRoutes = require('./routes/explorer');
  app.use('/api/admin/explorer', explorerRoutes);
  console.log('✅ /api/admin/explorer (Explorer Management)');
} catch (error) {
  console.warn('⚠️  Explorer routes skipped:', error.message);
}

// Recommendations
try {
  const recommendationsRoutes = require('./routes/recommendations');
  app.use('/api/recommendations', recommendationsRoutes);
  console.log('✅ /api/recommendations');
} catch (error) {
  console.warn('⚠️  Recommendations routes skipped:', error.message);
}

// Metrics
try {
  const metricsRoutes = require('./routes/metrics');
  app.use('/api/metrics', metricsRoutes);
  console.log('✅ /api/metrics');
} catch (error) {
  console.warn('⚠️  Metrics routes skipped:', error.message);
}

// Agora (Live Streaming)
try {
  const agoraRoutes = require('./routes/agora');
  app.use('/api/agora', agoraRoutes);
  console.log('✅ /api/agora');
} catch (error) {
  console.warn('⚠️  Agora routes skipped:', error.message);
}

// ZegoCloud (Live Streaming)
try {
  const zegocloudRoutes = require('./routes/zegocloud');
  app.use('/api/zegocloud', zegocloudRoutes);
  console.log('✅ /api/zegocloud');
} catch (error) {
  console.warn('⚠️  ZegoCloud routes skipped:', error.message);
}

// Config (App Configuration)
try {
  const configRoutes = require('./routes/config');
  app.use('/api/config', configRoutes);
  console.log('✅ /api/config');
} catch (error) {
  console.warn('⚠️  Config routes skipped:', error.message);
}

// System Health
try {
  const systemRoutes = require('./routes/system');
  app.use('/api', systemRoutes);
  console.log('✅ /api/system (System Health)');
} catch (error) {
  console.warn('⚠️  System routes skipped:', error.message);
}

// Cloudinary Management
try {
  const cloudinaryRoutes = require('./routes/cloudinary');
  app.use('/api', cloudinaryRoutes);
  console.log('✅ /api/cloudinary');
} catch (error) {
  console.warn('⚠️  Cloudinary routes skipped:', error.message);
}

// Cloudinary Webhooks
try {
  const cloudinaryWebhookRoutes = require('./routes/webhooks/cloudinary');
  app.use('/api/webhooks/cloudinary', cloudinaryWebhookRoutes);
  console.log('✅ /api/webhooks/cloudinary');
} catch (error) {
  console.warn('⚠️  Cloudinary webhooks skipped:', error.message);
}

// Translations
try {
  const translationsRoutes = require('./routes/translations');
  app.use('/api/translations', translationsRoutes);
  console.log('✅ /api/translations');
} catch (error) {
  console.warn('⚠️  Translations routes skipped:', error.message);
}

// Currencies
try {
  const currenciesRoutes = require('./routes/currencies');
  app.use('/api/currencies', currenciesRoutes);
  console.log('✅ /api/currencies');
} catch (error) {
  console.warn('⚠️  Currencies routes skipped:', error.message);
}

// Coupons
try {
  const couponsRoutes = require('./routes/coupons');
  app.use('/api/coupons', couponsRoutes);
  console.log('✅ /api/coupons');
} catch (error) {
  console.warn('⚠️  Coupons routes skipped:', error.message);
}

// Customer Service/Support
try {
  const customerServiceRoutes = require('./routes/customerService');
  app.use('/api/support', customerServiceRoutes);
  console.log('✅ /api/support');
} catch (error) {
  console.warn('⚠️  Customer service routes skipped:', error.message);
}

// Shipping
try {
  const shippingRoutes = require('./routes/shipping');
  app.use('/api/shipping', shippingRoutes);
  console.log('✅ /api/shipping');
} catch (error) {
  console.warn('⚠️  Shipping routes skipped:', error.message);
}

// Tags
try {
  const tagsRoutes = require('./routes/tags');
  app.use('/api/tags', tagsRoutes);
  console.log('✅ /api/tags');
} catch (error) {
  console.warn('⚠️  Tags routes skipped:', error.message);
}

// Monetization
try {
  const monetizationRoutes = require('./routes/monetization');
  app.use('/api/monetization', monetizationRoutes);
  console.log('✅ /api/monetization');
} catch (error) {
  console.warn('⚠️  Monetization routes skipped:', error.message);
}

// Livestreams
try {
  const livestreamsRoutes = require('./routes/livestreams');
  app.use('/api/livestreams', livestreamsRoutes);
  console.log('✅ /api/livestreams');
} catch (error) {
  console.warn('⚠️  Livestreams routes skipped:', error.message);
}

// Transcode
try {
  const transcodeRoutes = require('./routes/transcode');
  app.use('/api/transcode', transcodeRoutes);
  console.log('✅ /api/transcode');
} catch (error) {
  console.warn('⚠️  Transcode routes skipped:', error.message);
}

// Streaming Providers
try {
  const streamProvidersRoutes = require('./routes/streamProviders');
  app.use('/api/streaming/providers', streamProvidersRoutes);
  console.log('✅ /api/streaming/providers');
} catch (error) {
  console.warn('⚠️  Stream providers routes skipped:', error.message);
}

console.log('\n✅ All routes loaded successfully\n');

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
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
  
  // Token expired
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
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
