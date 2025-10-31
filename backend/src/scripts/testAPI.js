const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://reactv1-v8sa.onrender.com/api';

const testAPI = async () => {
  try {
    console.log('🧪 Testing Mixillo API...\n');

    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(process.env.API_URL?.replace('/api', '') || 'https://reactv1-v8sa.onrender.com/health');
    console.log('✅ Health check:', healthResponse.data.message);

    // Test admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'admin@mixillo.com',
      password: 'Admin123!'
    });
    
    const { user, token } = loginResponse.data.data;
    console.log('✅ Admin login successful:', user.fullName);
    console.log('✅ Role:', user.role);

    // Set auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Test dashboard stats
    console.log('\n3. Testing dashboard stats...');
    const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard`);
    const stats = dashboardResponse.data.data.stats;
    console.log('✅ Dashboard stats:');
    console.log(`   • Total users: ${stats.overview.totalUsers}`);
    console.log(`   • Active users: ${stats.overview.activeUsers}`);
    console.log(`   • Verified users: ${stats.overview.verifiedUsers}`);
    console.log(`   • Pending applications: ${stats.overview.pendingSellerApps}`);

    // Test users endpoint
    console.log('\n4. Testing users endpoint...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users?limit=5`);
    const users = usersResponse.data.data.users;
    console.log(`✅ Retrieved ${users.length} users`);
    console.log('   Sample users:');
    users.slice(0, 3).forEach(user => {
      console.log(`   • ${user.fullName} (@${user.username}) - ${user.status}`);
    });

    // Test seller applications
    console.log('\n5. Testing seller applications...');
    const appsResponse = await axios.get(`${BASE_URL}/admin/seller-applications`);
    const applications = appsResponse.data.data.applications;
    console.log(`✅ Retrieved ${applications.length} seller applications`);
    applications.forEach(app => {
      console.log(`   • ${app.userId.fullName} - ${app.status}`);
    });

    // Test regular user registration
    console.log('\n6. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      dateOfBirth: '1995-01-01'
    });
    console.log('✅ User registration successful:', registerResponse.data.data.user.fullName);

    // Test user login
    console.log('\n7. Testing user login...');
    const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ User login successful:', userLoginResponse.data.data.user.fullName);

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\n🚀 Your Mixillo User Management System is ready!');
    console.log('\nNext steps:');
    console.log('1. Start the admin dashboard: cd admin-dashboard && npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Login with: admin@mixillo.com / Admin123!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('1. MongoDB is running on localhost:27017');
    console.log('2. Backend server is running on port 5000');
    console.log('3. Database has been seeded with: npm run seed');
  }
};

module.exports = testAPI;

// Run tests if called directly
if (require.main === module) {
  testAPI();
}