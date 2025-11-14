const mongoose = require('mongoose');

/**
 * MongoDB Connection Manager
 * Replaces Firebase/Firestore with MongoDB + Mongoose
 * Last updated: 2025-11-08 - Force rebuild
 */

let isConnected = false;

/**
 * Connect to MongoDB
 * Uses connection pooling for better performance
 */
const connectMongoDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB: Using existing connection');
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI environment variable is not defined');
  }

  try {
    // Startup validation: log only the cluster host to verify correctness safely
    try {
      const uriForLog = new URL(MONGODB_URI.replace('mongodb+srv://', 'http://'));
      const host = uriForLog.host;
      console.log(`🔎 MongoDB host: ${host}`);
      if (/t8e6by\.mongodb\.net/i.test(host)) {
        throw new Error('❌ Configured MongoDB host points to deprecated cluster t8e6by. Please update to tt9e6by.');
      }
    } catch (e) {
      // Non-fatal for parsing issues; will fail on connect if invalid
      console.warn('⚠️  Could not parse MONGODB_URI for host validation:', e.message);
    }

    console.log('🔄 MongoDB: Connecting...');
    
    await mongoose.connect(MONGODB_URI, {
      // Modern connection options (mongoose 6+)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds (increased for Cloud Run cold start)
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give MongoDB 30 seconds to establish connection
    });

    isConnected = true;
    console.log('✅ MongoDB: Connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * Use during shutdown
 */
const disconnectMongoDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB: Disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnect error:', error);
    throw error;
  }
};

/**
 * Get MongoDB connection status
 */
const getConnectionStatus = () => {
  // Use actual mongoose readyState instead of local variable
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const readyState = mongoose.connection.readyState;
  return {
    isConnected: readyState === 1, // Only true when actually connected
    readyState: readyState,
    host: mongoose.connection.host,
    database: mongoose.connection.name,
  };
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getConnectionStatus,
  mongoose, // Export mongoose instance for model creation
};

