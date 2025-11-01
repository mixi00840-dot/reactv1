const axios = require('axios');

const BASE_URL = 'https://reactv1-v8sa.onrender.com';
const API_URL = `${BASE_URL}/api`;

console.log('🗂️ Upload Pipeline Live Test');
console.log(`📡 Server: ${BASE_URL}`);
console.log('='.repeat(60));

// Simple retry helper with exponential backoff
async function retry(label, fn, { retries = 3, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const statusText = err?.response?.statusText;
      const body = err?.response?.data;
      console.warn(`⚠️ ${label} attempt ${attempt}/${retries} failed` + (status ? ` [${status} ${statusText||''}]` : '') );
      if (body) {
        // Avoid dumping massive HTML; truncate
        const text = typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300);
        console.warn(`   ↳ Response (truncated): ${text}${text.length===300?'…':''}`);
      }
      if (attempt < retries) {
        const wait = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

async function loginAdmin() {
  const url = `${API_URL}/auth/login`;
  const data = { login: 'admin@mixillo.com', password: 'Admin123!' };
  try {
    const res = await retry('Login', () => axios.post(url, data, { timeout: 20000 }));
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
  const dummySize = 64; // arbitrary small test size
  console.log(`\n🧪 Presign for ${fileName}`);
  let uploadUrl, key, uploadId;
  try {
    const res = await retry('Presign', () => axios.post(
      presignUrl,
      { fileName, fileType, mimeType: fileType, fileSize: dummySize, contentType: 'uploads', metadata: { scope: 'e2e' } },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
    ));
    uploadUrl = res?.data?.data?.uploadUrl || res?.data?.uploadUrl;
    key = res?.data?.data?.key || res?.data?.key;
    uploadId = res?.data?.data?.uploadId || res?.data?.uploadId;
    if (!uploadUrl) throw new Error('uploadUrl missing');
    console.log('✅ Presigned URL received');
  } catch (err) {
    console.error('❌ Presign failed:', err?.response?.status, err?.response?.statusText, '\n', err?.response?.data || err.message);
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
      const directRes = await retry('Proxy upload', () => axios.post(`${API_URL}/uploads/direct`, formData, {
        headers: { ...formData.getHeaders(), Authorization: `Bearer ${token}` },
        timeout: 30000,
      }));
      const directUrl = directRes?.data?.data?.url || directRes?.data?.url;
      console.log('✅ Proxy upload success:', directUrl);
    } catch (proxyErr) {
      console.error('❌ Proxy upload failed:', proxyErr?.response?.data || proxyErr.message);
      return;
    }
  }

  // 3) Confirm upload only if backend provided a DB contentId (Mongo ObjectId)
  // The simplified /presigned-url route may not create Content records and uses a string uploadId.
  // Detect 24-hex ObjectId and only then confirm; otherwise skip.
  const contentIdCandidate = uploadId || key;
  const isObjectId = typeof contentIdCandidate === 'string' && /^[a-f\d]{24}$/i.test(contentIdCandidate);
  if (!isObjectId) {
    console.log('⚠️ Skipping confirm: no valid contentId (ObjectId) present');
    console.log('   ↳ Provided id:', contentIdCandidate);
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Upload Pipeline Live Test Complete');
    return;
  }
  const contentId = contentIdCandidate;
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
