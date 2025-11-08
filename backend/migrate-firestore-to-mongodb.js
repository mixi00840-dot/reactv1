#!/usr/bin/env node
/**
 * FIRESTORE → MONGODB MIGRATION SCRIPT
 * 
 * CRITICAL: This script migrates all data from Firestore to MongoDB
 * 
 * BEFORE RUNNING:
 * 1. Backup all Firestore data
 * 2. Test on staging/development environment first
 * 3. Schedule maintenance window
 * 4. Ensure MongoDB connection is stable
 * 
 * USAGE:
 *   node migrate-firestore-to-mongodb.js [options]
 * 
 * OPTIONS:
 *   --collection=<name>  Migrate specific collection only
 *   --dry-run           Preview migration without writing to MongoDB
 *   --batch-size=1000   Number of documents to process in each batch
 *   --verbose           Show detailed logs
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { connectMongoDB, mongoose } = require('./src/utils/mongodb');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log('✅ Firebase Admin initialized for migration');
}

const models = require('./src/models');

// Command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const DRY_RUN = args['dry-run'] || false;
const BATCH_SIZE = parseInt(args['batch-size']) || 1000;
const VERBOSE = args.verbose || false;
const SPECIFIC_COLLECTION = args.collection;

// Migration mapping: Firestore collection → MongoDB model
const MIGRATION_MAP = [
  { firestore: 'users', model: 'User', transform: transformUser },
  { firestore: 'content', model: 'Content', transform: transformContent },
  { firestore: 'follows', model: 'Follow', transform: transformFollow },
  { firestore: 'comments', model: 'Comment', transform: transformComment },
  { firestore: 'stories', model: 'Story', transform: transformStory },
  { firestore: 'wallets', model: 'Wallet', transform: transformWallet },
  { firestore: 'giftTransactions', model: 'GiftTransaction', transform: transformGiftTransaction },
  { firestore: 'livestreams', model: 'Livestream', transform: transformLivestream },
  { firestore: 'products', model: 'Product', transform: transformProduct },
  { firestore: 'stores', model: 'Store', transform: transformStore },
  { firestore: 'orders', model: 'Order', transform: transformOrder },
  { firestore: 'notifications', model: 'Notification', transform: transformNotification },
  { firestore: 'messages', model: 'Message', transform: transformMessage },
  { firestore: 'conversations', model: 'Conversation', transform: transformConversation },
  { firestore: 'gifts', model: 'Gift', transform: null },
  { firestore: 'streamingProviders', model: 'StreamProvider', transform: null },
  { firestore: 'categories', model: 'Category', transform: null },
  { firestore: 'banners', model: 'Banner', transform: null },
  { firestore: 'settings', model: 'Setting', transform: null },
  { firestore: 'sounds', model: 'Sound', transform: null },
];

// Transformation functions
function transformUser(firestoreData, docId) {
  return {
    _id: docId,
    email: firestoreData.email,
    username: firestoreData.username,
    password: firestoreData.password || '$2a$10$' + Math.random().toString(36), // Temporary password hash
    fullName: firestoreData.fullName || 'User',
    avatar: firestoreData.avatar || '',
    bio: firestoreData.bio || '',
    phone: firestoreData.phone || '',
    dateOfBirth: firestoreData.dateOfBirth,
    role: firestoreData.role || 'user',
    status: firestoreData.status || 'active',
    isVerified: firestoreData.isVerified || false,
    isFeatured: firestoreData.isFeatured || false,
    firebaseUid: docId,
    migratedFromFirebase: true,
    migrationDate: new Date(),
    followersCount: firestoreData.followersCount || 0,
    followingCount: firestoreData.followingCount || 0,
    videosCount: firestoreData.videosCount || 0,
    lastLogin: firestoreData.lastLogin ? new Date(firestoreData.lastLogin) : undefined,
    createdAt: firestoreData.createdAt ? new Date(firestoreData.createdAt) : new Date(),
    updatedAt: firestoreData.updatedAt ? new Date(firestoreData.updatedAt) : new Date()
  };
}

function transformContent(data, id) {
  return {
    _id: id,
    userId: data.userId,
    type: data.type || 'video',
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    duration: data.duration,
    caption: data.caption,
    hashtags: data.hashtags || [],
    status: data.status || 'active',
    viewsCount: data.viewsCount || 0,
    likesCount: data.likesCount || 0,
    commentsCount: data.commentsCount || 0,
    sharesCount: data.sharesCount || 0,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformFollow(data, id) {
  return {
    _id: id,
    followerId: data.followerId,
    followingId: data.followingId,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformComment(data, id) {
  return {
    _id: id,
    contentId: data.contentId,
    userId: data.userId,
    text: data.text,
    parentId: data.parentId,
    likesCount: data.likesCount || 0,
    repliesCount: data.repliesCount || 0,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformStory(data, id) {
  return {
    _id: id,
    userId: data.userId,
    type: data.type,
    mediaUrl: data.mediaUrl,
    thumbnailUrl: data.thumbnailUrl,
    duration: data.duration || 5,
    viewsCount: data.viewsCount || 0,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 24*60*60*1000),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformWallet(data, id) {
  return {
    _id: id,
    userId: data.userId || id,
    balance: parseFloat(data.balance) || 0,
    currency: data.currency || 'USD',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformGiftTransaction(data, id) {
  return {
    _id: id,
    giftId: data.giftId,
    senderId: data.senderId,
    recipientId: data.recipientId,
    context: data.context || 'livestream',
    livestreamId: data.livestreamId,
    quantity: data.quantity || 1,
    unitPrice: data.unitPrice || data.price || 0,
    totalCost: data.totalCost || (data.price * data.quantity) || 0,
    creatorEarnings: data.creatorEarnings || 0,
    platformFee: data.platformFee || 0,
    status: data.status || 'completed',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformLivestream(data, id) {
  return {
    _id: id,
    hostId: data.userId || data.hostId,
    title: data.title || 'Live Stream',
    streamId: data.id || data.streamId || id,
    provider: data.provider || 'agora',
    status: data.status || 'ended',
    type: data.type || 'solo',
    currentViewers: data.viewersCount || data.currentViewers || 0,
    peakViewers: data.peakViewers || 0,
    totalViews: data.totalViews || 0,
    likesCount: data.likesCount || 0,
    startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformProduct(data, id) {
  return {
    _id: id,
    storeId: data.storeId,
    sellerId: data.sellerId || data.userId,
    name: data.name,
    description: data.description,
    price: parseFloat(data.price),
    stock: parseInt(data.stock) || 0,
    images: data.images || [],
    category: data.category,
    status: data.status || 'draft',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformStore(data, id) {
  return {
    _id: id,
    sellerId: data.sellerId || data.userId,
    name: data.name,
    description: data.description,
    logo: data.logo,
    status: data.status || 'pending',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformOrder(data, id) {
  return {
    _id: id,
    userId: data.userId,
    orderNumber: data.orderNumber || `ORD-${id}`,
    items: data.items || [],
    subtotal: parseFloat(data.subtotal) || 0,
    total: parseFloat(data.total) || 0,
    status: data.status || 'pending',
    paymentMethod: data.paymentMethod || 'card',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

function transformNotification(data, id) {
  return {
    _id: id,
    userId: data.userId,
    type: data.type || 'system',
    title: data.title || 'Notification',
    body: data.body || '',
    isRead: data.isRead || false,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformMessage(data, id) {
  return {
    _id: id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    type: data.type || 'text',
    text: data.text,
    mediaUrl: data.mediaUrl,
    isRead: data.isRead || false,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
  };
}

function transformConversation(data, id) {
  return {
    _id: id,
    participants: data.participants || [],
    type: data.type || 'private',
    lastMessage: data.lastMessage,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
  };
}

/**
 * Migrate a single collection from Firestore to MongoDB
 */
async function migrateCollection(firestoreCollection, MongoModel, transformFn) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 Migrating: ${firestoreCollection} → ${MongoModel.modelName}`);
  console.log('='.repeat(80));
  
  try {
    const startTime = Date.now();
    
    // Get all documents from Firestore
    console.log('🔍 Fetching from Firestore...');
    const snapshot = await admin.firestore().collection(firestoreCollection).get();
    
    if (snapshot.empty) {
      console.log('⚠️  Collection is empty - skipping');
      return { success: true, count: 0 };
    }
    
    console.log(`✅ Found ${snapshot.size} documents`);
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN - Preview of first 3 documents:');
      snapshot.docs.slice(0, 3).forEach((doc, i) => {
        const data = transformFn ? transformFn(doc.data(), doc.id) : { _id: doc.id, ...doc.data() };
        console.log(`\n  Document ${i + 1} (ID: ${doc.id}):`);
        console.log(JSON.stringify(data, null, 2).split('\n').map(line => '    ' + line).join('\n'));
      });
      return { success: true, count: snapshot.size, dryRun: true };
    }
    
    // Process in batches
    const batch = [];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const doc of snapshot.docs) {
      try {
        const firestoreData = doc.data();
        const transformedData = transformFn ? transformFn(firestoreData, doc.id) : { _id: doc.id, ...firestoreData };
        batch.push(transformedData);
        
        // Process batch when it reaches BATCH_SIZE
        if (batch.length >= BATCH_SIZE) {
          console.log(`  📝 Processing batch of ${batch.length} documents...`);
          
          const result = await MongoModel.insertMany(batch, { 
            ordered: false, // Continue on duplicate errors
            lean: true
          });
          
          successCount += result.length;
          console.log(`  ✅ Inserted ${result.length} documents (Total: ${successCount}/${snapshot.size})`);
          batch.length = 0; // Clear batch
        }
      } catch (error) {
        errorCount++;
        errors.push({ docId: doc.id, error: error.message });
        if (VERBOSE) {
          console.error(`  ❌ Error on document ${doc.id}:`, error.message);
        }
      }
    }
    
    // Insert remaining documents
    if (batch.length > 0) {
      console.log(`  📝 Processing final batch of ${batch.length} documents...`);
      try {
        const result = await MongoModel.insertMany(batch, { 
          ordered: false,
          lean: true
        });
        successCount += result.length;
        console.log(`  ✅ Inserted ${result.length} documents`);
      } catch (error) {
        if (error.insertedDocs) {
          successCount += error.insertedDocs.length;
          console.log(`  ⚠️  Partial success: ${error.insertedDocs.length} inserted`);
        }
        if (error.writeErrors) {
          errorCount += error.writeErrors.length;
          errors.push(...error.writeErrors.map(e => ({ error: e.errmsg })));
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Migration complete for ${firestoreCollection}`);
    console.log(`  ✓ Migrated: ${successCount}/${snapshot.size} documents`);
    if (errorCount > 0) {
      console.log(`  ⚠️  Errors: ${errorCount} documents failed`);
      if (!VERBOSE && errorCount <= 10) {
        console.log('  Sample errors:', errors.slice(0, 5));
      }
    }
    console.log(`  ⏱️  Duration: ${duration}s`);
    
    return {
      success: true,
      total: snapshot.size,
      migrated: successCount,
      errors: errorCount,
      duration
    };
    
  } catch (error) {
    console.error(`❌ Migration failed for ${firestoreCollection}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n🚀 FIRESTORE → MONGODB MIGRATION');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '✍️  LIVE MIGRATION'}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Specific Collection: ${SPECIFIC_COLLECTION || 'All collections'}`);
  console.log('='.repeat(80));
  
  try {
    // Connect to MongoDB
    console.log('\n📊 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connected');
    
    // Initialize Firebase (should already be initialized)
    console.log('📊 Checking Firestore connection...');
    const firestoreDb = admin.firestore();
    await firestoreDb.collection('_test').limit(1).get();
    console.log('✅ Firestore connected');
    
    const results = [];
    const startTime = Date.now();
    
    // Filter migrations if specific collection requested
    const migrationsToRun = SPECIFIC_COLLECTION
      ? MIGRATION_MAP.filter(m => m.firestore === SPECIFIC_COLLECTION)
      : MIGRATION_MAP;
    
    if (migrationsToRun.length === 0) {
      console.error(`❌ Collection "${SPECIFIC_COLLECTION}" not found in migration map`);
      process.exit(1);
    }
    
    console.log(`\n📋 Migrating ${migrationsToRun.length} collections...\n`);
    
    // Migrate each collection
    for (const migration of migrationsToRun) {
      const { firestore, model, transform } = migration;
      const MongoModel = models[model];
      
      if (!MongoModel) {
        console.warn(`⚠️  Model ${model} not found - skipping ${firestore}`);
        continue;
      }
      
      const result = await migrateCollection(firestore, MongoModel, transform);
      results.push({
        collection: firestore,
        ...result
      });
      
      // Small delay between collections
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    
    const totalDocs = results.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalMigrated = results.reduce((sum, r) => sum + (r.migrated || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
    
    console.log(`Total Documents: ${totalDocs}`);
    console.log(`✅ Migrated: ${totalMigrated}`);
    if (totalErrors > 0) {
      console.log(`⚠️  Errors: ${totalErrors}`);
    }
    console.log(`⏱️  Total Duration: ${totalDuration}s`);
    console.log(`Success Rate: ${((totalMigrated / totalDocs) * 100).toFixed(1)}%`);
    
    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN COMPLETE - No data was written to MongoDB');
      console.log('   Run without --dry-run to perform actual migration');
    } else {
      console.log('\n✅ MIGRATION COMPLETE!');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Verify data in MongoDB');
      console.log('   2. Test API endpoints');
      console.log('   3. Update counters (followers, likes, etc.)');
      console.log('   4. Switch DATABASE_MODE to "mongodb"');
    }
    
    console.log('='.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate();

