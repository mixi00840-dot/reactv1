const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://reactv1-v8sa.onrender.com';
const ADMIN_EMAIL = 'admin@mixillo.com';
const ADMIN_PASSWORD = 'Admin123!';

let authToken = null;
const testResults = {
  timestamp: new Date().toISOString(),
  summary: { total: 0, passed: 0, failed: 0, successRate: '0%' },
  sections: {}
};

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(80), 'cyan');
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const statusSymbol = status === 'PASS' ? '✓' : '✗';
  log(`  ${statusSymbol} ${testName}`, statusColor);
  if (details) {
    log(`    ${details}`, 'yellow');
  }
}

// API Request Helper
async function apiRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
  };
  
  if (data) {
    config.data = data;
  }
  
  return await axios(config);
}

// Authentication
async function authenticate() {
  logSection('AUTHENTICATION TEST');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      login: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('Admin Login', 'PASS', `Token: ${authToken.substring(0, 20)}...`);
      testResults.passed++;
      return true;
    }
  } catch (error) {
    logTest('Admin Login', 'FAIL', error.message);
    testResults.failed++;
    return false;
  }
}

// Test Section 1: Dashboard
async function testDashboard() {
  logSection('SECTION 1: DASHBOARD');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/dashboard');
    if (response.data.success) {
      logTest('Get Dashboard Statistics', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Dashboard Stats', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Dashboard Statistics', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Dashboard Stats', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Dashboard'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 2: Users Management
async function testUsers() {
  logSection('SECTION 2: USERS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Users List
  try {
    const response = await apiRequest('GET', '/api/admin/users?page=1&limit=10');
    if (response.data.success && response.data.data.users) {
      logTest('Get Users List', 'PASS', `Found ${response.data.data.users.length} users`);
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Users', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Users List', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Users', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create New User
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@mixillo.com`,
      fullName: 'Test User',
      password: 'Test123!',
      dateOfBirth: '1995-01-01',
      role: 'user'
    };
    
    const response = await apiRequest('POST', '/api/admin/users', testUser);
    if (response.data.success && response.data.data.user) {
      logTest('Create User', 'PASS', `Created: ${testUser.username}`);
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create User', status: 'PASS', userId: response.data.data.user._id });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Create User', 'FAIL', error.response?.data?.message || error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create User', status: 'FAIL', error: error.response?.data?.message || error.message });
  }
  
  testResults.sections['Users'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 3: Seller Applications
async function testSellerApplications() {
  logSection('SECTION 3: SELLER APPLICATIONS');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/seller-applications?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Seller Applications', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Applications', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Seller Applications', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Applications', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Seller Applications'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 4: Content Manager
async function testContentManager() {
  logSection('SECTION 4: CONTENT MANAGER');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/content?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Content List', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Content', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Content List', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Content', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Content Manager'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 5: Upload Manager
async function testUploadManager() {
  logSection('SECTION 5: UPLOAD MANAGER');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Uploads
  try {
    const response = await apiRequest('GET', '/api/admin/uploads?page=1&limit=10');
    if (response.data.success && response.data.data) {
      logTest('Get Uploads List', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Uploads', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Uploads List', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Uploads', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Generate Presigned URL
  try {
    const response = await apiRequest('POST', '/api/uploads/presigned-url', {
      fileType: 'video',
      mimeType: 'video/mp4'
    });
    if (response.data.success && response.data.data.uploadUrl) {
      logTest('Generate Presigned URL', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Presigned URL', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Generate Presigned URL', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Presigned URL', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Upload Manager'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 6: Comments Management
async function testCommentsManagement() {
  logSection('SECTION 6: COMMENTS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/comments?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Comments List', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Comments', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Comments List', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Comments', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Comments Management'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 7: Gifts Management
async function testGifts() {
  logSection('SECTION 7: GIFTS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Gifts List
  try {
    const response = await apiRequest('GET', '/api/gifts?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Gifts List', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Gifts', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Gifts List', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Gifts', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create Gift
  try {
    const testGift = {
      name: `testgift${Date.now()}`,
      displayName: `Test Gift ${Date.now()}`,
      description: 'Test gift description',
      price: 100,
      category: 'emoji',
      media: {
        icon: 'https://example.com/icon.png'
      }
    };
    
    const response = await apiRequest('POST', '/api/gifts', testGift);
    if (response.data.success) {
      logTest('Create Gift', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create Gift', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.response?.data?.errors || error.message;
    logTest('Create Gift', 'FAIL', JSON.stringify(errorDetail));
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create Gift', status: 'FAIL', error: errorDetail });
  }
  
  testResults.sections['Gifts'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 8: Coins Management
async function testCoins() {
  logSection('SECTION 8: COINS/PACKAGES MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Coin Packages
  try {
    const response = await apiRequest('GET', '/api/admin/coin-packages?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Coin Packages', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Packages', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Coin Packages', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Packages', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create Coin Package
  try {
    const testPackage = {
      name: `Test Package ${Date.now()}`,
      coins: 1000,
      price: 9.99,
      currency: 'USD',
      isActive: true,
      description: 'Test coin package'
    };
    
    const response = await apiRequest('POST', '/api/admin/coin-packages', testPackage);
    if (response.data.success) {
      logTest('Create Coin Package', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create Package', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Create Coin Package', 'FAIL', error.response?.data?.message || error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create Package', status: 'FAIL', error: error.response?.data?.message || error.message });
  }
  
  testResults.sections['Coins'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 9: User Levels
async function testLevels() {
  logSection('SECTION 9: USER LEVELS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Levels
  try {
    const response = await apiRequest('GET', '/api/admin/levels?page=1&limit=10');
    if (response.data.success) {
      logTest('Get User Levels', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Levels', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get User Levels', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Levels', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create Level
  try {
    const testLevel = {
      level: Math.floor(Math.random() * 900) + 100,
      name: `Test Level ${Date.now()}`,
      minXP: 10000,
      maxXP: 20000,
      description: 'Test level description',
      badge: 'https://example.com/badge.png'
    };
    
    const response = await apiRequest('POST', '/api/admin/levels', testLevel);
    if (response.data.success) {
      logTest('Create Level', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create Level', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.response?.data?.errors || error.message;
    logTest('Create Level', 'FAIL', JSON.stringify(errorDetail));
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create Level', status: 'FAIL', error: errorDetail });
  }
  
  testResults.sections['Levels'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 10: Tags
async function testTags() {
  logSection('SECTION 10: TAGS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Tags
  try {
    const response = await apiRequest('GET', '/api/admin/tags?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Tags', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Tags', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Tags', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Tags', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create Tag
  try {
    const testTag = {
      name: `testtag${Date.now()}`,
      displayName: `Test Tag ${Date.now()}`,
      category: 'entertainment',
      description: 'Test tag description'
    };
    
    const response = await apiRequest('POST', '/api/admin/tags', testTag);
    if (response.data.success) {
      logTest('Create Tag', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create Tag', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.response?.data?.errors || error.message;
    logTest('Create Tag', 'FAIL', JSON.stringify(errorDetail));
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create Tag', status: 'FAIL', error: errorDetail });
  }
  
  testResults.sections['Tags'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 11: Explorer Sections
async function testExplorer() {
  logSection('SECTION 11: EXPLORER SECTIONS');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Get Explorer Sections
  try {
    const response = await apiRequest('GET', '/api/admin/explorer-sections?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Explorer Sections', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Sections', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Explorer Sections', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Sections', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Create Explorer Section
  try {
    const testSection = {
      name: `testsection${Date.now()}`,
      displayName: `Test Section ${Date.now()}`,
      type: 'trending',
      description: 'Test explorer section'
    };
    
    const response = await apiRequest('POST', '/api/admin/explorer-sections', testSection);
    if (response.data.success) {
      logTest('Create Explorer Section', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Create Section', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.response?.data?.errors || error.message;
    logTest('Create Explorer Section', 'FAIL', JSON.stringify(errorDetail));
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create Section', status: 'FAIL', error: errorDetail });
  }
  
  testResults.sections['Explorer'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 12: Moderation
async function testModeration() {
  logSection('SECTION 12: MODERATION');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/reports?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Reports', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Reports', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Reports', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Reports', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Moderation'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 13: Analytics
async function testAnalytics() {
  logSection('SECTION 13: ANALYTICS');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/analytics/overview');
    if (response.data.success) {
      logTest('Get Analytics Overview', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Analytics Overview', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Analytics Overview', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Analytics Overview', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Analytics'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 14: Livestreams
async function testLivestreams() {
  logSection('SECTION 14: LIVESTREAMS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Admin endpoint
  try {
    const response = await apiRequest('GET', '/api/admin/livestreams?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Livestreams (Admin)', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Livestreams Admin', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Livestreams (Admin)', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Livestreams Admin', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Public endpoint
  try {
    const response = await apiRequest('GET', '/api/streaming/livestreams?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Livestreams (Public)', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Livestreams Public', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Livestreams (Public)', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Livestreams Public', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Livestreams'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Test Section 15: Wallets
async function testWallets() {
  logSection('SECTION 15: WALLETS MANAGEMENT');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  // Test 1: Admin Get All Wallets
  try {
    const response = await apiRequest('GET', '/api/admin/wallets?page=1&limit=10');
    if (response.data.success) {
      logTest('Get All Wallets (Admin)', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Wallets Admin', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get All Wallets (Admin)', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Wallets Admin', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Public Wallets Endpoint
  try {
    const response = await apiRequest('GET', '/api/wallets?page=1&limit=10');
    if (response.data.success) {
      logTest('Get Wallets (Public)', 'PASS');
      sectionResults.passed++;
      sectionResults.tests.push({ name: 'Get Wallets Public', status: 'PASS' });
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    logTest('Get Wallets (Public)', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Get Wallets Public', status: 'FAIL', error: error.message });
  }
  
  testResults.sections['Wallets'] = sectionResults;
  testResults.passed += sectionResults.passed;
  testResults.failed += sectionResults.failed;
}

// Generate Final Report
function generateReport() {
  logSection('TEST SUMMARY REPORT');
  
  testResults.summary.total = testResults.passed + testResults.failed;
  testResults.summary.successRate = testResults.summary.total > 0
    ? `${((testResults.passed / testResults.summary.total) * 100).toFixed(2)}%`
    : '0%';
  
  log(`Total Tests: ${testResults.summary.total}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${testResults.summary.successRate}`, 'yellow');
  
  log('\nSection Breakdown:', 'cyan');
  for (const [section, results] of Object.entries(testResults.sections)) {
    const total = results.passed + results.failed;
    const rate = total > 0 ? ((results.passed / total) * 100).toFixed(0) : 0;
    log(`  ${section}: ${results.passed}/${total} (${rate}%)`, rate == 100 ? 'green' : 'yellow');
  }
  
  // Save report to file
  const reportPath = 'test-report-all-sections.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');
}

// Main Test Runner
async function runAllTests() {
  log('🚀 Starting Comprehensive API Testing - ALL SECTIONS', 'magenta');
  log(`📍 Testing API: ${API_BASE_URL}`, 'blue');
  
  const authenticated = await authenticate();
  if (!authenticated) {
    log('\n❌ Authentication failed. Cannot proceed with tests.', 'red');
    process.exit(1);
  }
  
  // Run all test sections
  await testDashboard();
  await testUsers();
  await testSellerApplications();
  await testContentManager();
  await testUploadManager();
  await testCommentsManagement();
  await testGifts();
  await testCoins();
  await testLevels();
  await testTags();
  await testExplorer();
  await testModeration();
  await testAnalytics();
  await testLivestreams();
  await testWallets();
  
  generateReport();
  
  // Exit with error code if any tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
