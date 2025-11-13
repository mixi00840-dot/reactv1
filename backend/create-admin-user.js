/**
 * Create Admin User Script
 * Run this to create a test admin account for the dashboard
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (simplified for this script)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  role: { type: String, enum: ['user', 'seller', 'admin', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'banned', 'suspended'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminData = {
      username: 'admin',
      email: 'admin@mixillo.com',
      password: 'Admin@123456', // Change this in production!
      fullName: 'System Administrator',
      role: 'superadmin',
      status: 'active',
      isVerified: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('');
      console.log('💡 Use these credentials to login:');
      console.log(`   Username/Email: ${existingAdmin.email}`);
      console.log(`   Password: Admin@123456 (if you created it with this script)`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   URL: http://localhost:3000/login (local)');
    console.log('   URL: https://admin-dashboard-9uby7vts2-mixillo.vercel.app/login (production)');
    console.log('   Username: admin');
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin@123456');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
