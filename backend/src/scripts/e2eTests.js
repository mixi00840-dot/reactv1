require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://mixillo-backend-t4isogdgqa-ew.a.run.app';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(testName, passed, message = '') {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${testName}${message ? ': ' + message : ''}`, color);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testEndpoint(name, method, url, data = null, headers = {}, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers,
      validateStatus: () => true // Don't throw on any status
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const passed = response.status === expectedStatus;
    
    logResult(
      name,
      passed,
      `Status: ${response.status} (Expected: ${expectedStatus})`
    );
    
    return { passed, response };
  } catch (error) {
    logResult(name, false, error.message);
    return { passed: false, error };
  }
}

async function runTests() {
  log('\n🚀 Starting End-to-End API Tests\n', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'blue');

  // ============================================
  // 1. HEALTH & BASIC CHECKS
  // ============================================
  log('📋 Section 1: Health & Basic Checks', 'yellow');
  
  await testEndpoint(
    'Health Check',
    'GET',
    '/health'
  );

  await testEndpoint(
    'MongoDB Health',
    'GET',
    '/health/mongodb'
  );

  // ============================================
  // 2. AUTHENTICATION TESTS
  // ============================================
  log('\n🔐 Section 2: Authentication', 'yellow');
  
  const registerResult = await testEndpoint(
    'Register New User',
    'POST',
    '/api/auth/mongodb/register',
    {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!@#',
      fullName: 'Test User'
    },
    {},
    201
  );

  const loginResult = await testEndpoint(
    'Login User',
    'POST',
    '/api/auth/mongodb/login',
    {
      email: 'admin@mixillo.com',
      password: 'password123'
    }
  );

  if (loginResult.passed && loginResult.response?.data?.token) {
    authToken = loginResult.response.data.token;
    log(`   Auth token obtained: ${authToken.substring(0, 20)}...`, 'green');
  }

  // ============================================
  // 3. CURRENCIES API TESTS
  // ============================================
  log('\n💰 Section 3: Currencies API', 'yellow');
  
  await testEndpoint(
    'Get All Currencies',
    'GET',
    '/api/currencies/mongodb'
  );

  await testEndpoint(
    'Get Default Currency',
    'GET',
    '/api/currencies/mongodb/default'
  );

  await testEndpoint(
    'Get Specific Currency (USD)',
    'GET',
    '/api/currencies/mongodb/USD'
  );

  await testEndpoint(
    'Get Specific Currency (EUR)',
    'GET',
    '/api/currencies/mongodb/EUR'
  );

  if (authToken) {
    await testEndpoint(
      'Create Currency (Admin)',
      'POST',
      '/api/currencies/mongodb',
      {
        code: 'TST',
        name: 'Test Currency',
        symbol: 'T$',
        exchangeRate: 1.5,
        country: 'Testland',
        flag: '🏳️'
      },
      { Authorization: `Bearer ${authToken}` },
      201
    );

    await testEndpoint(
      'Update Currency (Admin)',
      'PUT',
      '/api/currencies/mongodb/TST',
      {
        exchangeRate: 1.75
      },
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'Delete Currency (Admin)',
      'DELETE',
      '/api/currencies/mongodb/TST',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
  }

  // ============================================
  // 4. USERS API TESTS
  // ============================================
  log('\n👥 Section 4: Users API', 'yellow');
  
  await testEndpoint(
    'Get Users List',
    'GET',
    '/api/users/mongodb'
  );

  await testEndpoint(
    'Search Users',
    'GET',
    '/api/users/mongodb/search?q=admin'
  );

  await testEndpoint(
    'Get User Stats',
    'GET',
    '/api/users/mongodb/stats'
  );

  // ============================================
  // 5. CONTENT API TESTS
  // ============================================
  log('\n🎬 Section 5: Content API', 'yellow');
  
  await testEndpoint(
    'Get Content Feed',
    'GET',
    '/api/content/mongodb/feed'
  );

  await testEndpoint(
    'Get Trending Content',
    'GET',
    '/api/content/mongodb/trending'
  );

  await testEndpoint(
    'Get Trending (24h)',
    'GET',
    '/api/content/mongodb/trending?timeframe=24h'
  );

  await testEndpoint(
    'Get Trending (7d)',
    'GET',
    '/api/content/mongodb/trending?timeframe=7d'
  );

  // ============================================
  // 6. COMMENTS API TESTS
  // ============================================
  log('\n💬 Section 6: Comments API', 'yellow');
  
  await testEndpoint(
    'Get All Comments',
    'GET',
    '/api/comments/mongodb'
  );

  await testEndpoint(
    'Get Comments with Filters',
    'GET',
    '/api/comments/mongodb?status=approved&limit=10'
  );

  // ============================================
  // 7. CATEGORIES API TESTS
  // ============================================
  log('\n📁 Section 7: Categories API', 'yellow');
  
  await testEndpoint(
    'Get All Categories',
    'GET',
    '/api/categories/mongodb'
  );

  // ============================================
  // 8. PRODUCTS API TESTS
  // ============================================
  log('\n🛍️ Section 8: Products API', 'yellow');
  
  await testEndpoint(
    'Get All Products',
    'GET',
    '/api/products/mongodb'
  );

  await testEndpoint(
    'Get Products with Filters',
    'GET',
    '/api/products/mongodb?category=tech&minPrice=50&maxPrice=500'
  );

  // ============================================
  // 9. SETTINGS API TESTS
  // ============================================
  log('\n⚙️ Section 9: Settings API', 'yellow');
  
  await testEndpoint(
    'Get Public Settings',
    'GET',
    '/api/settings/mongodb/public'
  );

  if (authToken) {
    await testEndpoint(
      'Get All Settings (Admin)',
      'GET',
      '/api/settings/mongodb',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
  }

  // ============================================
  // 10. WALLETS API TESTS
  // ============================================
  log('\n💰 Section 10: Wallets API', 'yellow');
  
  if (authToken) {
    await testEndpoint(
      'Get My Wallet',
      'GET',
      '/api/wallets/mongodb',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
  }

  // ============================================
  // 11. GIFTS API TESTS
  // ============================================
  log('\n🎁 Section 11: Gifts API', 'yellow');
  
  await testEndpoint(
    'Get All Gifts',
    'GET',
    '/api/gifts/mongodb'
  );

  await testEndpoint(
    'Get Gifts by Rarity',
    'GET',
    '/api/gifts/mongodb?rarity=rare'
  );

  // ============================================
  // 12. SOUNDS API TESTS
  // ============================================
  log('\n🎵 Section 12: Sounds API', 'yellow');
  
  await testEndpoint(
    'Get All Sounds',
    'GET',
    '/api/sounds/mongodb'
  );

  await testEndpoint(
    'Get Trending Sounds',
    'GET',
    '/api/sounds/mongodb/trending'
  );

  // ============================================
  // 13. ANALYTICS API TESTS
  // ============================================
  log('\n📊 Section 13: Analytics API', 'yellow');
  
  if (authToken) {
    await testEndpoint(
      'Get Platform Stats (Admin)',
      'GET',
      '/api/analytics/mongodb/stats',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
  }

  // ============================================
  // 14. SEARCH API TESTS
  // ============================================
  log('\n🔍 Section 14: Search API', 'yellow');
  
  await testEndpoint(
    'Search All',
    'GET',
    '/api/search/mongodb?q=test'
  );

  await testEndpoint(
    'Search Users Only',
    'GET',
    '/api/search/mongodb/users?q=admin'
  );

  await testEndpoint(
    'Search Content Only',
    'GET',
    '/api/search/mongodb/content?q=dance'
  );

  // ============================================
  // FINAL RESULTS
  // ============================================
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = ((testResults.passed / total) * 100).toFixed(1);
  
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  log(`⏭️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => log(`   - ${t.name}: ${t.message}`, 'red'));
  }

  log('\n✅ Testing Complete!', 'green');
  
  // Exit with error code if tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log('\n❌ Test suite failed:', 'red');
  console.error(error);
  process.exit(1);
});
