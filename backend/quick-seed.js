/**
 * QUICK MIXILLO DATABASE SEEDER
 * Generates minimal test data for admin dashboard testing
 * Run: node quick-seed.js
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Import critical models only
const User = require('./src/models/User');
const Content = require('./src/models/Content');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Category = require('./src/models/Category');
const Store = require('./src/models/Store');
const Wallet = require('./src/models/Wallet');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

// Clear database
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  try {
    await User.deleteMany({});
    await Content.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    await Store.deleteMany({});
    await Wallet.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('⚠️  Error clearing database:', error.message);
  }
}

// Main seed function
async function seed() {
  try {
    await connectDB();
    
    console.log('\n🌱 Starting QUICK database seeding...\n');
    
    await clearDatabase();
    
    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      email: 'admin@mixillo.com',
      password: '$2a$10$K7L1OJ45/4Y2nIvhJrMtM.XNVvCZ0YzLVc1kU7vJ3qZ9kQc3F8K.C', // admin123
      role: 'admin',
      fullName: 'Admin User',
      verified: true,
      status: 'active',
    });
    console.log('✅ Admin created (username: admin, password: admin123)');
    
    // 2. Create Regular Users
    console.log('👥 Creating users...');
    const users = [];
    for (let i = 0; i < 50; i++) {
      users.push({
        username: `user${i}_${faker.string.alphanumeric(5)}`,
        email: faker.internet.email().toLowerCase(),
        password: '$2a$10$K7L1OJ45/4Y2nIvhJrMtM.XNVvCZ0YzLVc1kU7vJ3qZ9kQc3F8K.C',
        role: i < 10 ? 'seller' : 'user',
        fullName: faker.person.fullName(),
        avatar: faker.image.avatar(),
        verified: i < 20,
        status: 'active',
      });
    }
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // 3. Create Wallets
    console.log('💰 Creating wallets...');
    const wallets = [admin._id, ...createdUsers.map(u => u._id)].map(userId => ({
      userId,
      balance: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
      currency: 'USD',
    }));
    await Wallet.insertMany(wallets);
    console.log(`✅ Created ${wallets.length} wallets`);
    
    // 4. Create Categories
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Fashion', slug: 'fashion', description: 'Fashion products', active: true },
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices', active: true },
      { name: 'Beauty', slug: 'beauty', description: 'Beauty products', active: true },
      { name: 'Home', slug: 'home', description: 'Home goods', active: true },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment', active: true },
    ]);
    console.log(`✅ Created ${categories.length} categories`);
    
    // 5. Create Stores
    console.log('🏪 Creating stores...');
    const sellers = createdUsers.filter(u => u.role === 'seller');
    const stores = [];
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const storeName = faker.company.name();
      stores.push({
        sellerId: seller._id,
        name: storeName,
        slug: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
        description: faker.company.catchPhrase(),
        status: 'active',
        verified: true,
      });
    }
    const createdStores = await Store.insertMany(stores);
    console.log(`✅ Created ${createdStores.length} stores`);
    
    // 6. Create Products
    console.log('📦 Creating products...');
    const products = [];
    for (let i = 0; i < 100; i++) {
      const seller = sellers[i % sellers.length];
      const store = createdStores[i % createdStores.length];
      const category = categories[i % categories.length];
      
      products.push({
        sellerId: seller._id,
        storeId: store._id,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: category._id,
        price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        images: [{ url: faker.image.url(), alt: 'Product Image', sortOrder: 0 }],
        stock: faker.number.int({ min: 0, max: 100 }),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        status: i < 80 ? 'active' : 'draft',
        featured: i < 10,
      });
    }
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    // 7. Create Content
    console.log('🎬 Creating content...');
    const contents = [];
    for (let i = 0; i < 50; i++) {
      const creator = createdUsers[i % createdUsers.length];
      contents.push({
        userId: creator._id,
        type: 'video',
        caption: faker.lorem.sentence(),
        videoUrl: `https://example.com/videos/${faker.string.uuid()}.mp4`,
        thumbnailUrl: faker.image.url(),
        duration: faker.number.int({ min: 15, max: 60 }),
        viewsCount: faker.number.int({ min: 0, max: 10000 }),
        status: i < 45 ? 'active' : 'processing',
        allowComments: true,
      });
    }
    const createdContent = await Content.insertMany(contents);
    console.log(`✅ Created ${createdContent.length} content items`);
    
    // 8. Create Orders
    console.log('🛒 Creating orders...');
    const orders = [];
    for (let i = 0; i < 50; i++) {
      const buyer = createdUsers[i % createdUsers.length];
      const product = createdProducts[i % createdProducts.length];
      
      const quantity = faker.number.int({ min: 1, max: 3 });
      const price = product.price;
      const itemTotal = price * quantity;
      const shipping = 5.99;
      const tax = itemTotal * 0.1;
      const total = itemTotal + shipping + tax;
      
      orders.push({
        userId: buyer._id,
        orderNumber: `ORD-${Date.now()}-${i}`,
        items: [{
          productId: product._id,
          storeId: product.storeId,
          name: product.name,
          quantity,
          price,
          total: itemTotal,
        }],
        subtotal: itemTotal,
        shipping,
        tax,
        total,
        status: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'][i % 5],
        paymentStatus: i < 40 ? 'paid' : 'pending',
        paymentMethod: 'card',
        shippingAddress: {
          fullName: buyer.fullName,
          phone: faker.phone.number(),
          addressLine1: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          postalCode: faker.location.zipCode(),
          country: 'USA',
        },
      });
    }
    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} orders`);
    
    console.log('\n✅ ✅ ✅ QUICK SEED COMPLETE! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   Admin: 1 (username: admin, password: admin123)`);
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Wallets: ${wallets.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Stores: ${createdStores.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    console.log(`   Content: ${createdContent.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log('\n🎉 Ready for testing!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
