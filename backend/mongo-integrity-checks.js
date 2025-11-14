#!/usr/bin/env node
/**
 * MONGODB INTEGRITY CHECKS
 * Analyzes all 76 collections for health, indexes, duplicates, and orphaned references
 * Output: workspace/report/db_checks.json
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mixi00840_db_admin:JI70R4pjgm0xfUYt@mixillo.tt9e6by.mongodb.net/mixillo?retryWrites=true&w=majority';

console.log('🔍 MONGODB INTEGRITY CHECKS STARTING');
console.log('=====================================');
console.log(`📊 Database: ${MONGO_URI.split('@')[1]?.split('/')[1] || 'mixillo'}`);
console.log('=====================================\n');

// Expected collections (76 total based on project docs)
const expectedCollections = [
  'users', 'profiles', 'followers', 'followings', 'blockedusers',
  'contents', 'posts', 'stories', 'comments', 'likes', 'shares', 'views', 'saves',
  'products', 'productvariants', 'carts', 'cartitems', 'orders', 'payments', 'wishlists',
  'wallets', 'transactions', 'coins', 'gifts', 'gifttransactions',
  'livestreams', 'liveparticipants', 'livegifts',
  'chatrooms', 'messages', 'notifications', 'reports',
  'adminusers', 'adminactions', 'systemsettings', 'analytics',
  'sounds', 'levels', 'themes', 'translations', 'currencies',
  'categories', 'tags', 'featured', 'banners', 'explorersections',
  'sellerapplications', 'stores', 'coupons', 'shippingmethods',
  'subscriptions', 'subscriptiontiers', 'supporterbadges', 'creatorearnings',
  'contentmetrics', 'contentrecommendations', 'contentrights', 'scheduledcontents',
  'videoqualitysettings', 'transcodejobs', 'streamfilters', 'trendingrecords',
  'multihostsessions', 'pkbattles', 'liveshoppingsessions', 'streamproviders',
  'customerservicetickets', 'faqs', 'pages', 'searchqueries', 'adcampaigns',
  'aimoderation', 'moderationqueues', 'recommendationmetadata'
];

const results = {
  generated_at: new Date().toISOString(),
  mongo_uri: MONGO_URI.replace(/:([^:@]+)@/, ':***@'),  // Redact password
  collections: [],
  summary: {
    total_collections_expected: expectedCollections.length,
    total_collections_found: 0,
    total_documents: 0,
    missing_collections: [],
    collections_with_issues: []
  }
};

async function analyzeCollection(collectionName) {
  try {
    const collection = mongoose.connection.db.collection(collectionName);
    
    console.log(`\n📦 Analyzing: ${collectionName}`);
    
    // Get document count
    const count = await collection.countDocuments();
    console.log(`   Documents: ${count}`);
    
    // Get indexes
    const indexes = await collection.indexes();
    console.log(`   Indexes: ${indexes.length}`);
    
    const collectionResult = {
      name: collectionName,
      count,
      indexes: indexes.map(idx => idx.name),
      index_details: indexes,
      sample_duplicate_groups: [],
      orphan_refs: [],
      missing_indexes: [],
      issues: []
    };
    
    // Check for common duplicate patterns (if collection has data)
    if (count > 0) {
      // Sample a few documents
      const samples = await collection.find().limit(5).toArray();
      
      // Check for common unique fields that might have duplicates
      const uniqueFields = ['slug', 'externalId', 'email', 'username', 'name'];
      
      for (const field of uniqueFields) {
        if (samples[0] && samples[0][field]) {
          try {
            const duplicates = await collection.aggregate([
              { $match: { [field]: { $exists: true, $ne: null } } },
              { $group: { _id: `$${field}`, count: { $sum: 1 }, ids: { $push: '$_id' } } },
              { $match: { count: { $gt: 1 } } },
              { $limit: 5 }
            ]).toArray();
            
            if (duplicates.length > 0) {
              collectionResult.sample_duplicate_groups.push({
                field,
                groups: duplicates.map(d => ({ value: d._id, count: d.count, sample_ids: d.ids.slice(0, 3) }))
              });
              collectionResult.issues.push(`Potential duplicates on field: ${field}`);
              console.log(`   ⚠️  Duplicates found on '${field}': ${duplicates.length} groups`);
            }
          } catch (err) {
            // Field might not exist or aggregation failed
          }
        }
      }
      
      // Check for orphaned references (common foreign keys)
      const refFields = [
        { field: 'userId', targetCollection: 'users' },
        { field: 'creator', targetCollection: 'users' },
        { field: 'contentId', targetCollection: 'contents' },
        { field: 'productId', targetCollection: 'products' },
        { field: 'orderId', targetCollection: 'orders' }
      ];
      
      for (const ref of refFields) {
        if (samples[0] && samples[0][ref.field]) {
          try {
            // Find documents with this field
            const docsWithRef = await collection.find({ [ref.field]: { $exists: true, $ne: null } }).limit(100).toArray();
            
            if (docsWithRef.length > 0) {
              const refIds = [...new Set(docsWithRef.map(d => d[ref.field]))];
              const targetCollection = mongoose.connection.db.collection(ref.targetCollection);
              const existingIds = await targetCollection.find({ _id: { $in: refIds } }).project({ _id: 1 }).toArray();
              const existingIdSet = new Set(existingIds.map(d => d._id.toString()));
              
              const orphanedIds = refIds.filter(id => !existingIdSet.has(id.toString()));
              
              if (orphanedIds.length > 0) {
                collectionResult.orphan_refs.push({
                  field: ref.field,
                  target_collection: ref.targetCollection,
                  missing_count: orphanedIds.length,
                  sample_ids: orphanedIds.slice(0, 3)
                });
                collectionResult.issues.push(`Orphaned references: ${ref.field} → ${ref.targetCollection}`);
                console.log(`   ⚠️  Orphaned ${ref.field}: ${orphanedIds.length} references`);
              }
            }
          } catch (err) {
            // Reference check failed
          }
        }
      }
    }
    
    // Recommend indexes for common query fields
    const commonQueryFields = ['createdAt', 'updatedAt', 'status', 'userId', 'contentId', 'email'];
    const existingIndexFields = indexes.flatMap(idx => Object.keys(idx.key));
    
    for (const field of commonQueryFields) {
      if (count > 0 && !existingIndexFields.includes(field)) {
        // Check if field exists in sample documents
        const hasField = await collection.findOne({ [field]: { $exists: true } });
        if (hasField) {
          collectionResult.missing_indexes.push(field);
          console.log(`   💡 Recommend index on: ${field}`);
        }
      }
    }
    
    results.summary.total_documents += count;
    results.summary.total_collections_found++;
    
    return collectionResult;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      name: collectionName,
      error: error.message,
      count: 0,
      indexes: [],
      issues: ['Collection analysis failed']
    };
  }
}

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected!\n');
    
    // Get all actual collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const actualCollectionNames = collections.map(c => c.name);
    
    console.log(`Found ${actualCollectionNames.length} collections in database`);
    
    // Check for missing expected collections
    results.summary.missing_collections = expectedCollections.filter(
      name => !actualCollectionNames.includes(name)
    );
    
    if (results.summary.missing_collections.length > 0) {
      console.log(`\n⚠️  Missing ${results.summary.missing_collections.length} expected collections:`);
      results.summary.missing_collections.forEach(name => console.log(`   - ${name}`));
    }
    
    // Analyze each collection
    for (const collectionName of actualCollectionNames) {
      const result = await analyzeCollection(collectionName);
      results.collections.push(result);
      
      if (result.issues && result.issues.length > 0) {
        results.summary.collections_with_issues.push(collectionName);
      }
    }
    
    // Summary
    console.log('\n=====================================');
    console.log('📊 DATABASE INTEGRITY SUMMARY');
    console.log('=====================================');
    console.log(`Collections Found: ${results.summary.total_collections_found}`);
    console.log(`Total Documents: ${results.summary.total_documents}`);
    console.log(`Collections with Issues: ${results.summary.collections_with_issues.length}`);
    console.log(`Missing Collections: ${results.summary.missing_collections.length}`);
    
    if (results.summary.collections_with_issues.length > 0) {
      console.log('\n⚠️  COLLECTIONS WITH ISSUES:');
      results.summary.collections_with_issues.forEach(name => {
        const coll = results.collections.find(c => c.name === name);
        console.log(`   - ${name}: ${coll.issues.join(', ')}`);
      });
    }
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'workspace', 'report', 'db_checks.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Results saved to: ${outputPath}`);
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    results.error = error.message;
    
    // Save partial results
    const outputPath = path.join(__dirname, '..', 'workspace', 'report', 'db_checks.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
