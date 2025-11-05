const admin = require('firebase-admin');
const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'https://mixillo-backend-52242135857.europe-west1.run.app';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${name}: ${status}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

let idToken = null;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

async function getAuthToken() {
  try {
    const serviceAccount = require('./serviceAccount.mixillo.json');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }

    const created = JSON.parse(fs.readFileSync('created-admin.json', 'utf8'));
    const customToken = await admin.auth().createCustomToken(created.uid);
    return customToken;
  } catch (error) {
    throw new Error(`Failed to get auth token: ${error.message}`);
  }
}

async function testEndpoint(method, url, options = {}) {
  testResults.total++;
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': options.token ? `Bearer ${options.token}` : undefined,
        ...options.headers
      },
      data: options.data,
      timeout: options.timeout || 15000,
      validateStatus: () => true // Don't throw on any status
    });

    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    
    if (isSuccess) {
      testResults.passed++;
      return { success: true, status, data: response.data };
    } else if (status === 503) {
      testResults.warnings++;
      return { success: false, status, data: response.data, warning: 'Service unavailable (fallback)' };
    } else {
      testResults.failed++;
      return { success: false, status, data: response.data };
    }
  } catch (error) {
    testResults.failed++;
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status || 'ERROR'
    };
  }
}

async function runTests() {
  logSection('🚀 COMPREHENSIVE BACKEND API TEST SUITE');
  
  // Step 1: Get auth token
  logSection('Step 1: Authentication Setup');
  try {
    idToken = await getAuthToken();
    logTest('Get Auth Token', 'PASS', 'Custom token created');
  } catch (error) {
    logTest('Get Auth Token', 'FAIL', error.message);
    return;
  }

  // Step 2: Health Checks
  logSection('Step 2: Health Checks');
  const healthEndpoints = [
    '/health',
    '/api/auth/health',
    '/api/auth/firebase/health',
    '/api/users/health',
    '/api/admin/health'
  ];

  for (const endpoint of healthEndpoints) {
    const result = await testEndpoint('GET', endpoint);
    logTest(`GET ${endpoint}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 3: Firebase Auth Tests
  logSection('Step 3: Firebase Authentication');
  const firebaseAuthTests = [
    { method: 'GET', url: '/api/auth/firebase/me', token: idToken },
    { method: 'POST', url: '/api/auth/firebase/verify-token', token: idToken, data: { idToken } }
  ];

  for (const test of firebaseAuthTests) {
    const result = await testEndpoint(test.method, test.url, { token: test.token, data: test.data });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : 'FAIL', 
      result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 4: Public Endpoints
  logSection('Step 4: Public Endpoints');
  const publicEndpoints = [
    { method: 'GET', url: '/api/products', description: 'Get products' },
    { method: 'GET', url: '/api/stores', description: 'Get stores' },
    { method: 'GET', url: '/api/settings', description: 'Get settings', token: idToken },
    { method: 'GET', url: '/api/cms', description: 'Get CMS content' },
    { method: 'GET', url: '/api/banners', description: 'Get banners' }
  ];

  for (const test of publicEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: test.token });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 5: Admin Endpoints (with Firebase token)
  logSection('Step 5: Admin Endpoints (Firebase Auth)');
  const adminEndpoints = [
    { method: 'GET', url: '/api/admin/users', description: 'List users', token: idToken },
    { method: 'GET', url: '/api/admin/users/search', description: 'Search users', params: '?q=test', token: idToken },
    { method: 'GET', url: '/api/admin/dashboard', description: 'Admin dashboard', token: idToken },
    { method: 'GET', url: '/api/analytics', description: 'Analytics', token: idToken },
    { method: 'GET', url: '/api/moderation', description: 'Moderation', token: idToken },
    { method: 'GET', url: '/api/metrics', description: 'Metrics', token: idToken },
    { method: 'GET', url: '/api/transcode', description: 'Transcode', token: idToken },
    { method: 'GET', url: '/api/trending', description: 'Trending' }
  ];

  for (const test of adminEndpoints) {
    const url = test.params ? `${test.url}${test.params}` : test.url;
    const result = await testEndpoint(test.method, url, { token: test.token || idToken });
    logTest(`${test.method} ${url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 6: User Management
  logSection('Step 6: User Management');
  const userEndpoints = [
    { method: 'GET', url: '/api/users/profile', token: idToken },
    { method: 'GET', url: '/api/users/stats', token: idToken }
  ];

  for (const test of userEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: test.token });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : 'FAIL', 
      result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 7: E-commerce Endpoints
  logSection('Step 7: E-commerce Endpoints');
  const ecommerceEndpoints = [
    { method: 'GET', url: '/api/products', description: 'Products' },
    { method: 'GET', url: '/api/stores', description: 'Stores' },
    { method: 'GET', url: '/api/orders', description: 'Orders', token: idToken },
    { method: 'GET', url: '/api/cart', description: 'Cart', token: idToken },
    { method: 'GET', url: '/api/categories', description: 'Categories' }
  ];

  for (const test of ecommerceEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: test.token });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 8: Content & Social
  logSection('Step 8: Content & Social Features');
  const contentEndpoints = [
    { method: 'GET', url: '/api/content', description: 'Content' },
    { method: 'GET', url: '/api/stories', description: 'Stories' },
    { method: 'GET', url: '/api/comments', description: 'Comments' },
    { method: 'GET', url: '/api/feed', description: 'Feed' },
    { method: 'GET', url: '/api/messaging', description: 'Messaging' }
  ];

  for (const test of contentEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: idToken });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 9: Streaming & Media
  logSection('Step 9: Streaming & Media');
  const streamingEndpoints = [
    { method: 'GET', url: '/api/streaming/providers', description: 'Stream providers', token: idToken },
    { method: 'GET', url: '/api/streaming/livestreams', description: 'Livestreams', token: idToken },
    { method: 'GET', url: '/api/player', description: 'Player', token: idToken },
    { method: 'GET', url: '/api/uploads', description: 'Uploads', token: idToken },
    { method: 'GET', url: '/api/sounds', description: 'Sounds' }
  ];

  for (const test of streamingEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: test.token });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Step 10: Wallets & Payments
  logSection('Step 10: Wallets & Payments');
  const walletEndpoints = [
    { method: 'GET', url: '/api/wallets', token: idToken },
    { method: 'GET', url: '/api/payments', description: 'Payments', token: idToken },
    { method: 'GET', url: '/api/monetization', description: 'Monetization', token: idToken }
  ];

  for (const test of walletEndpoints) {
    const result = await testEndpoint(test.method, test.url, { token: test.token });
    logTest(`${test.method} ${test.url}`, result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL', 
      result.warning ? 'Service unavailable' : result.status ? `Status: ${result.status}` : result.error);
  }

  // Final Summary
  logSection('📊 TEST SUMMARY');
  log(`Total Tests: ${testResults.total}`, 'cyan');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');

  // Save results
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  log('\n📄 Results saved to test-results.json', 'blue');
}

runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

