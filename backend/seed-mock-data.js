const mongoose = require('mongoose');
const Content = require('./src/models/Content');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
const Store = require('./src/models/Store');
const Category = require('./src/models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo';

async function seedMockData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get or create test user
    let testUser = await User.findOne({ username: 'testuser1' });
    if (!testUser) {
      console.log('⚠️  Test user not found. Creating...');
      testUser = new User({
        username: 'testuser1',
        email: 'testuser1@mixillo.com',
        fullName: 'Test User 1',
        password: 'Test123!',
        role: 'seller',
        status: 'active',
        isVerified: true,
        dateOfBirth: new Date('1995-01-01'),
        phone: '+1234567891'
      });
      await testUser.save();
      console.log('✅ Test user created');
    }

    // Create test store for products
    console.log('\n🏪 Creating test store...');
    let testStore = await Store.findOne({ ownerId: testUser._id });
    if (!testStore) {
      testStore = new Store({
        ownerId: testUser._id,
        name: 'Test Store',
        description: 'Mock store for testing',
        logo: 'https://via.placeholder.com/200',
        banner: 'https://via.placeholder.com/800x200',
        isActive: true,
        isVerified: true
      });
      await testStore.save();
      console.log('✅ Test store created');
    } else {
      console.log('ℹ️  Test store already exists');
    }

    // Create product category
    console.log('\n📦 Creating product category...');
    let category = await Category.findOne({ name: 'Electronics' });
    if (!category) {
      category = new Category({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        isActive: true
      });
      await category.save();
      console.log('✅ Category created: Electronics');
    } else {
      console.log('ℹ️  Category already exists');
    }

    // Create mock content for testing
    console.log('\n🎥 Creating mock content...');
    const mockContents = [
      {
        userId: testUser._id,
        type: 'video',
        caption: 'Test video content #1',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://via.placeholder.com/640x360',
        duration: 120,
        hashtags: ['test', 'video', 'demo'],
        status: 'active',
        isPrivate: false,
        allowComments: true,
        allowDuet: true,
        allowStitch: true,
        allowDownload: true,
        viewsCount: 100,
        uniqueViewsCount: 80
      },
      {
        userId: testUser._id,
        type: 'video',
        caption: 'Test video content #2 - Amazing product demo!',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://via.placeholder.com/640x360',
        duration: 90,
        hashtags: ['product', 'demo', 'shopping'],
        status: 'active',
        isPrivate: false,
        allowComments: true,
        allowDuet: false,
        allowStitch: true,
        allowDownload: false,
        viewsCount: 250,
        uniqueViewsCount: 200
      },
      {
        userId: testUser._id,
        type: 'image',
        caption: 'Beautiful test image',
        imageUrls: ['https://via.placeholder.com/1080x1920'],
        hashtags: ['image', 'test', 'photo'],
        status: 'active',
        isPrivate: false,
        allowComments: true,
        viewsCount: 50,
        uniqueViewsCount: 45
      }
    ];

    const createdContent = [];
    for (const contentData of mockContents) {
      const existing = await Content.findOne({ 
        userId: testUser._id, 
        caption: contentData.caption 
      });
      
      if (!existing) {
        const content = new Content(contentData);
        await content.save();
        createdContent.push(content);
        console.log(`   ✅ Created content: ${content._id} - ${contentData.caption}`);
      } else {
        createdContent.push(existing);
        console.log(`   ℹ️  Content already exists: ${existing._id}`);
      }
    }

    // Create mock products
    console.log('\n🛍️  Creating mock products...');
    const mockProducts = [
      {
        storeId: testStore._id,
        sellerId: testUser._id,
        category: category._id,
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        sku: 'TEST-HEAD-001',
        price: 199.99,
        compareAtPrice: 299.99,
        currency: 'USD',
        stock: 50,
        lowStockThreshold: 10,
        trackInventory: true,
        images: [
          { url: 'https://via.placeholder.com/800', alt: 'Headphones front view', sortOrder: 0 },
          { url: 'https://via.placeholder.com/800', alt: 'Headphones side view', sortOrder: 1 }
        ],
        tags: ['electronics', 'audio', 'wireless', 'headphones'],
        brand: 'TestBrand',
        isActive: true,
        isFeatured: true,
        viewsCount: 500
      },
      {
        storeId: testStore._id,
        sellerId: testUser._id,
        category: category._id,
        name: 'Smart Watch Pro',
        description: 'Advanced smartwatch with fitness tracking and health monitoring',
        sku: 'TEST-WATCH-001',
        price: 349.99,
        compareAtPrice: 449.99,
        currency: 'USD',
        stock: 30,
        lowStockThreshold: 5,
        trackInventory: true,
        images: [
          { url: 'https://via.placeholder.com/800', alt: 'Smart watch', sortOrder: 0 }
        ],
        tags: ['electronics', 'wearable', 'fitness', 'smartwatch'],
        brand: 'TestBrand',
        isActive: true,
        isFeatured: true,
        viewsCount: 800
      },
      {
        storeId: testStore._id,
        sellerId: testUser._id,
        category: category._id,
        name: 'Portable Bluetooth Speaker',
        description: 'Compact waterproof speaker with 20-hour battery life',
        sku: 'TEST-SPEAKER-001',
        price: 79.99,
        compareAtPrice: 129.99,
        currency: 'USD',
        stock: 100,
        lowStockThreshold: 20,
        trackInventory: true,
        images: [
          { url: 'https://via.placeholder.com/800', alt: 'Bluetooth speaker', sortOrder: 0 }
        ],
        tags: ['electronics', 'audio', 'bluetooth', 'portable'],
        brand: 'TestBrand',
        isActive: true,
        isFeatured: false,
        viewsCount: 300
      }
    ];

    const createdProducts = [];
    for (const productData of mockProducts) {
      const existing = await Product.findOne({ sku: productData.sku });
      
      if (!existing) {
        const product = new Product(productData);
        await product.save();
        createdProducts.push(product);
        console.log(`   ✅ Created product: ${product._id} - ${productData.name}`);
      } else {
        createdProducts.push(existing);
        console.log(`   ℹ️  Product already exists: ${existing._id}`);
      }
    }

    // Print summary with real IDs for Flutter testing
    console.log('\n✅ Mock data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   Test User: ${testUser._id}`);
    console.log(`   Test Store: ${testStore._id}`);
    console.log(`   Category: ${category._id}`);
    console.log(`   Content Count: ${createdContent.length}`);
    console.log(`   Product Count: ${createdProducts.length}`);
    
    console.log('\n🎯 Flutter Testing URLs:');
    console.log('   Content Endpoints:');
    createdContent.forEach((content, i) => {
      console.log(`     - GET /api/content/${content._id}`);
      console.log(`     - POST /api/content/${content._id}/view`);
    });
    console.log('   Product Endpoints:');
    console.log(`     - GET /api/products/featured?limit=10`);
    createdProducts.forEach((product, i) => {
      console.log(`     - GET /api/products/${product._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
}

seedMockData();
