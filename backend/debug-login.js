/**
 * Debug admin login
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function debugLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kofiebaku123:mixillo2468@mixillo.tt9e6by.mongodb.net/mixillo', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@mixillo.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('\n📋 Admin User Details:');
    console.log('   ID:', admin._id);
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Password Hash:', admin.password ? 'EXISTS' : 'MISSING');
    console.log('   Hash Length:', admin.password?.length || 0);

    // Test password comparison
    const testPassword = 'Admin@123456';
    console.log('\n🔐 Testing Password Comparison:');
    console.log('   Test Password:', testPassword);
    
    try {
      const isMatch = await admin.comparePassword(testPassword);
      console.log('   Result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
      
      if (!isMatch) {
        // Try direct bcrypt compare
        const directMatch = await bcrypt.compare(testPassword, admin.password);
        console.log('   Direct bcrypt:', directMatch ? '✅ MATCH' : '❌ NO MATCH');
        
        // Maybe the password was set differently?
        console.log('\n💡 Trying to re-hash the password...');
        const newHash = await bcrypt.hash(testPassword, 10);
        const newMatch = await bcrypt.compare(testPassword, newHash);
        console.log('   New hash works:', newMatch ? '✅ YES' : '❌ NO');
        
        // Update admin with new hash - use findByIdAndUpdate to bypass pre-save hook
        await User.findByIdAndUpdate(admin._id, { password: newHash });
        console.log('   ✅ Password updated in database (bypassed pre-save hook)');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

debugLogin();
