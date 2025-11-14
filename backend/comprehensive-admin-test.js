// Comprehensive Admin Dashboard Test Suite
// Generated: 2025-11-14

const axios = require('axios');
const io = require('socket.io-client');
const fs = require('fs');

const API_BASE = 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
const ADMIN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxMjQ2MDksImV4cCI6MTc2MzcyOTQwOX0.OX6ABhv7nG-OgqueVwQ6T9Qw56DjN_EmW3VoBLxp-2Q';

const report = {
  summary: { status: 'IN_PROGRESS', timestamp: new Date().toISOString() },
  endpoints: [],
  pages: [],
  db_checks: [],
  third_party: [],
  real_time: [],
  duplicates: [],
  priority_fixes: [],
  tests_run: [],
  artifacts: []
};

// Test endpoints
const endpoints = [
  // Authentication
  { path: '/auth/me', method: 'GET', requiresAuth: true },
  { path: '/auth/refresh', method: 'POST', requiresAuth: true },
  
  // Users
  { path: '/users', method: 'GET', requiresAuth: true },
  { path: '/users/6907e305bd986387e937a67a', method: 'GET', requiresAuth: true },
  
  // Content
  { path: '/content/feed', method: 'GET', requiresAuth: false },
  { path: '/posts/feed', method: 'GET', requiresAuth: false },
  
  // Products
  { path: '/products', method: 'GET', requiresAuth: false },
  { path: '/products/featured', method: 'GET', requiresAuth: false },
  { path: '/products/search', method: 'GET', requiresAuth: false },
  
  // Cart
  { path: '/cart', method: 'GET', requiresAuth: true },
  
  // Wallet
  { path: '/wallet', method: 'GET', requiresAuth: true },
  
  // Live Streaming
  { path: '/live', method: 'GET', requiresAuth: false },
  
  // Coins
  { path: '/coins/packages', method: 'GET', requiresAuth: false },
  
  // Stories
  { path: '/stories', method: 'GET', requiresAuth: false },
  
  // Notifications
  { path: '/notifications', method: 'GET', requiresAuth: true },
  
  // Admin endpoints
  { path: '/admin/users', method: 'GET', requiresAuth: true },
  { path: '/admin/stats', method: 'GET', requiresAuth: true },
  { path: '/admin/database/stats', method: 'GET', requiresAuth: true },
  { path: '/admin/database/collections', method: 'GET', requiresAuth: true },
];

async function testEndpoint(endpoint) {
  const startTime = Date.now();
  const test = {
    path: endpoint.path,
    method: endpoint.method,
    requiresAuth: endpoint.requiresAuth,
    status_code: null,
    latency_ms: null,
    response_schema_ok: false,
    error_message: null
  };

  try {
    const config = {
      method: endpoint.method,
      url: `${API_BASE}${endpoint.path}`,
      headers: endpoint.requiresAuth ? { 'Authorization': `Bearer ${ADMIN_JWT}` } : {},
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    };

    const response = await axios(config);
    test.status_code = response.status;
    test.latency_ms = Date.now() - startTime;
    
    // Check if response has expected structure
    if (response.data && typeof response.data === 'object') {
      test.response_schema_ok = true;
      if (response.data.success !== undefined || response.data.data !== undefined || response.data.message !== undefined) {
        test.response_schema_ok = true;
      }
    }

    // Mark as error if 4xx or 5xx
    if (response.status >= 400) {
      test.error_message = response.data?.message || response.data?.error || `HTTP ${response.status}`;
    }

  } catch (error) {
    test.latency_ms = Date.now() - startTime;
    test.status_code = error.response?.status || 0;
    test.error_message = error.message;
  }

  return test;
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests...\n');

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.method} ${endpoint.path}... `);
    const result = await testEndpoint(endpoint);
    report.endpoints.push(result);
    
    if (result.status_code >= 200 && result.status_code < 300) {
      console.log(`✅ ${result.status_code} (${result.latency_ms}ms)`);
    } else if (result.status_code >= 300 && result.status_code < 400) {
      console.log(`⚠️  ${result.status_code} (${result.latency_ms}ms)`);
    } else {
      console.log(`❌ ${result.status_code} - ${result.error_message} (${result.latency_ms}ms)`);
    }
  }

  // Summary
  const passed = report.endpoints.filter(e => e.status_code >= 200 && e.status_code < 300).length;
  const warnings = report.endpoints.filter(e => e.status_code >= 300 && e.status_code < 400).length;
  const failed = report.endpoints.filter(e => e.status_code >= 400 || e.status_code === 0).length;

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Passed: ${passed}/${endpoints.length}`);
  console.log(`   ⚠️  Warnings: ${warnings}/${endpoints.length}`);
  console.log(`   ❌ Failed: ${failed}/${endpoints.length}`);

  if (failed === 0 && warnings === 0) {
    report.summary.status = 'PASS';
  } else if (failed > 0) {
    report.summary.status = 'FAIL';
  } else {
    report.summary.status = 'WARN';
  }

  // Save report
  fs.writeFileSync('./test-report.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to test-report.json`);
}

runAllTests().catch(console.error);
