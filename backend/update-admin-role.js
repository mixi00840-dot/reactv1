// Update admin user role in Firestore
const db = require('./src/utils/database');

async function updateAdminRole() {
  try {
    const userId = 'ZBbhjKUBwWCDnBXFzMV9';
    
    await db.collection('users').doc(userId).update({
      role: 'admin',
      updatedAt: new Date()
    });
    
    console.log('✅ Admin user role updated successfully!');
    console.log('   User ID:', userId);
    console.log('   New Role: admin');
    console.log('\nYou can now login to the admin dashboard!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin role:', error.message);
    process.exit(1);
  }
}

updateAdminRole();
