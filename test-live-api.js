const axios = require('axios');

// Live server configuration
const BASE_URL = 'https://reactv1-v8sa.onrender.com';
const API_URL = `${BASE_URL}/api`;

console.log('🚀 Testing Mixillo API on Live Server');
console.log(`📡 Server: ${BASE_URL}`);
console.log(`🔗 API Base: ${API_URL}`);
console.log('=' .repeat(60));

async function testEndpoint(name, url, method = 'GET', data = null, headers = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 ${method} ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000 // 10 second timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ SUCCESS: ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.status || 'NO_RESPONSE'} ${error.response?.statusText || error.message}`);
    if (error.response?.data) {
      console.log(`📦 Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message, status: error.response?.status };
  }
}

async function runTests() {
  console.log('\n🏥 HEALTH CHECK TESTS');
  console.log('-'.repeat(40));
  
  // Basic health checks
  await testEndpoint('Server Health', `${BASE_URL}/health`);
  await testEndpoint('Database Health', `${API_URL}/health/db`);
  
  console.log('\n🔐 AUTHENTICATION TESTS');
  console.log('-'.repeat(40));
  
  // Test auth endpoints
  await testEndpoint('Auth Health', `${API_URL}/auth/health`);
  await testEndpoint('Test Registration', `${API_URL}/auth/register`, 'POST', {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'TestPass123!',
    phoneNumber: '+1234567890'
  });
  
  console.log('\n👥 USER ENDPOINTS');
  console.log('-'.repeat(40));
  
  // Test actual user endpoints that exist
  await testEndpoint('Users Health', `${API_URL}/users/health`);
  await testEndpoint('User Search', `${API_URL}/users/search?q=test`);
  
  console.log('\n🛒 E-COMMERCE ENDPOINTS');
  console.log('-'.repeat(40));
  
  // Test e-commerce endpoints
  await testEndpoint('Products', `${API_URL}/products`);
  await testEndpoint('Categories', `${API_URL}/categories`);
  await testEndpoint('Stores', `${API_URL}/stores`);
  
  console.log('\n👨‍💼 ADMIN ENDPOINTS (require auth)');
  console.log('-'.repeat(40));
  
  // Test admin endpoints (these should return 401 without auth - that's correct)
  await testEndpoint('Admin Health', `${API_URL}/admin/health`);
  
  console.log('\n📊 ANALYTICS ENDPOINTS');
  console.log('-'.repeat(40));
  
  // Test actual analytics endpoints that exist  
  await testEndpoint('Analytics Dashboard', `${API_URL}/analytics/dashboard/overview`);
  await testEndpoint('Analytics Sales', `${API_URL}/analytics/sales`);
  await testEndpoint('Analytics Customers', `${API_URL}/analytics/customers`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 API Testing Complete!');
  console.log('\n💡 TROUBLESHOOTING TIPS:');
  console.log('• If you see "API endpoint not found" → Missing JWT environment variables');
  console.log('• If you see "Internal Server Error" → Check server logs on Render');
  console.log('• If endpoints work → API is properly configured!');
  console.log('\n🔧 If APIs still fail, add these environment variables to Render:');
  console.log('   JWT_SECRET=your-secret-key');
  console.log('   JWT_REFRESH_SECRET=your-refresh-secret');
  console.log('   NODE_ENV=production');
}

// Run the tests
runTests().catch(console.error);