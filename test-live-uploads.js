const axios = require('axios');

const BASE_URL = 'https://reactv1-v8sa.onrender.com';
const API_URL = `${BASE_URL}/api`;

console.log('🗂️ Upload Pipeline Live Test');
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

async function run() {
  const token = await loginAdmin();
  if (!token) {
    console.log('\n⛔ Skipping upload tests due to login failure');
    return;
  }

  // 1) Request presigned url
  const presignUrl = `${API_URL}/uploads/presigned-url`;
  const fileName = `health_${Date.now()}.png`;
  const fileType = 'image/png';
  console.log(`\n🧪 Presign for ${fileName}`);
  let uploadUrl, key, uploadId;
  try {
    const res = await axios.post(
      presignUrl,
      { fileName, fileType, contentType: 'uploads', metadata: { scope: 'e2e' } },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    uploadUrl = res?.data?.data?.uploadUrl || res?.data?.uploadUrl;
    key = res?.data?.data?.key || res?.data?.key;
    uploadId = res?.data?.data?.uploadId || res?.data?.uploadId;
    if (!uploadUrl) throw new Error('uploadUrl missing');
    console.log('✅ Presigned URL received');
  } catch (err) {
    console.error('❌ Presign failed:', err?.response?.data || err.message);
    return;
  }

  // 2) PUT to storage
  console.log('🧪 Uploading to storage via PUT');
  try {
  // Minimal PNG header bytes to satisfy image type checks
  const pngHeader = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const payload = Buffer.from(`Mixillo live upload test @ ${new Date().toISOString()}`);
  const buffer = Buffer.concat([pngHeader, payload]);
    await axios.put(uploadUrl, buffer, { headers: { 'Content-Type': fileType }, timeout: 30000 });
    console.log('✅ PUT to storage succeeded');
  } catch (err) {
    console.error('❌ PUT upload failed:', err?.response?.status || err.message);
    if (err?.response?.data) console.log('📦 Error:', JSON.stringify(err.response.data, null, 2));
    // Try proxy fallback
    try {
      console.log('↪️ Trying proxy fallback /api/uploads/direct');
      const formData = new (require('form-data'))();
  formData.append('file', Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, ...Buffer.from('proxy-fallback-' + Date.now())]), { filename: fileName, contentType: fileType });
      const directRes = await axios.post(`${API_URL}/uploads/direct`, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      const directUrl = directRes?.data?.data?.url || directRes?.data?.url;
      console.log('✅ Proxy upload success:', directUrl);
    } catch (proxyErr) {
      console.error('❌ Proxy upload failed:', proxyErr?.response?.data || proxyErr.message);
      return;
    }
  }

  // 3) Confirm upload (prefer uploadId when available to avoid path issues)
  const contentId = uploadId || key;
  if (!contentId) {
    console.log('⚠️ Skipping confirm: no contentId available');
    return;
  }
  console.log('🧪 Confirming upload:', contentId);
  try {
    const res = await axios.post(`${API_URL}/uploads/${contentId}/confirm`, { metadata: { scope: 'e2e' } }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    console.log('✅ Confirm success:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('❌ Confirm failed:', err?.response?.data || err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Upload Pipeline Live Test Complete');
}

run().catch(console.error);
