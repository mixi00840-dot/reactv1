/**
 * Mock data for testing
 */

const mockUser = {
  email: 'testuser@example.com',
  username: 'testuser123',
  displayName: 'Test User',
  phoneNumber: '+1234567890',
  role: 'user',
  status: 'active',
  isVerified: false,
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  followersCount: 0,
  followingCount: 0,
  videosCount: 0,
  likesCount: 0
};

const mockAdmin = {
  ...mockUser,
  email: 'admin@mixillo.com',
  username: 'admin',
  displayName: 'Admin User',
  role: 'admin'
};

const mockSeller = {
  ...mockUser,
  email: 'seller@example.com',
  username: 'testseller',
  displayName: 'Test Seller',
  role: 'seller',
  isSeller: true,
  isVerified: true
};

const mockSellerApplication = {
  userId: 'test-user-id',
  storeName: 'Test Store',
  businessName: 'Test Business LLC',
  businessType: 'individual',
  taxId: '123-45-6789',
  phoneNumber: '+1234567890',
  email: 'seller@example.com',
  address: {
    street: '123 Business St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  bankAccount: {
    accountHolder: 'Test User',
    accountNumber: '****1234',
    routingNumber: '****5678',
    bankName: 'Test Bank'
  },
  documents: {
    idUrl: 'https://example.com/id.jpg',
    taxDocUrl: 'https://example.com/tax.pdf',
    businessLicenseUrl: 'https://example.com/license.pdf'
  },
  status: 'pending',
  adminNotes: ''
};

const mockProduct = {
  name: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  compareAtPrice: 129.99,
  category: 'Electronics',
  subcategory: 'Smartphones',
  brand: 'Test Brand',
  sku: 'TEST-001',
  barcode: '1234567890123',
  stock: 100,
  lowStockThreshold: 10,
  images: [
    'https://example.com/product1.jpg',
    'https://example.com/product2.jpg'
  ],
  variants: [
    {
      name: 'Color',
      options: ['Red', 'Blue', 'Green']
    },
    {
      name: 'Size',
      options: ['S', 'M', 'L', 'XL']
    }
  ],
  specifications: {
    weight: '200g',
    dimensions: '10x5x2cm',
    material: 'Plastic'
  },
  tags: ['electronics', 'smartphone', 'test'],
  status: 'active',
  isFeatured: false,
  storeId: 'test-store-id',
  sellerId: 'test-seller-id'
};

const mockOrder = {
  orderNumber: 'ORD-123456',
  customerId: 'test-customer-id',
  customerName: 'Test Customer',
  customerEmail: 'customer@example.com',
  storeId: 'test-store-id',
  storeName: 'Test Store',
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'credit_card',
  items: [
    {
      productId: 'test-product-id',
      productName: 'Test Product',
      quantity: 2,
      price: 99.99,
      subtotal: 199.98,
      image: 'https://example.com/product.jpg'
    }
  ],
  subtotal: 199.98,
  tax: 19.99,
  shippingFee: 10.00,
  discount: 0,
  totalAmount: 229.97,
  shippingAddress: {
    fullName: 'Test Customer',
    phoneNumber: '+1234567890',
    street: '123 Customer St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  billingAddress: {
    fullName: 'Test Customer',
    phoneNumber: '+1234567890',
    street: '123 Customer St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  shippingMethod: 'standard',
  trackingNumber: '',
  notes: 'Test order notes'
};

const mockStory = {
  userId: 'test-user-id',
  userName: 'Test User',
  userAvatar: 'https://example.com/avatar.jpg',
  mediaUrl: 'https://example.com/story.jpg',
  mediaType: 'image',
  thumbnail: 'https://example.com/story-thumb.jpg',
  duration: 5000,
  caption: 'Test story caption',
  status: 'active',
  viewsCount: 0,
  likesCount: 0,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
};

const mockUpload = {
  userId: 'test-user-id',
  userName: 'Test User',
  type: 'id',
  status: 'pending',
  fileName: 'test-document.jpg',
  fileUrl: 'https://example.com/test-document.jpg',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  uploadedFrom: 'web',
  metadata: {
    width: 1920,
    height: 1080,
    format: 'jpeg'
  },
  adminNotes: ''
};

const mockWallet = {
  userId: 'test-user-id',
  balance: 1000.00,
  currency: 'USD',
  status: 'active',
  totalEarnings: 5000.00,
  totalWithdrawals: 4000.00,
  pendingBalance: 0,
  availableBalance: 1000.00
};

const mockTransaction = {
  walletId: 'test-wallet-id',
  userId: 'test-user-id',
  type: 'credit',
  amount: 100.00,
  currency: 'USD',
  status: 'completed',
  description: 'Test transaction',
  reference: 'REF-123456',
  balanceBefore: 1000.00,
  balanceAfter: 1100.00,
  metadata: {
    source: 'test',
    orderId: 'order-123'
  }
};

module.exports = {
  mockUser,
  mockAdmin,
  mockSeller,
  mockSellerApplication,
  mockProduct,
  mockOrder,
  mockStory,
  mockUpload,
  mockWallet,
  mockTransaction
};
