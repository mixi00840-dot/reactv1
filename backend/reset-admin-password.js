const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/mixillo');

const User = require('./src/models/User');

async function resetAdminPassword() {
  try {
    const admin = await User.findOne({ email: 'admin@mixillo.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    const newPassword = 'Admin@123456';
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    
    console.log('✅ Admin password reset successfully!');
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin@123456');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdminPassword();
