const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

/**
 * Generate a test JWT token for authentication
 */
function generateTestToken(userId, role = 'user', customClaims = {}) {
  const payload = {
    uid: userId,
    role,
    ...customClaims
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
}

/**
 * Create a test Firebase user
 */
async function createTestUser(userData = {}) {
  const db = admin.firestore();
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    displayName: 'Test User',
    role: 'user',
    status: 'active',
    isVerified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...userData
  };

  const userRef = await db.collection('users').add(defaultData);
  return { id: userRef.id, ...defaultData };
}

/**
 * Create a test admin user
 */
async function createTestAdmin(userData = {}) {
  return createTestUser({
    role: 'admin',
    ...userData
  });
}

/**
 * Create a test seller
 */
async function createTestSeller(userData = {}) {
  const user = await createTestUser({
    role: 'seller',
    isSeller: true,
    isVerified: true,
    ...userData
  });

  // Create seller application
  const db = admin.firestore();
  await db.collection('sellerApplications').add({
    userId: user.id,
    status: 'approved',
    storeName: `Test Store ${Date.now()}`,
    businessType: 'individual',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return user;
}

/**
 * Create test upload record
 */
async function createTestUpload(uploadData = {}) {
  const db = admin.firestore();
  const defaultData = {
    type: 'id',
    status: 'pending',
    userId: 'test-user-id',
    fileName: `test-file-${Date.now()}.jpg`,
    fileUrl: `https://example.com/test-file-${Date.now()}.jpg`,
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...uploadData
  };

  const uploadRef = await db.collection('uploads').add(defaultData);
  return { id: uploadRef.id, ...defaultData };
}

/**
 * Create test product
 */
async function createTestProduct(productData = {}) {
  const db = admin.firestore();
  const defaultData = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 99.99,
    category: 'test-category',
    status: 'active',
    storeId: 'test-store-id',
    sellerId: 'test-seller-id',
    stock: 100,
    images: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...productData
  };

  const productRef = await db.collection('products').add(defaultData);
  return { id: productRef.id, ...defaultData };
}

/**
 * Create test order
 */
async function createTestOrder(orderData = {}) {
  const db = admin.firestore();
  const defaultData = {
    customerId: 'test-customer-id',
    storeId: 'test-store-id',
    status: 'pending',
    totalAmount: 99.99,
    items: [
      {
        productId: 'test-product-id',
        quantity: 1,
        price: 99.99
      }
    ],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...orderData
  };

  const orderRef = await db.collection('orders').add(defaultData);
  return { id: orderRef.id, ...defaultData };
}

/**
 * Clear test data from Firestore
 */
async function clearTestData() {
  const db = admin.firestore();
  const collections = [
    'users',
    'sellerApplications',
    'uploads',
    'products',
    'orders',
    'stores',
    'wallets',
    'transactions',
    'stories'
  ];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

/**
 * Wait for Firestore to process
 */
function waitForFirestore(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateTestToken,
  createTestUser,
  createTestAdmin,
  createTestSeller,
  createTestUpload,
  createTestProduct,
  createTestOrder,
  clearTestData,
  waitForFirestore
};
