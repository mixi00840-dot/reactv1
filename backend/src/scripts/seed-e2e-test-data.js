/**
 * E2E Test Data Seeding Script
 * Creates comprehensive test data for all admin dashboard pages
 * All data prefixed with __e2e__ for easy cleanup
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import all models
const User = require('../models/User');
const Content = require('../models/Content');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Livestream = require('../models/Livestream');
const Gift = require('../models/Gift');
const GiftTransaction = require('../models/GiftTransaction');
const CoinPackage = require('../models/CoinPackage');
const Level = require('../models/Level');
const Tag = require('../models/Tag');
const Banner = require('../models/Banner');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const Analytics = require('../models/Analytics');
const Category = require('../models/Category');
const StreamProvider = require('../models/StreamProvider');
const SellerApplication = require('../models/SellerApplication');
const Featured = require('../models/Featured');
const ExplorerSection = require('../models/ExplorerSection');
const Translation = require('../models/Translation');
const Currency = require('../models/Currency');

const ADMIN_PASSWORD = 'Admin@123456';
const USER_PASSWORD = 'User@123456';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanupExistingE2EData() {
  console.log('\n🧹 Cleaning up existing E2E test data...');
  
  const collections = await mongoose.connection.db.collections();
  let deletedCount = 0;
  
  for (const collection of collections) {
    // Delete documents with __e2e__ prefix in various fields
    const result = await collection.deleteMany({
      $or: [
        { username: { $regex: '^__e2e__' } },
        { email: { $regex: '^__e2e__' } },
        { name: { $regex: '^__e2e__' } },
        { title: { $regex: '^__e2e__' } },
        { caption: { $regex: '^__e2e__' } },
        { description: { $regex: '^__e2e__' } },
        { code: { $regex: '^__e2e__' } },
        { storeName: { $regex: '^__e2e__' } },
        { slug: { $regex: '^__e2e__' } },
        { orderNumber: { $regex: '^__e2e__' } },
        { transactionId: { $regex: '^__e2e__' } },
        { sku: { $regex: '^__e2e__' } },
        { isE2ETestData: true }
      ]
    });
    deletedCount += result.deletedCount;
  }
  
  // Also clean up any stores with null slug to avoid unique index issues
  try {
    const Store = mongoose.model('Store');
    const nullSlugResult = await Store.deleteMany({ slug: null });
    deletedCount += nullSlugResult.deletedCount;
    
    const Product = mongoose.model('Product');
    const nullSkuResult = await Product.deleteMany({ sku: null });
    deletedCount += nullSkuResult.deletedCount;
  } catch (error) {
    // Ignore if models not yet loaded
  }
  
  console.log(`✅ Cleaned up ${deletedCount} E2E test documents`);
}

async function createUsers() {
  console.log('\n👥 Creating test users...');
  
  const users = [];
  const roles = ['user', 'seller', 'admin'];
  const statuses = ['active', 'banned', 'suspended'];
  
  // Create 50 test users
  for (let i = 1; i <= 50; i++) {
    const role = roles[i % 3];
    const status = statuses[i % 3];
    const hashedPassword = await bcrypt.hash(USER_PASSWORD, 10);
    
    const user = await User.create({
      username: `__e2e__user${i}`,
      email: `e2euser${i}@mixillo.com`,
      fullName: `__e2e__ Test User ${i}`,
      password: hashedPassword,
      role: role,
      status: status,
      isVerified: i % 2 === 0,
      phone: `+1234567${String(i).padStart(4, '0')}`,
      dateOfBirth: new Date(1990 + (i % 30), (i % 12), (i % 28) + 1),
      bio: `__e2e__ Test user ${i} biography`,
      avatar: `https://i.pravatar.cc/150?img=${i}`,
      website: `https://e2euser${i}.example.com`,
      isE2ETestData: true
    });
    
    // Create wallet for each user
    await Wallet.create({
      userId: user._id,
      balance: Math.floor(Math.random() * 10000) + 100,
      currency: 'USD',
      isE2ETestData: true
    });
    
    users.push(user);
  }
  
  console.log(`✅ Created ${users.length} test users with wallets`);
  return users;
}

async function createStores(users) {
  console.log('\n🏪 Creating test stores...');
  
  const sellers = users.filter(u => u.role === 'seller');
  const stores = [];
  const statuses = ['active', 'pending', 'suspended'];
  
  for (let i = 0; i < Math.min(sellers.length, 20); i++) {
    const store = await Store.create({
      sellerId: sellers[i]._id,
      name: `__e2e__ Store ${i + 1}`,
      slug: `__e2e__store${i + 1}`,
      description: `__e2e__ Test store ${i + 1} selling amazing products`,
      logo: `https://picsum.photos/seed/__e2e__store${i}/200/200`,
      banner: `https://picsum.photos/seed/__e2e__storebanner${i}/1200/400`,
      status: statuses[i % 3],
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      totalSales: Math.floor(Math.random() * 10000),
      commission: Math.random() * 0.15 + 0.05, // 5% - 20%
      isE2ETestData: true
    });
    stores.push(store);
  }
  
  console.log(`✅ Created ${stores.length} test stores`);
  return stores;
}

async function createCategories() {
  console.log('\n📂 Creating test categories...');
  
  const categoryNames = ['Electronics', 'Fashion', 'Beauty', 'Home', 'Sports', 'Books', 'Toys', 'Food'];
  const categories = [];
  
  for (let i = 0; i < categoryNames.length; i++) {
    try {
      const category = await Category.create({
        name: categoryNames[i],
        slug: categoryNames[i].toLowerCase(),
        description: `__e2e__ ${categoryNames[i]} category`,
        image: `https://picsum.photos/seed/__e2e__cat${i}/200/200`,
        isActive: true,
        isE2ETestData: true
      });
      categories.push(category);
    } catch (error) {
      // If category exists, find it
      const existing = await Category.findOne({ name: categoryNames[i] });
      if (existing) categories.push(existing);
    }
  }
  
  console.log(`✅ Created/Found ${categories.length} test categories`);
  return categories;
}

async function createProducts(stores, users, categories) {
  console.log('\n📦 Creating test products...');
  
  const products = [];
  const statuses = ['active', 'draft', 'out_of_stock'];
  
  for (let i = 0; i < 100; i++) {
    const store = stores[i % stores.length];
    const category = categories[i % categories.length];
    const product = await Product.create({
      name: `__e2e__ Product ${i + 1}`,
      description: `__e2e__ Amazing product ${i + 1} with great features`,
      sku: `__e2e__SKU${String(i + 1).padStart(6, '0')}`,
      price: Math.floor(Math.random() * 500) + 10,
      compareAtPrice: Math.floor(Math.random() * 600) + 50,
      category: category._id,
      storeId: store._id,
      sellerId: store.sellerId,
      images: [
        { url: `https://picsum.photos/seed/__e2e__prod${i}a/400/400`, alt: `Product ${i + 1} image 1`, sortOrder: 0 },
        { url: `https://picsum.photos/seed/__e2e__prod${i}b/400/400`, alt: `Product ${i + 1} image 2`, sortOrder: 1 },
        { url: `https://picsum.photos/seed/__e2e__prod${i}c/400/400`, alt: `Product ${i + 1} image 3`, sortOrder: 2 }
      ],
      stock: Math.floor(Math.random() * 1000),
      status: statuses[i % 3],
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500),
      isE2ETestData: true
    });
    
    products.push(product);
  }
  
  console.log(`✅ Created ${products.length} test products`);
  return products;
}

async function createOrders(users, products, stores) {
  console.log('\n🛒 Creating test orders...');
  
  const orders = [];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  for (let i = 0; i < 150; i++) {
    const user = users[i % users.length];
    const product = products[i % products.length];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const totalAmount = product.price * quantity;
    
    const order = await Order.create({
      orderNumber: `__e2e__ORD${String(i + 1).padStart(6, '0')}`,
      userId: user._id,
      items: [{
        productId: product._id,
        storeId: product.store,
        quantity: quantity,
        price: product.price,
        totalAmount: totalAmount
      }],
      subtotal: totalAmount,
      total: totalAmount,
      paymentMethod: ['card', 'paypal', 'wallet', 'cash_on_delivery'][i % 4],
      shippingAddress: {
        fullName: user.fullName || `__e2e__ Test User ${i}`,
        phone: user.phone || `+1234567890`,
        addressLine1: `__e2e__ ${i + 1} Test Street`,
        city: `Test City ${i % 10}`,
        state: 'Test State',
        postalCode: `${10000 + i}`,
        country: 'Test Country'
      },
      status: statuses[i % statuses.length],
      isE2ETestData: true
    });
    orders.push(order);
  }
  
  console.log(`✅ Created ${orders.length} test orders`);
  return orders;
}

async function createPayments(orders) {
  console.log('\n💳 Creating test payments...');
  
  const payments = [];
  const methods = ['card', 'wallet', 'paypal', 'stripe'];
  const statuses = ['completed', 'pending', 'failed', 'refunded'];
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const payment = await Payment.create({
      transactionId: `__e2e__TXN${String(i + 1).padStart(10, '0')}`,
      orderId: order._id,
      userId: order.userId,
      amount: order.total,
      paymentMethod: methods[i % methods.length],
      status: statuses[i % statuses.length],
      isE2ETestData: true
    });
    payments.push(payment);
  }
  
  console.log(`✅ Created ${payments.length} test payments`);
  return payments;
}

async function createCoupons(stores) {
  console.log('\n🎟️  Creating test coupons...');
  
  const coupons = [];
  const discountTypes = ['percentage', 'fixed'];
  const statuses = ['active', 'expired', 'disabled'];
  
  for (let i = 0; i < 30; i++) {
    try {
      const coupon = await Coupon.create({
        code: `__e2e__COUPON${i + 1}`,
        description: `__e2e__ Test coupon ${i + 1} for amazing discounts`,
        type: discountTypes[i % 2],
        value: discountTypes[i % 2] === 'percentage' ? Math.floor(Math.random() * 50) + 5 : Math.floor(Math.random() * 50) + 10,
        minPurchase: Math.floor(Math.random() * 100),
        maxUses: Math.floor(Math.random() * 1000) + 100,
        usedCount: Math.floor(Math.random() * 50),
        validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: i % 3 !== 0,
        isE2ETestData: true
      });
      coupons.push(coupon);
    } catch (error) {
      console.log(`Skipping coupon ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`✅ Created ${coupons.length} test coupons`);
  return coupons;
}

async function createTransactions(users) {
  console.log('\n💰 Creating test transactions...');
  
  const transactions = [];
  const types = ['deposit', 'withdrawal', 'purchase', 'refund', 'gift', 'transfer'];
  const statuses = ['completed', 'pending', 'failed'];
  
  for (let i = 0; i < 200; i++) {
    const user = users[i % users.length];
    const transaction = await Transaction.create({
      userId: user._id,
      type: types[i % types.length],
      amount: Math.floor(Math.random() * 1000) + 10,
      currency: 'USD',
      status: statuses[i % statuses.length],
      description: `__e2e__ Test transaction ${i + 1}`,
      reference: `__e2e__REF${String(i + 1).padStart(10, '0')}`,
      isE2ETestData: true
    });
    transactions.push(transaction);
  }
  
  console.log(`✅ Created ${transactions.length} test transactions`);
  return transactions;
}

async function createLivestreams(users) {
  console.log('\n📺 Creating test Livestreams...');
  
  const streams = [];
  const statuses = ['live', 'scheduled', 'ended'];
  
  for (let i = 0; i < 40; i++) {
    const broadcaster = users[i % users.length];
    const stream = await Livestream.create({
      title: `__e2e__ Test Stream ${i + 1}`,
      description: `__e2e__ Amazing live stream ${i + 1} with great content`,
      hostId: broadcaster._id,
      thumbnail: `https://picsum.photos/seed/__e2e__stream${i}/800/450`,
      status: statuses[i % 3],
      viewerCount: Math.floor(Math.random() * 10000),
      likeCount: Math.floor(Math.random() * 5000),
      startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      endTime: i % 3 === 2 ? new Date() : null,
      streamKey: `__e2e__KEY${String(i + 1).padStart(10, '0')}`,
      agoraChannelId: `__e2e__CHANNEL${i + 1}`,
      isE2ETestData: true
    });
    streams.push(stream);
  }
  
  console.log(`✅ Created ${streams.length} test Livestreams`);
  return streams;
}

async function createGifts() {
  console.log('\n🎁 Creating test gifts...');
  
  const gifts = [];
  
  for (let i = 0; i < 25; i++) {
    const gift = await Gift.create({
      name: `__e2e__ Gift ${i + 1}`,
      description: `__e2e__ Amazing virtual gift ${i + 1}`,
      image: `https://picsum.photos/seed/__e2e__gift${i}/200/200`,
      price: Math.floor(Math.random() * 1000) + 50,
      coinValue: Math.floor(Math.random() * 10000) + 500,
      category: ['hearts', 'flowers', 'luxury', 'special'][i % 4],
      isActive: i % 5 !== 0,
      isE2ETestData: true
    });
    gifts.push(gift);
  }
  
  console.log(`✅ Created ${gifts.length} test gifts`);
  return gifts;
}

async function createGiftTransactions(users, gifts, streams) {
  console.log('\n🎁 Creating test gift transactions...');
  
  const giftTransactions = [];
  
  for (let i = 0; i < 100; i++) {
    const sender = users[i % users.length];
    const receiver = users[(i + 1) % users.length];
    const gift = gifts[i % gifts.length];
    const stream = streams[i % streams.length];
    
    const giftTxn = await GiftTransaction.create({
      senderId: sender._id,
      receiverId: receiver._id,d,
      giftId: gift._id,
      streamId: stream._id,
      quantity: Math.floor(Math.random() * 5) + 1,
      totalCoinValue: gift.coinValue * (Math.floor(Math.random() * 5) + 1),
      isE2ETestData: true
    });
    giftTransactions.push(giftTxn);
  }
  
  console.log(`✅ Created ${giftTransactions.length} test gift transactions`);
  return giftTransactions;
}

async function createCoins() {
  console.log('\n🪙 Creating test coin packages...');
  
  const coins = [];
  const packages = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];
  
  for (let i = 0; i < packages.length; i++) {
    const coinAmount = packages[i];
    const coin = await CoinPackage.create({
      name: `__e2e__ ${coinAmount} Coins`,
      description: `__e2e__ Package of ${coinAmount} coins`,
      coinAmount: coinAmount,
      price: coinAmount * 0.01, // $0.01 per coin
      bonusCoins: Math.floor(coinAmount * 0.1),
      isPopular: i === 3,
      isActive: true,
      isE2ETestData: true
    });
    coins.push(coin);
  }
  
  console.log(`✅ Created ${coins.length} test coin packages`);
  return coins;
}

async function createLevels() {
  console.log('\n⭐ Creating test user levels...');
  
  const levels = [];
  
  for (let i = 1; i <= 20; i++) {
    const level = await Level.create({
      level: i,
      name: `__e2e__ Level ${i}`,
      minExperience: (i - 1) * 1000,
      maxExperience: i * 1000,
      benefits: {
        giftDiscount: i * 2,
        coinBonus: i * 5,
        specialBadge: i >= 10
      },
      icon: `https://picsum.photos/seed/__e2e__level${i}/100/100`,
      isE2ETestData: true
    });
    levels.push(level);
  }
  
  console.log(`✅ Created ${levels.length} test user levels`);
  return levels;
}

async function createTags() {
  console.log('\n🏷️  Creating test tags...');
  
  const tags = [];
  const categories = ['trending', 'gaming', 'music', 'sports', 'education', 'entertainment', 'cooking', 'travel'];
  
  for (let i = 0; i < 30; i++) {
    const tag = await Tag.create({
      name: `__e2e__tag${i + 1}`,
      displayName: `__e2e__ Tag ${i + 1}`,
      category: categories[i % categories.length],
      usageCount: Math.floor(Math.random() * 10000),
      isE2ETestData: true
    });
    tags.push(tag);
  }
  
  console.log(`✅ Created ${tags.length} test tags`);
  return tags;
}

async function createContent(users, tags) {
  console.log('\n🎬 Creating test content...');
  
  const contents = [];
  const statuses = ['published', 'draft', 'under_review', 'rejected'];
  
  for (let i = 0; i < 100; i++) {
    const creator = users[i % users.length];
    const content = await Content.create({
      caption: `__e2e__ Test video ${i + 1}`,
      description: `__e2e__ Amazing content ${i + 1} with great visuals`,
      videoUrl: `https://storage.googleapis.com/__e2e__/video${i + 1}.mp4`,
      thumbnailUrl: `https://picsum.photos/seed/__e2e__content${i}/400/600`,
      userId: creator._id,
      duration: Math.floor(Math.random() * 300) + 15,
      views: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 500),
      status: statuses[i % statuses.length],
      tags: [tags[i % tags.length]._id, tags[(i + 1) % tags.length]._id],
      isE2ETestData: true
    });
    contents.push(content);
  }
  
  console.log(`✅ Created ${contents.length} test content items`);
  return contents;
}

async function createBanners() {
  console.log('\n🎨 Creating test banners...');
  
  const banners = [];
  const positions = ['home_top', 'home_middle', 'shop_top', 'profile_top'];
  const statuses = ['active', 'scheduled', 'inactive'];
  
  for (let i = 0; i < 15; i++) {
    const banner = await Banner.create({
      title: `__e2e__ Banner ${i + 1}`,
      description: `__e2e__ Promotional banner ${i + 1}`,
      image: `https://picsum.photos/seed/__e2e__banner${i}/1200/400`,
      link: `https://__e2e__banner${i}.example.com`,
      position: positions[i % positions.length],
      status: statuses[i % statuses.length],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      clickCount: Math.floor(Math.random() * 10000),
      isE2ETestData: true
    });
    banners.push(banner);
  }
  
  console.log(`✅ Created ${banners.length} test banners`);
  return banners;
}

async function createReports(users, content) {
  console.log('\n🚨 Creating test reports...');
  
  const reports = [];
  const types = ['spam', 'inappropriate', 'copyright', 'harassment', 'other'];
  const statuses = ['pending', 'investigating', 'resolved', 'dismissed'];
  
  for (let i = 0; i < 60; i++) {
    const reporter = users[i % users.length];
    const reportedContent = content[i % content.length];
    
    const report = await Report.create({
      reporter: reporter._id,
      reportedContent: reportedContent._id,
      reportedUser: reportedContent.creator,
      type: types[i % types.length],
      reason: `__e2e__ Test report ${i + 1} - ${types[i % types.length]}`,
      status: statuses[i % statuses.length],
      priority: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      isE2ETestData: true
    });
    reports.push(report);
  }
  
  console.log(`✅ Created ${reports.length} test reports`);
  return reports;
}

async function createNotifications(users) {
  console.log('\n🔔 Creating test notifications...');
  
  const notifications = [];
  const types = ['like', 'comment', 'follow', 'gift', 'system', 'order', 'payment'];
  
  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];
    const notification = await Notification.create({
      userId: user._id,
      type: types[i % types.length],
      title: `__e2e__ Notification ${i + 1}`,
      message: `__e2e__ Test notification message ${i + 1}`,
      isRead: i % 3 === 0,
      link: `/notifications/${i + 1}`,
      isE2ETestData: true
    });
    notifications.push(notification);
  }
  
  console.log(`✅ Created ${notifications.length} test notifications`);
  return notifications;
}

async function createAnalytics() {
  console.log('\n📊 Creating test analytics...');
  
  const analytics = [];
  const metrics = ['users', 'content', 'orders', 'revenue', 'streams', 'engagement'];
  
  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    for (const metric of metrics) {
      const analytic = await Analytics.create({
        date: date,
        metric: metric,
        value: Math.floor(Math.random() * 10000) + 100,
        previousValue: Math.floor(Math.random() * 9000) + 100,
        changePercentage: (Math.random() * 40 - 10).toFixed(2),
        isE2ETestData: true
      });
      analytics.push(analytic);
    }
  }
  
  console.log(`✅ Created ${analytics.length} test analytics entries`);
  return analytics;
}

async function createCategories() {
  console.log('\n📂 Creating test categories...');
  
  const categories = [];
  const categoryNames = [
    'Electronics', 'Fashion', 'Beauty', 'Home & Garden', 'Sports', 
    'Books', 'Toys', 'Food & Beverage', 'Health', 'Automotive'
  ];
  
  for (let i = 0; i < categoryNames.length; i++) {
    const category = await Category.create({
      name: `__e2e__ ${categoryNames[i]}`,
      slug: `__e2e__-${categoryNames[i].toLowerCase().replace(/\s+/g, '-')}`,
      description: `__e2e__ ${categoryNames[i]} category`,
      icon: `https://picsum.photos/seed/__e2e__cat${i}/100/100`,
      image: `https://picsum.photos/seed/__e2e__cat${i}/400/400`,
      isActive: true,
      sortOrder: i,
      isE2ETestData: true
    });
    categories.push(category);
  }
  
  console.log(`✅ Created ${categories.length} test categories`);
  return categories;
}

async function createSystemSettings() {
  console.log('\n⚙️  Creating test system settings...');
  
  const settings = [
    { key: '__e2e__app_name', value: 'Mixillo Test', type: 'string' },
    { key: '__e2e__maintenance_mode', value: false, type: 'boolean' },
    { key: '__e2e__max_upload_size', value: 100, type: 'number' },
    { key: '__e2e__coin_to_dollar_rate', value: 0.01, type: 'number' },
    { key: '__e2e__commission_rate', value: 0.15, type: 'number' },
    { key: '__e2e__email_notifications', value: true, type: 'boolean' },
    { key: '__e2e__push_notifications', value: true, type: 'boolean' },
    { key: '__e2e__allow_comments', value: true, type: 'boolean' },
    { key: '__e2e__allow_downloads', value: false, type: 'boolean' },
    { key: '__e2e__min_withdrawal', value: 50, type: 'number' },
  ];
  
  for (const setting of settings) {
    await SystemSettings.create({
      ...setting,
      isE2ETestData: true
    });
  }
  
  console.log(`✅ Created ${settings.length} test system settings`);
  return settings;
}

async function seedAll() {
  try {
    console.log('🌱 Starting E2E Test Data Seeding...\n');
    console.log('═══════════════════════════════════════\n');
    
    await connectDB();
    await cleanupExistingE2EData();
    
    // Create all test data (wrapped in try-catch for resilience)
    const users = await createUsers();
    const stores = await createStores(users);
    const categories = await createCategories();
    const products = await createProducts(stores, users, categories);
    const orders = await createOrders(users, products, stores);
    const payments = await createPayments(orders);
    const coupons = await createCoupons(stores).catch(() => []);
    const transactions = await createTransactions(users).catch(() => []);
    const streams = await createLivestreams(users).catch(() => []);
    const gifts = await createGifts().catch(() => []);
    const giftTransactions = streams.length > 0 && gifts.length > 0 ? await createGiftTransactions(users, gifts, streams).catch(() => []) : [];
    const coins = await createCoins().catch(() => []);
    const Levels = await createLevels().catch(() => []);
    const tags = await createTags().catch(() => []);
    const content = tags.length > 0 ? await createContent(users, tags).catch(() => []) : [];
    const banners = await createBanners().catch(() => []);
    const reports = content.length > 0 ? await createReports(users, content).catch(() => []) : [];
    const notifications = await createNotifications(users).catch(() => []);
    const analytics = await createAnalytics().catch(() => []);
    const SystemSettingss = await createSystemSettings().catch(() => []);
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ E2E TEST DATA SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - ${users.length} Users (with profiles & wallets)`);
    console.log(`   - ${stores.length} Stores`);
    console.log(`   - ${products.length} Products (with variants)`);
    console.log(`   - ${orders.length} Orders`);
    console.log(`   - ${payments.length} Payments`);
    console.log(`   - ${coupons.length} Coupons`);
    console.log(`   - ${transactions.length} Transactions`);
    console.log(`   - ${streams.length} Livestreams`);
    console.log(`   - ${gifts.length} Gifts`);
    console.log(`   - ${giftTransactions.length} Gift Transactions`);
    console.log(`   - ${coins.length} Coin Packages`);
    console.log(`   - ${Levels.length} User Levels`);
    console.log(`   - ${tags.length} Tags`);
    console.log(`   - ${content.length} Content Items`);
    console.log(`   - ${banners.length} Banners`);
    console.log(`   - ${reports.length} Reports`);
    console.log(`   - ${notifications.length} Notifications`);
    console.log(`   - ${analytics.length} Analytics Entries`);
    console.log(`   - ${categories.length} Categories`);
    console.log(`   - ${SystemSettingss.length} System Settings`);
    console.log('\n🔍 All data prefixed with __e2e__ for easy cleanup');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding E2E test data:', error);
    process.exit(1);
  }
}

// Run seeding
seedAll();
