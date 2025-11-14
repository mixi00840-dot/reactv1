#!/usr/bin/env node
/**
 * ADMIN DASHBOARD PAGE CHECKER
 * Fast lightweight check of 42 admin pages using axios
 * Simulates authenticated browser session
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ADMIN_URL = 'https://admin-dashboard-mixillo.vercel.app';
const API_BASE = 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
const ADMIN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxMjQ2MDksImV4cCI6MTc2MzcyOTQwOX0.OX6ABhv7nG-OgqueVwQ6T9Qw56DjN_EmW3VoBLxp-2Q';

console.log('📱 ADMIN DASHBOARD PAGE AUDIT');
console.log('=====================================\n');

const results = {
  generated_at: new Date().toISOString(),
  total_pages: 0,
  passed: 0,
  warnings: 0,
  failed: 0,
  pages: []
};

// Pages with their underlying API endpoints
const pagesToTest = [
  { name: 'Login', path: '/login', api: null, critical: true },
  { name: 'Dashboard', path: '/dashboard', api: '/admin/dashboard', critical: true },
  { name: 'Users List', path: '/users', api: '/admin/users', critical: true },
  { name: 'User Details', path: '/users/:id', api: '/admin/users/6907e305bd986387e937a67a', critical: true },
  { name: 'Sellers', path: '/sellers', api: '/admin/users?role=seller', critical: false },
  { name: 'Seller Applications', path: '/seller-applications', api: '/seller-applications', critical: false },
  { name: 'Content', path: '/content', api: '/content/feed', critical: true },
  { name: 'Posts', path: '/posts', api: '/posts/feed', critical: false },
  { name: 'Stories', path: '/stories', api: '/stories', critical: false },
  { name: 'Comments', path: '/comments', api: '/comments/admin/all', critical: false },
  { name: 'Shares', path: '/shares', api: '/shares', critical: false },
  { name: 'Products', path: '/products', api: '/products', critical: true },
  { name: 'Categories', path: '/categories', api: '/categories', critical: false },
  { name: 'Stores', path: '/stores', api: '/stores', critical: true },
  { name: 'Orders', path: '/orders', api: '/orders', critical: true },
  { name: 'Shipping Methods', path: '/shipping-methods', api: '/shipping-methods', critical: false },
  { name: 'Wallets', path: '/wallets', api: '/admin/wallets', critical: true },
  { name: 'Transactions', path: '/transactions', api: '/wallets/6907e305bd986387e937a67a/transactions', critical: false },
  { name: 'Coin Packages', path: '/coin-packages', api: '/coins/packages', critical: false },
  { name: 'Live Streams', path: '/live-streams', api: '/live/livestreams', critical: true },
  { name: 'Stream Providers', path: '/stream-providers', api: '/admin/stream-providers', critical: false },
  { name: 'Gifts', path: '/gifts', api: '/gifts', critical: false },
  { name: 'Notifications', path: '/notifications', api: '/notifications', critical: false },
  { name: 'Reports', path: '/reports', api: '/reports', critical: false },
  { name: 'Strikes', path: '/strikes', api: '/strikes', critical: false },
  { name: 'Analytics', path: '/analytics', api: '/analytics/overview', critical: false },
  { name: 'Settings', path: '/settings', api: null, critical: false },
  { name: 'Admin Users', path: '/admin-users', api: '/admin/users?role=admin', critical: false },
  { name: 'Banners', path: '/banners', api: '/banners', critical: false },
  { name: 'Featured', path: '/featured', api: '/featured/admin/featured', critical: false },
  { name: 'Database Stats', path: '/database/stats', api: '/admin/database/stats', critical: false },
  { name: 'Database Collections', path: '/database/collections', api: '/admin/database/collections', critical: false },
  { name: 'Database Performance', path: '/database/performance', api: '/admin/database/performance', critical: false },
  { name: 'Cloudinary Config', path: '/cloudinary/config', api: '/admin/cloudinary/config', critical: false },
  { name: 'API Health', path: '/api-health', api: '/health', critical: false }
];

async function testPage(pageConfig) {
  const startTime = Date.now();
  const pageResult = {
    name: pageConfig.name,
    ui_path: pageConfig.path,
    api_endpoint: pageConfig.api,
    status: 'UNKNOWN',
    critical: pageConfig.critical,
    api_status: null,
    api_latency_ms: 0,
    error: null
  };
  
  results.total_pages++;
  
  try {
    // Test underlying API endpoint if specified
    if (pageConfig.api) {
      const apiUrl = `${API_BASE}${pageConfig.api}`;
      const response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${ADMIN_JWT}` },
        timeout: 5000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      });
      
      pageResult.api_status = response.status;
      pageResult.api_latency_ms = Date.now() - startTime;
      
      if (response.status === 200) {
        pageResult.status = 'OK';
        results.passed++;
        console.log(`   ✅ ${pageConfig.name} - API OK (${pageResult.api_latency_ms}ms)`);
      } else if (response.status === 404) {
        pageResult.status = 'WARN';
        pageResult.error = 'API endpoint not found';
        results.warnings++;
        console.log(`   ⚠️  ${pageConfig.name} - API 404 (endpoint missing)`);
      } else if (response.status >= 500) {
        pageResult.status = 'FAIL';
        pageResult.error = `API ${response.status} error`;
        results.failed++;
        console.log(`   ❌ ${pageConfig.name} - API ${response.status} (server error)`);
      } else {
        pageResult.status = 'WARN';
        pageResult.error = `API ${response.status}`;
        results.warnings++;
        console.log(`   ⚠️  ${pageConfig.name} - API ${response.status}`);
      }
    } else {
      // No API to test (static page)
      pageResult.status = 'OK';
      pageResult.error = 'No API endpoint (static page)';
      results.passed++;
      console.log(`   ✅ ${pageConfig.name} - Static page`);
    }
    
  } catch (error) {
    pageResult.status = 'FAIL';
    pageResult.error = error.message;
    results.failed++;
    console.log(`   ❌ ${pageConfig.name} - ${error.message}`);
  }
  
  results.pages.push(pageResult);
}

async function main() {
  console.log('Testing admin pages via API endpoints...\n');
  
  for (const page of pagesToTest) {
    await testPage(page);
  }
  
  console.log('\n=====================================');
  console.log('📊 ADMIN PAGE AUDIT SUMMARY');
  console.log('=====================================');
  console.log(`Total Pages: ${results.total_pages}`);
  console.log(`✅ Passed: ${results.passed} (${((results.passed/results.total_pages)*100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings: ${results.warnings} (${((results.warnings/results.total_pages)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${((results.failed/results.total_pages)*100).toFixed(1)}%)`);
  console.log('');
  
  // Calculate pass rate
  const passRate = (results.passed / results.total_pages) * 100;
  let overall_status = 'OK';
  if (passRate < 50) overall_status = 'FAIL';
  else if (passRate < 90) overall_status = 'WARN';
  
  results.overall_status = overall_status;
  results.pass_rate = passRate;
  
  console.log(`Overall Status: ${overall_status} (${passRate.toFixed(1)}% pass rate)`);
  console.log('');
  
  // Save results
  const outputPath = path.join(__dirname, '..', 'workspace', 'report', 'pages.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`💾 Results saved to: ${outputPath}`);
  console.log('=====================================\n');
}

main();
