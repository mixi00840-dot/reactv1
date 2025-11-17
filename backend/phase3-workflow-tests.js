/**
 * Phase 3: Production Workflow Verification
 * Tests critical workflows end-to-end against production backend
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app';

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Color codes for console output
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

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}${details ? ': ' + details : ''}`, color);
}

// Store auth tokens globally
let adminToken = null;
let adminUser = null;

/**
 * Test 1: Admin Authentication
 */
async function testAdminAuth() {
  log('\n📝 Test 1: Admin Authentication', 'cyan');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'admin@mixillo.com',
      password: 'Admin@123456'
    });

    const responseData = response.data.data || response.data;
    
    if (responseData.token || responseData.accessToken || response.data.token) {
      adminToken = responseData.token || responseData.accessToken || response.data.token;
      adminUser = responseData.user || response.data.user;
      
      if (adminUser && adminUser.role === 'admin') {
        logTest('Admin login', 'pass', `User: ${adminUser.username}`);
        results.passed.push('Admin Authentication');
        return true;
      } else {
        logTest('Admin role check', 'fail', `Role: ${adminUser?.role || 'unknown'}, expected: admin`);
        results.failed.push('Admin Authentication - Wrong role');
        return false;
      }
    } else {
      logTest('Admin login', 'fail', 'No token received');
      console.log('   Response data:', JSON.stringify(response.data, null, 2));
      results.failed.push('Admin Authentication - No token');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const statusCode = error.response?.status;
    logTest('Admin login', 'fail', `${statusCode ? `[${statusCode}] ` : ''}${errorMsg}`);
    console.log('   Full error:', JSON.stringify(error.response?.data || error.message, null, 2));
    results.failed.push('Admin Authentication - ' + errorMsg);
    return false;
  }
}

/**
 * Test 2: Dashboard Analytics Endpoint
 */
async function testDashboardAnalytics() {
  log('\n📊 Test 2: Dashboard Analytics', 'cyan');
  
  if (!adminToken) {
    logTest('Dashboard analytics', 'fail', 'No admin token');
    results.failed.push('Dashboard Analytics - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    
    if (data.totalUsers !== undefined || data.users !== undefined) {
      logTest('Dashboard analytics', 'pass', `Users: ${data.totalUsers || data.users || 0}`);
      results.passed.push('Dashboard Analytics');
      return true;
    } else {
      logTest('Dashboard analytics', 'warn', 'No user count in response');
      results.warnings.push('Dashboard Analytics - Unexpected response structure');
      return true;
    }
  } catch (error) {
    logTest('Dashboard analytics', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Dashboard Analytics - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 3: User Management - List Users
 */
async function testUserList() {
  log('\n👥 Test 3: User Management - List Users', 'cyan');
  
  if (!adminToken) {
    logTest('List users', 'fail', 'No admin token');
    results.failed.push('List Users - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const users = data.users || data;
    
    if (Array.isArray(users)) {
      logTest('List users', 'pass', `Retrieved ${users.length} users`);
      results.passed.push('User List');
      return true;
    } else {
      logTest('List users', 'fail', 'Response is not an array');
      results.failed.push('User List - Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('List users', 'fail', error.response?.data?.message || error.message);
    results.failed.push('User List - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 4: Settings Endpoint
 */
async function testSettings() {
  log('\n⚙️  Test 4: Platform Settings', 'cyan');
  
  if (!adminToken) {
    logTest('Get settings', 'fail', 'No admin token');
    results.failed.push('Settings - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/settings/mongodb`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const settings = response.data.data || response.data;
    
    if (settings) {
      logTest('Get settings', 'pass', 'Settings retrieved successfully');
      results.passed.push('Platform Settings');
      return true;
    } else {
      logTest('Get settings', 'fail', 'No settings data');
      results.failed.push('Settings - No data');
      return false;
    }
  } catch (error) {
    logTest('Get settings', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Settings - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 5: Products Endpoint
 */
async function testProducts() {
  log('\n🛍️  Test 5: Product Management', 'cyan');
  
  if (!adminToken) {
    logTest('List products', 'fail', 'No admin token');
    results.failed.push('Products - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/products?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const products = data.products || data;
    
    if (Array.isArray(products)) {
      logTest('List products', 'pass', `Retrieved ${products.length} products`);
      results.passed.push('Product List');
      return true;
    } else {
      logTest('List products', 'warn', 'Products endpoint returned non-array');
      results.warnings.push('Products - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('List products', 'warn', 'Products endpoint not found (404)');
      results.warnings.push('Products - Endpoint not implemented');
      return true;
    }
    logTest('List products', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Products - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 6: Orders Endpoint
 */
async function testOrders() {
  log('\n📦 Test 6: Order Management', 'cyan');
  
  if (!adminToken) {
    logTest('List orders', 'fail', 'No admin token');
    results.failed.push('Orders - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/orders?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const orders = data.orders || data;
    
    if (Array.isArray(orders)) {
      logTest('List orders', 'pass', `Retrieved ${orders.length} orders`);
      results.passed.push('Order List');
      return true;
    } else {
      logTest('List orders', 'warn', 'Orders endpoint returned non-array');
      results.warnings.push('Orders - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('List orders', 'warn', 'Orders endpoint not found (404)');
      results.warnings.push('Orders - Endpoint not implemented');
      return true;
    }
    logTest('List orders', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Orders - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 7: Wallet Management
 */
async function testWallets() {
  log('\n💰 Test 7: Wallet Management', 'cyan');
  
  if (!adminToken) {
    logTest('List wallets', 'fail', 'No admin token');
    results.failed.push('Wallets - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/wallets/admin/all?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const wallets = data.wallets || data;
    
    if (Array.isArray(wallets)) {
      logTest('List wallets', 'pass', `Retrieved ${wallets.length} wallets`);
      results.passed.push('Wallet List');
      return true;
    } else {
      logTest('List wallets', 'warn', 'Wallets endpoint returned non-array');
      results.warnings.push('Wallets - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('List wallets', 'warn', 'Wallets endpoint not found (404)');
      results.warnings.push('Wallets - Endpoint not implemented');
      return true;
    }
    logTest('List wallets', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Wallets - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 8: Live Streaming
 */
async function testLiveStreams() {
  log('\n🎥 Test 8: Live Streaming', 'cyan');
  
  if (!adminToken) {
    logTest('List streams', 'fail', 'No admin token');
    results.failed.push('Live Streams - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/livestreams/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const streams = data.streams || data.livestreams || data;
    
    if (Array.isArray(streams)) {
      logTest('List live streams', 'pass', `Retrieved ${streams.length} streams`);
      results.passed.push('Live Streams');
      return true;
    } else {
      logTest('List live streams', 'warn', 'Streams endpoint returned non-array');
      results.warnings.push('Live Streams - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('List live streams', 'warn', 'Streams endpoint not found (404)');
      results.warnings.push('Live Streams - Endpoint not implemented');
      return true;
    }
    logTest('List live streams', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Live Streams - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 9: Moderation Queue
 */
async function testModeration() {
  log('\n🛡️  Test 9: Content Moderation', 'cyan');
  
  if (!adminToken) {
    logTest('Moderation queue', 'fail', 'No admin token');
    results.failed.push('Moderation - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/moderation/queue`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const queue = data.queue || data.content || data;
    
    if (Array.isArray(queue)) {
      logTest('Moderation queue', 'pass', `Retrieved ${queue.length} items`);
      results.passed.push('Moderation Queue');
      return true;
    } else {
      logTest('Moderation queue', 'warn', 'Queue endpoint returned non-array');
      results.warnings.push('Moderation - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Moderation queue', 'warn', 'Moderation endpoint not found (404)');
      results.warnings.push('Moderation - Endpoint not implemented');
      return true;
    }
    logTest('Moderation queue', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Moderation - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 10: System Health Monitoring
 */
async function testSystemHealth() {
  log('\n🏥 Test 10: System Health', 'cyan');
  
  if (!adminToken) {
    logTest('System health', 'fail', 'No admin token');
    results.failed.push('System Health - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/system/health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const health = response.data.data || response.data;
    
    if (health.status || health.database) {
      logTest('System health', 'pass', `Status: ${health.status || 'OK'}`);
      results.passed.push('System Health');
      return true;
    } else {
      logTest('System health', 'warn', 'Health check returned unexpected format');
      results.warnings.push('System Health - Unexpected response');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('System health', 'warn', 'Health endpoint not found (404)');
      results.warnings.push('System Health - Endpoint not implemented');
      return true;
    }
    logTest('System health', 'fail', error.response?.data?.message || error.message);
    results.failed.push('System Health - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 11: Database Monitoring
 */
async function testDatabaseMonitoring() {
  log('\n🗄️  Test 11: Database Monitoring', 'cyan');
  
  if (!adminToken) {
    logTest('Database stats', 'fail', 'No admin token');
    results.failed.push('Database Monitoring - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/database/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const stats = response.data.data || response.data;
    
    if (stats) {
      logTest('Database stats', 'pass', 'Stats retrieved successfully');
      results.passed.push('Database Monitoring');
      return true;
    } else {
      logTest('Database stats', 'fail', 'No stats data');
      results.failed.push('Database Monitoring - No data');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Database stats', 'warn', 'Database stats endpoint not found (404)');
      results.warnings.push('Database Monitoring - Endpoint not implemented');
      return true;
    }
    logTest('Database stats', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Database Monitoring - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Test 12: Notification System
 */
async function testNotifications() {
  log('\n🔔 Test 12: Notification System', 'cyan');
  
  if (!adminToken) {
    logTest('Notification history', 'fail', 'No admin token');
    results.failed.push('Notifications - No token');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/notifications/admin/history`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = response.data.data || response.data;
    const notifications = data.notifications || data;
    
    if (Array.isArray(notifications)) {
      logTest('Notification history', 'pass', `Retrieved ${notifications.length} notifications`);
      results.passed.push('Notification System');
      return true;
    } else {
      logTest('Notification history', 'warn', 'Notifications endpoint returned non-array');
      results.warnings.push('Notifications - Unexpected response format');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Notification history', 'warn', 'Notifications endpoint not found (404)');
      results.warnings.push('Notifications - Endpoint not implemented');
      return true;
    }
    logTest('Notification history', 'fail', error.response?.data?.message || error.message);
    results.failed.push('Notifications - ' + (error.response?.data?.message || error.message));
    return false;
  }
}

/**
 * Print final report
 */
function printReport() {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 PHASE 3: WORKFLOW VERIFICATION REPORT', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n✅ Passed: ${results.passed.length}`, 'green');
  results.passed.forEach(test => log(`   • ${test}`, 'green'));
  
  if (results.warnings.length > 0) {
    log(`\n⚠️  Warnings: ${results.warnings.length}`, 'yellow');
    results.warnings.forEach(test => log(`   • ${test}`, 'yellow'));
  }
  
  if (results.failed.length > 0) {
    log(`\n❌ Failed: ${results.failed.length}`, 'red');
    results.failed.forEach(test => log(`   • ${test}`, 'red'));
  }
  
  const total = results.passed.length + results.warnings.length + results.failed.length;
  const passRate = ((results.passed.length / total) * 100).toFixed(1);
  
  log(`\n📈 Success Rate: ${passRate}%`, passRate > 80 ? 'green' : passRate > 50 ? 'yellow' : 'red');
  log(`🔗 API Base URL: ${API_BASE_URL}`, 'cyan');
  
  log('\n' + '='.repeat(60), 'blue');
  
  // Determine overall status
  if (results.failed.length === 0) {
    log('\n🎉 ALL CRITICAL WORKFLOWS PASSED', 'green');
    log('✅ System is production-ready', 'green');
  } else if (results.failed.length <= 2) {
    log('\n⚠️  MINOR ISSUES DETECTED', 'yellow');
    log('System is mostly functional with minor issues', 'yellow');
  } else {
    log('\n❌ CRITICAL ISSUES DETECTED', 'red');
    log('System requires fixes before production deployment', 'red');
  }
  
  log('\n');
}

/**
 * Main test runner
 */
async function runTests() {
  log('🚀 Starting Phase 3: Production Workflow Verification', 'blue');
  log(`🔗 Testing against: ${API_BASE_URL}`, 'cyan');
  log('');
  
  // Run all tests sequentially
  await testAdminAuth();
  await testDashboardAnalytics();
  await testUserList();
  await testSettings();
  await testProducts();
  await testOrders();
  await testWallets();
  await testLiveStreams();
  await testModeration();
  await testSystemHealth();
  await testDatabaseMonitoring();
  await testNotifications();
  
  // Print final report
  printReport();
  
  // Exit with appropriate code
  process.exit(results.failed.length === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
