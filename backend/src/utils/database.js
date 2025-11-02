const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI is not set; starting without a database connection');
      return; // Allow app to start for health checks and basic routes
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      connectTimeoutMS: 10000, // 10 seconds timeout for initial connection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket inactivity
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Do not hard-exit here; let caller decide. AppRunner can pass health checks and logs can be inspected.
    throw error;
  }
};

module.exports = connectDB;