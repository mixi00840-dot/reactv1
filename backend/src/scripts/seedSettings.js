require('dotenv').config();
const mongoose = require('mongoose');
const { Setting } = require('../models/Setting');

const defaultSettings = [
  // General Settings
  {
    category: 'general',
    key: 'app_name',
    value: 'Mixillo',
    label: 'Application Name',
    description: 'The name of your application',
    type: 'string',
    publicRead: true
  },
  {
    category: 'general',
    key: 'app_tagline',
    value: 'Social Video + E-commerce Platform',
    label: 'Application Tagline',
    description: 'Short description of your platform',
    type: 'string',
    publicRead: true
  },
  {
    category: 'general',
    key: 'maintenance_mode',
    value: false,
    label: 'Maintenance Mode',
    description: 'Enable maintenance mode to disable app access',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'general',
    key: 'app_version',
    value: '1.0.0',
    label: 'App Version',
    description: 'Current version of the application',
    type: 'string',
    publicRead: true
  },
  
  // i18n Settings
  {
    category: 'i18n',
    key: 'default_language',
    value: 'en',
    label: 'Default Language',
    description: 'Default language code for the application',
    type: 'string',
    publicRead: true
  },
  {
    category: 'i18n',
    key: 'enabled_languages',
    value: ['en', 'ar', 'es', 'fr'],
    label: 'Enabled Languages',
    description: 'List of enabled language codes',
    type: 'array',
    publicRead: true
  },
  {
    category: 'i18n',
    key: 'auto_translate_enabled',
    value: false,
    label: 'Auto-Translate Enabled',
    description: 'Enable automatic translation using external provider',
    type: 'boolean',
    publicRead: false
  },
  {
    category: 'i18n',
    key: 'translation_provider_api_key',
    value: '',
    label: 'Translation Provider API Key',
    description: 'API key for translation service (Google Translate)',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  },
  
  // Streaming Settings
  {
    category: 'streaming',
    key: 'enabled',
    value: true,
    label: 'Streaming Enabled',
    description: 'Enable live streaming functionality',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'streaming',
    key: 'default_provider',
    value: 'agora',
    label: 'Default Streaming Provider',
    description: 'Default provider for live streaming',
    type: 'string',
    validation: { enum: ['zego', 'agora', 'webrtc'] },
    publicRead: false
  },
  {
    category: 'streaming',
    key: 'failover_enabled',
    value: true,
    label: 'Failover Enabled',
    description: 'Automatically switch to backup provider on failure',
    type: 'boolean',
    publicRead: false
  },
  
  // CMS Settings
  {
    category: 'cms',
    key: 'banners_enabled',
    value: true,
    label: 'Banners Enabled',
    description: 'Enable in-app banners',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'cms',
    key: 'primary_color',
    value: '#1976d2',
    label: 'Primary Color',
    description: 'Primary theme color for the app',
    type: 'color',
    publicRead: true
  },
  {
    category: 'cms',
    key: 'secondary_color',
    value: '#dc004e',
    label: 'Secondary Color',
    description: 'Secondary theme color for the app',
    type: 'color',
    publicRead: true
  },
  
  // Currencies Settings
  {
    category: 'currencies',
    key: 'default_currency',
    value: 'USD',
    label: 'Default Currency',
    description: 'Default currency code',
    type: 'string',
    publicRead: true
  },
  {
    category: 'currencies',
    key: 'enabled_currencies',
    value: ['USD', 'EUR', 'GBP'],
    label: 'Enabled Currencies',
    description: 'List of enabled currency codes',
    type: 'array',
    publicRead: true
  },
  {
    category: 'currencies',
    key: 'auto_sync_rates',
    value: true,
    label: 'Auto-Sync Exchange Rates',
    description: 'Automatically sync exchange rates daily',
    type: 'boolean',
    publicRead: false
  },
  
  // Coins Settings
  {
    category: 'coins',
    key: 'enabled',
    value: true,
    label: 'Virtual Coins Enabled',
    description: 'Enable virtual coins system',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'coins',
    key: 'coin_symbol',
    value: '💎',
    label: 'Coin Symbol',
    description: 'Symbol representing virtual coins',
    type: 'string',
    publicRead: true
  },
  {
    category: 'coins',
    key: 'usd_conversion_rate',
    value: 100,
    label: 'USD Conversion Rate',
    description: 'Number of coins per 1 USD',
    type: 'number',
    publicRead: true
  },
  
  // Moderation Settings
  {
    category: 'moderation',
    key: 'enabled',
    value: true,
    label: 'Content Moderation Enabled',
    description: 'Enable automatic content moderation',
    type: 'boolean',
    publicRead: false
  },
  {
    category: 'moderation',
    key: 'sightengine_api_user',
    value: '',
    label: 'Sightengine API User',
    description: 'Sightengine API user ID',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  },
  {
    category: 'moderation',
    key: 'sightengine_api_secret',
    value: '',
    label: 'Sightengine API Secret',
    description: 'Sightengine API secret key',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  },
  {
    category: 'moderation',
    key: 'auto_block_threshold',
    value: 0.9,
    label: 'Auto-Block Threshold',
    description: 'Confidence threshold for auto-blocking content (0-1)',
    type: 'number',
    validation: { min: 0, max: 1 },
    publicRead: false
  },
  
  // Payments Settings
  {
    category: 'payments',
    key: 'stripe_enabled',
    value: false,
    label: 'Stripe Enabled',
    description: 'Enable Stripe payments',
    type: 'boolean',
    publicRead: false
  },
  {
    category: 'payments',
    key: 'stripe_publishable_key',
    value: '',
    label: 'Stripe Publishable Key',
    description: 'Stripe publishable API key',
    type: 'string',
    publicRead: false
  },
  {
    category: 'payments',
    key: 'stripe_secret_key',
    value: '',
    label: 'Stripe Secret Key',
    description: 'Stripe secret API key',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  },
  {
    category: 'payments',
    key: 'platform_commission_rate',
    value: 0.15,
    label: 'Platform Commission Rate',
    description: 'Commission rate (0-1) charged on transactions',
    type: 'number',
    validation: { min: 0, max: 1 },
    publicRead: false
  },
  
  // Ads Settings
  {
    category: 'ads',
    key: 'admob_enabled',
    value: false,
    label: 'AdMob Enabled',
    description: 'Enable AdMob ads in the app',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'ads',
    key: 'admob_test_mode',
    value: true,
    label: 'AdMob Test Mode',
    description: 'Use test ads instead of real ads',
    type: 'boolean',
    publicRead: false
  },
  {
    category: 'ads',
    key: 'admob_banner_id_android',
    value: '',
    label: 'AdMob Banner ID (Android)',
    description: 'AdMob banner ad unit ID for Android',
    type: 'string',
    publicRead: false
  },
  {
    category: 'ads',
    key: 'admob_banner_id_ios',
    value: '',
    label: 'AdMob Banner ID (iOS)',
    description: 'AdMob banner ad unit ID for iOS',
    type: 'string',
    publicRead: false
  },
  
  // Media Processing Settings
  {
    category: 'media',
    key: 'image_max_width',
    value: 1920,
    label: 'Max Image Width',
    description: 'Maximum width for uploaded images (px)',
    type: 'number',
    publicRead: false
  },
  {
    category: 'media',
    key: 'image_quality',
    value: 85,
    label: 'Image Quality',
    description: 'JPEG quality for compressed images (1-100)',
    type: 'number',
    validation: { min: 1, max: 100 },
    publicRead: false
  },
  {
    category: 'media',
    key: 'video_max_duration',
    value: 300,
    label: 'Max Video Duration',
    description: 'Maximum video duration in seconds',
    type: 'number',
    publicRead: true
  },
  {
    category: 'media',
    key: 'auto_transcode_enabled',
    value: true,
    label: 'Auto-Transcode Videos',
    description: 'Automatically transcode videos to multiple resolutions',
    type: 'boolean',
    publicRead: false
  },
  
  // Integrations Settings
  {
    category: 'integrations',
    key: 'giphy_enabled',
    value: false,
    label: 'GIPHY Enabled',
    description: 'Enable GIPHY GIF search',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'integrations',
    key: 'giphy_api_key',
    value: '',
    label: 'GIPHY API Key',
    description: 'GIPHY API key for GIF search',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  },
  
  // Notifications Settings
  {
    category: 'notifications',
    key: 'push_enabled',
    value: true,
    label: 'Push Notifications Enabled',
    description: 'Enable push notifications',
    type: 'boolean',
    publicRead: true
  },
  {
    category: 'notifications',
    key: 'email_enabled',
    value: true,
    label: 'Email Notifications Enabled',
    description: 'Enable email notifications',
    type: 'boolean',
    publicRead: false
  },
  {
    category: 'notifications',
    key: 'fcm_server_key',
    value: '',
    label: 'FCM Server Key',
    description: 'Firebase Cloud Messaging server key',
    type: 'encrypted',
    encrypted: true,
    publicRead: false
  }
];

async function seedSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    let created = 0;
    let skipped = 0;
    
    for (const settingData of defaultSettings) {
      const existing = await Setting.findOne({
        category: settingData.category,
        key: settingData.key
      });
      
      if (existing) {
        console.log(`⏭️  Skipping ${settingData.category}.${settingData.key} (already exists)`);
        skipped++;
        continue;
      }
      
      await Setting.create(settingData);
      console.log(`✅ Created ${settingData.category}.${settingData.key}`);
      created++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${defaultSettings.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    process.exit(1);
  }
}

seedSettings();
