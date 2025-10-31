const axios = require('axios');

// Test admin login and dashboard access
async function testAdminAccess() {
  try {
    console.log('🔐 Testing admin login...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin@mixillo.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('👤 User role:', loginResponse.data.data.user.role);
      
      const token = loginResponse.data.data.token;
      console.log('🎫 Token received:', token.substring(0, 20) + '...');
      
      // Step 2: Test dashboard endpoint with token
      console.log('\n📊 Testing dashboard endpoint...');
      const dashboardResponse = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard data retrieved successfully');
        console.log('📈 Dashboard stats:', JSON.stringify(dashboardResponse.data.data.stats.overview, null, 2));
      } else {
        console.log('❌ Dashboard request failed:', dashboardResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminAccess();