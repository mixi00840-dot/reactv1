/**
 * Modified app.js with MongoDB support (Dual Database Mode)
 * 
 * This file adds MongoDB routes alongside existing Firebase/Firestore routes
 * Database mode controlled by DATABASE_MODE environment variable:
 * - 'firebase' = Firebase only (current)
 * - 'mongodb' = MongoDB only
 * - 'dual' = Both (migration mode)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database connectors
const { connectMongoDB, getConnectionStatus } = require('./utils/mongodb'); // MongoDB

// Get database mode from environment (force MongoDB-only)
const DB_MODE = process.env.DATABASE_MODE || 'mongodb';

console.log(`\n🗄️  DATABASE MODE: ${DB_MODE.toUpperCase()}`);

// MongoDB-only mode - No Firebase imports

// Import all MongoDB routes
const authMongoRoutes = require('./routes/auth-mongodb');
const usersMongoRoutes = require('./routes/users-mongodb');
const contentMongoRoutes = require('./routes/content-mongodb');
const adminMongoRoutes = require('./routes/admin-mongodb');
const productsMongoRoutes = require('./routes/products-mongodb');
const storesMongoRoutes = require('./routes/stores-mongodb');
const ordersMongoRoutes = require('./routes/orders-mongodb');
const walletsMongoRoutes = require('./routes/wallets-mongodb');
const giftsMongoRoutes = require('./routes/gifts-mongodb');
const storiesMongoRoutes = require('./routes/stories-mongodb');
const notificationsMongoRoutes = require('./routes/notifications-mongodb');
const messagingMongoRoutes = require('./routes/messaging-mongodb');
const commentsMongoRoutes = require('./routes/comments-mongodb');
const searchMongoRoutes = require('./routes/search-mongodb');
const settingsMongoRoutes = require('./routes/settings-mongodb');
const analyticsMongoRoutes = require('./routes/analytics-mongodb');
const moderationMongoRoutes = require('./routes/moderation-mongodb');
const streamingMongoRoutes = require('./routes/streaming-mongodb');
const uploadsMongoRoutes = require('./routes/uploads-mongodb');
const paymentsMongoRoutes = require('./routes/payments-mongodb');
const trendingMongoRoutes = require('./routes/trending-mongodb');
const metricsMongoRoutes = require('./routes/metrics-mongodb');
const soundsMongoRoutes = require('./routes/sounds-mongodb');
const reportsMongoRoutes = require('./routes/reports-mongodb');
const recommendationsMongoRoutes = require('./routes/recommendations-mongodb');
const feedMongoRoutes = require('./routes/feed-mongodb');
const categoriesMongoRoutes = require('./routes/categories-mongodb');
const cartMongoRoutes = require('./routes/cart-mongodb');
const livestreamingMongoRoutes = require('./routes/livestreaming-mongodb');

// ... (rest of existing route imports)

const app = express();

// Trust proxy setting
app.set('trust proxy', 1);

// CORS configuration (same as existing)
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction ? [
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  'https://mixillo.firebaseapp.com',
  'https://mixillo.web.app',
].filter(Boolean) : [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.ADMIN_DASHBOARD_URL,
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.github\.io$/,
  /^https:\/\/.*\.amplifyapp\.com$/,
  /^https:\/\/.*\.cloudfront\.net$/,
  /^https:\/\/.*\.run\.app$/
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
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

app.options('*', cors());

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const allowlist = (process.env.RATE_LIMIT_ALLOWLIST || '').split(',').map(ip => ip.trim()).filter(Boolean);

function isAllowlistedIp(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  if (!ip) return false;
  const normalized = typeof ip === 'string' && ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
  return allowlist.includes(normalized);
}

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAllowlistedIp(req)
});

app.use(limiter);

// Initialize MongoDB database
const initDatabases = async () => {
  try {
    await connectMongoDB();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Health check endpoint - MongoDB-only
app.get('/health', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.json({
    success: true,
    status: 'ok',
    message: 'Mixillo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: 'MongoDB',
    databaseMode: 'mongodb',
    mongodb: {
      connected: mongoStatus.isConnected,
      database: mongoStatus.database,
      host: mongoStatus.host
    }
  });
});

// Database status endpoint
app.get('/database-status', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.json({
    success: true,
    mode: DB_MODE,
    firebase: {
      available: DB_MODE === 'firebase' || DB_MODE === 'dual',
      project: process.env.FIREBASE_PROJECT_ID || 'mixillo'
    },
    mongodb: {
      available: DB_MODE === 'mongodb' || DB_MODE === 'dual',
      connected: mongoStatus.isConnected,
      database: mongoStatus.database,
      host: mongoStatus.host,
      readyState: mongoStatus.readyState
    }
  });
});

// API ROUTES - MongoDB Only

// Authentication Routes
app.use('/api/auth/mongodb', authMongoRoutes);
app.use('/api/auth', authMongoRoutes); // Default to MongoDB

// User Routes
app.use('/api/users/mongodb', usersMongoRoutes);
app.use('/api/users', usersMongoRoutes); // Default to MongoDB

// Admin Routes
app.use('/api/admin/mongodb', adminMongoRoutes);
app.use('/api/admin', adminMongoRoutes); // Default to MongoDB

// Content Routes
app.use('/api/content/mongodb', contentMongoRoutes);
app.use('/api/content', contentMongoRoutes); // Default to MongoDB

// E-commerce Routes
app.use('/api/products/mongodb', productsMongoRoutes);
app.use('/api/products', productsMongoRoutes); // Default to MongoDB

app.use('/api/stores/mongodb', storesMongoRoutes);
app.use('/api/stores', storesMongoRoutes); // Default to MongoDB

app.use('/api/orders/mongodb', ordersMongoRoutes);
app.use('/api/orders', ordersMongoRoutes); // Default to MongoDB

// Finance Routes
app.use('/api/wallets/mongodb', walletsMongoRoutes);
app.use('/api/wallets', walletsMongoRoutes); // Default to MongoDB

// Social & Content Routes
app.use('/api/stories/mongodb', storiesMongoRoutes);
app.use('/api/stories', storiesMongoRoutes); // Default to MongoDB

app.use('/api/comments/mongodb', commentsMongoRoutes);
app.use('/api/comments', commentsMongoRoutes); // Default to MongoDB

app.use('/api/gifts/mongodb', giftsMongoRoutes);
app.use('/api/gifts', giftsMongoRoutes); // Default to MongoDB

// Communication Routes
app.use('/api/notifications/mongodb', notificationsMongoRoutes);
app.use('/api/notifications', notificationsMongoRoutes); // Default to MongoDB

app.use('/api/messaging/mongodb', messagingMongoRoutes);
app.use('/api/messaging', messagingMongoRoutes); // Default to MongoDB

// Utility Routes
app.use('/api/search/mongodb', searchMongoRoutes);
app.use('/api/search', searchMongoRoutes); // Default to MongoDB

app.use('/api/settings/mongodb', settingsMongoRoutes);
app.use('/api/settings', settingsMongoRoutes); // Default to MongoDB

app.use('/api/analytics/mongodb', analyticsMongoRoutes);
app.use('/api/analytics', analyticsMongoRoutes); // Default to MongoDB

app.use('/api/moderation/mongodb', moderationMongoRoutes);
app.use('/api/moderation', moderationMongoRoutes); // Default to MongoDB

app.use('/api/streaming/mongodb', streamingMongoRoutes);
app.use('/api/streaming', streamingMongoRoutes); // Default to MongoDB

app.use('/api/uploads/mongodb', uploadsMongoRoutes);
app.use('/api/uploads', uploadsMongoRoutes); // Default to MongoDB

// Payment & Transaction Routes
app.use('/api/payments/mongodb', paymentsMongoRoutes);
app.use('/api/payments', paymentsMongoRoutes);

// Discovery & Recommendation Routes
app.use('/api/trending/mongodb', trendingMongoRoutes);
app.use('/api/trending', trendingMongoRoutes);

app.use('/api/recommendations/mongodb', recommendationsMongoRoutes);
app.use('/api/recommendations', recommendationsMongoRoutes);

app.use('/api/feed/mongodb', feedMongoRoutes);
app.use('/api/feed', feedMongoRoutes);

// Media & Content Routes
app.use('/api/sounds/mongodb', soundsMongoRoutes);
app.use('/api/sounds', soundsMongoRoutes);

app.use('/api/categories/mongodb', categoriesMongoRoutes);
app.use('/api/categories', categoriesMongoRoutes);

app.use('/api/livestreaming/mongodb', livestreamingMongoRoutes);
app.use('/api/livestreaming', livestreamingMongoRoutes);

// System Routes
app.use('/api/metrics/mongodb', metricsMongoRoutes);
app.use('/api/metrics', metricsMongoRoutes);

app.use('/api/reports/mongodb', reportsMongoRoutes);
app.use('/api/reports', reportsMongoRoutes);

app.use('/api/cart/mongodb', cartMongoRoutes);
app.use('/api/cart', cartMongoRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    hint: 'Check the endpoint path or refer to API documentation'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize databases on startup
initDatabases().catch(error => {
  console.error('❌ Database initialization failed:', error);
  if (DB_MODE === 'mongodb') {
    process.exit(1); // Exit if MongoDB-only mode fails
  }
});

module.exports = app;

