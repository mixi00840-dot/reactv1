const admin = require('firebase-admin');

// Initialize
admin.initializeApp();

async function recreateAdmin() {
  const userId = 'ZBbhjKUBwWCDnBXFzMV9';
  const email = 'admin@mixillo.com';
  const password = 'Admin123!';

  try {
    // Try to delete if exists
    try {
      await admin.auth().deleteUser(userId);
      console.log('Deleted existing Firebase Auth user');
    } catch (e) {
      console.log('No existing Firebase Auth user');
    }

    // Create with specific UID
    const user = await admin.auth().createUser({
      uid: userId,
      email: email,
      password: password,
      emailVerified: true,
      disabled: false
    });

    console.log('✅ Firebase Auth user created!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Password: Set to Admin123!');
    console.log('\n✅ Ready to test login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

recreateAdmin();
