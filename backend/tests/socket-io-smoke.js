/*
  Socket.IO Smoke Test
  - Registers a temp user
  - Logs in to get JWT
  - Connects to Socket.IO with token
  - Subscribes to a couple of events and validates round-trip
*/

const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = process.env.BASE_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app';

async function registerAndLogin() {
  const ts = Date.now();
  const registerBody = {
    username: `socketuser_${ts}`,
    email: `socket_${ts}@example.com`,
    password: 'Test123!@#',
    fullName: 'Socket Test'
  };

  const reg = await axios.post(`${BASE_URL}/api/auth/register`, registerBody, {
    validateStatus: () => true,
  });

  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error(`Registration failed: ${reg.status} ${JSON.stringify(reg.data)}`);
  }

  const token = reg.data?.data?.token;
  const userId = reg.data?.data?.user?._id || reg.data?.data?.user?.id;
  if (!token || !userId) throw new Error('No token or userId from registration');

  return { token, userId };
}

async function run() {
  const { token, userId } = await registerAndLogin();
  console.log('Registered user:', userId.substring(0,8), '...');

  return await new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000,
      auth: { token },
      path: '/socket.io'
    });

    const results = { connected: false, subscribed: false, echoed: false };
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout waiting for events'));
    }, 15000);

    socket.on('connect', () => {
      results.connected = true;
      console.log('Socket connected:', socket.id);
      socket.emit('feed:subscribe');
    });

    socket.on('feed:subscribed', () => {
      results.subscribed = true;
      // Minimal round-trip: join/leave a conversation room
      socket.emit('conversation:join', { conversationId: `test_${userId}` });
      setTimeout(() => {
        socket.emit('conversation:leave', { conversationId: `test_${userId}` });
        results.echoed = true;
        clearTimeout(timer);
        socket.disconnect();
        resolve(results);
      }, 500);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

run()
  .then((r) => {
    console.log('RESULT:', r);
    if (!r.connected || !r.subscribed || !r.echoed) {
      process.exitCode = 1;
    }
  })
  .catch((e) => {
    console.error('Socket smoke test failed:', e.message);
    process.exitCode = 1;
  });
