#!/usr/bin/env node

/**
 * Phase 2 Migration Script
 * Replaces all MongoDB controllers with Firestore versions
 */

const fs = require('fs');
const path = require('path');

const migrations = [
  {
    source: 'productController-firestore.js',
    target: 'productController.js',
    backup: 'productController-mongodb-backup.js'
  },
  {
    source: 'storeController-firestore.js',
    target: 'storeController.js',
    backup: 'storeController-mongodb-backup.js'
  },
  {
    source: 'orderController-firestore.js',
    target: 'orderController.js',
    backup: 'orderController-mongodb-backup.js'
  },
  {
    source: 'cmsController-firestore.js',
    target: 'cmsController.js',
    backup: 'cmsController-mongodb-backup.js'
  },
  {
    source: 'settingsController-firestore.js',
    target: 'settingsController.js',
    backup: 'settingsController-mongodb-backup.js'
  }
];

const controllersDir = path.join(__dirname, '../controllers');

console.log('🚀 Starting Phase 2 Migration...\n');

migrations.forEach(({ source, target, backup }) => {
  const sourcePath = path.join(controllersDir, source);
  const targetPath = path.join(controllersDir, target);
  const backupPath = path.join(controllersDir, backup);

  try {
    // Skip if source doesn't exist
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Skipping ${source} (not found)`);
      return;
    }

    // Backup existing MongoDB version if it exists
    if (fs.existsSync(targetPath)) {
      fs.copyFileSync(targetPath, backupPath);
      console.log(`📦 Backed up ${target} -> ${backup}`);
    }

    // Replace with Firestore version
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Migrated ${target}`);

  } catch (error) {
    console.error(`❌ Error migrating ${target}:`, error.message);
  }
});

console.log('\n✨ Phase 2 Migration Complete!\n');
console.log('Next steps:');
console.log('1. Review the migrated controllers');
console.log('2. Remove fallback routers from app.js');
console.log('3. Test all endpoints');
console.log('4. Deploy to Cloud Run\n');
