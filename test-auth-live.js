const axios = require('axios');

// Live server configuration
const BASE_URL = 'https://reactv1-v8sa.onrender.com';
const API_URL = `${BASE_URL}/api`;

console.log('🔐 Testing Mixillo Authentication & Admin Features');
console.log(`📡 Server: ${BASE_URL}`);
console.log('=' .repeat(60));

let adminToken = '';
let userToken = '';

async function apiCall(name, method, url, data = null, headers = {}) {
  try {
    console.log(`\n🧪 ${name}`);
    console.log(`📍 ${method} ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 15000
    };
    
    if (data) {
      config.data = data;
      console.log(`📦 Request:`, JSON.stringify(data, null, 2));
    }
    
    const response = await axios(config);
    console.log(`✅ SUCCESS: ${response.status}`);
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

async function testAuthentication() {
  console.log('\n🔐 ADMIN AUTHENTICATION');
  console.log('-'.repeat(50));
  
  // Test admin login
  const adminLogin = await apiCall(
    'Admin Login', 
    'POST', 
    `${API_URL}/auth/login`,
    {
      login: 'admin@mixillo.com',  // Use 'login' field instead of 'email'
      password: 'Admin123!'
    }
  );
  
  if (adminLogin.success && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    console.log('✅ Admin token obtained successfully!');
  } else {
    console.log('❌ Failed to get admin token - may need to seed database first');
    return false;
  }
  
  // Test admin endpoints with token
  console.log('\n👨‍💼 ADMIN PROTECTED ENDPOINTS');
  console.log('-'.repeat(50));
  
  await apiCall(
    'Admin Stats',
    'GET',
    `${API_URL}/admin/stats`,
    null,
    { Authorization: `Bearer ${adminToken}` }
  );
  
  await apiCall(
    'Admin Users List',
    'GET', 
    `${API_URL}/admin/users`,
    null,
    { Authorization: `Bearer ${adminToken}` }
  );
  
  await apiCall(
    'Admin Analytics',
    'GET',
    `${API_URL}/analytics/dashboard/overview`,
    null,
    { Authorization: `Bearer ${adminToken}` }
  );
  
  return true;
}

async function testUserRegistration() {
  console.log('\n👤 USER REGISTRATION & LOGIN');
  console.log('-'.repeat(50));
  
  // Test user registration
  const userReg = await apiCall(
    'User Registration',
    'POST',
    `${API_URL}/auth/register`,
    {
      username: 'testuser2024',
      email: 'testuser@example.com',
      password: 'TestUser123!',
      fullName: 'Test User',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-01'
    }
  );
  
  if (userReg.success) {
    // Test user login
    const userLogin = await apiCall(
      'User Login',
      'POST',
      `${API_URL}/auth/login`,
      {
        login: 'testuser@example.com',  // Use 'login' field instead of 'email'
        password: 'TestUser123!'
      }
    );
    
    if (userLogin.success && userLogin.data.token) {
      userToken = userLogin.data.token;
      console.log('✅ User token obtained successfully!');
      
      // Test user endpoints
      await apiCall(
        'User Profile',
        'GET',
        `${API_URL}/users/profile`,
        null,
        { Authorization: `Bearer ${userToken}` }
      );
    }
  }
}

async function testEcommerceWithData() {
  console.log('\n🛒 E-COMMERCE WITH DATA');
  console.log('-'.repeat(50));
  
  await apiCall('Products List', 'GET', `${API_URL}/products`);
  await apiCall('Categories List', 'GET', `${API_URL}/categories`);
  await apiCall('Stores List', 'GET', `${API_URL}/stores`);
  
  // Test creating a product (admin required)
  if (adminToken) {
    await apiCall(
      'Create Product',
      'POST',
      `${API_URL}/products`,
      {
        name: 'Test Product',
        description: 'A test product created via API',
        price: 29.99,
        category: 'electronics',
        inStock: true,
        stockQuantity: 100
      },
      { Authorization: `Bearer ${adminToken}` }
    );
  }
}

async function runAuthTests() {
  console.log('\n🚀 Starting Authentication & Feature Tests\n');
  
  // First check if database has data
  const hasData = await apiCall('Check Products', 'GET', `${API_URL}/products`);
  
  if (hasData.success && hasData.data.data.products.length === 0) {
    console.log('\n⚠️  DATABASE APPEARS TO BE EMPTY');
    console.log('💡 You may need to run the seeding script first:');
    console.log('   npm run seed:comprehensive');
    console.log('\n🔄 Continuing with tests anyway...');
  }
  
  // Test authentication flows
  const adminAuthSuccess = await testAuthentication();
  await testUserRegistration();
  await testEcommerceWithData();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Authentication & Feature Testing Complete!');
  
  if (adminAuthSuccess) {
    console.log('\n✅ ADMIN LOGIN SUCCESSFUL');
    console.log('   Email: admin@mixillo.com');
    console.log('   Password: Admin123!');
  } else {
    console.log('\n❌ ADMIN LOGIN FAILED');
    console.log('💡 Try running: npm run seed:comprehensive');
  }
  
  console.log('\n🔗 Live API Base URL: https://reactv1-v8sa.onrender.com/api');
}

// Run the tests
runAuthTests().catch(console.error);