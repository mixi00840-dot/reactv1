// Test setup and global configurations
const admin = require('firebase-admin');

// Mock Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Use emulator for tests
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.NODE_ENV = 'test';
}

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Close database connections, clear timers, etc.
  await new Promise(resolve => setTimeout(() => resolve(), 500));
});
