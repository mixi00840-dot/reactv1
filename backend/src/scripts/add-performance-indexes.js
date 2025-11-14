#!/usr/bin/env node
/**
 * ADD PERFORMANCE INDEXES
 * Adds createdAt/updatedAt indexes to 6 collections for improved query performance
 * Run with: node src/scripts/add-performance-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('🚀 MIXILLO - ADD PERFORMANCE INDEXES');
console.log('='.repeat(50));

const collectionsToIndex = [
  { name: 'strikes', indexes: [
    { fields: { createdAt: -1 }, options: { background: true } },
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]},
  { name: 'carts', indexes: [
    { fields: { createdAt: -1 }, options: { background: true } },
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]},
  { name: 'stores', indexes: [
    { fields: { createdAt: -1 }, options: { background: true } },
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]},
  { name: 'wallets', indexes: [
    { fields: { createdAt: -1 }, options: { background: true } },
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]},
  { name: 'users', indexes: [
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]},
  { name: 'sellerapplications', indexes: [
    { fields: { updatedAt: -1 }, options: { background: true } }
  ]}
];

async function addPerformanceIndexes() {
  try {
    console.log(`\n📡 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const collectionDef of collectionsToIndex) {
      console.log(`\n📦 Processing: ${collectionDef.name}`);
      
      try {
        const collection = db.collection(collectionDef.name);
        
        // Get existing indexes
        const existingIndexes = await collection.indexes();
        const existingKeys = existingIndexes.map(idx => JSON.stringify(idx.key));
        
        for (const indexDef of collectionDef.indexes) {
          const indexKey = JSON.stringify(indexDef.fields);
          
          if (existingKeys.includes(indexKey)) {
            console.log(`  ⏭️  Index ${indexKey} - Already exists`);
            skipped++;
          } else {
            await collection.createIndex(indexDef.fields, indexDef.options);
            console.log(`  ✅ Index ${indexKey} - Created successfully`);
            created++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error on ${collectionDef.name}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 INDEXING SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped (existing): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (created > 0) {
      console.log('\n🎉 Indexing completed successfully!');
      console.log('💡 Performance indexes will improve query speeds');
    } else {
      console.log('\n✨ All indexes already exist');
    }

  } catch (error) {
    console.error('\n❌ Indexing failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

console.log('\n⚡ Starting indexing...\n');
addPerformanceIndexes();
