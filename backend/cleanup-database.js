/**
 * Database Cleanup Script
 * Removes orphaned content and fixes data integrity issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupOrphanedData() {
  console.log('🧹 Starting Database Cleanup\n');
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

    // 1. Find and clean orphaned contents
    console.log('\n🔍 Checking for orphaned content...');
    
    const orphanedContents = await db.collection('contents').aggregate([
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
      }
    ]).toArray();

    if (orphanedContents.length > 0) {
      console.log(`⚠️  Found ${orphanedContents.length} orphaned content(s)`);
      
      // Option 1: Delete orphaned content
      console.log('\n🗑️  Deleting orphaned content...');
      const contentIds = orphanedContents.map(c => c._id);
      const deleteResult = await db.collection('contents').deleteMany({
        _id: { $in: contentIds }
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned content(s)`);
      
      // Clean up related data (likes, comments, views, etc.)
      console.log('\n🧹 Cleaning up related data...');
      
      // Delete likes for orphaned content
      const likesResult = await db.collection('likes').deleteMany({
        contentId: { $in: contentIds }
      });
      console.log(`  - Deleted ${likesResult.deletedCount} orphaned likes`);
      
      // Delete comments for orphaned content
      const commentsResult = await db.collection('comments').deleteMany({
        contentId: { $in: contentIds }
      });
      console.log(`  - Deleted ${commentsResult.deletedCount} orphaned comments`);
      
      // Delete views for orphaned content
      const viewsResult = await db.collection('views').deleteMany({
        contentId: { $in: contentIds }
      });
      console.log(`  - Deleted ${viewsResult.deletedCount} orphaned views`);
      
      // Delete shares for orphaned content
      const sharesResult = await db.collection('shares').deleteMany({
        contentId: { $in: contentIds }
      });
      console.log(`  - Deleted ${sharesResult.deletedCount} orphaned shares`);
      
      // Delete saves for orphaned content
      const savesResult = await db.collection('saves').deleteMany({
        contentId: { $in: contentIds }
      });
      console.log(`  - Deleted ${savesResult.deletedCount} orphaned saves`);
      
    } else {
      console.log('✅ No orphaned content found');
    }

    // 2. Check for other orphaned data
    console.log('\n\n🔍 Checking for other orphaned data...');
    
    // Orphaned products
    const orphanedProducts = await db.collection('products').aggregate([
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
      }
    ]).toArray();
    
    if (orphanedProducts.length > 0) {
      console.log(`⚠️  Found ${orphanedProducts.length} orphaned product(s)`);
      const productIds = orphanedProducts.map(p => p._id);
      const deleteResult = await db.collection('products').deleteMany({
        _id: { $in: productIds }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned product(s)`);
    } else {
      console.log('✅ No orphaned products found');
    }

    // 3. Clean up expired data
    console.log('\n\n🔍 Checking for expired data...');
    
    // Delete expired stories (older than 24 hours)
    const expiredStories = await db.collection('stories').deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`✅ Deleted ${expiredStories.deletedCount} expired stories`);
    
    // Delete expired sessions
    const expiredSessions = await db.collection('sessions')?.deleteMany({
      expiresAt: { $lt: new Date() }
    }).catch(() => ({ deletedCount: 0 }));
    console.log(`✅ Deleted ${expiredSessions.deletedCount} expired sessions`);

    // 4. Verify data integrity after cleanup
    console.log('\n\n🔍 Verifying data integrity...');
    
    const userCount = await db.collection('users').countDocuments();
    const contentCount = await db.collection('contents').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    
    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Contents: ${contentCount}`);
    console.log(`✅ Products: ${productCount}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 CLEANUP SUMMARY\n');
    console.log(`Orphaned contents cleaned: ${orphanedContents.length}`);
    console.log(`Orphaned products cleaned: ${orphanedProducts.length}`);
    console.log(`Expired stories cleaned: ${expiredStories.deletedCount}`);
    console.log(`Expired sessions cleaned: ${expiredSessions.deletedCount}`);
    console.log('\n✅ Database cleanup complete!');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupOrphanedData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
