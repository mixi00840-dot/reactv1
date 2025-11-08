const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Seed Streaming Providers to Firestore
 * Run: node src/scripts/seedStreamingProviders.js
 */

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'mixillo',
  });
}

const db = admin.firestore();

const streamingProviders = [
  {
    id: 'agora',
    name: 'agora',
    displayName: 'Agora',
    enabled: true,
    status: 'active',
    priority: 1,
    config: {
      appId: process.env.AGORA_APP_ID || 'your_agora_app_id',
      appKey: process.env.AGORA_APP_KEY || '',
      appSecret: process.env.AGORA_APP_SECRET || '',
      region: 'global',
      protocol: 'webrtc',
      maxResolution: '1080p',
      maxBitrate: 2000,
      maxFrameRate: 30
    },
    features: {
      pkBattle: true,
      screenShare: true,
      beautyFilter: true,
      virtualBackground: false,
      recording: true,
      cloudRecording: true
    },
    limits: {
      maxViewers: 10000,
      maxDuration: 14400, // 4 hours in seconds
      maxConcurrentStreams: 100
    },
    pricing: {
      model: 'usage',
      currency: 'USD',
      costPerMinute: 0.001
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'zegocloud',
    name: 'zegocloud',
    displayName: 'Zego Cloud',
    enabled: true,
    status: 'active',
    priority: 2,
    config: {
      appId: process.env.ZEGO_APP_ID || 'your_zego_app_id',
      appKey: process.env.ZEGO_APP_KEY || '',
      appSecret: process.env.ZEGO_APP_SECRET || '',
      serverUrl: process.env.ZEGO_SERVER_URL || '',
      region: 'global',
      protocol: 'webrtc',
      maxResolution: '1080p',
      maxBitrate: 2000,
      maxFrameRate: 30
    },
    features: {
      pkBattle: true,
      screenShare: true,
      beautyFilter: true,
      virtualBackground: true,
      recording: true,
      cloudRecording: true,
      aiEffects: true
    },
    limits: {
      maxViewers: 10000,
      maxDuration: 14400,
      maxConcurrentStreams: 100
    },
    pricing: {
      model: 'usage',
      currency: 'USD',
      costPerMinute: 0.0015
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'webrtc',
    name: 'webrtc',
    displayName: 'WebRTC (Self-hosted)',
    enabled: false,
    status: 'maintenance',
    priority: 3,
    config: {
      appId: 'webrtc-self-hosted',
      serverUrl: process.env.WEBRTC_SERVER_URL || 'wss://mixillo-backend-52242135857.europe-west1.run.app/streaming',
      region: 'global',
      protocol: 'webrtc',
      maxResolution: '720p',
      maxBitrate: 1500,
      maxFrameRate: 30
    },
    features: {
      pkBattle: false,
      screenShare: true,
      beautyFilter: false,
      virtualBackground: false,
      recording: true,
      cloudRecording: false
    },
    limits: {
      maxViewers: 1000,
      maxDuration: 7200, // 2 hours
      maxConcurrentStreams: 50
    },
    pricing: {
      model: 'free',
      currency: 'USD',
      costPerMinute: 0
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function seedStreamingProviders() {
  try {
    console.log('🌱 Seeding Streaming Providers to Firestore...\n');

    const batch = db.batch();
    
    for (const provider of streamingProviders) {
      const docRef = db.collection('streamingProviders').doc(provider.id);
      batch.set(docRef, provider, { merge: true });
      console.log(`   ✓ ${provider.displayName} (${provider.name}) - ${provider.status}`);
    }

    await batch.commit();

    console.log('\n✅ Streaming providers seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total providers: ${streamingProviders.length}`);
    console.log(`   Active providers: ${streamingProviders.filter(p => p.status === 'active').length}`);
    console.log(`   Enabled providers: ${streamingProviders.filter(p => p.enabled).length}`);
    
    console.log(`\n⚙️  Configuration:`);
    console.log(`   Default provider: agora (priority ${streamingProviders.find(p => p.name === 'agora')?.priority})`);
    console.log(`   Fallback provider: zegocloud (priority ${streamingProviders.find(p => p.name === 'zegocloud')?.priority})`);
    
    console.log(`\n🔑 API Keys Status:`);
    console.log(`   AGORA_APP_ID: ${process.env.AGORA_APP_ID ? '✓ Set' : '✗ Not set'}`);
    console.log(`   ZEGO_APP_ID: ${process.env.ZEGO_APP_ID ? '✓ Set' : '✗ Not set'}`);
    
    if (!process.env.AGORA_APP_ID && !process.env.ZEGO_APP_ID) {
      console.log(`\n⚠️  Warning: No streaming provider API keys configured!`);
      console.log(`   Add to your .env file:`);
      console.log(`   AGORA_APP_ID=your_agora_app_id`);
      console.log(`   ZEGO_APP_ID=your_zego_app_id`);
    }

    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Configure API keys in .env file`);
    console.log(`   2. Test provider: GET /api/streaming/providers`);
    console.log(`   3. Start a livestream: POST /api/streaming/start`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding streaming providers:', error);
    process.exit(1);
  }
}

seedStreamingProviders();
