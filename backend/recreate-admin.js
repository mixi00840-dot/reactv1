const admin = require('firebase-admin');
async function recreateUser() {
  if (!admin.apps.length) admin.initializeApp();
  const uid = 'ZBbhjKUBwWCDnBXFzMV9';
  try {
    await admin.auth().deleteUser(uid);
    console.log(' Deleted old user');
  } catch (e) { console.log('User not found or already deleted'); }
  
  const newUser = await admin.auth().createUser({
    uid: uid,
    email: 'admin@mixillo.com',
    password: 'Admin123!',
    emailVerified: true,
    disabled: false
  });
  console.log(' Created user with password');
  console.log('   UID:', newUser.uid);
  console.log('   Email:', newUser.email);
  process.exit(0);
}
recreateUser().catch(e => { console.error('', e.message); process.exit(1); });
