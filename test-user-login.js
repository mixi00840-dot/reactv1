const axios = require('axios');

// Test login for existing user
async function testExistingUserLogin() {
  try {
    console.log('🔐 Testing login for existing user...');
    
    const response = await axios.post('https://reactv1-v8sa.onrender.com/api/auth/login', {
      login: 'testuser@example.com',
      password: 'TestUser123!'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    
    // Test authenticated endpoint
    const profileResponse = await axios.get('https://reactv1-v8sa.onrender.com/api/users/profile', {
      headers: {
        Authorization: `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('User:', profileResponse.data.data);
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testExistingUserLogin();