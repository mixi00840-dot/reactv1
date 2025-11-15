const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function forceResetPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mixillo');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const newPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await usersCollection.updateOne(
      { email: 'admin@mixillo.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password updated directly in database');
    console.log('   Matched:', result.matchedCount);
    console.log('   Modified:', result.modifiedCount);
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin@123456');
    
    // Verify it works
    const admin = await usersCollection.findOne({ email: 'admin@mixillo.com' });
    const match = await bcrypt.compare(newPassword, admin.password);
    console.log('   Verification:', match ? '✅ Password works!' : '❌ Still broken');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

forceResetPassword();
