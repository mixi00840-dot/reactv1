const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Verify Streaming Providers in Firestore
 * Run: node src/scripts/verifyStreamingProviders.js
 */

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'mixillo',
  });
}

const db = admin.firestore();

async function verifyProviders() {
  try {
    console.log('🔍 Checking Streaming Providers in Firestore...\n');

    const providersSnapshot = await db.collection('streamingProviders').get();

    if (providersSnapshot.empty) {
      console.log('❌ No streaming providers found in Firestore!');
      console.log('   Run: node src/scripts/seedStreamingProviders.js');
      process.exit(1);
    }

    console.log(`✅ Found ${providersSnapshot.size} streaming provider(s):\n`);

    providersSnapshot.forEach(doc => {
      const data = doc.data();
      const statusIcon = data.status === 'active' ? '🟢' : data.status === 'maintenance' ? '🟡' : '🔴';
      const enabledIcon = data.enabled ? '✓' : '✗';
      
      console.log(`${statusIcon} ${data.displayName} (${doc.id})`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Enabled: ${enabledIcon}`);
      console.log(`   Priority: ${data.priority}`);
      console.log(`   App ID: ${data.config?.appId || 'Not configured'}`);
      console.log(`   Protocol: ${data.config?.protocol || 'N/A'}`);
      console.log(`   Features: ${Object.keys(data.features || {}).join(', ')}`);
      console.log('');
    });

    const activeProviders = providersSnapshot.docs.filter(doc => doc.data().status === 'active');
    const enabledProviders = providersSnapshot.docs.filter(doc => doc.data().enabled);

    console.log('📊 Summary:');
    console.log(`   Total: ${providersSnapshot.size}`);
    console.log(`   Active: ${activeProviders.length}`);
    console.log(`   Enabled: ${enabledProviders.length}`);

    if (enabledProviders.length === 0) {
      console.log('\n⚠️  Warning: No enabled providers! Enable at least one provider.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying providers:', error);
    process.exit(1);
  }
}

verifyProviders();
