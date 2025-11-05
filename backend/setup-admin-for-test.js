/**
 * Check and create admin user for testing
 */
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin
const serviceAccount = require('./mixillo-firebase-adminsdk-dvwdr-69fd21eb4c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'mixillo'
});

const db = admin.firestore();

async function setupAdmin() {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    const usersRef = db.collection('users');
    const adminSnapshot = await usersRef
      .where('email', '==', 'admin@mixillo.com')
      .limit(1)
      .get();
    
    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      console.log('✅ Found existing admin:');
      console.log('  ID:', adminDoc.id);
      console.log('  Email:', adminData.email);
      console.log('  Username:', adminData.username);
      console.log('  Role:', adminData.role);
      console.log('  IsAdmin:', adminData.isAdmin);
      
      // Update password to known value
      const hashedPassword = await bcrypt.hash('Admin123!Secure', 10);
      await adminDoc.ref.update({
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('\n✅ Admin password updated to: Admin123!Secure');
      console.log('\nTest credentials:');
      console.log('  login: admin@mixillo.com');
      console.log('  password: Admin123!Secure');
      
    } else {
      console.log('❌ No admin user found. Creating new admin...');
      
      // Create new admin
      const hashedPassword = await bcrypt.hash('Admin123!Secure', 10);
      const newAdmin = {
        username: 'admin',
        email: 'admin@mixillo.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        isAdmin: true,
        verified: true,
        active: true,
        emailVerified: true,
        phoneVerified: false,
        profileComplete: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await usersRef.add(newAdmin);
      console.log('✅ Admin created with ID:', docRef.id);
      console.log('\nTest credentials:');
      console.log('  login: admin@mixillo.com');
      console.log('  password: Admin123!Secure');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupAdmin();
