// Quick script to set Firebase Auth password for admin user
const admin = require('firebase-admin');

async function setPassword() {
  try {
    // Initialize if not already done
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    const uid = 'ZBbhjKUBwWCDnBXFzMV9';
    const password = 'Admin123!';

    await admin.auth().updateUser(uid, {
      password: password,
      emailVerified: true
    });

    console.log('✅ Password set successfully for admin user!');
    console.log('   UID:', uid);
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin123!');
    console.log('   Email Verified: true');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setPassword();
