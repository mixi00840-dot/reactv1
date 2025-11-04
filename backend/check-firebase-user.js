// Check Firebase Auth user status
const admin = require('firebase-admin');

async function checkUser() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    const uid = 'ZBbhjKUBwWCDnBXFzMV9';
    const user = await admin.auth().getUser(uid);

    console.log('\n📋 Firebase Auth User Details:');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Disabled:', user.disabled);
    console.log('   Password Hash:', user.passwordHash ? 'Set ✅' : 'Not Set ❌');
    console.log('   Creation Time:', user.metadata.creationTime);
    console.log('   Last Sign In:', user.metadata.lastSignInTime || 'Never');
    
    // Test password by attempting sign-in
    console.log('\n🔐 Testing sign-in with Firebase REST API...');
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBqomROTpVMIBRbYBpXRdOUnFBtZXaEwZM`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mixillo.com',
        password: 'Admin123!',
        returnSecureToken: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sign-in successful!');
      console.log('   ID Token:', data.idToken.substring(0, 50) + '...');
    } else {
      const error = await response.json();
      console.log('❌ Sign-in failed:', error.error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
