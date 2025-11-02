const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI is not set; starting without a database connection');
      return; // Allow app to start for health checks and basic routes
    }

    console.log('🔌 Attempting MongoDB connection...');
    console.log('📍 Region: Connecting from eu-central-1 to me-south-1');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // 15 seconds timeout for server selection
      connectTimeoutMS: 15000, // 15 seconds timeout for initial connection
      socketTimeoutMS: 60000, // 60 seconds timeout for socket inactivity
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      retryWrites: true,
      w: 'majority',
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection state: ${conn.connection.readyState}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      console.log('🔄 Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Full error:', error);
    // Do not hard-exit here; let caller decide. AppRunner can pass health checks and logs can be inspected.
    throw error;
  }
};

module.exports = connectDB;