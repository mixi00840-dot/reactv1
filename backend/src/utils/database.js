const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * In Cloud Run, this automatically uses the service account credentials
 * For local development, set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */
if (!admin.apps.length) {
  admin.initializeApp({
    // projectId is automatically detected in Google Cloud environments
    // credential: admin.credential.applicationDefault() is used by default
  });
  console.log('✅ Firebase Admin SDK initialized');
}

/**
 * Initialize Firestore client from Firebase Admin
 * This allows both Firebase Auth and Firestore to share the same credentials
 */
const db = admin.firestore();

console.log('✅ Firestore client initialized');

// Firestore doesn't require explicit connection like MongoDB
// The client is ready to use immediately

// Export the Firestore instance
module.exports = db;