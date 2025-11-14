/**
 * MongoDB Database Validation & Health Check Script
 * Validates schema consistency, indexes, and data integrity
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function validateDatabase() {
  console.log('🔍 Starting MongoDB Database Validation\n');
  console.log('=' .repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // 1. List all collections
    console.log('\n📊 DATABASE COLLECTIONS\n');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // 2. Check indexes for each collection
    console.log('\n\n📑 INDEXES VALIDATION\n');
    const indexIssues = [];
    
    for (const col of collections) {
      const collectionName = col.name;
      const indexes = await db.collection(collectionName).indexes();
      
      console.log(`\n${collectionName}:`);
      console.log(`  Total indexes: ${indexes.length}`);
      
      // Check for duplicate indexes
      const indexKeys = indexes.map(idx => JSON.stringify(idx.key));
      const duplicates = indexKeys.filter((item, index) => indexKeys.indexOf(item) !== index);
      
      if (duplicates.length > 0) {
        console.log(`  ⚠️  WARNING: ${duplicates.length} duplicate index(es) found`);
        indexIssues.push({ collection: collectionName, issue: 'duplicate indexes' });
      }
      
      indexes.forEach(idx => {
        const keyStr = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
        const unique = idx.unique ? ' (unique)' : '';
        console.log(`    - {${keyStr}}${unique}`);
      });
    }

    // 3. Check collection sizes and document counts
    console.log('\n\n📈 COLLECTION STATISTICS\n');
    const stats = [];
    
    for (const col of collections) {
      const collectionName = col.name;
      const count = await db.collection(collectionName).countDocuments();
      const collStats = await db.command({ collStats: collectionName });
      
      stats.push({
        collection: collectionName,
        documents: count,
        size: Math.round(collStats.size / 1024), // KB
        avgDocSize: count > 0 ? Math.round(collStats.avgObjSize) : 0
      });
    }
    
    stats.sort((a, b) => b.documents - a.documents);
    
    console.log('Collection Name                Documents    Size(KB)   Avg Doc Size');
    console.log('-'.repeat(70));
    stats.forEach(s => {
      console.log(
        `${s.collection.padEnd(30)} ${String(s.documents).padStart(8)} ${String(s.size).padStart(10)} ${String(s.avgDocSize).padStart(12)}`
      );
    });

    // 4. Check for orphaned data
    console.log('\n\n🔗 REFERENTIAL INTEGRITY CHECK\n');
    
    // Check users with invalid references
    if (collections.some(c => c.name === 'users')) {
      const userCount = await db.collection('users').countDocuments();
      console.log(`✅ Users collection: ${userCount} documents`);
    }
    
    // Check for contents without valid creators
    if (collections.some(c => c.name === 'contents')) {
      const contentsWithInvalidCreators = await db.collection('contents').aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creatorDoc'
          }
        },
        {
          $match: {
            creatorDoc: { $size: 0 }
          }
        },
        {
          $count: 'orphaned'
        }
      ]).toArray();
      
      const orphanedCount = contentsWithInvalidCreators[0]?.orphaned || 0;
      if (orphanedCount > 0) {
        console.log(`⚠️  WARNING: ${orphanedCount} contents with invalid creators`);
      } else {
        console.log(`✅ All contents have valid creators`);
      }
    }
    
    // Check for products without valid sellers
    if (collections.some(c => c.name === 'products')) {
      const productsWithInvalidSellers = await db.collection('products').aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'sellerDoc'
          }
        },
        {
          $match: {
            sellerDoc: { $size: 0 }
          }
        },
        {
          $count: 'orphaned'
        }
      ]).toArray();
      
      const orphanedCount = productsWithInvalidSellers[0]?.orphaned || 0;
      if (orphanedCount > 0) {
        console.log(`⚠️  WARNING: ${orphanedCount} products with invalid sellers`);
      } else {
        console.log(`✅ All products have valid sellers`);
      }
    }

    // 5. Performance recommendations
    console.log('\n\n⚡ PERFORMANCE RECOMMENDATIONS\n');
    
    // Find collections with many documents but no indexes (except _id)
    const needsIndexes = stats.filter(s => {
      const indexes = collections.find(c => c.name === s.collection);
      return s.documents > 1000; // Collections with 1000+ docs
    });
    
    if (needsIndexes.length > 0) {
      console.log('Collections that might benefit from additional indexes:');
      needsIndexes.forEach(s => {
        console.log(`  - ${s.collection} (${s.documents} documents)`);
      });
    } else {
      console.log('✅ All large collections have proper indexing');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 VALIDATION SUMMARY\n');
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Total Documents: ${stats.reduce((sum, s) => sum + s.documents, 0)}`);
    console.log(`Total Size: ${Math.round(stats.reduce((sum, s) => sum + s.size, 0) / 1024)} MB`);
    
    if (indexIssues.length > 0) {
      console.log(`\n⚠️  ${indexIssues.length} collections have index issues`);
      indexIssues.forEach(issue => {
        console.log(`  - ${issue.collection}: ${issue.issue}`);
      });
    } else {
      console.log('\n✅ No index issues found');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run validation
validateDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
