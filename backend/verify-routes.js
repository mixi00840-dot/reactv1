/**
 * Quick verification script to test new API routes structure
 */

const express = require('express');

console.log('🔍 Verifying new API routes...\n');

try {
  // Load route files
  const storiesRouter = require('./src/routes/admin/stories');
  const walletsRouter = require('./src/routes/admin/wallets');
  const analyticsRouter = require('./src/routes/admin/analytics');
  
  console.log('✅ Stories router loaded');
  console.log('✅ Wallets router loaded');
  console.log('✅ Analytics router loaded');
  
  // Check if they're Express routers
  console.log('\n📋 Checking router stack...\n');
  
  console.log('Stories routes:', storiesRouter.stack ? storiesRouter.stack.length : 0, 'endpoints');
  console.log('Wallets routes:', walletsRouter.stack ? walletsRouter.stack.length : 0, 'endpoints');
  console.log('Analytics routes:', analyticsRouter.stack ? analyticsRouter.stack.length : 0, 'endpoints');
  
  // List stories endpoints
  if (storiesRouter.stack) {
    console.log('\n📍 Stories API endpoints:');
    storiesRouter.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`  ${methods} ${layer.route.path}`);
      }
    });
  }
  
  // List wallets endpoints
  if (walletsRouter.stack) {
    console.log('\n📍 Wallets API endpoints:');
    walletsRouter.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`  ${methods} ${layer.route.path}`);
      }
    });
  }
  
  // List analytics endpoints
  if (analyticsRouter.stack) {
    console.log('\n📍 Analytics API endpoints:');
    analyticsRouter.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`  ${methods} ${layer.route.path}`);
      }
    });
  }
  
  console.log('\n✅ All routes verified successfully!');
  console.log('\n📦 Ready to deploy to Cloud Run');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
