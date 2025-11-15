const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to local MongoDB
mongoose.connect('mongodb://localhost:27017/mixillo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./src/models/User');

async function createAdmin() {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    const existingAdmin = await User.findOne({ email: 'admin@mixillo.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Username:', existingAdmin.username);
      console.log('   Role:', existingAdmin.role);
      return;
    }
    
    console.log('📝 Creating new admin user...');
    
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = new User({
      username: 'admin',
      email: 'admin@mixillo.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      isVerified: true,
      profile: {
        displayName: 'Admin',
        bio: 'System Administrator'
      }
    });
    
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin@123456');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
