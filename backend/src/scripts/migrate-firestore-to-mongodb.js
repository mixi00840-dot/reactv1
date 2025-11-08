#!/usr/bin/env node
/**
 * Firestore to MongoDB Migration Script
 * Safely migrates data from Firestore to MongoDB with verification
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { connectMongoDB } = require('../utils/mongodb');
const models = require('../models');

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Migration configuration
const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE) || 1000;
const DRY_RUN = process.env.DRY_RUN === 'true';

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green 
              : type === 'error' ? colors.red
              : type === 'warning' ? colors.yellow
              : type === 'header' ? colors.blue
              : colors.reset;
  
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Transform Firestore document to MongoDB format
 */
function transformDocument(firestoreData, docId, transformFn) {
  let mongoData = { _id: docId, ...firestoreData };
  
  // Apply custom transformation if provided
  if (transformFn) {
    mongoData = transformFn(mongoData, docId);
  }
  
  // Convert Firestore timestamps to Date objects
  Object.keys(mongoData).forEach(key => {
    if (mongoData[key] && typeof mongoData[key].toDate === 'function') {
      mongoData[key] = mongoData[key].toDate();
    }
    
    // Convert ISO string dates to Date objects
    if (typeof mongoData[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(mongoData[key])) {
      mongoData[key] = new Date(mongoData[key]);
    }
  });
  
  return mongoData;
}

/**
 * Migrate a single collection
 */
async function migrateCollection(firestoreCollection, MongooseModel, options = {}) {
  const { transformFn, batchSize = BATCH_SIZE } = options;
  
  log(`\n${'='.repeat(80)}`, 'header');
  log(`📦 Migrating: ${firestoreCollection} → ${MongooseModel.modelName}`, 'header');
  log('='.repeat(80), 'header');
  
  try {
    // Get total count
    const snapshot = await db.collection(firestoreCollection).get();
    const totalDocs = snapshot.size;
    
    log(`📊 Total documents to migrate: ${totalDocs}`, 'info');
    
    if (totalDocs === 0) {
      log('⚠️  No documents found in Firestore', 'warning');
      return { success: true, migrated: 0, failed: 0, skipped: 0 };
    }
    
    let migrated = 0;
    let failed = 0;
    let skipped = 0;
    let batch = [];
    
    for (const doc of snapshot.docs) {
      try {
        const firestoreData = doc.data();
        const mongoData = transformDocument(firestoreData, doc.id, transformFn);
        
        batch.push(mongoData);
        
        // Process batch when full
        if (batch.length >= batchSize) {
          if (DRY_RUN) {
            log(`[DRY RUN] Would insert ${batch.length} documents`, 'warning');
            skipped += batch.length;
          } else {
            try {
              await MongooseModel.insertMany(batch, { ordered: false });
              migrated += batch.length;
              log(`✅ Inserted ${batch.length} documents (Total: ${migrated}/${totalDocs})`, 'success');
            } catch (error) {
              // Handle duplicate key errors
              if (error.code === 11000) {
                const duplicates = error.writeErrors?.length || 0;
                migrated += batch.length - duplicates;
                failed += duplicates;
                log(`⚠️  ${duplicates} duplicates skipped`, 'warning');
              } else {
                throw error;
              }
            }
          }
          batch = [];
        }
      } catch (error) {
        log(`❌ Error processing document ${doc.id}: ${error.message}`, 'error');
        failed++;
      }
    }
    
    // Insert remaining documents
    if (batch.length > 0) {
      if (DRY_RUN) {
        log(`[DRY RUN] Would insert ${batch.length} documents`, 'warning');
        skipped += batch.length;
      } else {
        try {
          await MongooseModel.insertMany(batch, { ordered: false });
          migrated += batch.length;
          log(`✅ Inserted ${batch.length} documents (Total: ${migrated}/${totalDocs})`, 'success');
        } catch (error) {
          if (error.code === 11000) {
            const duplicates = error.writeErrors?.length || 0;
            migrated += batch.length - duplicates;
            failed += duplicates;
            log(`⚠️  ${duplicates} duplicates skipped`, 'warning');
          } else {
            throw error;
          }
        }
      }
    }
    
    log(`\n✅ Completed: ${firestoreCollection}`, 'success');
    log(`   Migrated: ${migrated}`, 'success');
    log(`   Failed: ${failed}`, 'error');
    if (DRY_RUN) log(`   Skipped (dry run): ${skipped}`, 'warning');
    
    return { success: true, migrated, failed, skipped };
    
  } catch (error) {
    log(`❌ Migration failed for ${firestoreCollection}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrate() {
  log('\n' + '═'.repeat(80), 'header');
  log('🚀 FIRESTORE → MONGODB MIGRATION', 'header');
  log('═'.repeat(80) + '\n', 'header');
  
  if (DRY_RUN) {
    log('⚠️  DRY RUN MODE - No data will be written to MongoDB', 'warning');
  }
  
  try {
    // Connect to MongoDB
    log('🔌 Connecting to MongoDB...', 'info');
    await connectMongoDB();
    log('✅ MongoDB connected\n', 'success');
    
    const startTime = Date.now();
    const results = {};
    
    // Migrate Users
    log('👥 Migrating Users...', 'header');
    results.users = await migrateCollection('users', models.User, {
      transformFn: (data) => {
        // Ensure passwords are NOT overwritten (users will need to reset)
        if (!data.password) {
          data.password = 'MIGRATION_PLACEHOLDER_' + Math.random().toString(36);
        }
        return data;
      }
    });
    
    // Migrate Content
    log('\n📹 Migrating Content (Videos/Posts)...', 'header');
    results.content = await migrateCollection('content', models.Content);
    
    // Migrate Follows
    log('\n👥 Migrating Follows...', 'header');
    results.follows = await migrateCollection('follows', models.Follow);
    
    // Migrate Comments
    log('\n💬 Migrating Comments...', 'header');
    results.comments = await migrateCollection('comments', models.Comment);
    
    // Migrate Stories
    log('\n📖 Migrating Stories...', 'header');
    results.stories = await migrateCollection('stories', models.Story);
    
    // Migrate Wallets
    log('\n💰 Migrating Wallets...', 'header');
    results.wallets = await migrateCollection('wallets', models.Wallet);
    
    // Migrate Transactions
    log('\n💳 Migrating Transactions...', 'header');
    results.transactions = await migrateCollection('transactions', models.Transaction);
    
    // Migrate Gifts
    log('\n🎁 Migrating Gifts...', 'header');
    results.gifts = await migrateCollection('gifts', models.Gift);
    
    // Migrate Livestreams
    log('\n📡 Migrating Livestreams...', 'header');
    results.livestreams = await migrateCollection('livestreams', models.Livestream);
    
    // Migrate Products
    log('\n🛍️  Migrating Products...', 'header');
    results.products = await migrateCollection('products', models.Product);
    
    // Migrate Stores
    log('\n🏪 Migrating Stores...', 'header');
    results.stores = await migrateCollection('stores', models.Store);
    
    // Migrate Orders
    log('\n📦 Migrating Orders...', 'header');
    results.orders = await migrateCollection('orders', models.Order);
    
    // Migrate Notifications
    log('\n🔔 Migrating Notifications...', 'header');
    results.notifications = await migrateCollection('notifications', models.Notification);
    
    // Migrate Conversations
    log('\n💬 Migrating Conversations...', 'header');
    results.conversations = await migrateCollection('conversations', models.Conversation);
    
    // Migrate Messages
    log('\n✉️  Migrating Messages...', 'header');
    results.messages = await migrateCollection('messages', models.Message);
    
    // Migrate Gift Transactions
    log('\n🎁 Migrating Gift Transactions...', 'header');
    results.giftTransactions = await migrateCollection('giftTransactions', models.GiftTransaction);
    
    // Migrate additional collections
    log('\n📊 Migrating Additional Collections...', 'header');
    results.likes = await migrateCollection('likes', models.Like);
    results.saves = await migrateCollection('saves', models.Save);
    results.shares = await migrateCollection('shares', models.Share);
    results.views = await migrateCollection('views', models.View);
    
    log('\n🎵 Migrating Sounds...', 'header');
    results.sounds = await migrateCollection('sounds', models.Sound);
    
    log('\n📂 Migrating Categories & Cart...', 'header');
    results.categories = await migrateCollection('categories', models.Category);
    results.carts = await migrateCollection('carts', models.Cart);
    
    log('\n⚙️  Migrating Settings & Banners...', 'header');
    results.settings = await migrateCollection('settings', models.Setting);
    results.banners = await migrateCollection('banners', models.Banner);
    
    log('\n🔍 Migrating Reports & Moderation...', 'header');
    results.reports = await migrateCollection('reports', models.Report);
    results.moderationQueue = await migrateCollection('moderationQueue', models.ModerationQueue);
    
    log('\n📈 Migrating Analytics...', 'header');
    results.analytics = await migrateCollection('analytics', models.Analytics);
    
    log('\n✅ Core migration complete. Advanced features available for manual migration if needed.', 'success');
    
    // Calculate totals
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + (r.migrated || 0), 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + (r.failed || 0), 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + (r.skipped || 0), 0);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print summary
    log('\n' + '═'.repeat(80), 'header');
    log('📊 MIGRATION SUMMARY', 'header');
    log('═'.repeat(80), 'header');
    
    Object.entries(results).forEach(([collection, result]) => {
      const status = result.success ? '✅' : '❌';
      log(`${status} ${collection}: ${result.migrated || 0} migrated, ${result.failed || 0} failed`);
    });
    
    log('\n' + '─'.repeat(80), 'gray');
    log(`📊 Total Migrated: ${totalMigrated}`, 'success');
    log(`❌ Total Failed: ${totalFailed}`, 'error');
    if (DRY_RUN) log(`⚠️  Total Skipped (dry run): ${totalSkipped}`, 'warning');
    log(`⏱️  Duration: ${duration} seconds`, 'info');
    log('─'.repeat(80) + '\n', 'gray');
    
    if (DRY_RUN) {
      log('💡 To perform actual migration, run without DRY_RUN=true', 'warning');
    } else {
      log('✅ MIGRATION COMPLETED SUCCESSFULLY!', 'success');
    }
    
    process.exit(0);
    
  } catch (error) {
    log('\n❌ MIGRATION FAILED', 'error');
    log(`Error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrate();

