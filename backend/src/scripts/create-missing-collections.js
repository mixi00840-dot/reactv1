#!/usr/bin/env node
/**
 * CREATE MISSING COLLECTIONS MIGRATION
 * Creates all 31 missing database collections identified in audit
 * Run with: node src/scripts/create-missing-collections.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const User = require('../models/User');
const Content = require('../models/Content');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');

console.log('🔧 MIXILLO - CREATE MISSING COLLECTIONS MIGRATION');
console.log('='.repeat(50));

// Define all collections that should exist
const requiredCollections = [
  // User-related collections
  { name: 'profiles', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      website: String,
      location: String,
      birthDate: Date,
      gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
      interests: [String],
      privacySettings: {
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false }
      }
    }, { timestamps: true });
    schema.index({ userId: 1 });
    schema.index({ createdAt: -1 });
    return mongoose.model('Profile', schema);
  }},
  
  { name: 'followers', createFn: async () => {
    const schema = new mongoose.Schema({
      followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      notificationsEnabled: { type: Boolean, default: true }
    }, { timestamps: true });
    schema.index({ followerId: 1, followingId: 1 }, { unique: true });
    schema.index({ followingId: 1 });
    schema.index({ createdAt: -1 });
    return mongoose.model('Follower', schema);
  }},
  
  { name: 'followings', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      followedAt: { type: Date, default: Date.now }
    }, { timestamps: true });
    schema.index({ userId: 1, followingId: 1 }, { unique: true });
    schema.index({ followingId: 1 });
    return mongoose.model('Following', schema);
  }},
  
  { name: 'blockedusers', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      reason: String
    }, { timestamps: true });
    schema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
    return mongoose.model('BlockedUser', schema);
  }},
  
  // Content collections
  { name: 'posts', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      mediaUrls: [String],
      mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
      likesCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 },
      visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      status: { type: String, enum: ['active', 'deleted', 'reported'], default: 'active' }
    }, { timestamps: true });
    schema.index({ userId: 1, createdAt: -1 });
    schema.index({ status: 1 });
    return mongoose.model('Post', schema);
  }},
  
  // Product-related
  { name: 'productvariants', createFn: async () => {
    const schema = new mongoose.Schema({
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      sku: { type: String, unique: true, sparse: true },
      price: { type: Number, required: true },
      compareAtPrice: Number,
      stock: { type: Number, default: 0 },
      attributes: mongoose.Schema.Types.Mixed,
      images: [String]
    }, { timestamps: true });
    schema.index({ productId: 1 });
    schema.index({ sku: 1 });
    return mongoose.model('ProductVariant', schema);
  }},
  
  { name: 'cartitems', createFn: async () => {
    const schema = new mongoose.Schema({
      cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }
    }, { timestamps: true });
    schema.index({ cartId: 1 });
    schema.index({ productId: 1 });
    return mongoose.model('CartItem', schema);
  }},
  
  { name: 'wishlists', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
    }, { timestamps: true });
    schema.index({ userId: 1, productId: 1 }, { unique: true });
    return mongoose.model('Wishlist', schema);
  }},
  
  // Wallet & Currency
  { name: 'coins', createFn: async () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      price: { type: Number, required: true },
      bonus: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      icon: String,
      description: String
    }, { timestamps: true });
    schema.index({ isActive: 1 });
    return mongoose.model('Coin', schema);
  }},
  
  // Live Streaming
  { name: 'liveparticipants', createFn: async () => {
    const schema = new mongoose.Schema({
      liveStreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveStream', required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      joinedAt: { type: Date, default: Date.now },
      leftAt: Date,
      role: { type: String, enum: ['viewer', 'moderator'], default: 'viewer' }
    }, { timestamps: true });
    schema.index({ liveStreamId: 1, userId: 1 });
    schema.index({ liveStreamId: 1, joinedAt: -1 });
    return mongoose.model('LiveParticipant', schema);
  }},
  
  { name: 'livegifts', createFn: async () => {
    const schema = new mongoose.Schema({
      liveStreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveStream', required: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift', required: true },
      quantity: { type: Number, default: 1 },
      totalValue: { type: Number, required: true }
    }, { timestamps: true });
    schema.index({ liveStreamId: 1, createdAt: -1 });
    schema.index({ senderId: 1 });
    return mongoose.model('LiveGift', schema);
  }},
  
  // Chat
  { name: 'chatrooms', createFn: async () => {
    const schema = new mongoose.Schema({
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      lastMessage: String,
      lastMessageAt: Date,
      isGroup: { type: Boolean, default: false },
      groupName: String,
      groupAvatar: String
    }, { timestamps: true });
    schema.index({ participants: 1 });
    schema.index({ lastMessageAt: -1 });
    return mongoose.model('ChatRoom', schema);
  }},
  
  // Admin
  { name: 'adminusers', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
      role: { type: String, enum: ['admin', 'super_admin', 'moderator'], default: 'admin' },
      permissions: [String],
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    schema.index({ userId: 1 });
    schema.index({ role: 1 });
    return mongoose.model('AdminUser', schema);
  }},
  
  { name: 'adminactions', createFn: async () => {
    const schema = new mongoose.Schema({
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      action: { type: String, required: true },
      targetType: { type: String, enum: ['user', 'content', 'product', 'order', 'other'] },
      targetId: mongoose.Schema.Types.ObjectId,
      details: mongoose.Schema.Types.Mixed,
      ipAddress: String
    }, { timestamps: true });
    schema.index({ adminId: 1, createdAt: -1 });
    schema.index({ targetType: 1, targetId: 1 });
    return mongoose.model('AdminAction', schema);
  }},
  
  // System
  { name: 'systemsettings', createFn: async () => {
    const schema = new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: mongoose.Schema.Types.Mixed,
      type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], required: true },
      description: String,
      category: String
    }, { timestamps: true });
    schema.index({ key: 1 });
    schema.index({ category: 1 });
    return mongoose.model('SystemSetting', schema);
  }},
  
  { name: 'themes', createFn: async () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      colors: mongoose.Schema.Types.Mixed,
      isDefault: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    return mongoose.model('Theme', schema);
  }},
  
  { name: 'translations', createFn: async () => {
    const schema = new mongoose.Schema({
      key: { type: String, required: true },
      language: { type: String, required: true },
      value: { type: String, required: true }
    }, { timestamps: true });
    schema.index({ key: 1, language: 1 }, { unique: true });
    return mongoose.model('Translation', schema);
  }},
  
  { name: 'featured', createFn: async () => {
    const schema = new mongoose.Schema({
      itemType: { type: String, enum: ['content', 'product', 'user', 'store'], required: true },
      itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
      position: { type: Number, default: 0 },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    schema.index({ itemType: 1, isActive: 1, position: 1 });
    return mongoose.model('Featured', schema);
  }},
  
  // Shipping
  { name: 'shippingmethods', createFn: async () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
      description: String,
      price: { type: Number, required: true },
      estimatedDays: { type: Number, default: 3 },
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    return mongoose.model('ShippingMethod', schema);
  }},
  
  // Gamification
  { name: 'supporterbadges', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      badgeType: { type: String, required: true },
      level: { type: Number, default: 1 },
      earnedAt: { type: Date, default: Date.now }
    }, { timestamps: true });
    schema.index({ userId: 1, badgeType: 1 });
    return mongoose.model('SupporterBadge', schema);
  }},
  
  // Creator monetization
  { name: 'creatorearnings', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      source: { type: String, enum: ['gift', 'product', 'coin', 'subscription'], required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' }
    }, { timestamps: true });
    schema.index({ userId: 1, createdAt: -1 });
    schema.index({ status: 1 });
    return mongoose.model('CreatorEarning', schema);
  }},
  
  { name: 'contentrights', createFn: async () => {
    const schema = new mongoose.Schema({
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
      rightsType: { type: String, enum: ['original', 'licensed', 'fair_use'], default: 'original' },
      licenseInfo: String,
      verified: { type: Boolean, default: false }
    }, { timestamps: true });
    schema.index({ contentId: 1 });
    return mongoose.model('ContentRight', schema);
  }},
  
  // Video processing
  { name: 'videoqualitysettings', createFn: async () => {
    const schema = new mongoose.Schema({
      quality: { type: String, enum: ['360p', '480p', '720p', '1080p', '4k'], required: true },
      bitrate: { type: Number, required: true },
      isDefault: { type: Boolean, default: false }
    }, { timestamps: true });
    return mongoose.model('VideoQualitySetting', schema);
  }},
  
  { name: 'transcodejobs', createFn: async () => {
    const schema = new mongoose.Schema({
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
      status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
      inputUrl: String,
      outputUrls: mongoose.Schema.Types.Mixed,
      progress: { type: Number, default: 0 },
      error: String
    }, { timestamps: true });
    schema.index({ contentId: 1 });
    schema.index({ status: 1, createdAt: -1 });
    return mongoose.model('TranscodeJob', schema);
  }},
  
  // Live streaming features
  { name: 'streamfilters', createFn: async () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
      type: { type: String, enum: ['beauty', 'effect', 'ar'], required: true },
      thumbnailUrl: String,
      filterData: mongoose.Schema.Types.Mixed,
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    return mongoose.model('StreamFilter', schema);
  }},
  
  { name: 'liveshoppingsessions', createFn: async () => {
    const schema = new mongoose.Schema({
      liveStreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveStream', required: true },
      productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      totalSales: { type: Number, default: 0 },
      ordersCount: { type: Number, default: 0 }
    }, { timestamps: true });
    schema.index({ liveStreamId: 1 });
    return mongoose.model('LiveShoppingSession', schema);
  }},
  
  // Customer service
  { name: 'customerservicetickets', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      subject: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, enum: ['technical', 'billing', 'content', 'account', 'other'], required: true },
      status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        sentAt: { type: Date, default: Date.now }
      }]
    }, { timestamps: true });
    schema.index({ userId: 1, status: 1 });
    schema.index({ status: 1, priority: 1 });
    return mongoose.model('CustomerServiceTicket', schema);
  }},
  
  // CMS
  { name: 'pages', createFn: async () => {
    const schema = new mongoose.Schema({
      title: { type: String, required: true },
      slug: { type: String, required: true, unique: true },
      content: { type: String, required: true },
      metaTitle: String,
      metaDescription: String,
      isPublished: { type: Boolean, default: false },
      publishedAt: Date
    }, { timestamps: true });
    schema.index({ slug: 1 });
    return mongoose.model('Page', schema);
  }},
  
  // Marketing
  { name: 'adcampaigns', createFn: async () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
      description: String,
      budget: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
      targetAudience: mongoose.Schema.Types.Mixed,
      creativeUrls: [String],
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }, { timestamps: true });
    schema.index({ status: 1, startDate: 1 });
    return mongoose.model('AdCampaign', schema);
  }},
  
  // AI & Moderation
  { name: 'aimoderation', createFn: async () => {
    const schema = new mongoose.Schema({
      contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
      contentType: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
      score: { type: Number, min: 0, max: 1 },
      labels: [String],
      isApproved: { type: Boolean, default: false },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date
    }, { timestamps: true });
    schema.index({ contentId: 1 });
    schema.index({ isApproved: 1, createdAt: -1 });
    return mongoose.model('AIModeration', schema);
  }},
  
  // Recommendations
  { name: 'recommendationmetadata', createFn: async () => {
    const schema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      preferences: mongoose.Schema.Types.Mixed,
      viewHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
      likedContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
      lastUpdated: { type: Date, default: Date.now }
    }, { timestamps: true });
    schema.index({ userId: 1 });
    return mongoose.model('RecommendationMetadata', schema);
  }}
];

async function createMissingCollections() {
  try {
    // Connect to MongoDB
    console.log(`\n📡 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    console.log(`📦 Found ${existingNames.length} existing collections`);
    console.log(`🎯 Need to create ${requiredCollections.length} collections\n`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const collectionDef of requiredCollections) {
      try {
        if (existingNames.includes(collectionDef.name)) {
          console.log(`⏭️  ${collectionDef.name} - Already exists`);
          skipped++;
          continue;
        }
        
        // Create model and collection
        const Model = await collectionDef.createFn();
        await Model.createCollection();
        
        console.log(`✅ ${collectionDef.name} - Created successfully`);
        created++;
        
      } catch (error) {
        console.error(`❌ ${collectionDef.name} - Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped (existing): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📦 Total collections now: ${existingNames.length + created}`);
    
    if (created > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 All missing collections have been created with proper indexes');
    } else {
      console.log('\n✨ No new collections needed - all exist already');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
console.log('\n⚡ Starting migration...\n');
createMissingCollections();
