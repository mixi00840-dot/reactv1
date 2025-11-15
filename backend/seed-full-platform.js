/**
 * MIXILLO FULL PLATFORM SEED SCRIPT
 * Generates comprehensive test data for all models with proper relationships
 * Run: node seed-full-platform.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('./src/models/User');
const Wallet = require('./src/models/Wallet');
const Content = require('./src/models/Content');
const Comment = require('./src/models/Comment');
const Like = require('./src/models/Like');
const View = require('./src/models/View');
const Share = require('./src/models/Share');
const Save = require('./src/models/Save');
const Follow = require('./src/models/Follow');
const Story = require('./src/models/Story');
const Sound = require('./src/models/Sound');
const Tag = require('./src/models/Tag');
const Category = require('./src/models/Category');
const Store = require('./src/models/Store');
const Product = require('./src/models/Product');
const Cart = require('./src/models/Cart');
const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');
const Shipping = require('./src/models/Shipping');
const Coupon = require('./src/models/Coupon');
const Livestream = require('./src/models/Livestream');
const Gift = require('./src/models/Gift');
const GiftTransaction = require('./src/models/GiftTransaction');
const CoinPackage = require('./src/models/CoinPackage');
const Level = require('./src/models/Level');
const Transaction = require('./src/models/Transaction');
const Notification = require('./src/models/Notification');
const Message = require('./src/models/Message');
const Conversation = require('./src/models/Conversation');
const Report = require('./src/models/Report');
const ModerationQueue = require('./src/models/ModerationQueue');
const Strike = require('./src/models/Strike');
const Analytics = require('./src/models/Analytics');
const Banner = require('./src/models/Banner');
const ExplorerSection = require('./src/models/ExplorerSection');
const Featured = require('./src/models/Featured');
const TrendingRecord = require('./src/models/TrendingRecord');
const SellerApplication = require('./src/models/SellerApplication');
const CustomerService = require('./src/models/Ticket');
const SystemSettings = require('./src/models/SystemSettings');
const Currency = require('./src/models/Currency');
const Translation = require('./src/models/Translation');
const Language = require('./src/models/Language');
const CreatorEarnings = require('./src/models/CreatorEarnings');
const Subscription = require('./src/models/Subscription');
const SubscriptionTier = require('./src/models/SubscriptionTier');
const SearchQuery = require('./src/models/SearchQuery');
const TranscodeJob = require('./src/models/TranscodeJob');
const VideoQuality = require('./src/models/VideoQuality');
const ContentMetrics = require('./src/models/ContentMetrics');
const RecommendationMetadata = require('./src/models/RecommendationMetadata');
const UploadSession = require('./src/models/UploadSession');
const StreamProvider = require('./src/models/StreamProvider');
const PKBattle = require('./src/models/PKBattle');
const MultiHostSession = require('./src/models/MultiHostSession');
const LiveShoppingSession = require('./src/models/LiveShoppingSession');
const AIModeration = require('./src/models/AIModeration');
const AuditLog = require('./src/models/AuditLog');
const UserActivity = require('./src/models/UserActivity');
const Setting = require('./src/models/Setting');
const TrendingConfig = require('./src/models/TrendingConfig');
const Page = require('./src/models/Page');
const FAQ = require('./src/models/FAQ');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Helper functions
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Data pools
const usernames = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'ivy', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'peter', 'quinn', 'ryan', 'sophia', 'tom', 'uma', 'victor', 'wendy', 'xander', 'yara', 'zane'];
const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'Mexico'];
const productCategories = ['Electronics', 'Fashion', 'Beauty', 'Home & Garden', 'Sports', 'Books', 'Toys', 'Food & Beverage', 'Health', 'Automotive'];
const videoTitles = ['Amazing Dance', 'Cooking Tutorial', 'Travel Vlog', 'Product Review', 'Comedy Sketch', 'Music Cover', 'DIY Project', 'Gaming Highlights', 'Fashion Haul', 'Fitness Routine'];
const hashtags = ['#trending', '#viral', '#challenge', '#fyp', '#foryou', '#explore', '#love', '#instagood', '#photooftheday', '#beautiful', '#happy', '#art', '#music', '#dance', '#funny', '#tutorial', '#gaming', '#fashion', '#food', '#travel'];

// Clear all collections and drop indexes
const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data and indexes...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
    // Drop all indexes except _id
    try {
      await collections[key].dropIndexes();
    } catch (e) {
      // Ignore errors (collection might not have indexes)
    }
  }
  console.log('✅ Database cleared and indexes dropped');
};

// Seed functions
const seedUsers = async (count = 200) => {
  console.log(`👥 Seeding ${count} users...`);
  const users = [];
  const hashedPassword = await bcrypt.hash('Test@123', 10);
  
  // Admin user
  users.push(await User.create({
    username: 'admin',
    email: 'admin@mixillo.com',
    password: hashedPassword,
    fullName: 'Admin User',
    role: 'admin',
    status: 'active',
    isVerified: true,
    emailVerified: true,
    bio: 'Platform administrator',
    avatar: 'https://i.pravatar.cc/150?img=1',
    followersCount: 1000,
    followingCount: 50,
    videosCount: 0
  }));

  // Regular users
  for (let i = 0; i < count - 1; i++) {
    const username = `${randomElement(usernames)}_${i}_${randomInt(10000, 99999)}`;
    const role = i < 20 ? 'seller' : 'user';
    const status = randomElement(['active', 'active', 'active', 'active', 'suspended', 'banned']);
    
    users.push(await User.create({
      username,
      email: `${username}@test.com`,
      password: hashedPassword,
      fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
      role,
      status,
      isVerified: Math.random() > 0.3,
      emailVerified: Math.random() > 0.2,
      phoneVerified: Math.random() > 0.5,
      bio: `Content creator and ${role}. Love sharing my life!`,
      avatar: `https://i.pravatar.cc/150?img=${randomInt(1, 70)}`,
      location: randomElement(cities),
      website: Math.random() > 0.7 ? `https://${username}.com` : null,
      followersCount: randomInt(0, 10000),
      followingCount: randomInt(0, 500),
      videosCount: randomInt(0, 100),
      likesCount: randomInt(0, 50000),
      viewsCount: randomInt(0, 100000),
      coinsBalance: randomInt(0, 10000),
      isFeatured: Math.random() > 0.9,
      activeStrikes: status === 'suspended' ? randomInt(1, 2) : 0,
      birthDate: randomDate(new Date(1990, 0, 1), new Date(2005, 11, 31)),
      gender: randomElement(['male', 'female', 'other', 'prefer_not_to_say'])
    }));
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
};

const seedWallets = async (users) => {
  console.log('💰 Seeding wallets...');
  const wallets = [];
  for (const user of users) {
    wallets.push(await Wallet.create({
      userId: user._id,
      balance: parseFloat(randomFloat(0, 5000)),
      totalEarnings: parseFloat(randomFloat(0, 10000)),
      totalWithdrawals: parseFloat(randomFloat(0, 3000)),
      currency: 'USD',
      pendingBalance: parseFloat(randomFloat(0, 500))
    }));
  }
  console.log(`✅ Created ${wallets.length} wallets`);
  return wallets;
};

const seedFollows = async (users) => {
  console.log('👫 Seeding follows...');
  const follows = [];
  for (let i = 0; i < 500; i++) {
    const follower = randomElement(users);
    const following = randomElement(users);
    if (follower._id.toString() !== following._id.toString()) {
      try {
        follows.push(await Follow.create({
          followerId: follower._id,
          followingId: following._id
        }));
      } catch (e) {
        // Duplicate, skip
      }
    }
  }
  console.log(`✅ Created ${follows.length} follows`);
  return follows;
};

const seedCategories = async () => {
  console.log('📂 Seeding categories...');
  const categories = [];
  for (const catName of productCategories) {
    categories.push(await Category.create({
      name: catName,
      slug: catName.toLowerCase().replace(/\s+/g, '-'),
      description: `${catName} products and items`,
      icon: '📦',
      isActive: true,
      sortOrder: categories.length
    }));
  }
  console.log(`✅ Created ${categories.length} categories`);
  return categories;
};

const seedTags = async () => {
  console.log('🏷️  Seeding tags...');
  const tags = [];
  const tagNames = ['trending', 'viral', 'challenge', 'tutorial', 'review', 'vlog', 'comedy', 'music', 'dance', 'gaming', 'fashion', 'food', 'travel', 'fitness', 'beauty'];
  for (const tagName of tagNames) {
    tags.push(await Tag.create({
      name: tagName,
      slug: tagName.toLowerCase(),
      usageCount: randomInt(100, 10000)
    }));
  }
  console.log(`✅ Created ${tags.length} tags`);
  return tags;
};

const seedSounds = async (users) => {
  console.log('🎵 Seeding sounds...');
  const sounds = [];
  for (let i = 0; i < 50; i++) {
    sounds.push(await Sound.create({
      title: `Sound ${i + 1}`,
      artist: randomElement(firstNames) + ' ' + randomElement(lastNames),
      audioUrl: `https://cdn.mixillo.com/sounds/sound-${i + 1}.mp3`,
      duration: randomInt(10, 180),
      uploadedBy: randomElement(users)._id,
      usageCount: randomInt(0, 5000),
      isOriginal: Math.random() > 0.7,
      status: randomElement(['active', 'active', 'active', 'pending'])
    }));
  }
  console.log(`✅ Created ${sounds.length} sounds`);
  return sounds;
};

const seedContent = async (users, sounds, tags) => {
  console.log('📹 Seeding content...');
  const contents = [];
  for (let i = 0; i < 300; i++) {
    const creator = randomElement(users);
    const sound = Math.random() > 0.3 ? randomElement(sounds) : null;
    const selectedTags = [];
    for (let j = 0; j < randomInt(1, 5); j++) {
      selectedTags.push(randomElement(tags)._id);
    }
    
    contents.push(await Content.create({
      userId: creator._id,
      type: 'video',
      caption: `${randomElement(videoTitles)} - ${randomElement(hashtags)}`,
      videoUrl: `https://cdn.mixillo.com/videos/video-${i + 1}.mp4`,
      thumbnailUrl: `https://cdn.mixillo.com/thumbs/thumb-${i + 1}.jpg`,
      duration: randomInt(10, 180),
      soundId: sound?._id,
      hashtags: [randomElement(hashtags), randomElement(hashtags)],
      viewsCount: randomInt(0, 100000),
      likesCount: randomInt(0, 10000),
      commentsCount: randomInt(0, 500),
      sharesCount: randomInt(0, 1000),
      savesCount: randomInt(0, 2000),
      status: randomElement(['active', 'active', 'active', 'draft', 'processing']),
      isPrivate: Math.random() > 0.9,
      allowComments: true,
      allowDuet: true,
      allowStitch: true
    }));
  }
  console.log(`✅ Created ${contents.length} contents`);
  return contents;
};

const seedEngagement = async (users, contents) => {
  console.log('❤️  Seeding engagement (likes, comments, views)...');
  
  // Likes
  for (let i = 0; i < 1000; i++) {
    try {
      await Like.create({
        userId: randomElement(users)._id,
        contentId: randomElement(contents)._id
      });
    } catch (e) {} // Duplicate
  }
  
  // Comments
  const comments = [];
  for (let i = 0; i < 500; i++) {
    comments.push(await Comment.create({
      contentId: randomElement(contents)._id,
      userId: randomElement(users)._id,
      text: randomElement(['Love this!', 'Amazing!', 'Great video!', 'So cool!', 'Wow!', 'Nice!', 'Interesting', 'Beautiful', 'Awesome content', 'Keep it up!']),
      likesCount: randomInt(0, 100)
    }));
  }
  
  // Views
  for (let i = 0; i < 2000; i++) {
    try {
      await View.create({
        contentId: randomElement(contents)._id,
        userId: randomElement(users)._id,
        duration: randomInt(5, 180)
      });
    } catch (e) {}
  }
  
  // Shares
  for (let i = 0; i < 300; i++) {
    await Share.create({
      userId: randomElement(users)._id,
      contentId: randomElement(contents)._id,
      platform: randomElement(['twitter', 'facebook', 'whatsapp', 'telegram', 'copy_link', 'other'])
    });
  }
  
  // Saves
  for (let i = 0; i < 400; i++) {
    try {
      await Save.create({
        userId: randomElement(users)._id,
        contentId: randomElement(contents)._id
      });
    } catch (e) {}
  }
  
  console.log('✅ Created engagement data');
  return comments;
};

const seedStores = async (users) => {
  console.log('🏪 Seeding stores...');
  const sellers = users.filter(u => u.role === 'seller');
  const stores = [];
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    stores.push(await Store.create({
      sellerId: seller._id,
      name: `${seller.fullName}'s Store`,
      slug: `store-${seller.username}`,
      description: 'Quality products and fast shipping!',
      logo: `https://i.pravatar.cc/200?img=${i + 100}`,
      banner: `https://picsum.photos/1200/400?random=${i}`,
      status: randomElement(['active', 'active', 'active', 'pending', 'suspended']),
      isVerified: Math.random() > 0.5,
      rating: parseFloat(randomFloat(3.5, 5.0)),
      reviewsCount: randomInt(0, 500),
      productsCount: randomInt(0, 100),
      ordersCount: randomInt(0, 1000),
      revenue: parseFloat(randomFloat(0, 50000))
    }));
  }
  console.log(`✅ Created ${stores.length} stores`);
  return stores;
};

const seedProducts = async (stores, categories) => {
  console.log('🛍️  Seeding products...');
  const products = [];
  for (let i = 0; i < 200; i++) {
    const store = randomElement(stores);
    const category = randomElement(categories);
    products.push(await Product.create({
      storeId: store._id,
      sellerId: store.sellerId,
      name: `Product ${i + 1}`,
      slug: `product-${i + 1}`,
      description: 'High quality product with excellent features',
      price: parseFloat(randomFloat(9.99, 999.99)),
      compareAtPrice: parseFloat(randomFloat(19.99, 1299.99)),
      cost: parseFloat(randomFloat(5, 500)),
      sku: `SKU${String(i + 1).padStart(6, '0')}`,
      barcode: `${randomInt(100000000000, 999999999999)}`,
      trackInventory: true,
      quantity: randomInt(0, 500),
      categoryId: category._id,
      images: [
        { url: `https://picsum.photos/800/800?random=${i}`, alt: `Product ${i + 1}`, sortOrder: 0 }
      ],
      status: randomElement(['active', 'active', 'active', 'draft', 'archived']),
      isFeatured: Math.random() > 0.9,
      rating: parseFloat(randomFloat(3, 5)),
      reviewsCount: randomInt(0, 200),
      salesCount: randomInt(0, 500),
      viewsCount: randomInt(0, 2000)
    }));
  }
  console.log(`✅ Created ${products.length} products`);
  return products;
};

const seedOrders = async (users, products, stores) => {
  console.log('📦 Seeding orders...');
  const orders = [];
  for (let i = 0; i < 150; i++) {
    const user = randomElement(users);
    const numItems = randomInt(1, 4);
    const items = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = randomElement(products);
      const quantity = randomInt(1, 3);
      const price = product.price;
      const total = price * quantity;
      subtotal += total;
      
      items.push({
        productId: product._id,
        storeId: product.storeId,
        name: product.name,
        price,
        quantity,
        totalAmount: total,
        image: product.images[0]?.url
      });
    }
    
    const shipping = 9.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    orders.push(await Order.create({
      orderNumber: `ORD${String(i + 1).padStart(8, '0')}`,
      userId: user._id,
      items,
      subtotal,
      shipping,
      tax,
      total,
      status: randomElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      paymentMethod: randomElement(['card', 'paypal', 'wallet']),
      paymentStatus: randomElement(['paid', 'paid', 'pending', 'failed']),
      shippingAddress: {
        fullName: user.fullName,
        addressLine1: '123 Main St',
        city: randomElement(cities),
        state: 'CA',
        postalCode: '90210',
        country: randomElement(countries),
        phone: '+1234567890'
      }
    }));
  }
  console.log(`✅ Created ${orders.length} orders`);
  return orders;
};

const seedPayments = async (orders) => {
  console.log('💳 Seeding payments...');
  const payments = [];
  for (const order of orders) {
    if (order.paymentStatus === 'paid') {
      payments.push(await Payment.create({
        userId: order.userId,
        orderId: order._id,
        amount: order.total,
        currency: 'USD',
        paymentMethod: order.paymentMethod,
        status: 'completed',
        transactionId: `TXN${randomInt(100000000, 999999999)}`,
        provider: randomElement(['stripe', 'paypal', 'square'])
      }));
    }
  }
  console.log(`✅ Created ${payments.length} payments`);
  return payments;
};

const seedCoupons = async () => {
  console.log('🎟️  Seeding coupons...');
  const coupons = [];
  for (let i = 0; i < 20; i++) {
    coupons.push(await Coupon.create({
      code: `SAVE${randomInt(10, 50)}_${randomInt(100, 999)}`,
      type: randomElement(['percentage', 'fixed']),
      value: randomInt(5, 50),
      minPurchase: randomInt(20, 100),
      maxDiscount: randomInt(50, 200),
      usageLimit: randomInt(100, 1000),
      usageCount: randomInt(0, 500),
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: Math.random() > 0.2
    }));
  }
  console.log(`✅ Created ${coupons.length} coupons`);
  return coupons;
};

const seedGifts = async () => {
  console.log('🎁 Seeding gifts...');
  const gifts = [];
  const giftNames = ['Rose', 'Heart', 'Diamond', 'Crown', 'Rocket', 'Star', 'Medal', 'Trophy', 'Fire', 'Lightning'];
  for (let i = 0; i < giftNames.length; i++) {
    gifts.push(await Gift.create({
      name: giftNames[i],
      icon: `https://cdn.mixillo.com/gifts/${giftNames[i].toLowerCase()}.png`,
      price: randomInt(10, 1000),
      currency: 'coins',
      category: randomElement(['emotion', 'celebration', 'luxury', 'fun']),
      rarity: randomElement(['common', 'rare', 'epic', 'legendary']),
      isActive: true
    }));
  }
  console.log(`✅ Created ${gifts.length} gifts`);
  return gifts;
};

const seedLivestreams = async (users) => {
  console.log('📡 Seeding livestreams...');
  const livestreams = [];
  for (let i = 0; i < 30; i++) {
    const host = randomElement(users);
    const isLive = Math.random() > 0.7;
    const streamId = `stream_${Date.now()}_${randomInt(100000, 999999)}`;
    livestreams.push(await Livestream.create({
      hostId: host._id,
      title: `Live Stream ${i + 1}`,
      description: 'Join me live!',
      thumbnailUrl: `https://picsum.photos/640/360?random=${i + 200}`,
      streamId,
      provider: randomElement(['agora', 'zegocloud', 'webrtc']),
      streamKey: `key_${randomInt(100000, 999999)}`,
      status: isLive ? 'live' : randomElement(['ended', 'scheduled']),
      currentViewers: isLive ? randomInt(10, 5000) : 0,
      peakViewers: randomInt(100, 10000),
      totalGifts: randomInt(0, 500),
      totalRevenue: parseFloat(randomFloat(0, 5000)),
      startedAt: isLive ? new Date(Date.now() - randomInt(5, 180) * 60000) : null,
      endedAt: !isLive && Math.random() > 0.5 ? new Date() : null
    }));
  }
  console.log(`✅ Created ${livestreams.length} livestreams`);
  return livestreams;
};

const seedGiftTransactions = async (users, gifts, livestreams, contents) => {
  console.log('💝 Seeding gift transactions...');
  const transactions = [];
  for (let i = 0; i < 200; i++) {
    const sender = randomElement(users);
    const recipient = randomElement(users.filter(u => u._id.toString() !== sender._id.toString()));
    const gift = randomElement(gifts);
    const context = randomElement(['livestream', 'video', 'profile']);
    const quantity = randomInt(1, 5);
    const unitPrice = gift.price;
    const totalCost = unitPrice * quantity;
    const creatorEarnings = Math.floor(totalCost * 0.7);
    const platformFee = totalCost - creatorEarnings;
    
    const txData = {
      giftId: gift._id,
      senderId: sender._id,
      recipientId: recipient._id,
      quantity,
      unitPrice,
      totalCost,
      currency: 'coins',
      creatorEarnings,
      platformFee,
      context
    };
    
    if (context === 'livestream') {
      txData.livestreamId = randomElement(livestreams)._id;
    } else if (context === 'video') {
      txData.contentId = randomElement(contents)._id;
    }
    
    transactions.push(await GiftTransaction.create(txData));
  }
  console.log(`✅ Created ${transactions.length} gift transactions`);
  return transactions;
};

const seedCoinPackages = async () => {
  console.log('🪙 Seeding coin packages...');
  const packages = [];
  const amounts = [100, 500, 1000, 2500, 5000, 10000];
  for (const amount of amounts) {
    packages.push(await CoinPackage.create({
      name: `${amount} Coins`,
      coins: amount,
      price: amount * 0.01,
      bonus: amount >= 5000 ? Math.floor(amount * 0.1) : 0,
      isPopular: amount === 1000,
      isActive: true
    }));
  }
  console.log(`✅ Created ${packages.length} coin packages`);
  return packages;
};

const seedLevels = async () => {
  console.log('🎯 Seeding levels...');
  const levels = [];
  for (let i = 1; i <= 20; i++) {
    levels.push(await Level.create({
      level: i,
      name: `Level ${i}`,
      minXP: Math.pow(i, 2) * 100,
      maxXP: Math.pow(i + 1, 2) * 100,
      icon: `https://cdn.mixillo.com/levels/level-${i}.png`,
      color: `hsl(${i * 18}, 70%, 50%)`,
      rewards: {
        coins: i * 100,
        badges: i > 10 ? ['premium'] : []
      }
    }));
  }
  console.log(`✅ Created ${levels.length} levels`);
  return levels;
};

const seedTransactions = async (users, wallets) => {
  console.log('💸 Seeding transactions...');
  const transactions = [];
  for (let i = 0; i < 300; i++) {
    const user = randomElement(users);
    const wallet = wallets.find(w => w.userId.toString() === user._id.toString());
    const amount = parseFloat(randomFloat(5, 500));
    const type = randomElement(['purchase', 'gift_sent', 'gift_received', 'withdrawal', 'refund', 'earning', 'coin_purchase']);
    const isDebit = ['purchase', 'gift_sent', 'withdrawal'].includes(type);
    const balanceBefore = wallet.balance;
    const balanceAfter = isDebit ? balanceBefore - amount : balanceBefore + amount;
    
    transactions.push(await Transaction.create({
      userId: user._id,
      walletId: wallet._id,
      type,
      amount,
      currency: 'USD',
      description: randomElement(['Coin purchase', 'Gift sent', 'Withdrawal', 'Creator earnings', 'Product purchase', 'Refund']),
      status: randomElement(['completed', 'completed', 'completed', 'pending', 'failed']),
      balanceBefore,
      balanceAfter
    }));
  }
  console.log(`✅ Created ${transactions.length} transactions`);
  return transactions;
};

const seedNotifications = async (users) => {
  console.log('🔔 Seeding notifications...');
  const notifications = [];
  for (let i = 0; i < 200; i++) {
    const user = randomElement(users);
    notifications.push(await Notification.create({
      userId: user._id,
      type: randomElement(['like', 'comment', 'follow', 'gift', 'system']),
      title: randomElement(['New like!', 'New follower', 'New comment', 'Gift received', 'Order shipped']),
      body: randomElement(['Someone liked your video', 'You have a new follower', 'New comment on your post', 'You received a gift', 'Your order has been shipped']),
      isRead: Math.random() > 0.4
    }));
  }
  console.log(`✅ Created ${notifications.length} notifications`);
  return notifications;
};

const seedConversationsAndMessages = async (users) => {
  console.log('💬 Seeding conversations and messages...');
  const conversations = [];
  const messages = [];
  
  for (let i = 0; i < 50; i++) {
    const user1 = randomElement(users);
    const user2 = randomElement(users.filter(u => u._id.toString() !== user1._id.toString()));
    
    const conversation = await Conversation.create({
      participants: [user1._id, user2._id],
      lastMessage: 'Hey!',
      lastMessageAt: new Date()
    });
    conversations.push(conversation);
    
    // Add messages to conversation
    const numMessages = randomInt(5, 20);
    for (let j = 0; j < numMessages; j++) {
      messages.push(await Message.create({
        conversationId: conversation._id,
        senderId: Math.random() > 0.5 ? user1._id : user2._id,
        text: randomElement(['Hey!', 'How are you?', 'Great video!', 'Thanks!', 'See you later', 'Nice to meet you', 'What do you think?', 'Cool!', 'Awesome', 'Let me know']),
        isRead: Math.random() > 0.3
      }));
    }
  }
  
  console.log(`✅ Created ${conversations.length} conversations and ${messages.length} messages`);
  return { conversations, messages };
};

const seedReportsAndModeration = async (users, contents) => {
  console.log('⚠️  Seeding reports and moderation...');
  const reports = [];
  const moderationQueue = [];
  
  for (let i = 0; i < 30; i++) {
    const reporter = randomElement(users);
    const content = randomElement(contents);
    
    reports.push(await Report.create({
      reporterId: reporter._id,
      reportedType: 'content',
      reportedId: content._id,
      reportedUserId: content.userId,
      reason: randomElement(['spam', 'inappropriate', 'harassment', 'copyright', 'violence', 'hate_speech']),
      description: 'This content violates community guidelines',
      status: randomElement(['pending', 'under_review', 'resolved', 'dismissed'])
    }));
  }
  
  for (let i = 0; i < 20; i++) {
    const content = randomElement(contents);
    moderationQueue.push(await ModerationQueue.create({
      contentId: content._id,
      contentType: 'content',
      reportCount: randomInt(1, 5),
      reasons: [randomElement(['spam', 'inappropriate', 'harassment'])],
      priority: randomElement(['low', 'medium', 'high', 'urgent']),
      status: randomElement(['pending', 'in_review', 'approved', 'rejected'])
    }));
  }
  
  console.log(`✅ Created ${reports.length} reports and ${moderationQueue.length} moderation items`);
  return { reports, moderationQueue };
};

const seedBannersAndFeatured = async (users, contents, products) => {
  console.log('🎨 Seeding banners and featured...');
  const banners = [];
  const featured = [];
  
  for (let i = 0; i < 10; i++) {
    banners.push(await Banner.create({
      title: `Banner ${i + 1}`,
      imageUrl: `https://picsum.photos/1200/400?random=${i + 300}`,
      link: '/explore',
      position: randomElement(['home', 'explore', 'shop']),
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      priority: randomInt(1, 10)
    }));
  }
  
  for (let i = 0; i < 20; i++) {
    const itemType = randomElement(['content', 'user', 'product']);
    let itemId;
    if (itemType === 'content') itemId = randomElement(contents)._id;
    else if (itemType === 'product') itemId = randomElement(products)._id;
    else itemId = randomElement(users)._id;
    
    featured.push(await Featured.create({
      type: itemType,
      itemId,
      position: randomElement(['homepage', 'explore', 'trending', 'shop']),
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      priority: randomInt(1, 100)
    }));
  }
  
  console.log(`✅ Created ${banners.length} banners and ${featured.length} featured items`);
  return { banners, featured };
};

const seedAnalytics = async (users, contents) => {
  console.log('📊 Seeding analytics...');
  const analytics = [];
  for (let i = 0; i < 100; i++) {
    const user = randomElement(users);
    const content = Math.random() > 0.5 ? randomElement(contents) : null;
    const type = randomElement(['content_view', 'profile_view', 'search', 'click', 'impression', 'engagement']);
    
    analytics.push(await Analytics.create({
      userId: user._id,
      contentId: content?._id,
      type,
      event: randomElement(['view', 'like', 'comment', 'share', 'profile_view', 'follow', 'purchase']),
      date: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      device: randomElement(['ios', 'android', 'web', 'other']),
      metrics: {
        duration: randomInt(10, 300),
        source: randomElement(['feed', 'search', 'profile', 'trending'])
      }
    }));
  }
  console.log(`✅ Created ${analytics.length} analytics events`);
  return analytics;
};

const seedSystemData = async () => {
  console.log('⚙️  Seeding system data...');
  
  // System Settings
  await SystemSettings.create([
    { category: 'general', key: 'maintenanceMode', value: false, description: 'Enable maintenance mode' },
    { category: 'general', key: 'allowRegistration', value: true, description: 'Allow new user registration' },
    { category: 'general', key: 'allowUploads', value: true, description: 'Allow video uploads' },
    { category: 'general', key: 'minAppVersion', value: '1.0.0', description: 'Minimum app version' },
    { category: 'storage', key: 'maxUploadSize', value: 100, description: 'Max upload size in MB' },
    { category: 'general', key: 'supportEmail', value: 'support@mixillo.com', description: 'Support email' },
    { category: 'general', key: 'termsUrl', value: 'https://mixillo.com/terms', description: 'Terms URL' },
    { category: 'general', key: 'privacyUrl', value: 'https://mixillo.com/privacy', description: 'Privacy policy URL' }
  ]);
  
  // Currencies
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD'];
  for (const code of currencies) {
    await Currency.create({
      code,
      name: code,
      symbol: code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : code === 'JPY' ? '¥' : '$',
      exchangeRate: 1.0,
      isActive: true
    });
  }
  
  // Languages
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' }
  ];
  for (const lang of languages) {
    await Language.create({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      isActive: true
    });
  }
  
  console.log('✅ Created system data');
};

// Main seed function
const seedAll = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    console.log('\n🌱 Starting full platform seed...\n');
    
    const users = await seedUsers(200);
    const wallets = await seedWallets(users);
    await seedFollows(users);
    const categories = await seedCategories();
    const tags = await seedTags();
    const sounds = await seedSounds(users);
    const contents = await seedContent(users, sounds, tags);
    await seedEngagement(users, contents);
    const stores = await seedStores(users);
    const products = await seedProducts(stores, categories);
    const orders = await seedOrders(users, products, stores);
    await seedPayments(orders);
    await seedCoupons();
    const gifts = await seedGifts();
    const livestreams = await seedLivestreams(users);
    await seedGiftTransactions(users, gifts, livestreams, contents);
    await seedCoinPackages();
    await seedLevels();
    await seedTransactions(users, wallets);
    await seedNotifications(users);
    await seedConversationsAndMessages(users);
    await seedReportsAndModeration(users, contents);
    await seedBannersAndFeatured(users, contents, products);
    await seedAnalytics(users, contents);
    await seedSystemData();
    
    console.log('\n✅ SEED COMPLETE! All data created successfully.');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Content: ${contents.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Livestreams: ${livestreams.length}`);
    console.log(`   And much more...`);
    console.log('\n🔑 Admin Login: admin@mixillo.com / Test@123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

// Run
seedAll();
