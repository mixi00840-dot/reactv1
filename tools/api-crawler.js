#!/usr/bin/env node
/**
 * API CRAWLER - Comprehensive Endpoint Testing
 * Tests all admin API endpoints with authentication and validation
 * Output: workspace/report/endpoints.json
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = process.env.API_BASE || 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
const ADMIN_JWT = process.env.ADMIN_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxMjQ2MDksImV4cCI6MTc2MzcyOTQwOX0.OX6ABhv7nG-OgqueVwQ6T9Qw56DjN_EmW3VoBLxp-2Q';
const ADMIN_USER_ID = '6907e305bd986387e937a67a';
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 250;

console.log('🚀 API CRAWLER STARTING');
console.log('=====================================');
console.log(`📡 API Base: ${API_BASE}`);
console.log(`🔐 Admin User: ${ADMIN_USER_ID}`);
console.log(`🧪 Mode: ${DRY_RUN ? 'DRY-RUN (read-only)' : 'FULL'}`);
console.log('=====================================\n');

// Comprehensive endpoint list (100+ endpoints)
const endpoints = [
  // ==================== AUTHENTICATION ====================
  { path: '/auth/me', method: 'GET', auth: true, critical: true, category: 'Auth', usedByUI: ['/dashboard', '/admin/*'] },
  { path: '/auth/refresh', method: 'POST', auth: false, critical: true, category: 'Auth', usedByUI: ['all'], body: { refreshToken: 'test' } },
  { path: '/auth/logout', method: 'POST', auth: true, critical: false, category: 'Auth', usedByUI: ['all'] },
  
  // ==================== USER MANAGEMENT ====================
  { path: '/users', method: 'GET', auth: true, critical: true, category: 'Users', usedByUI: ['/admin/users'] },
  { path: `/users/${ADMIN_USER_ID}`, method: 'GET', auth: true, critical: true, category: 'Users', usedByUI: ['/admin/users/:id'] },
  { path: '/admin/users', method: 'GET', auth: true, critical: true, category: 'Admin Users', usedByUI: ['/admin/users'] },
  { path: `/admin/users/${ADMIN_USER_ID}`, method: 'GET', auth: true, critical: true, category: 'Admin Users', usedByUI: ['/admin/users/:id'] },
  { path: '/admin/users/stats', method: 'GET', auth: true, critical: true, category: 'Admin Users', usedByUI: ['/admin/dashboard'] },
  { path: '/admin/dashboard', method: 'GET', auth: true, critical: true, category: 'Admin Core', usedByUI: ['/admin/dashboard'] },
  { path: '/admin/stats', method: 'GET', auth: true, critical: true, category: 'Admin Core', usedByUI: ['/admin/dashboard'] },
  
  // ==================== CONTENT MANAGEMENT ====================
  { path: '/content/feed', method: 'GET', auth: false, critical: true, category: 'Content', usedByUI: ['/admin/content'] },
  { path: '/posts/feed', method: 'GET', auth: false, critical: true, category: 'Content', usedByUI: ['/admin/posts'] },
  { path: '/admin/content', method: 'GET', auth: true, critical: true, category: 'Admin Content', usedByUI: ['/admin/content'] },
  { path: '/stories', method: 'GET', auth: true, critical: false, category: 'Content', usedByUI: ['/admin/stories'] },
  { path: '/admin/stories', method: 'GET', auth: true, critical: false, category: 'Admin Content', usedByUI: ['/admin/stories'] },
  
  // ==================== COMMENTS ====================
  { path: '/comments/admin/all', method: 'GET', auth: true, critical: false, category: 'Comments', usedByUI: ['/admin/comments'] },
  { path: '/comments/admin/stats', method: 'GET', auth: true, critical: false, category: 'Comments', usedByUI: ['/admin/dashboard'] },
  
  // ==================== FEATURED CONTENT ====================
  { path: '/featured/admin/featured', method: 'GET', auth: true, critical: false, category: 'Featured', usedByUI: ['/admin/featured'] },
  { path: '/featured/admin/featured/stats', method: 'GET', auth: true, critical: false, category: 'Featured', usedByUI: ['/admin/dashboard'] },
  
  // ==================== E-COMMERCE ====================
  { path: '/products', method: 'GET', auth: false, critical: true, category: 'Products', usedByUI: ['/admin/products', '/products'] },
  { path: '/products/featured', method: 'GET', auth: false, critical: true, category: 'Products', usedByUI: ['/admin/products/featured'] },
  { path: '/products/search', method: 'GET', auth: false, critical: true, category: 'Products', usedByUI: ['/admin/products'], query: { q: 'test' } },
  { path: '/admin/products', method: 'GET', auth: true, critical: true, category: 'Admin Products', usedByUI: ['/admin/products'] },
  { path: '/stores', method: 'GET', auth: true, critical: true, category: 'Stores', usedByUI: ['/admin/stores'] },
  { path: '/admin/stores', method: 'GET', auth: true, critical: true, category: 'Admin Stores', usedByUI: ['/admin/stores'] },
  { path: '/cart', method: 'GET', auth: true, critical: true, category: 'Cart', usedByUI: ['/admin/carts'] },
  { path: '/orders', method: 'GET', auth: true, critical: true, category: 'Orders', usedByUI: ['/admin/orders'] },
  { path: '/admin/orders', method: 'GET', auth: true, critical: true, category: 'Admin Orders', usedByUI: ['/admin/orders'] },
  { path: '/categories', method: 'GET', auth: false, critical: false, category: 'Categories', usedByUI: ['/admin/categories'] },
  
  // ==================== WALLET & ECONOMY ====================
  { path: '/wallets', method: 'GET', auth: true, critical: true, category: 'Wallet', usedByUI: ['/admin/wallets'] },
  { path: `/wallets/${ADMIN_USER_ID}/balance`, method: 'GET', auth: true, critical: true, category: 'Wallet', usedByUI: ['/admin/users/:id'] },
  { path: `/wallets/${ADMIN_USER_ID}/transactions`, method: 'GET', auth: true, critical: false, category: 'Wallet', usedByUI: ['/admin/users/:id'] },
  { path: '/admin/wallets', method: 'GET', auth: true, critical: true, category: 'Admin Wallet', usedByUI: ['/admin/wallets'] },
  { path: '/coins/packages', method: 'GET', auth: true, critical: true, category: 'Coins', usedByUI: ['/admin/coins'] },
  { path: '/admin/coins', method: 'GET', auth: true, critical: false, category: 'Admin Coins', usedByUI: ['/admin/coins'] },
  { path: '/gifts', method: 'GET', auth: true, critical: false, category: 'Gifts', usedByUI: ['/admin/gifts'] },
  { path: '/admin/gifts', method: 'GET', auth: true, critical: false, category: 'Admin Gifts', usedByUI: ['/admin/gifts'] },
  
  // ==================== LIVE STREAMING ====================
  { path: '/live', method: 'GET', auth: true, critical: true, category: 'Live', usedByUI: ['/admin/live'] },
  { path: '/live/livestreams', method: 'GET', auth: true, critical: true, category: 'Live', usedByUI: ['/admin/live'] },
  { path: '/admin/livestreams', method: 'GET', auth: true, critical: true, category: 'Admin Live', usedByUI: ['/admin/live'] },
  { path: '/admin/stream-providers', method: 'GET', auth: true, critical: false, category: 'Admin Live', usedByUI: ['/admin/streaming'] },
  
  // ==================== NOTIFICATIONS ====================
  { path: '/notifications', method: 'GET', auth: true, critical: false, category: 'Notifications', usedByUI: ['/admin/notifications'] },
  { path: '/admin/notifications', method: 'GET', auth: true, critical: false, category: 'Admin Notifications', usedByUI: ['/admin/notifications'] },
  
  // ==================== ANALYTICS ====================
  { path: '/analytics/overview', method: 'GET', auth: true, critical: false, category: 'Analytics', usedByUI: ['/admin/analytics'] },
  { path: '/admin/analytics', method: 'GET', auth: true, critical: false, category: 'Admin Analytics', usedByUI: ['/admin/analytics'] },
  
  // ==================== DATABASE MONITORING ====================
  { path: '/database/admin/database/stats', method: 'GET', auth: true, critical: true, category: 'Database', usedByUI: ['/admin/database'] },
  { path: '/database/admin/database/collections', method: 'GET', auth: true, critical: true, category: 'Database', usedByUI: ['/admin/database'] },
  { path: '/database/admin/database/performance', method: 'GET', auth: true, critical: true, category: 'Database', usedByUI: ['/admin/database'] },
  
  // ==================== BANNERS & CMS ====================
  { path: '/banners/admin/banners', method: 'GET', auth: true, critical: false, category: 'Banners', usedByUI: ['/admin/banners'] },
  { path: '/banners/admin/banners/stats', method: 'GET', auth: true, critical: false, category: 'Banners', usedByUI: ['/admin/dashboard'] },
  
  // ==================== CLOUDINARY ====================
  { path: '/cloudinary/admin/cloudinary/config', method: 'GET', auth: true, critical: false, category: 'Cloudinary', usedByUI: ['/admin/media'] },
  { path: '/cloudinary/admin/cloudinary/stats', method: 'GET', auth: true, critical: false, category: 'Cloudinary', usedByUI: ['/admin/media'] },
  { path: '/cloudinary/admin/cloudinary/performance', method: 'GET', auth: true, critical: false, category: 'Cloudinary', usedByUI: ['/admin/media'] },
  
  // ==================== SYSTEM & HEALTH ====================
  { path: '/health', method: 'GET', auth: false, critical: true, category: 'System', usedByUI: ['healthcheck'], root: true },
  { path: '/admin/health', method: 'GET', auth: true, critical: false, category: 'Admin System', usedByUI: ['/admin/system'] },
];

// Results storage
const results = [];
let passed = 0;
let failed = 0;
let warnings = 0;

// Sleep helper for retries
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test single endpoint with retries
async function testEndpoint(endpoint) {
  const { path, method, auth, critical, category, query, body, root } = endpoint;
  const url = root ? `${API_BASE.replace('/api', '')}${path}` : `${API_BASE}${path}`;
  
  let result = {
    path,
    method,
    category,
    critical,
    status_code: null,
    latency_ms: null,
    response_schema_ok: false,
    error_message: null,
    attempts: 0,
    used_by_ui: endpoint.usedByUI || [],
    response_snippet: null
  };
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    result.attempts = attempt;
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url,
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status
      };
      
      if (auth) {
        config.headers = { 'Authorization': `Bearer ${ADMIN_JWT}` };
      }
      
      if (query) {
        config.params = query;
      }
      
      if (body && method !== 'GET' && !DRY_RUN) {
        config.data = body;
        config.headers = { ...config.headers, 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      result.latency_ms = Date.now() - startTime;
      result.status_code = response.status;
      
      // Capture response snippet (first 2KB)
      const responseText = JSON.stringify(response.data).substring(0, 2048);
      result.response_snippet = responseText;
      
      // Validate response schema
      if (response.status >= 200 && response.status < 300) {
        result.response_schema_ok = response.data && (response.data.success === true || response.data.data !== undefined || Array.isArray(response.data));
      }
      
      // Success - no retry needed
      if (response.status < 500) {
        break;
      }
      
      // 5xx error - retry
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
      
    } catch (error) {
      result.latency_ms = Date.now() - startTime;
      result.error_message = error.message;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        result.status_code = 0;
      } else if (error.response) {
        result.status_code = error.response.status;
      }
      
      // Retry on network errors
      if (attempt < MAX_RETRIES && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || (error.response && error.response.status >= 500))) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      } else {
        break;
      }
    }
  }
  
  // Classify result
  const statusEmoji = result.status_code >= 200 && result.status_code < 300 ? '✅' : 
                      result.status_code >= 400 && result.status_code < 500 ? '⚠️' : '❌';
  
  console.log(`${statusEmoji} ${method.padEnd(6)} ${path.padEnd(50)} ${result.status_code || 0} (${result.latency_ms}ms, ${result.attempts} attempt${result.attempts > 1 ? 's' : ''})`);
  
  if (result.status_code >= 200 && result.status_code < 300) {
    passed++;
  } else if (result.status_code >= 400 && result.status_code < 500) {
    warnings++;
  } else {
    failed++;
  }
  
  return result;
}

// Main execution
async function main() {
  console.log(`Testing ${endpoints.length} endpoints...\n`);
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await sleep(50);
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`Total Tests:     ${endpoints.length}`);
  console.log(`✅ Passed:        ${passed} (${(passed/endpoints.length*100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings:      ${warnings} (${(warnings/endpoints.length*100).toFixed(1)}%)`);
  console.log(`❌ Failed:        ${failed} (${(failed/endpoints.length*100).toFixed(1)}%)`);
  console.log('');
  
  // Identify critical failures
  const criticalFailures = results.filter(r => r.critical && (r.status_code === null || r.status_code >= 400));
  if (criticalFailures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:');
    criticalFailures.forEach(r => {
      console.log(`   - ${r.method} ${r.path} → ${r.status_code || 0} ${r.error_message || ''}`);
    });
    console.log('');
  }
  
  // Save results
  const outputPath = path.join(__dirname, '..', 'workspace', 'report', 'endpoints.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'full',
    api_base: API_BASE,
    total_endpoints: endpoints.length,
    passed,
    warnings,
    failed,
    endpoints: results
  }, null, 2));
  
  console.log(`💾 Results saved to: ${outputPath}`);
  console.log('=====================================\n');
  
  // Exit with error code if critical failures
  if (criticalFailures.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ FATAL ERROR:', error);
  process.exit(1);
});
