const mongoose = require('mongoose');
require('dotenv').config();
const { StreamProvider } = require('../models/StreamProvider');

const defaultProviders = [
  {
    name: 'zegocloud',
    displayName: 'ZegoCloud',
    description: 'Enterprise-grade live streaming with ultra-low latency',
    enabled: true,
    status: 'active',
    priority: 1,
    config: {
      appId: process.env.ZEGO_APP_ID || 'YOUR_ZEGO_APP_ID',
      appKey: process.env.ZEGO_APP_KEY || 'YOUR_ZEGO_APP_KEY',
      appSecret: process.env.ZEGO_APP_SECRET || 'YOUR_ZEGO_APP_SECRET',
      serverUrl: 'stream.zegocloud.com',
      region: 'global',
      protocol: 'webrtc',
      maxResolution: '1080p',
      maxBitrate: 3000,
      maxFrameRate: 60,
      features: {
        recording: true,
        transcoding: true,
        beauty: true,
        virtualBackground: true,
        screenSharing: true,
        multiHost: true,
        chat: true,
        gifts: true
      }
    },
    limits: {
      maxConcurrentStreams: 1000,
      maxViewersPerStream: 10000,
      maxStreamDuration: 14400,
      monthlyMinutes: 100000,
      usedMinutes: 0
    },
    health: {
      uptime: 99.9,
      averageLatency: 150,
      errorRate: 0.1,
      consecutiveFailures: 0
    },
    pricing: {
      perMinute: 0.01,
      perViewer: 0.001,
      monthlyFee: 199,
      currency: 'USD'
    }
  },
  {
    name: 'agora',
    displayName: 'Agora',
    description: 'Real-time engagement platform for live streaming',
    enabled: true,
    status: 'active',
    priority: 2,
    config: {
      appId: process.env.AGORA_APP_ID || 'YOUR_AGORA_APP_ID',
      appKey: process.env.AGORA_APP_KEY || 'YOUR_AGORA_APP_KEY',
      appSecret: process.env.AGORA_APP_SECRET || 'YOUR_AGORA_APP_SECRET',
      serverUrl: 'stream.agora.io',
      region: 'global',
      protocol: 'webrtc',
      maxResolution: '1080p',
      maxBitrate: 2500,
      maxFrameRate: 30,
      features: {
        recording: true,
        transcoding: true,
        beauty: false,
        virtualBackground: false,
        screenSharing: true,
        multiHost: true,
        chat: false,
        gifts: false
      }
    },
    limits: {
      maxConcurrentStreams: 500,
      maxViewersPerStream: 5000,
      maxStreamDuration: 10800,
      monthlyMinutes: 50000,
      usedMinutes: 0
    },
    health: {
      uptime: 99.5,
      averageLatency: 180,
      errorRate: 0.3,
      consecutiveFailures: 0
    },
    pricing: {
      perMinute: 0.012,
      perViewer: 0.0012,
      monthlyFee: 149,
      currency: 'USD'
    }
  },
  {
    name: 'webrtc',
    displayName: 'WebRTC (Self-Hosted)',
    description: 'Open-source WebRTC solution for peer-to-peer streaming',
    enabled: false,
    status: 'maintenance',
    priority: 3,
    config: {
      appId: 'webrtc-server',
      appKey: 'N/A',
      appSecret: process.env.WEBRTC_SECRET || 'YOUR_WEBRTC_SECRET',
      serverUrl: process.env.WEBRTC_SERVER_URL || 'localhost:8080',
      region: 'us',
      protocol: 'webrtc',
      maxResolution: '720p',
      maxBitrate: 2000,
      maxFrameRate: 30,
      features: {
        recording: false,
        transcoding: false,
        beauty: false,
        virtualBackground: false,
        screenSharing: true,
        multiHost: false,
        chat: false,
        gifts: false
      }
    },
    limits: {
      maxConcurrentStreams: 100,
      maxViewersPerStream: 1000,
      maxStreamDuration: 7200,
      monthlyMinutes: 20000,
      usedMinutes: 0
    },
    health: {
      uptime: 95,
      averageLatency: 250,
      errorRate: 2,
      consecutiveFailures: 0
    },
    pricing: {
      perMinute: 0,
      perViewer: 0,
      monthlyFee: 0,
      currency: 'USD'
    }
  }
];

async function seedStreamProviders() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📡 Seeding stream providers...');
    
    let created = 0;
    let skipped = 0;
    
    for (const providerData of defaultProviders) {
      const existing = await StreamProvider.findOne({ name: providerData.name });
      
      if (existing) {
        console.log(`⏭️  Provider ${providerData.displayName} already exists`);
        skipped++;
      } else {
        await StreamProvider.create(providerData);
        console.log(`✨ Created provider: ${providerData.displayName} (${providerData.name}) - Priority ${providerData.priority}`);
        created++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✨ Created: ${created} providers`);
    console.log(`   ⏭️  Skipped: ${skipped} providers (already exist)`);
    console.log(`   📡 Total: ${defaultProviders.length} providers`);
    
    // Display provider details
    const providers = await StreamProvider.find().sort({ priority: 1 });
    console.log(`\n🎥 Stream Providers Configuration:`);
    providers.forEach(provider => {
      const statusIcon = provider.enabled ? '✅' : '❌';
      const healthIcon = provider.health.uptime >= 99 ? '🟢' : provider.health.uptime >= 95 ? '🟡' : '🔴';
      console.log(`   ${statusIcon} ${provider.displayName} (Priority ${provider.priority}) ${healthIcon}`);
      console.log(`      Status: ${provider.status} | Uptime: ${provider.health.uptime}%`);
      console.log(`      Limits: ${provider.limits.maxConcurrentStreams} streams, ${provider.limits.maxViewersPerStream} viewers/stream`);
      console.log(`      Features: ${Object.entries(provider.config.features).filter(([k, v]) => v).map(([k]) => k).join(', ')}`);
      console.log('');
    });
    
    console.log('✅ Stream provider seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure your streaming provider credentials in .env file:');
    console.log('      - ZEGO_APP_ID, ZEGO_APP_KEY, ZEGO_APP_SECRET');
    console.log('      - AGORA_APP_ID, AGORA_APP_KEY, AGORA_APP_SECRET');
    console.log('   2. Test health checks: POST /api/streaming/providers/health-check-all');
    console.log('   3. Create a livestream: POST /api/streaming/livestreams');
    
  } catch (error) {
    console.error('❌ Error seeding stream providers:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedStreamProviders()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedStreamProviders;
