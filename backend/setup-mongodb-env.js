#!/usr/bin/env node
/**
 * MongoDB Environment Setup Script
 * Adds MongoDB configuration to .env file
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Configuration to add
const mongoConfig = `
# ============================================
# MONGODB CONFIGURATION (Migration)
# ============================================
MONGODB_URI=mongodb+srv://mixi00840_db_admin:JI70R4pjgm0xfUYt@mixillo.tt9e6by.mongodb.net/mixillo?retryWrites=true&w=majority

# JWT Secrets (SECURE - DO NOT SHARE)
JWT_SECRET=a156bacc6832a7dd47daf788e7890a1d644b63cce7ac62af19c5bf51b15c14eb8bddfec728d6e419450e0b5675b87a05f9b232c2160fb2cf2ad9769b34dfc2ea
JWT_REFRESH_SECRET=04bb8a21af500b9d5d71bce67b34a14bcc31e44c79a58144a49dc194d7c5b29fbc0622e6886dbb8b8d86b8713cdb4d8162d19af02bc51dafb3065460e57d8bb7
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Migration Mode
# Options: "firebase" | "mongodb" | "dual"
# "dual" = write to both, read from MongoDB with Firebase fallback (safest)
DATABASE_MODE=dual

# Migration Settings
MIGRATION_BATCH_SIZE=1000
MIGRATION_LOG_LEVEL=info
`;

try {
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating new one...');
    fs.writeFileSync(envPath, mongoConfig.trim() + '\n');
    console.log('✅ Created .env file with MongoDB configuration');
  } else {
    // Read existing .env
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if MongoDB config already exists
    if (envContent.includes('MONGODB_URI')) {
      console.log('⚠️  MongoDB configuration already exists in .env');
      console.log('ℹ️  Skipping to avoid duplicates');
    } else {
      // Append MongoDB config
      envContent += '\n' + mongoConfig;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Added MongoDB configuration to .env');
    }
  }
  
  console.log('\n📋 Configuration added:');
  console.log('  ✅ MONGODB_URI - Connected to mixillo.tt9e6by.mongodb.net');
  console.log('  ✅ JWT_SECRET - Secure token generated');
  console.log('  ✅ JWT_REFRESH_SECRET - Secure refresh token generated');
  console.log('  ✅ DATABASE_MODE - Set to "dual" (Firebase + MongoDB)');
  
  console.log('\n🎯 Next steps:');
  console.log('  1. Restart your backend server');
  console.log('  2. MongoDB will be available alongside Firebase');
  console.log('  3. Continue with model creation and API migration');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️  Please manually add this to your .env file:');
  console.log(mongoConfig);
  process.exit(1);
}

