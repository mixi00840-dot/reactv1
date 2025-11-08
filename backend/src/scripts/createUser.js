const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Create User Profile in Firestore
 * Run: node src/scripts/createUser.js
 */

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'mixillo',
  });
}

const db = admin.firestore();

const userId = 'DUlGs3O3U7fcOXo99lUpYDZHXY62';

const userProfile = {
  uid: userId,
  email: 'test@test.com',
  username: 'testuser',
  displayName: 'Test User',
  bio: 'Test user profile',
  role: 'user',
  verified: false,
  featured: false,
  banned: false,
  strikes: 0,
  followers: 0,
  following: 0,
  totalLikes: 0,
  totalVideos: 0,
  wallet: {
    balance: 0,
    currency: 'USD'
  },
  settings: {
    privateAccount: false,
    allowComments: true,
    allowDuets: true,
    allowStitches: true
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function createUser() {
  try {
    console.log(`Creating user profile for UID: ${userId}`);
    
    await db.collection('users').doc(userId).set(userProfile);
    
    console.log('✅ User profile created successfully in Firestore');
    console.log('User data:', userProfile);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    process.exit(1);
  }
}

createUser();
