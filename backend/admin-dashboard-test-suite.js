// COMPREHENSIVE ADMIN DASHBOARD PRODUCTION TEST SUITE
// Auto-generated: 2025-11-14
// Purpose: Full audit of Mixillo admin dashboard for production readiness

const axios = require('axios');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ADMIN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxMjQ2MDksImV4cCI6MTc2MzcyOTQwOX0.OX6ABhv7nG-OgqueVwQ6T9Qw56DjN_EmW3VoBLxp-2Q';
const ADMIN_USER_ID = '6907e305bd986387e937a67a';

const report = {
  summary: {
    status: 'IN_PROGRESS',
    timestamp: new Date().toISOString(),
    total_tests: 0,
    passed: 0,
    warnings: 0,
    failed: 0
  },
  endpoints: [],
  priority_fixes: [],
  tests_run: []
};

// Comprehensive endpoint list based on actual routes
const endpoints = [
  // === AUTHENTICATION ===
  { category: 'Auth', path: '/auth/me', method: 'GET', auth: true, critical: true },
  
  // === USERS ===
  { category: 'Users', path: '/users', method: 'GET', auth: true, critical: true },
  { category: 'Users', path: `/users/${ADMIN_USER_ID}`, method: 'GET', auth: true, critical: true },
  
  // === ADMIN - CORE ===
  { category: 'Admin Core', path: '/admin/stats', method: 'GET', auth: true, critical: true },
  { category: 'Admin Core', path: '/admin/users', method: 'GET', auth: true, critical: true },
  { category: 'Admin Core', path: '/admin/users/stats', method: 'GET', auth: true, critical: true },
  
  // === ADMIN - DATABASE MONITORING ===
  { category: 'Database', path: '/database/admin/database/stats', method: 'GET', auth: true, critical: true },
  { category: 'Database', path: '/database/admin/database/collections', method: 'GET', auth: true, critical: true },
  { category: 'Database', path: '/database/admin/database/performance', method: 'GET', auth: true, critical: true },
  
  // === ADMIN - BANNERS ===
  { category: 'Banners', path: '/banners/admin/banners', method: 'GET', auth: true, critical: false },
  { category: 'Banners', path: '/banners/admin/banners/stats', method: 'GET', auth: true, critical: false },
  
  // === ADMIN - COMMENTS ===
  { category: 'Comments', path: '/comments/admin/all', method: 'GET', auth: true, critical: false },
  { category: 'Comments', path: '/comments/admin/stats', method: 'GET', auth: true, critical: false },
  
  // === ADMIN - CLOUDINARY ===
  { category: 'Cloudinary', path: '/cloudinary/admin/cloudinary/config', method: 'GET', auth: true, critical: false },
  { category: 'Cloudinary', path: '/cloudinary/admin/cloudinary/stats', method: 'GET', auth: true, critical: false },
  { category: 'Cloudinary', path: '/cloudinary/admin/cloudinary/performance', method: 'GET', auth: true, critical: false },
  
  // === ADMIN - FEATURED ===
  { category: 'Featured', path: '/featured/admin/featured', method: 'GET', auth: true, critical: false },
  { category: 'Featured', path: '/featured/admin/featured/stats', method: 'GET', auth: true, critical: false },
  
  // === CONTENT ===
  { category: 'Content', path: '/content/feed', method: 'GET', auth: false, critical: true },
  { category: 'Content', path: '/posts/feed', method: 'GET', auth: false, critical: true },
  
  // === PRODUCTS & E-COMMERCE ===
  { category: 'Products', path: '/products', method: 'GET', auth: false, critical: true },
  { category: 'Products', path: '/products/featured', method: 'GET', auth: false, critical: true },
  { category: 'Products', path: '/products/search?q=test', method: 'GET', auth: false, critical: false },
  { category: 'Cart', path: '/cart', method: 'GET', auth: true, critical: true },
  { category: 'Orders', path: '/orders', method: 'GET', auth: true, critical: true },
  { category: 'Stores', path: '/stores', method: 'GET', auth: false, critical: true },
  
  // === WALLET & PAYMENTS ===
  { category: 'Wallet', path: '/wallets', method: 'GET', auth: true, critical: true },
  { category: 'Wallet', path: `/wallets/${ADMIN_USER_ID}/balance`, method: 'GET', auth: true, critical: true },
  { category: 'Wallet', path: `/wallets/${ADMIN_USER_ID}/transactions`, method: 'GET', auth: true, critical: false },
  
  // === COINS & GIFTS ===
  { category: 'Coins', path: '/coins/packages', method: 'GET', auth: false, critical: true },
  { category: 'Gifts', path: '/gifts', method: 'GET', auth: false, critical: false },
  
  // === LIVE STREAMING ===
  { category: 'Live', path: '/live', method: 'GET', auth: false, critical: true },
  { category: 'Live', path: '/live/livestreams', method: 'GET', auth: false, critical: true },
  
  // === STORIES ===
  { category: 'Stories', path: '/stories', method: 'GET', auth: true, critical: false },
  
  // === NOTIFICATIONS ===
  { category: 'Notifications', path: '/notifications', method: 'GET', auth: true, critical: false },
  
  // === ANALYTICS ===
  { category: 'Analytics', path: '/analytics/overview', method: 'GET', auth: true, critical: false },
];

async function testEndpoint(endpoint) {
  const startTime = Date.now();
  const test = {
    category: endpoint.category,
    path: endpoint.path,
    method: endpoint.method,
    requiresAuth: endpoint.auth,
    critical: endpoint.critical,
    status_code: null,
    latency_ms: null,
    response_schema_ok: false,
    error_message: null,
    severity: null
  };

  try {
    const config = {
      method: endpoint.method,
      url: `${API_BASE}${endpoint.path}`,
      headers: endpoint.auth ? { 'Authorization': `Bearer ${ADMIN_JWT}` } : {},
      timeout: 15000,
      validateStatus: () => true
    };

    const response = await axios(config);
    test.status_code = response.status;
    test.latency_ms = Date.now() - startTime;
    
    // Validate response structure
    if (response.data && typeof response.data === 'object') {
      if (response.data.success !== undefined || response.data.data !== undefined) {
        test.response_schema_ok = true;
      }
    }

    // Determine severity
    if (response.status >= 200 && response.status < 300) {
      test.severity = 'PASS';
    } else if (response.status === 404) {
      test.severity = endpoint.critical ? 'P0' : 'P2';
      test.error_message = 'Endpoint not found';
    } else if (response.status === 401 || response.status === 403) {
      test.severity = endpoint.auth ? 'P1' : 'P2';
      test.error_message = response.data?.message || 'Authentication/Authorization failed';
    } else if (response.status >= 500) {
      test.severity = 'P0';
      test.error_message = response.data?.message || `Server error: ${response.status}`;
    } else if (response.status >= 400) {
      test.severity = 'P2';
      test.error_message = response.data?.message || response.data?.error || `Client error: ${response.status}`;
    }

  } catch (error) {
    test.latency_ms = Date.now() - startTime;
    test.status_code = error.response?.status || 0;
    test.error_message = error.code === 'ECONNREFUSED' ? 'Connection refused' : error.message;
    test.severity = endpoint.critical ? 'P0' : 'P1';
  }

  return test;
}

async function runAllTests() {
  console.log('🚀 COMPREHENSIVE ADMIN DASHBOARD TEST SUITE');
  console.log('='.repeat(70));
  console.log(`📡 API Base: ${API_BASE}`);
  console.log(`🔐 Admin User: ${ADMIN_USER_ID}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  console.log();

  const categories = [...new Set(endpoints.map(e => e.category))];
  
  for (const category of categories) {
    console.log(`\n📂 ${category.toUpperCase()}`);
    console.log('-'.repeat(70));
    
    const categoryEndpoints = endpoints.filter(e => e.category === category);
    
    for (const endpoint of categoryEndpoints) {
      const critical = endpoint.critical ? '🔴' : '⚪';
      process.stdout.write(`${critical} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(50)}`);
      
      const result = await testEndpoint(endpoint);
      report.endpoints.push(result);
      report.summary.total_tests++;
      
      if (result.severity === 'PASS') {
        console.log(` ✅ ${result.status_code} (${result.latency_ms}ms)`);
        report.summary.passed++;
      } else if (result.severity === 'P0') {
        console.log(` ❌ ${result.status_code} - ${result.error_message} (${result.latency_ms}ms)`);
        report.summary.failed++;
        report.priority_fixes.push({
          severity: 'P0',
          category: result.category,
          endpoint: `${result.method} ${result.path}`,
          issue: result.error_message,
          status_code: result.status_code,
          reproduction: `curl -H "Authorization: Bearer $ADMIN_JWT" ${API_BASE}${result.path}`
        });
      } else if (result.severity === 'P1') {
        console.log(` ⚠️  ${result.status_code} - ${result.error_message} (${result.latency_ms}ms)`);
        report.summary.warnings++;
      } else {
        console.log(` ℹ️  ${result.status_code} - ${result.error_message} (${result.latency_ms}ms)`);
        report.summary.warnings++;
      }
      
      // Rate limiting: 100ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests:     ${report.summary.total_tests}`);
  console.log(`✅ Passed:        ${report.summary.passed} (${((report.summary.passed/report.summary.total_tests)*100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings:      ${report.summary.warnings} (${((report.summary.warnings/report.summary.total_tests)*100).toFixed(1)}%)`);
  console.log(`❌ Failed:        ${report.summary.failed} (${((report.summary.failed/report.summary.total_tests)*100).toFixed(1)}%)`);
  
  if (report.summary.failed === 0 && report.summary.warnings === 0) {
    report.summary.status = 'PASS';
    console.log(`\n🎉 Status: ALL TESTS PASSED`);
  } else if (report.summary.failed > 0) {
    report.summary.status = 'FAIL';
    console.log(`\n🚨 Status: CRITICAL FAILURES DETECTED`);
  } else {
    report.summary.status = 'WARN';
    console.log(`\n⚠️  Status: WARNINGS DETECTED`);
  }

  // Priority fixes
  if (report.priority_fixes.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 PRIORITY FIXES REQUIRED');
    console.log('='.repeat(70));
    report.priority_fixes.forEach((fix, idx) => {
      console.log(`\n${idx + 1}. [${fix.severity}] ${fix.category}: ${fix.endpoint}`);
      console.log(`   Issue: ${fix.issue}`);
      console.log(`   Status Code: ${fix.status_code}`);
      console.log(`   Reproduction: ${fix.reproduction}`);
    });
  }

  // Save report
  fs.writeFileSync('./admin-test-report.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: admin-test-report.json`);
  console.log(`⏰ Completed: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
}

runAllTests().catch(err => {
  console.error('❌ Test suite failed:', err.message);
  process.exit(1);
});
