/**
 * Comprehensive Admin Dashboard API Testing Script
 * Tests all features and APIs in realtime against Google Cloud Run backend
 * Backend URL: https://mixillo-backend-t4isogdgqa-ew.a.run.app
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'https://mixillo-backend-52242135857.europe-west1.run.app';
const REQUEST_DELAY_MS = 250; // base delay between requests to reduce 429
const RETRY_POLICY = {
  maxRetries: 3,
  baseDelayMs: 500, // initial backoff on 429
  factor: 2, // exponential backoff factor
};
const ADMIN_CREDENTIALS = {
  login: 'admin@mixillo.com',
  password: 'Admin123!'  // Try the password from seed scripts
};

let authToken = null;
let testResults = [];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(80)}`, colors.bright);
  log(`  ${message}`, colors.bright);
  log(`${'='.repeat(80)}`, colors.bright);
}

function recordResult(category, endpoint, method, status, responseTime, success, error = null) {
  testResults.push({
    category,
    endpoint,
    method,
    status,
    responseTime: `${responseTime}ms`,
    success,
    error,
    timestamp: new Date().toISOString()
  });
}

async function testEndpoint(category, method, endpoint, data = null, requiresAuth = true) {
  const url = `${BASE_URL}${endpoint}`;
  let attempt = 0;
  let lastError = null;

  while (attempt <= RETRY_POLICY.maxRetries) {
    const startTime = Date.now();
    try {
      const config = {
        method,
        url,
        headers: {}
      };

      if (requiresAuth && authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      logSuccess(`${method.toUpperCase()} ${endpoint} - ${response.status} (${responseTime}ms)`);
      recordResult(category, endpoint, method, response.status, responseTime, true);

      // delay between requests
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));

      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status = error.response?.status || 'ERROR';
      const errorMsg = error.response?.data?.message || error.message;

      // If rate limited, backoff and retry
      if (status === 429 && attempt < RETRY_POLICY.maxRetries) {
        const delay = RETRY_POLICY.baseDelayMs * Math.pow(RETRY_POLICY.factor, attempt);
        logInfo(`429 rate limited on ${method.toUpperCase()} ${endpoint}. Retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_POLICY.maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
        lastError = { status, errorMsg };
        continue;
      }

      logError(`${method.toUpperCase()} ${endpoint} - ${status} (${responseTime}ms) - ${errorMsg}`);
      recordResult(category, endpoint, method, status, responseTime, false, errorMsg);

      // small delay even on error
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));

      return { success: false, error: errorMsg, status };
    }
  }

  // If we exhausted retries (should rarely reach here)
  return { success: false, error: lastError?.errorMsg || 'Unknown error', status: lastError?.status || 'ERROR' };
}

// Test Categories

async function testAuthentication() {
  logSection('1. AUTHENTICATION & AUTHORIZATION');
  
  // Test admin login
  logInfo('Testing admin login...');
  const loginResult = await testEndpoint(
    'Authentication',
    'post',
    '/api/auth/login',
    ADMIN_CREDENTIALS,
    false
  );

  // Debug: Log the response structure
  if (loginResult.success) {
    console.log('Login response data:', JSON.stringify(loginResult.data, null, 2));
  }

  // Check for token in different possible locations
  const token = loginResult.data?.token || 
                loginResult.data?.data?.token || 
                loginResult.data?.accessToken ||
                loginResult.data?.data?.accessToken;

  if (loginResult.success && token) {
    authToken = token;
    logSuccess(`Admin token acquired: ${authToken.substring(0, 20)}...`);
  } else {
    logError('Failed to obtain admin token. Cannot proceed with protected routes.');
    logError('Response structure:', JSON.stringify(loginResult.data));
    return false;
  }

  // Test token verification
  await testEndpoint('Authentication', 'get', '/api/auth/verify');
  
  // Test refresh token (if available)
  if (loginResult.data?.refreshToken) {
    await testEndpoint(
      'Authentication',
      'post',
      '/api/auth/refresh',
      { refreshToken: loginResult.data.refreshToken },
      false
    );
  }

  return true;
}

async function testUserManagement() {
  logSection('2. USER MANAGEMENT');
  
  // Get all users
  await testEndpoint('Users', 'get', '/api/users');
  
  // Get users with pagination
  await testEndpoint('Users', 'get', '/api/users?page=1&limit=10');
  
  // Search users
  await testEndpoint('Users', 'get', '/api/users?search=test');
  
  // Get user statistics
  await testEndpoint('Users', 'get', '/api/users/stats');
  
  // Get banned users
  await testEndpoint('Users', 'get', '/api/users?status=banned');
  
  // Get verified users
  await testEndpoint('Users', 'get', '/api/users?verified=true');
  
  // Test creating a user (admin function)
  await testEndpoint('Users', 'post', '/api/users', {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!',
    role: 'user'
  });
}

async function testSellerManagement() {
  logSection('3. SELLER MANAGEMENT');
  
  // Get seller applications
  await testEndpoint('Sellers', 'get', '/api/sellers/applications');
  
  // Get pending applications
  await testEndpoint('Sellers', 'get', '/api/sellers/applications?status=pending');
  
  // Get approved sellers
  await testEndpoint('Sellers', 'get', '/api/sellers/applications?status=approved');
  
  // Get rejected applications
  await testEndpoint('Sellers', 'get', '/api/sellers/applications?status=rejected');
  
  // Get seller statistics
  await testEndpoint('Sellers', 'get', '/api/sellers/stats');
}

async function testProductManagement() {
  logSection('4. PRODUCT & STORE MANAGEMENT');
  
  // Products
  await testEndpoint('Products', 'get', '/api/products');
  await testEndpoint('Products', 'get', '/api/products?page=1&limit=10');
  await testEndpoint('Products', 'get', '/api/products?status=active');
  await testEndpoint('Products', 'get', '/api/products/stats');
  
  // Stores
  await testEndpoint('Stores', 'get', '/api/stores');
  await testEndpoint('Stores', 'get', '/api/stores?status=active');
  await testEndpoint('Stores', 'get', '/api/stores/stats');
  
  // Orders
  await testEndpoint('Orders', 'get', '/api/orders');
  await testEndpoint('Orders', 'get', '/api/orders?status=pending');
  await testEndpoint('Orders', 'get', '/api/orders/stats');
}

async function testContentManagement() {
  logSection('5. CONTENT MANAGEMENT');
  
  // Videos
  await testEndpoint('Videos', 'get', '/api/transcode/queue');
  await testEndpoint('Videos', 'get', '/api/transcode/stats');
  
  // Stories
  await testEndpoint('Stories', 'get', '/api/stories');
  await testEndpoint('Stories', 'get', '/api/stories?status=active');
  
  // Posts/Comments
  await testEndpoint('Comments', 'get', '/api/comments');
  await testEndpoint('Comments', 'get', '/api/comments?flagged=true');
  
  // Sounds
  await testEndpoint('Sounds', 'get', '/api/sounds');
  await testEndpoint('Sounds', 'get', '/api/sounds/trending');
  
  // Gifts
  await testEndpoint('Gifts', 'get', '/api/monetization/gifts');
  await testEndpoint('Gifts', 'get', '/api/monetization/gifts/stats');
}

async function testModerationAndSafety() {
  logSection('6. MODERATION & SAFETY');
  
  // Moderation queue
  await testEndpoint('Moderation', 'get', '/api/moderation/queue');
  await testEndpoint('Moderation', 'get', '/api/moderation/reports');
  await testEndpoint('Moderation', 'get', '/api/moderation/stats');
  
  // Flagged content
  await testEndpoint('Moderation', 'get', '/api/moderation/flagged');
  
  // Trending controls
  await testEndpoint('Trending', 'get', '/api/trending/hashtags');
  await testEndpoint('Trending', 'get', '/api/trending/sounds');
  await testEndpoint('Trending', 'get', '/api/trending/videos');
}

async function testWalletsAndFinancials() {
  logSection('7. WALLETS & FINANCIAL MANAGEMENT');
  
  // Wallets
  await testEndpoint('Wallets', 'get', '/api/wallets');
  await testEndpoint('Wallets', 'get', '/api/wallets/stats');
  await testEndpoint('Wallets', 'get', '/api/wallets/transactions');
  
  // Payments
  await testEndpoint('Payments', 'get', '/api/payments');
  await testEndpoint('Payments', 'get', '/api/payments/stats');
  
  // Monetization
  await testEndpoint('Monetization', 'get', '/api/monetization/coins');
  await testEndpoint('Monetization', 'get', '/api/monetization/packages');
  await testEndpoint('Monetization', 'get', '/api/monetization/stats');
}

async function testAnalyticsAndReporting() {
  logSection('8. ANALYTICS & REPORTING');
  
  // Platform analytics
  await testEndpoint('Analytics', 'get', '/api/analytics/dashboard');
  await testEndpoint('Analytics', 'get', '/api/analytics/users');
  await testEndpoint('Analytics', 'get', '/api/analytics/content');
  await testEndpoint('Analytics', 'get', '/api/analytics/revenue');
  
  // Metrics
  await testEndpoint('Metrics', 'get', '/api/metrics/summary');
  await testEndpoint('Metrics', 'get', '/api/metrics/realtime');
  await testEndpoint('Metrics', 'get', '/api/metrics/engagement');
}

async function testSystemSettings() {
  logSection('9. SYSTEM SETTINGS & CONFIGURATION');
  
  // General settings
  await testEndpoint('Settings', 'get', '/api/settings');
  await testEndpoint('Settings', 'get', '/api/settings/app');
  await testEndpoint('Settings', 'get', '/api/settings/features');
  
  // CMS
  await testEndpoint('CMS', 'get', '/api/cms/pages');
  await testEndpoint('CMS', 'get', '/api/cms/banners');
  
  // Banners
  await testEndpoint('Banners', 'get', '/api/banners');
  await testEndpoint('Banners', 'get', '/api/banners?position=home');
  
  // Notifications
  await testEndpoint('Notifications', 'get', '/api/notifications');
  await testEndpoint('Notifications', 'get', '/api/notifications/stats');
}

async function testLivestreaming() {
  logSection('10. LIVESTREAMING & REAL-TIME FEATURES');
  
  // Livestreams
  await testEndpoint('Livestreams', 'get', '/api/livestreams');
  await testEndpoint('Livestreams', 'get', '/api/livestreams?status=live');
  await testEndpoint('Livestreams', 'get', '/api/livestreams/stats');
}

async function testCouponsAndPromotions() {
  logSection('11. COUPONS & PROMOTIONS');
  
  // Coupons
  await testEndpoint('Coupons', 'get', '/api/coupons');
  await testEndpoint('Coupons', 'get', '/api/coupons?status=active');
  await testEndpoint('Coupons', 'get', '/api/coupons/stats');
}

async function testShippingAndLogistics() {
  logSection('12. SHIPPING & LOGISTICS');
  
  // Shipping
  await testEndpoint('Shipping', 'get', '/api/shipping/zones');
  await testEndpoint('Shipping', 'get', '/api/shipping/methods');
  await testEndpoint('Shipping', 'get', '/api/shipping/stats');
}

async function testCustomerSupport() {
  logSection('13. CUSTOMER SUPPORT');
  
  // Support tickets
  await testEndpoint('Support', 'get', '/api/customer-service/tickets');
  await testEndpoint('Support', 'get', '/api/customer-service/tickets?status=open');
  await testEndpoint('Support', 'get', '/api/customer-service/stats');
  
  // FAQs
  await testEndpoint('Support', 'get', '/api/customer-service/faqs');
}

// Generate report
function generateReport() {
  logSection('TEST RESULTS SUMMARY');
  
  const totalTests = testResults.length;
  const successfulTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  const successRate = ((successfulTests / totalTests) * 100).toFixed(2);
  
  log(`\nTotal Tests: ${totalTests}`, colors.bright);
  log(`Successful: ${successfulTests}`, colors.green);
  log(`Failed: ${failedTests}`, colors.red);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.yellow);
  
  // Group by category
  logSection('RESULTS BY CATEGORY');
  const categories = [...new Set(testResults.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    const categoryTotal = categoryTests.length;
    const categoryRate = ((categorySuccess / categoryTotal) * 100).toFixed(2);
    
    log(`\n${category}:`, colors.cyan);
    log(`  Tests: ${categoryTotal}, Success: ${categorySuccess}, Rate: ${categoryRate}%`);
    
    // Show failed tests in this category
    const failed = categoryTests.filter(r => !r.success);
    if (failed.length > 0) {
      log('  Failed endpoints:', colors.yellow);
      failed.forEach(f => {
        log(`    - ${f.method.toUpperCase()} ${f.endpoint} (${f.status}) - ${f.error}`);
      });
    }
  });
  
  // Save detailed report to JSON
  const fs = require('fs');
  const reportPath = './admin-dashboard-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    backend_url: BASE_URL,
    summary: {
      total: totalTests,
      successful: successfulTests,
      failed: failedTests,
      successRate: `${successRate}%`
    },
    results: testResults
  }, null, 2));
  
  logSuccess(`\nDetailed report saved to: ${reportPath}`);
}

// Main execution
async function runAllTests() {
  log(`\n${'*'.repeat(80)}`, colors.bright);
  log(`  MIXILLO ADMIN DASHBOARD - COMPREHENSIVE API TEST`, colors.bright);
  log(`  Backend: ${BASE_URL}`, colors.cyan);
  log(`  Date: ${new Date().toLocaleString()}`, colors.cyan);
  log(`${'*'.repeat(80)}\n`, colors.bright);
  
  try {
    // Step 1: Authentication (required for all other tests)
    const authSuccess = await testAuthentication();
    
    if (!authSuccess) {
      logError('\n⚠️  Authentication failed. Cannot proceed with protected route tests.');
      return;
    }
    
    // Step 2: Run all feature tests
    await testUserManagement();
    await testSellerManagement();
    await testProductManagement();
    await testContentManagement();
    await testModerationAndSafety();
    await testWalletsAndFinancials();
    await testAnalyticsAndReporting();
    await testSystemSettings();
    await testLivestreaming();
    await testCouponsAndPromotions();
    await testShippingAndLogistics();
    await testCustomerSupport();
    
    // Step 3: Generate comprehensive report
    generateReport();
    
  } catch (error) {
    logError(`\nFatal error during testing: ${error.message}`);
    console.error(error);
  }
}

// Execute tests
runAllTests().catch(console.error);
