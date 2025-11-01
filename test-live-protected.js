const axios = require('axios');

const BASE_URL = 'https://reactv1-v8sa.onrender.com';
const API_URL = `${BASE_URL}/api`;

console.log('🔐 Protected Endpoints Live Test');
console.log(`📡 Server: ${BASE_URL}`);
console.log('='.repeat(60));

async function loginAdmin() {
  const url = `${API_URL}/auth/login`;
  const data = { login: 'admin@mixillo.com', password: 'Admin123!' };
  try {
    const res = await axios.post(url, data, { timeout: 15000 });
    const token = res?.data?.data?.token || res?.data?.token;
    if (!token) throw new Error('Token missing in response');
    console.log('✅ Admin login success');
    return token;
  } catch (err) {
    console.error('❌ Admin login failed:', err?.response?.data || err.message);
    return null;
  }
}

async function getWithAuth(name, path, token) {
  const url = `${API_URL}${path}`;
  try {
    console.log(`\n🧪 ${name}`);
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
    console.log(`✅ ${name}: ${res.status}`);
    console.log('📦 Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log(`❌ ${name}:`, err?.response?.status || 'NO_RESPONSE', err?.response?.statusText || err.message);
    if (err?.response?.data) console.log('📦 Error:', JSON.stringify(err.response.data, null, 2));
  }
}

async function run() {
  const token = await loginAdmin();
  if (!token) {
    console.log('\n⛔ Skipping protected tests due to login failure');
    return;
  }

  await getWithAuth('Analytics Dashboard Overview', '/analytics/dashboard/overview', token);
  await getWithAuth('Analytics Sales', '/analytics/sales', token);
  await getWithAuth('Analytics Customers', '/analytics/customers', token);
  await getWithAuth('Admin Users List', '/admin/users', token);

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Protected Endpoints Live Test Complete');
}

run().catch(console.error);
