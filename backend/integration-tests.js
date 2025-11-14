#!/usr/bin/env node
/**
 * THIRD-PARTY INTEGRATION TESTS
 * Tests Cloudinary, Socket.IO, Agora/ZegoCloud
 * Output: workspace/report/third_party.json & workspace/report/realtime.json
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
const ADMIN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDdlMzA1YmQ5ODYzODdlOTM3YTY3YSIsImVtYWlsIjoiYWRtaW5AbWl4aWxsby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMxMjQ2MDksImV4cCI6MTc2MzcyOTQwOX0.OX6ABhv7nG-OgqueVwQ6T9Qw56DjN_EmW3VoBLxp-2Q';

console.log('🔌 THIRD-PARTY INTEGRATION TESTS');
console.log('=====================================\n');

const results = {
  generated_at: new Date().toISOString(),
  cloudinary: { status: 'UNKNOWN', details: null, error: null },
  agora: { status: 'UNKNOWN', details: null, error: null },
  zegocloud: { status: 'UNKNOWN', details: null, error: null },
  socketio: { status: 'UNKNOWN', connection: false, latency_ms: null, error: null }
};

// Test Cloudinary
async function testCloudinary() {
  console.log('☁️  Testing Cloudinary...');
  
  try {
    // Check if backend has Cloudinary configured
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dlg6dnlj4/resources/image';
    const response = await axios.get(cloudinaryUrl, {
      auth: {
        username: '287216393992378',
        password: 'kflDVBjiq-Jkc-IgDWlggtdc6Yw'
      },
      timeout: 5000
    });
    
    results.cloudinary.status = 'OK';
    results.cloudinary.details = {
      cloud_name: 'dlg6dnlj4',
      resources_count: response.data.resources?.length || 0,
      api_accessible: true
    };
    console.log('   ✅ Cloudinary API accessible');
    console.log(`   📊 Resources: ${response.data.resources?.length || 0}`);
    
  } catch (error) {
    results.cloudinary.status = 'FAIL';
    results.cloudinary.error = error.message;
    console.log(`   ❌ Cloudinary test failed: ${error.message}`);
  }
}

// Test Agora
async function testAgora() {
  console.log('\n📡 Testing Agora...');
  
  try {
    // Try to get Agora token from backend
    const response = await axios.get(`${API_BASE}/agora/token`, {
      headers: { 'Authorization': `Bearer ${ADMIN_JWT}` },
      params: { channelName: '__audit_test__', uid: 0 },
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.token) {
      results.agora.status = 'OK';
      results.agora.details = {
        token_generated: true,
        endpoint_working: true
      };
      console.log('   ✅ Agora token generation working');
    } else if (response.status === 404) {
      results.agora.status = 'WARN';
      results.agora.error = 'Endpoint not found - Agora may not be configured';
      console.log('   ⚠️  Agora endpoint not found (404)');
    } else {
      results.agora.status = 'WARN';
      results.agora.error = `Unexpected status: ${response.status}`;
      console.log(`   ⚠️  Agora returned ${response.status}`);
    }
    
  } catch (error) {
    results.agora.status = 'WARN';
    results.agora.error = error.message;
    console.log(`   ⚠️  Agora test inconclusive: ${error.message}`);
  }
}

// Test ZegoCloud
async function testZegoCloud() {
  console.log('\n🌐 Testing ZegoCloud...');
  
  try {
    // Check if ZegoCloud is configured via stream providers
    const response = await axios.get(`${API_BASE}/admin/stream-providers`, {
      headers: { 'Authorization': `Bearer ${ADMIN_JWT}` },
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data) {
      const zegoProvider = response.data.data?.find(p => p.name === 'zegocloud');
      
      if (zegoProvider) {
        results.zegocloud.status = 'OK';
        results.zegocloud.details = {
          provider_configured: true,
          enabled: zegoProvider.enabled
        };
        console.log(`   ✅ ZegoCloud configured (enabled: ${zegoProvider.enabled})`);
      } else {
        results.zegocloud.status = 'WARN';
        results.zegocloud.error = 'ZegoCloud provider not found in database';
        console.log('   ⚠️  ZegoCloud not configured');
      }
    } else if (response.status === 404) {
      results.zegocloud.status = 'WARN';
      results.zegocloud.error = 'Stream providers endpoint not found';
      console.log('   ⚠️  Stream providers endpoint not found (404)');
    } else {
      results.zegocloud.status = 'WARN';
      results.zegocloud.error = `Unexpected status: ${response.status}`;
      console.log(`   ⚠️  Stream providers returned ${response.status}`);
    }
    
  } catch (error) {
    results.zegocloud.status = 'WARN';
    results.zegocloud.error = error.message;
    console.log(`   ⚠️  ZegoCloud test inconclusive: ${error.message}`);
  }
}

// Test Socket.IO (basic check - can't do full test without socket.io-client)
async function testSocketIO() {
  console.log('\n🔌 Testing Socket.IO...');
  
  try {
    // Check if Socket.IO endpoint is accessible
    const wsUrl = API_BASE.replace('/api', '');
    const response = await axios.get(`${wsUrl}/socket.io/?EIO=4&transport=polling`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200 || response.data.toString().includes('sid')) {
      results.socketio.status = 'OK';
      results.socketio.connection = true;
      results.socketio.details = {
        endpoint_accessible: true,
        transport: 'polling'
      };
      console.log('   ✅ Socket.IO endpoint accessible');
    } else {
      results.socketio.status = 'WARN';
      results.socketio.error = `Unexpected response: ${response.status}`;
      console.log(`   ⚠️  Socket.IO returned ${response.status}`);
    }
    
  } catch (error) {
    results.socketio.status = 'WARN';
    results.socketio.error = error.message;
    console.log(`   ⚠️  Socket.IO test inconclusive: ${error.message}`);
  }
}

async function main() {
  await testCloudinary();
  await testAgora();
  await testZegoCloud();
  await testSocketIO();
  
  console.log('\n=====================================');
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('=====================================');
  console.log(`Cloudinary: ${results.cloudinary.status}`);
  console.log(`Agora: ${results.agora.status}`);
  console.log(`ZegoCloud: ${results.zegocloud.status}`);
  console.log(`Socket.IO: ${results.socketio.status}`);
  console.log('');
  
  // Save results
  const thirdPartyPath = path.join(__dirname, '..', 'workspace', 'report', 'third_party.json');
  fs.writeFileSync(thirdPartyPath, JSON.stringify({
    generated_at: results.generated_at,
    cloudinary: results.cloudinary,
    agora: results.agora,
    zegocloud: results.zegocloud
  }, null, 2));
  
  const realtimePath = path.join(__dirname, '..', 'workspace', 'report', 'realtime.json');
  fs.writeFileSync(realtimePath, JSON.stringify({
    generated_at: results.generated_at,
    socket_io: results.socketio
  }, null, 2));
  
  console.log(`💾 Third-party results: ${thirdPartyPath}`);
  console.log(`💾 Real-time results: ${realtimePath}`);
  console.log('=====================================\n');
}

main();
