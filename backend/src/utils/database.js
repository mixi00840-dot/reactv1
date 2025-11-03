const { Firestore } = require('@google-cloud/firestore');

/**
 * Initialize Firestore client
 * In Cloud Run, this automatically uses the service account credentials
 * and project ID from the environment.
 */
const db = new Firestore({
  // projectId is automatically detected in Google Cloud environments
  // For local development, set GOOGLE_APPLICATION_CREDENTIALS or FIRESTORE_EMULATOR_HOST
});

console.log('✅ Firestore client initialized');

// Firestore doesn't require explicit connection like MongoDB
// The client is ready to use immediately

// Export the Firestore instance
module.exports = db;