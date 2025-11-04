const admin = require('firebase-admin');
const db = require('./src/utils/database');

/**
 * Migrate existing Firestore users to Firebase Authentication
 * This script creates Firebase Auth users for all existing Firestore users
 * 
 * IMPORTANT: Run this AFTER Firebase Admin is initialized in database.js
 * 
 * Usage:
 *   node migrate-users-to-firebase.js
 * 
 * Options:
 *   node migrate-users-to-firebase.js --dry-run  (preview without making changes)
 *   node migrate-users-to-firebase.js --email=admin@mixillo.com  (migrate single user)
 */

const isDryRun = process.argv.includes('--dry-run');
const singleUserEmail = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1];

async function migrateUsers() {
  try {
    console.log('\n🔄 Starting User Migration to Firebase Authentication\n');
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✅ LIVE (making changes)'}\n`);

    let query = db.collection('users');
    
    // Filter by email if specified
    if (singleUserEmail) {
      console.log(`📧 Migrating single user: ${singleUserEmail}\n`);
      query = query.where('email', '==', singleUserEmail);
    }

    const usersSnapshot = await query.get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found to migrate');
      return;
    }

    console.log(`📊 Found ${usersSnapshot.size} user(s) to process\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      console.log(`\n👤 Processing: ${userData.email} (${userData.username})`);
      
      // Skip if already has firebaseUid
      if (userData.firebaseUid) {
        console.log(`   ⏭️  Already migrated (firebaseUid: ${userData.firebaseUid})`);
        skipped++;
        continue;
      }

      // Validate required fields
      if (!userData.email) {
        console.log(`   ❌ Missing email - skipping`);
        errors++;
        errorDetails.push({ email: 'N/A', error: 'Missing email field' });
        continue;
      }

      if (isDryRun) {
        console.log(`   🔍 Would create Firebase user with:`);
        console.log(`      - UID: ${userId}`);
        console.log(`      - Email: ${userData.email}`);
        console.log(`      - Display Name: ${userData.fullName}`);
        console.log(`      - Email Verified: ${userData.isVerified || false}`);
        console.log(`      - Disabled: ${userData.status === 'banned' || userData.status === 'suspended'}`);
        migrated++;
        continue;
      }

      try {
        // Check if Firebase user already exists with this UID
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().getUser(userId);
          console.log(`   ℹ️  Firebase user already exists with UID ${userId}`);
        } catch (getUserError) {
          if (getUserError.code === 'auth/user-not-found') {
            // User doesn't exist, create it
            firebaseUser = await admin.auth().createUser({
              uid: userId, // Use existing Firestore doc ID as Firebase UID
              email: userData.email,
              displayName: userData.fullName || userData.username,
              emailVerified: userData.isVerified || false,
              disabled: userData.status === 'banned' || userData.status === 'suspended'
            });
            console.log(`   ✅ Created Firebase Auth user`);
          } else {
            throw getUserError;
          }
        }

        // Update Firestore document with firebaseUid
        await doc.ref.update({
          firebaseUid: firebaseUser.uid,
          updatedAt: new Date().toISOString(),
          migratedToFirebaseAuth: true,
          migrationDate: new Date().toISOString()
        });

        console.log(`   ✅ Updated Firestore document with firebaseUid`);
        migrated++;

      } catch (error) {
        errors++;
        const errorMsg = error.message || String(error);
        console.error(`   ❌ Error: ${errorMsg}`);
        errorDetails.push({ email: userData.email, error: errorMsg });

        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
          console.log(`   ℹ️  Email already registered in Firebase Auth`);
          console.log(`   💡 Consider using importUsers() API for bulk import`);
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total Users Processed: ${usersSnapshot.size}`);
    console.log(`✅ Successfully Migrated: ${migrated}`);
    console.log(`⏭️  Already Migrated (Skipped): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    if (errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      errorDetails.forEach((detail, index) => {
        console.log(`\n${index + 1}. ${detail.email}`);
        console.log(`   Error: ${detail.error}`);
      });
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN Complete - No changes were made');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Migration Complete!');
      
      if (errors > 0) {
        console.log('\n⚠️  Some users failed to migrate. Review errors above.');
        console.log('💡 Tip: Run with --email=user@example.com to retry specific users');
      }
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Verify migrated users in Firebase Console: Authentication > Users');
    console.log('2. Test login with migrated user credentials');
    console.log('3. Update frontend to use Firebase Authentication');
    console.log('4. Deploy changes to production\n');

  } catch (error) {
    console.error('\n💥 Fatal Migration Error:', error);
    process.exit(1);
  }
}

// Check if Firebase Admin is initialized
if (!admin.apps.length) {
  console.error('❌ Error: Firebase Admin not initialized');
  console.error('Make sure database.js initializes Firebase Admin SDK');
  process.exit(1);
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
