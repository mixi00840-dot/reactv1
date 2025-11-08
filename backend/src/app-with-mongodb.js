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
const firestoreDb = require('./utils/database'); // Firestore
const { connectMongoDB, getConnectionStatus } = require('./utils/mongodb'); // MongoDB
const { dualDb } = require('./middleware/dualDatabase'); // Dual database manager

// Get database mode from environment
const DB_MODE = process.env.DATABASE_MODE || 'firebase';

console.log(`\n🗄️  DATABASE MODE: ${DB_MODE.toUpperCase()}`);

// Import all existing routes (Firebase/Firestore)
const authRoutes = require('./routes/auth');
const authFirebaseRoutes = require('./routes/authFirebase');
const usersFirestoreRoutes = require('./routes/users-firestore');

// Import new MongoDB routes
const authMongoRoutes = require('./routes/auth-mongodb');
const usersMongoRoutes = require('./routes/users-mongodb');
const contentMongoRoutes = require('./routes/content-mongodb');

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

// Initialize databases based on mode
const initDatabases = async () => {
  if (DB_MODE === 'mongodb' || DB_MODE === 'dual') {
    try {
      await connectMongoDB();
      console.log('✅ MongoDB initialized for', DB_MODE, 'mode');
    } catch (error) {
      console.error('❌ MongoDB initialization failed:', error.message);
      if (DB_MODE === 'mongodb') {
        throw error; // MongoDB-only mode requires MongoDB
      }
    }
  }
  
  if (DB_MODE === 'firebase' || DB_MODE === 'dual') {
    console.log('✅ Firebase/Firestore initialized for', DB_MODE, 'mode');
  }
  
  if (DB_MODE === 'dual') {
    await dualDb.initialize();
    console.log('✅ Dual database manager initialized');
  }
};

// Health check endpoint - Enhanced with database info
app.get('/health', (req, res) => {
  const mongoStatus = getConnectionStatus();
  
  res.json({
    status: 'ok',
    message: 'Mixillo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: {
      mode: DB_MODE,
      firebase: DB_MODE === 'firebase' || DB_MODE === 'dual' ? 'connected' : 'disabled',
      mongodb: mongoStatus.isConnected ? 'connected' : 'disconnected',
      mongoDetails: DB_MODE === 'mongodb' || DB_MODE === 'dual' ? {
        database: mongoStatus.database,
        host: mongoStatus.host
      } : null
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

// API ROUTES

// Authentication Routes - Support both Firebase and MongoDB
if (DB_MODE === 'firebase' || DB_MODE === 'dual') {
  app.use('/api/auth', authRoutes); // Legacy JWT auth
  app.use('/api/auth/firebase', authFirebaseRoutes); // Firebase Auth
}

if (DB_MODE === 'mongodb' || DB_MODE === 'dual') {
  app.use('/api/auth/mongodb', authMongoRoutes); // MongoDB Auth (JWT)
}

// User Routes - Support both
if (DB_MODE === 'firebase' || DB_MODE === 'dual') {
  app.use('/api/users/firestore', usersFirestoreRoutes); // Firestore users (backward compatibility)
}

if (DB_MODE === 'mongodb' || DB_MODE === 'dual') {
  app.use('/api/users/mongodb', usersMongoRoutes); // MongoDB users
}

// Default users route (based on mode)
if (DB_MODE === 'mongodb') {
  app.use('/api/users', usersMongoRoutes);
} else {
  app.use('/api/users', usersFirestoreRoutes); // Firebase default
}

// Content Routes
if (DB_MODE === 'mongodb' || DB_MODE === 'dual') {
  app.use('/api/content/mongodb', contentMongoRoutes); // MongoDB content
}

// Default content route
if (DB_MODE === 'mongodb') {
  app.use('/api/content', contentMongoRoutes);
} else if (DB_MODE === 'firebase' || DB_MODE === 'dual') {
  const contentFirestoreRoutes = require('./routes/content-firestore');
  app.use('/api/content', contentFirestoreRoutes);
}

// All other existing routes continue to work...
// (Load all your existing routes here)

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

