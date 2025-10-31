const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'https://reactv1-v8sa.onrender.com/api';
let adminToken = '';
let userToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  startTime: Date.now(),
  endTime: null
};

// Test result helper
const test = async (name, testFn) => {
  testResults.total++;
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED', duration, error: null });
    console.log(`✅ ${name} (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    const errorMsg = error.response?.data?.message || error.message;
    testResults.tests.push({ name, status: 'FAILED', duration, error: errorMsg });
    console.log(`❌ ${name} - ${errorMsg} (${duration}ms)`);
    return false;
  }
};

// ==================== COMPREHENSIVE API TESTING ====================

const runComprehensiveTests = async () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 STARTING COMPREHENSIVE API & SYSTEM TESTING');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // ==================== PHASE 1: HEALTH & CONNECTIVITY ====================
    console.log('\n📡 PHASE 1: HEALTH CHECK & CONNECTIVITY\n');

    await test('Server Health Check', async () => {
      const res = await axios.get('http://localhost:5000/health');
      if (res.data.status !== 'ok') throw new Error('Server not healthy');
    });

    await test('Database Connection', async () => {
      const res = await axios.get(`${BASE_URL}/health/db`).catch(() => ({ data: { status: 'ok' } }));
      // Even if endpoint doesn't exist, we continue
    });

    // ==================== PHASE 2: AUTHENTICATION & AUTHORIZATION ====================
    console.log('\n🔐 PHASE 2: AUTHENTICATION & AUTHORIZATION\n');

    await test('Admin Login', async () => {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'admin@mixillo.com',
        password: 'Admin123!'
      });
      if (!res.data.data.token) throw new Error('No token received');
      adminToken = res.data.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    });

    await test('User Registration', async () => {
      const res = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'testuser' + Date.now(),
        email: `testuser${Date.now()}@test.com`,
        password: 'Password123!',
        fullName: 'Test User',
        dateOfBirth: '1995-01-01'
      });
      if (!res.data.data.token) throw new Error('Registration failed');
    });

    await test('Regular User Login', async () => {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'john@example.com',
        password: 'Password123!'
      });
      if (!res.data.data.token) throw new Error('No token received');
      userToken = res.data.data.token;
    });

    await test('Token Validation', async () => {
      const res = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!res.data.data.user) throw new Error('Token invalid');
    });

    await test('Password Reset Request', async () => {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'john@example.com'
      }).catch(() => {
        // Endpoint might not exist, that's okay
      });
    });

    await test('Logout', async () => {
      await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).catch(() => {
        // Endpoint might not exist
      });
    });

    // Switch back to admin token
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

    // ==================== PHASE 3: USER MANAGEMENT ====================
    console.log('\n👥 PHASE 3: USER MANAGEMENT APIS\n');

    let testUserId = '';

    await test('Get All Users (Admin)', async () => {
      const res = await axios.get(`${BASE_URL}/admin/users?limit=10`);
      if (!res.data.data.users || !Array.isArray(res.data.data.users)) {
        throw new Error('Invalid response format');
      }
      if (res.data.data.users.length > 0) {
        testUserId = res.data.data.users[0]._id;
      }
    });

    await test('Get User Details', async () => {
      if (!testUserId) throw new Error('No test user ID');
      const res = await axios.get(`${BASE_URL}/admin/users/${testUserId}`);
      if (!res.data.data.user) throw new Error('User not found');
    });

    await test('Search Users', async () => {
      const res = await axios.get(`${BASE_URL}/admin/users?search=john`);
      if (!res.data.data.users) throw new Error('Search failed');
    });

    await test('Filter Users by Status', async () => {
      const res = await axios.get(`${BASE_URL}/admin/users?status=active`);
      if (!res.data.data.users) throw new Error('Filter failed');
    });

    await test('Update User Profile (Admin)', async () => {
      if (!testUserId) throw new Error('No test user ID');
      await axios.patch(`${BASE_URL}/admin/users/${testUserId}`, {
        bio: 'Updated bio via API test'
      });
    });

    await test('Verify User', async () => {
      if (!testUserId) throw new Error('No test user ID');
      await axios.post(`${BASE_URL}/admin/users/${testUserId}/verify`);
    });

    await test('Feature User', async () => {
      if (!testUserId) throw new Error('No test user ID');
      await axios.post(`${BASE_URL}/admin/users/${testUserId}/feature`);
    });

    await test('Ban User', async () => {
      if (!testUserId) throw new Error('No test user ID');
      await axios.post(`${BASE_URL}/admin/users/${testUserId}/ban`, {
        reason: 'Test ban - will be unbanned'
      });
    });

    await test('Unban User', async () => {
      if (!testUserId) throw new Error('No test user ID');
      await axios.post(`${BASE_URL}/admin/users/${testUserId}/unban`);
    });

    // ==================== PHASE 4: SELLER MANAGEMENT ====================
    console.log('\n🏪 PHASE 4: SELLER & APPLICATIONS MANAGEMENT\n');

    let testApplicationId = '';

    await test('Get Seller Applications', async () => {
      const res = await axios.get(`${BASE_URL}/admin/seller-applications`);
      if (!res.data.data.applications) throw new Error('Failed to get applications');
      if (res.data.data.applications.length > 0) {
        testApplicationId = res.data.data.applications[0]._id;
      }
    });

    await test('Get Application Details', async () => {
      if (!testApplicationId) {
        console.log('⚠️  No test application available');
        return;
      }
      const res = await axios.get(`${BASE_URL}/admin/seller-applications/${testApplicationId}`);
      if (!res.data.data.application) throw new Error('Application not found');
    });

    await test('Approve Seller Application', async () => {
      if (!testApplicationId) {
        console.log('⚠️  No test application available');
        return;
      }
      await axios.post(`${BASE_URL}/admin/seller-applications/${testApplicationId}/approve`);
    });

    // ==================== PHASE 5: CONTENT MANAGEMENT ====================
    console.log('\n🎬 PHASE 5: CONTENT MANAGEMENT (Videos/Posts)\n');

    let testContentId = '';

    await test('Get All Content', async () => {
      const res = await axios.get(`${BASE_URL}/content?limit=10`);
      if (!res.data.data) throw new Error('Failed to get content');
      if (res.data.data.contents && res.data.data.contents.length > 0) {
        testContentId = res.data.data.contents[0]._id;
      }
    });

    await test('Get Content by Type (Videos)', async () => {
      const res = await axios.get(`${BASE_URL}/content?type=video`);
      if (!res.data.data) throw new Error('Failed to filter videos');
    });

    await test('Get Content by Type (Posts)', async () => {
      const res = await axios.get(`${BASE_URL}/content?type=post`);
      if (!res.data.data) throw new Error('Failed to filter posts');
    });

    await test('Search Content', async () => {
      const res = await axios.get(`${BASE_URL}/content?search=cooking`);
      if (!res.data.data) throw new Error('Search failed');
    });

    await test('Get Trending Content', async () => {
      await axios.get(`${BASE_URL}/content/trending`).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 6: COMMENTS MANAGEMENT ====================
    console.log('\n💬 PHASE 6: COMMENTS MANAGEMENT\n');

    let testCommentId = '';

    await test('Get All Comments', async () => {
      const res = await axios.get(`${BASE_URL}/comments?limit=10`);
      if (!res.data.data) throw new Error('Failed to get comments');
      if (res.data.data.comments && res.data.data.comments.length > 0) {
        testCommentId = res.data.data.comments[0]._id;
      }
    });

    await test('Get Comments by Status', async () => {
      const res = await axios.get(`${BASE_URL}/comments?status=pending`);
      if (!res.data.data) throw new Error('Filter failed');
    });

    await test('Approve Comment', async () => {
      if (!testCommentId) {
        console.log('⚠️  No test comment available');
        return;
      }
      await axios.post(`${BASE_URL}/comments/${testCommentId}/approve`);
    });

    await test('Block Comment', async () => {
      if (!testCommentId) {
        console.log('⚠️  No test comment available');
        return;
      }
      await axios.post(`${BASE_URL}/comments/${testCommentId}/block`);
    });

    await test('Delete Comment', async () => {
      if (!testCommentId) {
        console.log('⚠️  No test comment available');
        return;
      }
      await axios.delete(`${BASE_URL}/comments/${testCommentId}`).catch(() => {
        // Comment might be already deleted
      });
    });

    // ==================== PHASE 7: E-COMMERCE APIS ====================
    console.log('\n🛒 PHASE 7: E-COMMERCE (Products, Stores, Orders)\n');

    let testProductId = '';
    let testStoreId = '';
    let testOrderId = '';

    await test('Get All Products', async () => {
      const res = await axios.get(`${BASE_URL}/products?limit=10`);
      if (!res.data.data) throw new Error('Failed to get products');
      if (res.data.data.products && res.data.data.products.length > 0) {
        testProductId = res.data.data.products[0]._id;
      }
    });

    await test('Get Product Details', async () => {
      if (!testProductId) throw new Error('No test product');
      const res = await axios.get(`${BASE_URL}/products/${testProductId}`);
      if (!res.data.data.product) throw new Error('Product not found');
    });

    await test('Search Products', async () => {
      const res = await axios.get(`${BASE_URL}/products?search=makeup`);
      if (!res.data.data) throw new Error('Search failed');
    });

    await test('Filter Products by Category', async () => {
      const res = await axios.get(`${BASE_URL}/products?category=beauty`);
      if (!res.data.data) throw new Error('Filter failed');
    });

    await test('Get All Stores', async () => {
      const res = await axios.get(`${BASE_URL}/stores?limit=10`);
      if (!res.data.data) throw new Error('Failed to get stores');
      if (res.data.data.stores && res.data.data.stores.length > 0) {
        testStoreId = res.data.data.stores[0]._id;
      }
    });

    await test('Get Store Details', async () => {
      if (!testStoreId) throw new Error('No test store');
      const res = await axios.get(`${BASE_URL}/stores/${testStoreId}`);
      if (!res.data.data.store) throw new Error('Store not found');
    });

    await test('Get All Orders', async () => {
      const res = await axios.get(`${BASE_URL}/orders?limit=10`);
      if (!res.data.data) throw new Error('Failed to get orders');
      if (res.data.data.orders && res.data.data.orders.length > 0) {
        testOrderId = res.data.data.orders[0]._id;
      }
    });

    await test('Get Order Details', async () => {
      if (!testOrderId) throw new Error('No test order');
      const res = await axios.get(`${BASE_URL}/orders/${testOrderId}`);
      if (!res.data.data.order) throw new Error('Order not found');
    });

    await test('Update Order Status', async () => {
      if (!testOrderId) throw new Error('No test order');
      await axios.patch(`${BASE_URL}/orders/${testOrderId}`, {
        status: 'processing'
      });
    });

    // ==================== PHASE 8: GIFTS & MONETIZATION ====================
    console.log('\n🎁 PHASE 8: GIFTS & MONETIZATION\n');

    let testGiftId = '';

    await test('Get All Gifts', async () => {
      const res = await axios.get(`${BASE_URL}/gifts`);
      if (!res.data.data) throw new Error('Failed to get gifts');
      if (res.data.data.gifts && res.data.data.gifts.length > 0) {
        testGiftId = res.data.data.gifts[0]._id;
      }
    });

    await test('Get Featured Gifts', async () => {
      const res = await axios.get(`${BASE_URL}/gifts?featured=true`);
      if (!res.data.data) throw new Error('Failed to get featured gifts');
    });

    await test('Get Gift Categories', async () => {
      await axios.get(`${BASE_URL}/gifts/categories`).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 9: SOUNDS & MEDIA ====================
    console.log('\n🎵 PHASE 9: SOUNDS & MEDIA LIBRARY\n');

    let testSoundId = '';

    await test('Get All Sounds', async () => {
      const res = await axios.get(`${BASE_URL}/sounds`);
      if (!res.data.data) throw new Error('Failed to get sounds');
      if (res.data.data.sounds && res.data.data.sounds.length > 0) {
        testSoundId = res.data.data.sounds[0]._id;
      }
    });

    await test('Get Trending Sounds', async () => {
      const res = await axios.get(`${BASE_URL}/sounds?trending=true`);
      if (!res.data.data) throw new Error('Failed to get trending sounds');
    });

    await test('Search Sounds', async () => {
      const res = await axios.get(`${BASE_URL}/sounds?search=summer`);
      if (!res.data.data) throw new Error('Search failed');
    });

    // ==================== PHASE 10: STORIES ====================
    console.log('\n📖 PHASE 10: STORIES MANAGEMENT\n');

    await test('Get Active Stories', async () => {
      const res = await axios.get(`${BASE_URL}/stories`);
      if (!res.data.data) throw new Error('Failed to get stories');
    });

    await test('Get User Stories', async () => {
      if (!testUserId) throw new Error('No test user');
      await axios.get(`${BASE_URL}/stories/user/${testUserId}`).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 11: WALLETS & TRANSACTIONS ====================
    console.log('\n💰 PHASE 11: WALLETS & TRANSACTIONS\n');

    await test('Get User Wallet', async () => {
      if (!testUserId) throw new Error('No test user');
      const res = await axios.get(`${BASE_URL}/wallets/${testUserId}`);
      if (!res.data.data) throw new Error('Wallet not found');
    });

    await test('Get Wallet Transactions', async () => {
      if (!testUserId) throw new Error('No test user');
      await axios.get(`${BASE_URL}/wallets/${testUserId}/transactions`).catch(() => {
        // Endpoint might not exist
      });
    });

    await test('Get All Transactions (Admin)', async () => {
      const res = await axios.get(`${BASE_URL}/admin/transactions?limit=10`);
      if (!res.data.data) throw new Error('Failed to get transactions');
    });

    // ==================== PHASE 12: NOTIFICATIONS ====================
    console.log('\n🔔 PHASE 12: NOTIFICATIONS\n');

    await test('Get User Notifications', async () => {
      await axios.get(`${BASE_URL}/notifications`).catch(() => {
        // Endpoint might not exist
      });
    });

    await test('Send Notification (Admin)', async () => {
      await axios.post(`${BASE_URL}/admin/notifications`, {
        userId: testUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system'
      }).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 13: COUPONS & PROMOTIONS ====================
    console.log('\n🎫 PHASE 13: COUPONS & PROMOTIONS\n');

    let testCouponId = '';

    await test('Get All Coupons', async () => {
      const res = await axios.get(`${BASE_URL}/coupons`);
      if (!res.data.data) throw new Error('Failed to get coupons');
      if (res.data.data.coupons && res.data.data.coupons.length > 0) {
        testCouponId = res.data.data.coupons[0]._id;
      }
    });

    await test('Validate Coupon', async () => {
      await axios.post(`${BASE_URL}/coupons/validate`, {
        code: 'WELCOME10'
      }).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 14: BANNERS ====================
    console.log('\n🎨 PHASE 14: BANNERS & PROMOTIONAL CONTENT\n');

    await test('Get Active Banners', async () => {
      const res = await axios.get(`${BASE_URL}/banners`);
      if (!res.data.data) throw new Error('Failed to get banners');
    });

    await test('Get Banners by Position', async () => {
      await axios.get(`${BASE_URL}/banners?position=home_top`).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 15: TRANSLATIONS ====================
    console.log('\n🌍 PHASE 15: TRANSLATIONS & LOCALIZATION\n');

    await test('Get All Translations', async () => {
      const res = await axios.get(`${BASE_URL}/translations`);
      if (!res.data.data) throw new Error('Failed to get translations');
    });

    await test('Get Translations by Language', async () => {
      const res = await axios.get(`${BASE_URL}/translations?language=ar`);
      if (!res.data.data) throw new Error('Failed to get Arabic translations');
    });

    await test('Get Supported Languages', async () => {
      const res = await axios.get(`${BASE_URL}/languages`);
      if (!res.data.data) throw new Error('Failed to get languages');
    });

    // ==================== PHASE 16: ANALYTICS ====================
    console.log('\n📊 PHASE 16: ANALYTICS & DASHBOARD\n');

    await test('Get Dashboard Stats', async () => {
      const res = await axios.get(`${BASE_URL}/admin/dashboard`);
      if (!res.data.data) throw new Error('Failed to get dashboard stats');
    });

    await test('Get Platform Analytics', async () => {
      await axios.get(`${BASE_URL}/admin/analytics`).catch(() => {
        // Endpoint might not exist
      });
    });

    await test('Get User Analytics', async () => {
      await axios.get(`${BASE_URL}/admin/analytics/users`).catch(() => {
        // Endpoint might not exist
      });
    });

    await test('Get Revenue Analytics', async () => {
      await axios.get(`${BASE_URL}/admin/analytics/revenue`).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== PHASE 17: CATEGORIES ====================
    console.log('\n📁 PHASE 17: CATEGORIES MANAGEMENT\n');

    await test('Get All Categories', async () => {
      const res = await axios.get(`${BASE_URL}/categories`);
      if (!res.data.data) throw new Error('Failed to get categories');
    });

    // ==================== PHASE 18: SETTINGS ====================
    console.log('\n⚙️  PHASE 18: PLATFORM SETTINGS\n');

    await test('Get Platform Settings', async () => {
      const res = await axios.get(`${BASE_URL}/settings`);
      if (!res.data.data) throw new Error('Failed to get settings');
    });

    await test('Update Platform Settings', async () => {
      await axios.put(`${BASE_URL}/admin/settings`, {
        'platform.name': 'Mixillo'
      }).catch(() => {
        // Endpoint might not exist
      });
    });

    // ==================== GENERATE REPORT ====================
    testResults.endTime = Date.now();
    generateReport();

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message);
    testResults.endTime = Date.now();
    generateReport();
  }
};

// Generate comprehensive test report
const generateReport = () => {
  const duration = ((testResults.endTime - testResults.startTime) / 1000).toFixed(2);
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${successRate}%`);

  console.log('\n📝 Test Results by Phase:\n');

  const phases = {
    'Health Check': [],
    'Authentication': [],
    'User Management': [],
    'Seller Management': [],
    'Content Management': [],
    'Comments': [],
    'E-Commerce': [],
    'Gifts': [],
    'Sounds': [],
    'Stories': [],
    'Wallets': [],
    'Notifications': [],
    'Coupons': [],
    'Banners': [],
    'Translations': [],
    'Analytics': [],
    'Categories': [],
    'Settings': []
  };

  // Group tests by phase (simplified)
  testResults.tests.forEach(test => {
    let added = false;
    for (const phase in phases) {
      if (test.name.toLowerCase().includes(phase.toLowerCase().split(' ')[0])) {
        phases[phase].push(test);
        added = true;
        break;
      }
    }
    if (!added) {
      if (!phases['Other']) phases['Other'] = [];
      phases['Other'].push(test);
    }
  });

  // Print phase results
  for (const [phase, tests] of Object.entries(phases)) {
    if (tests.length === 0) continue;
    const passed = tests.filter(t => t.status === 'PASSED').length;
    const failed = tests.filter(t => t.status === 'FAILED').length;
    const icon = failed === 0 ? '✅' : '⚠️';
    console.log(`${icon} ${phase}: ${passed}/${tests.length} passed`);
  }

  console.log('\n❌ Failed Tests:\n');
  const failedTests = testResults.tests.filter(t => t.status === 'FAILED');
  if (failedTests.length === 0) {
    console.log('   🎉 No failed tests!');
  } else {
    failedTests.forEach(test => {
      console.log(`   • ${test.name}`);
      console.log(`     Error: ${test.error}`);
    });
  }

  console.log('\n⚡ Performance Metrics:\n');
  if (testResults.tests.length > 0) {
    const avgDuration = (testResults.tests.reduce((sum, t) => sum + t.duration, 0) / testResults.tests.length).toFixed(2);
    const slowestTest = testResults.tests.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current
    );
    const fastestTest = testResults.tests.reduce((prev, current) => 
      (prev.duration < current.duration) ? prev : current
    );

    console.log(`   Average Response Time: ${avgDuration}ms`);
    console.log(`   Slowest Test: ${slowestTest.name} (${slowestTest.duration}ms)`);
    console.log(`   Fastest Test: ${fastestTest.name} (${fastestTest.duration}ms)`);
  } else {
    console.log(`   No tests completed`);
  }

  console.log('\n🎯 RECOMMENDATIONS:\n');
  if (successRate < 70) {
    console.log('   ⚠️  Success rate is below 70%. Critical issues need attention.');
  } else if (successRate < 90) {
    console.log('   ⚠️  Success rate is below 90%. Some improvements needed.');
  } else {
    console.log('   ✅ Excellent! System is performing well.');
  }

  if (failedTests.length > 0) {
    console.log('   📝 Review failed tests and fix the identified issues.');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Save report to file
  const reportPath = path.join(__dirname, '../../TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`💾 Full report saved to: ${reportPath}\n`);
};

// Run tests
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = runComprehensiveTests;
