const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@mixillo.com';
const ADMIN_PASSWORD = 'Admin123!';

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  sections: {}
};

// Color codes for console output
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

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test Section 1: Dashboard
async function testDashboard() {
  logSection('SECTION 1: DASHBOARD');
  const sectionResults = { passed: 0, failed: 0, tests: [] };
  
  try {
    const response = await apiRequest('GET', '/api/admin/dashboard');
    if (response.data.success && response.data.data.stats) {
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
    if (response.data.success && Array.isArray(response.data.data.users)) {
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
    logTest('Create User', 'FAIL', error.message);
    sectionResults.failed++;
    sectionResults.tests.push({ name: 'Create User', status: 'FAIL', error: error.message });
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
    if (response.data.success && response.data.data.applications) {
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
    if (response.data.success && response.data.data.content) {
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
    if (response.data.success && response.data.data.uploads) {
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
    const response = await apiRequest('POST', '/api/upload/presigned-url', {
      fileName: 'test.mp4',
      fileType: 'video/mp4',
      contentType: 'video'
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

// Generate detailed report
function generateReport() {
  logSection('TEST SUMMARY REPORT');
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(2) : 0;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  log('\nSection Breakdown:', 'cyan');
  Object.entries(testResults.sections).forEach(([section, results]) => {
    const sectionTotal = results.passed + results.failed;
    const sectionRate = sectionTotal > 0 ? ((results.passed / sectionTotal) * 100).toFixed(0) : 0;
    log(`  ${section}: ${results.passed}/${sectionTotal} (${sectionRate}%)`, 
        sectionRate >= 80 ? 'green' : 'yellow');
  });
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${successRate}%`
    },
    sections: testResults.sections
  };
  
  fs.writeFileSync(
    'test-report.json',
    JSON.stringify(reportData, null, 2)
  );
  
  log('\n📄 Detailed report saved to: test-report.json', 'magenta');
}

// Main execution
async function runAllTests() {
  log('🚀 Starting Comprehensive API Testing', 'magenta');
  log(`📍 Testing API: ${API_BASE_URL}`, 'blue');
  
  const authenticated = await authenticate();
  if (!authenticated) {
    log('\n❌ Authentication failed. Cannot proceed with tests.', 'red');
    process.exit(1);
  }
  
  // Run all section tests
  await testDashboard();
  await testUsers();
  await testSellerApplications();
  await testContentManager();
  await testUploadManager();
  await testCommentsManagement();
  
  // Generate final report
  generateReport();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test execution failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
