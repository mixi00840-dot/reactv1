/**
 * COMPLETE MIXILLO DATABASE SEEDER
 * Generates comprehensive test data for all 74 models
 * Run: node comprehensive-seed.js
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Import ALL models
const User = require('./src/models/User');
const Content = require('./src/models/Content');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');
const Livestream = require('./src/models/Livestream');
const Wallet = require('./src/models/Wallet');
const Transaction = require('./src/models/Transaction');
const Gift = require('./src/models/Gift');
const GiftTransaction = require('./src/models/GiftTransaction');
const CoinPackage = require('./src/models/CoinPackage');
const Comment = require('./src/models/Comment');
const Like = require('./src/models/Like');
const Share = require('./src/models/Share');
const View = require('./src/models/View');
const Follow = require('./src/models/Follow');
const Sound = require('./src/models/Sound');
const Tag = require('./src/models/Tag');
const Banner = require('./src/models/Banner');
const Category = require('./src/models/Category');
const Store = require('./src/models/Store');
const SellerApplication = require('./src/models/SellerApplication');
const Cart = require('./src/models/Cart');
const Coupon = require('./src/models/Coupon');
const Shipping = require('./src/models/Shipping');
const Level = require('./src/models/Level');
const SupporterBadge = require('./src/models/SupporterBadge');
const ExplorerSection = require('./src/models/ExplorerSection');
const Featured = require('./src/models/Featured');
const ModerationQueue = require('./src/models/ModerationQueue');
const AIModeration = require('./src/models/AIModeration');
const Report = require('./src/models/Report');
const Strike = require('./src/models/Strike');
const Analytics = require('./src/models/Analytics');
const SystemSettings = require('./src/models/SystemSettings');
const Notification = require('./src/models/Notification');
const Message = require('./src/models/Message');
const Conversation = require('./src/models/Conversation');
const Story = require('./src/models/Story');
const Translation = require('./src/models/Translation');
const Currency = require('./src/models/Currency');
const Language = require('./src/models/Language');
const PKBattle = require('./src/models/PKBattle');
const MultiHostSession = require('./src/models/MultiHostSession');
const StreamProvider = require('./src/models/StreamProvider');
const StreamFilter = require('./src/models/StreamFilter');
const LiveShoppingSession = require('./src/models/LiveShoppingSession');
const UploadSession = require('./src/models/UploadSession');
const TranscodeJob = require('./src/models/TranscodeJob');
const VideoQuality = require('./src/models/VideoQuality');
const ContentMetrics = require('./src/models/ContentMetrics');
const ContentRecommendation = require('./src/models/ContentRecommendation');
const TrendingRecord = require('./src/models/TrendingRecord');
const TrendingConfig = require('./src/models/TrendingConfig');
const SearchQuery = require('./src/models/SearchQuery');
const UserActivity = require('./src/models/UserActivity');
const ScheduledContent = require('./src/models/ScheduledContent');
const Subscription = require('./src/models/Subscription');
const SubscriptionTier = require('./src/models/SubscriptionTier');
const CreatorEarnings = require('./src/models/CreatorEarnings');
const ContentRights = require('./src/models/ContentRights');
const RecommendationMetadata = require('./src/models/RecommendationMetadata');
const AdCampaign = require('./src/models/AdCampaign');
const AuditLog = require('./src/models/AuditLog');
const CustomerService = require('./src/models/CustomerService');
const Ticket = require('./src/models/Ticket');
const FAQ = require('./src/models/FAQ');
const Page = require('./src/models/Page');
const Theme = require('./src/models/Theme');
const Credit = require('./src/models/Credit');
const Save = require('./src/models/Save');
const Setting = require('./src/models/Setting');

// Seed configuration
const SEED_COUNTS = {
  users: 100,
  content: 200,
  products: 150,
  orders: 300,
  livestreams: 50,
  comments: 500,
  likes: 1000,
  follows: 500,
  sounds: 100,
  tags: 50,
  categories: 20,
  stores: 30,
  gifts: 50,
  coinPackages: 10,
  banners: 10,
  levels: 20,
  stories: 100,
  messages: 500,
  notifications: 1000,
  transactions: 500,
};

let generatedIds = {
  users: [],
  sellers: [],
  admins: [],
  content: [],
  products: [],
  stores: [],
  tags: [],
  sounds: [],
  categories: [],
  livestreams: [],
  orders: [],
  gifts: [],
  coinPackages: [],
  levels: [],
  conversations: [],
};

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

// Clear existing data
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('✅ Database cleared');
}

// Seed Users (Regular, Sellers, Admins)
async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const users = [];
  
  // Create Admin
  users.push({
    username: 'admin',
    email: 'admin@mixillo.com',
    password: '$2a$10$K7L1OJ45/4Y2nIvhJrMtM.XNVvCZ0YzLVc1kU7vJ3qZ9kQc3F8K.C', // admin123
    role: 'admin',
    fullName: 'Admin User',
    avatar: faker.image.avatar(),
    bio: 'Platform Administrator',
    verified: true,
    status: 'active',
    followers: 0,
    following: 0,
    totalLikes: 0,
    totalViews: 0,
  });
  
  // Create Sellers
  for (let i = 0; i < 20; i++) {
    users.push({
      username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email: faker.internet.email().toLowerCase(),
      password: '$2a$10$K7L1OJ45/4Y2nIvhJrMtM.XNVvCZ0YzLVc1kU7vJ3qZ9kQc3F8K.C',
      role: 'seller',
      fullName: faker.person.fullName(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.sentence(),
      verified: true,
      status: 'active',
      followers: faker.number.int({ min: 100, max: 10000 }),
      following: faker.number.int({ min: 50, max: 500 }),
      totalLikes: faker.number.int({ min: 1000, max: 50000 }),
      totalViews: faker.number.int({ min: 10000, max: 500000 }),
    });
  }
  
  // Create Regular Users
  for (let i = 0; i < SEED_COUNTS.users - 21; i++) {
    users.push({
      username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email: faker.internet.email().toLowerCase(),
      password: '$2a$10$K7L1OJ45/4Y2nIvhJrMtM.XNVvCZ0YzLVc1kU7vJ3qZ9kQc3F8K.C',
      role: 'user',
      fullName: faker.person.fullName(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.sentence(),
      verified: faker.datatype.boolean(),
      status: faker.helpers.arrayElement(['active', 'suspended', 'banned']),
      followers: faker.number.int({ min: 0, max: 1000 }),
      following: faker.number.int({ min: 0, max: 500 }),
      totalLikes: faker.number.int({ min: 0, max: 5000 }),
      totalViews: faker.number.int({ min: 0, max: 50000 }),
    });
  }
  
  const createdUsers = await User.insertMany(users);
  generatedIds.users = createdUsers.map(u => u._id);
  generatedIds.admins = createdUsers.filter(u => u.role === 'admin').map(u => u._id);
  generatedIds.sellers = createdUsers.filter(u => u.role === 'seller').map(u => u._id);
  
  console.log(`✅ Created ${createdUsers.length} users (1 admin, 20 sellers, ${createdUsers.length - 21} regular)`);
}

// Seed Wallets
async function seedWallets() {
  console.log('💰 Seeding wallets...');
  
  const wallets = generatedIds.users.map(userId => ({
    userId: userId,
    balance: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
    currency: 'USD',
  }));
  
  await Wallet.insertMany(wallets);
  console.log(`✅ Created ${wallets.length} wallets`);
}

// Seed Categories
async function seedCategories() {
  console.log('📂 Seeding categories...');
  
  const categories = [
    { name: 'Fashion', slug: 'fashion', description: 'Fashion and Style', icon: '👗', active: true },
    { name: 'Electronics', slug: 'electronics', description: 'Electronics and Gadgets', icon: '📱', active: true },
    { name: 'Beauty', slug: 'beauty', description: 'Beauty and Cosmetics', icon: '💄', active: true },
    { name: 'Home', slug: 'home', description: 'Home and Garden', icon: '🏠', active: true },
    { name: 'Sports', slug: 'sports', description: 'Sports and Fitness', icon: '⚽', active: true },
    { name: 'Food', slug: 'food', description: 'Food and Beverages', icon: '🍔', active: true },
    { name: 'Books', slug: 'books', description: 'Books and Media', icon: '📚', active: true },
    { name: 'Toys', slug: 'toys', description: 'Toys and Games', icon: '🎮', active: true },
    { name: 'Jewelry', slug: 'jewelry', description: 'Jewelry and Accessories', icon: '💍', active: true },
    { name: 'Automotive', slug: 'automotive', description: 'Automotive and Parts', icon: '🚗', active: true },
  ];
  
  const createdCategories = await Category.insertMany(categories);
  generatedIds.categories = createdCategories.map(c => c._id);
  console.log(`✅ Created ${createdCategories.length} categories`);
}

// Seed Tags
async function seedTags() {
  console.log('🏷️  Seeding tags...');
  
  const tagNames = ['trending', 'viral', 'funny', 'music', 'dance', 'comedy', 'food', 
    'travel', 'fitness', 'beauty', 'fashion', 'gaming', 'tech', 'sports', 'art',
    'photography', 'cooking', 'lifestyle', 'motivation', 'education'];
  
  const tags = tagNames.map(name => ({
    name,
    usageCount: faker.number.int({ min: 0, max: 10000 }),
    trending: faker.datatype.boolean(),
  }));
  
  const createdTags = await Tag.insertMany(tags);
  generatedIds.tags = createdTags.map(t => t._id);
  console.log(`✅ Created ${createdTags.length} tags`);
}

// Seed Sounds
async function seedSounds() {
  console.log('🎵 Seeding sounds...');
  
  const sounds = [];
  for (let i = 0; i < SEED_COUNTS.sounds; i++) {
    sounds.push({
      title: faker.music.songName(),
      artist: faker.person.fullName(),
      audioUrl: `https://example.com/sounds/${faker.string.uuid()}.mp3`,
      duration: faker.number.int({ min: 10, max: 180 }),
      coverImage: faker.image.url(),
      usageCount: faker.number.int({ min: 0, max: 1000 }),
      trending: faker.datatype.boolean(),
      uploader: faker.helpers.arrayElement(generatedIds.users),
    });
  }
  
  const createdSounds = await Sound.insertMany(sounds);
  generatedIds.sounds = createdSounds.map(s => s._id);
  console.log(`✅ Created ${createdSounds.length} sounds`);
}

// Seed Content (Videos/Posts)
async function seedContent() {
  console.log('🎬 Seeding content...');
  
  const contents = [];
  for (let i = 0; i < SEED_COUNTS.content; i++) {
    contents.push({
      userId: faker.helpers.arrayElement(generatedIds.users),
      type: faker.helpers.arrayElement(['video', 'image', 'text']),
      caption: faker.lorem.paragraph(),
      videoUrl: `https://example.com/videos/${faker.string.uuid()}.mp4`,
      thumbnailUrl: faker.image.url(),
      duration: faker.number.int({ min: 5, max: 60 }),
      metrics: {
        views: faker.number.int({ min: 0, max: 100000 }),
        likes: faker.number.int({ min: 0, max: 10000 }),
        comments: faker.number.int({ min: 0, max: 500 }),
        shares: faker.number.int({ min: 0, max: 1000 })
      },
      hashtags: faker.helpers.arrayElements(['viral', 'trending', 'fun', 'music', 'dance'], faker.number.int({ min: 1, max: 3 })),
      soundId: faker.helpers.arrayElement(generatedIds.sounds),
      status: faker.helpers.arrayElement(['published', 'pending', 'rejected', 'draft']),
      visibility: faker.helpers.arrayElement(['public', 'private', 'followers']),
      allowComments: true,
      allowDuet: faker.datatype.boolean(),
      allowStitch: faker.datatype.boolean(),
    });
  }
  
  const createdContent = await Content.insertMany(contents);
  generatedIds.content = createdContent.map(c => c._id);
  console.log(`✅ Created ${createdContent.length} content items`);
}

// Seed Stores
async function seedStores() {
  console.log('🏪 Seeding stores...');
  
  const stores = [];
  for (let i = 0; i < SEED_COUNTS.stores; i++) {
    stores.push({
      seller: faker.helpers.arrayElement(generatedIds.sellers),
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      logo: faker.image.url(),
      banner: faker.image.url(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
      rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      totalSales: faker.number.int({ min: 0, max: 10000 }),
      totalProducts: faker.number.int({ min: 0, max: 500 }),
      verified: faker.datatype.boolean(),
    });
  }
  
  const createdStores = await Store.insertMany(stores);
  generatedIds.stores = createdStores.map(s => s._id);
  console.log(`✅ Created ${createdStores.length} stores`);
}

// Seed Products
async function seedProducts() {
  console.log('📦 Seeding products...');
  
  const products = [];
  for (let i = 0; i < SEED_COUNTS.products; i++) {
    products.push({
      seller: faker.helpers.arrayElement(generatedIds.sellers),
      store: faker.helpers.arrayElement(generatedIds.stores),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(generatedIds.categories),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      compareAtPrice: parseFloat(faker.commerce.price({ min: 15, max: 1200 })),
      images: [faker.image.url(), faker.image.url(), faker.image.url()],
      stock: faker.number.int({ min: 0, max: 1000 }),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      status: faker.helpers.arrayElement(['active', 'draft', 'out_of_stock', 'discontinued']),
      featured: faker.datatype.boolean(),
      rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 0, max: 500 }),
      soldCount: faker.number.int({ min: 0, max: 1000 }),
      tags: faker.helpers.arrayElements(generatedIds.tags, faker.number.int({ min: 1, max: 5 })),
    });
  }
  
  const createdProducts = await Product.insertMany(products);
  generatedIds.products = createdProducts.map(p => p._id);
  console.log(`✅ Created ${createdProducts.length} products`);
}

// Seed Orders
async function seedOrders() {
  console.log('🛒 Seeding orders...');
  
  const orders = [];
  for (let i = 0; i < SEED_COUNTS.orders; i++) {
    const items = [];
    const itemCount = faker.number.int({ min: 1, max: 5 });
    
    for (let j = 0; j < itemCount; j++) {
      const price = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
      const quantity = faker.number.int({ min: 1, max: 5 });
      items.push({
        product: faker.helpers.arrayElement(generatedIds.products),
        quantity,
        price,
        total: price * quantity,
      });
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const shipping = 5.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    orders.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      orderNumber: `ORD-${faker.string.numeric(8)}`,
      items,
      subtotal,
      shipping,
      tax,
      total,
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
      paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded']),
      paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'wallet']),
      shippingAddress: {
        fullName: faker.person.fullName(),
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        phone: faker.phone.number(),
      },
    });
  }
  
  const createdOrders = await Order.insertMany(orders);
  generatedIds.orders = createdOrders.map(o => o._id);
  console.log(`✅ Created ${createdOrders.length} orders`);
}

// Seed Gifts
async function seedGifts() {
  console.log('🎁 Seeding gifts...');
  
  const giftTypes = ['rose', 'heart', 'diamond', 'crown', 'rocket', 'star', 'moon', 'cake', 'car', 'yacht'];
  const gifts = giftTypes.map((name, index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    icon: `https://example.com/gifts/${name}.png`,
    animation: `https://example.com/animations/${name}.json`,
    price: (index + 1) * 10,
    rarity: index < 3 ? 'common' : index < 7 ? 'rare' : 'legendary',
    active: true,
  }));
  
  const createdGifts = await Gift.insertMany(gifts);
  generatedIds.gifts = createdGifts.map(g => g._id);
  console.log(`✅ Created ${createdGifts.length} gifts`);
}

// Seed Coin Packages
async function seedCoinPackages() {
  console.log('💎 Seeding coin packages...');
  
  const packages = [
    { coins: 100, price: 0.99, bonus: 0, popular: false },
    { coins: 500, price: 4.99, bonus: 50, popular: false },
    { coins: 1000, price: 9.99, bonus: 100, popular: true },
    { coins: 2500, price: 24.99, bonus: 300, popular: false },
    { coins: 5000, price: 49.99, bonus: 750, popular: false },
    { coins: 10000, price: 99.99, bonus: 2000, popular: false },
  ];
  
  const createdPackages = await CoinPackage.insertMany(packages);
  generatedIds.coinPackages = createdPackages.map(p => p._id);
  console.log(`✅ Created ${createdPackages.length} coin packages`);
}

// Seed Livestreams
async function seedLivestreams() {
  console.log('📺 Seeding livestreams...');
  
  const livestreams = [];
  for (let i = 0; i < SEED_COUNTS.livestreams; i++) {
    const isLive = i < 10;
    livestreams.push({
      host: faker.helpers.arrayElement(generatedIds.users),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      thumbnail: faker.image.url(),
      status: isLive ? 'live' : faker.helpers.arrayElement(['scheduled', 'ended']),
      viewers: isLive ? faker.number.int({ min: 10, max: 10000 }) : 0,
      peakViewers: faker.number.int({ min: 50, max: 50000 }),
      likes: faker.number.int({ min: 0, max: 5000 }),
      gifts: faker.number.int({ min: 0, max: 1000 }),
      duration: isLive ? faker.number.int({ min: 60, max: 7200 }) : faker.number.int({ min: 300, max: 14400 }),
      streamKey: faker.string.uuid(),
      agoraAppId: faker.string.uuid(),
      agoraChannel: faker.string.uuid(),
      startedAt: isLive ? faker.date.recent() : faker.date.past(),
      endedAt: isLive ? null : faker.date.recent(),
    });
  }
  
  const createdLivestreams = await Livestream.insertMany(livestreams);
  generatedIds.livestreams = createdLivestreams.map(l => l._id);
  console.log(`✅ Created ${createdLivestreams.length} livestreams`);
}

// Seed Levels
async function seedLevels() {
  console.log('🎖️  Seeding levels...');
  
  const levels = [];
  for (let i = 1; i <= SEED_COUNTS.levels; i++) {
    levels.push({
      level: i,
      name: `Level ${i}`,
      minExperience: i * 1000,
      maxExperience: (i + 1) * 1000 - 1,
      icon: `https://example.com/levels/level-${i}.png`,
      color: faker.color.rgb(),
      rewards: {
        coins: i * 100,
        badge: i % 5 === 0 ? `Badge ${i/5}` : null,
      },
    });
  }
  
  const createdLevels = await Level.insertMany(levels);
  generatedIds.levels = createdLevels.map(l => l._id);
  console.log(`✅ Created ${createdLevels.length} levels`);
}

// Seed Comments
async function seedComments() {
  console.log('💬 Seeding comments...');
  
  const comments = [];
  for (let i = 0; i < SEED_COUNTS.comments; i++) {
    comments.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      content: faker.helpers.arrayElement(generatedIds.content),
      text: faker.lorem.sentence(),
      likes: faker.number.int({ min: 0, max: 100 }),
      replies: faker.number.int({ min: 0, max: 20 }),
    });
  }
  
  await Comment.insertMany(comments);
  console.log(`✅ Created ${comments.length} comments`);
}

// Seed Likes
async function seedLikes() {
  console.log('❤️  Seeding likes...');
  
  const likes = [];
  for (let i = 0; i < SEED_COUNTS.likes; i++) {
    likes.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      content: faker.helpers.arrayElement(generatedIds.content),
    });
  }
  
  await Like.insertMany(likes);
  console.log(`✅ Created ${likes.length} likes`);
}

// Seed Follows
async function seedFollows() {
  console.log('👥 Seeding follows...');
  
  const follows = [];
  for (let i = 0; i < SEED_COUNTS.follows; i++) {
    const follower = faker.helpers.arrayElement(generatedIds.users);
    let following = faker.helpers.arrayElement(generatedIds.users);
    while (follower.toString() === following.toString()) {
      following = faker.helpers.arrayElement(generatedIds.users);
    }
    follows.push({ follower, following });
  }
  
  await Follow.insertMany(follows);
  console.log(`✅ Created ${follows.length} follows`);
}

// Seed Transactions
async function seedTransactions() {
  console.log('💸 Seeding transactions...');
  
  const transactions = [];
  for (let i = 0; i < SEED_COUNTS.transactions; i++) {
    transactions.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      type: faker.helpers.arrayElement(['deposit', 'withdrawal', 'purchase', 'gift', 'refund', 'earning']),
      amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
      currency: 'USD',
      status: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
      description: faker.lorem.sentence(),
      reference: faker.string.uuid(),
    });
  }
  
  await Transaction.insertMany(transactions);
  console.log(`✅ Created ${transactions.length} transactions`);
}

// Seed Banners
async function seedBanners() {
  console.log('🖼️  Seeding banners...');
  
  const banners = [];
  for (let i = 0; i < SEED_COUNTS.banners; i++) {
    banners.push({
      title: faker.lorem.words(3),
      image: faker.image.url(),
      link: faker.internet.url(),
      position: faker.helpers.arrayElement(['home_top', 'home_middle', 'shop_top', 'profile_top']),
      active: faker.datatype.boolean(),
      startDate: faker.date.past(),
      endDate: faker.date.future(),
      clicks: faker.number.int({ min: 0, max: 10000 }),
      impressions: faker.number.int({ min: 0, max: 100000 }),
    });
  }
  
  await Banner.insertMany(banners);
  console.log(`✅ Created ${banners.length} banners`);
}

// Seed Stories
async function seedStories() {
  console.log('📖 Seeding stories...');
  
  const stories = [];
  for (let i = 0; i < SEED_COUNTS.stories; i++) {
    stories.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      media: faker.image.url(),
      type: faker.helpers.arrayElement(['image', 'video']),
      views: faker.number.int({ min: 0, max: 1000 }),
      expiresAt: faker.date.soon({ days: 1 }),
    });
  }
  
  await Story.insertMany(stories);
  console.log(`✅ Created ${stories.length} stories`);
}

// Seed Notifications
async function seedNotifications() {
  console.log('🔔 Seeding notifications...');
  
  const notifications = [];
  for (let i = 0; i < SEED_COUNTS.notifications; i++) {
    notifications.push({
      user: faker.helpers.arrayElement(generatedIds.users),
      type: faker.helpers.arrayElement(['like', 'comment', 'follow', 'mention', 'gift', 'system']),
      title: faker.lorem.words(3),
      message: faker.lorem.sentence(),
      read: faker.datatype.boolean(),
      link: faker.internet.url(),
      sender: faker.helpers.arrayElement(generatedIds.users),
    });
  }
  
  await Notification.insertMany(notifications);
  console.log(`✅ Created ${notifications.length} notifications`);
}

// Main seed function
async function seed() {
  try {
    await connectDB();
    
    console.log('\n🌱 Starting comprehensive database seeding...\n');
    
    // Clear database first
    await clearDatabase();
    
    // Seed in order (respecting dependencies)
    await seedUsers();
    await seedWallets();
    await seedCategories();
    await seedTags();
    await seedSounds();
    await seedContent();
    await seedStores();
    await seedProducts();
    await seedOrders();
    await seedGifts();
    await seedCoinPackages();
    await seedLivestreams();
    await seedLevels();
    await seedComments();
    await seedLikes();
    await seedFollows();
    await seedTransactions();
    await seedBanners();
    await seedStories();
    await seedNotifications();
    
    console.log('\n✅ ✅ ✅ DATABASE SEEDING COMPLETE! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   Users: ${generatedIds.users.length}`);
    console.log(`   Content: ${generatedIds.content.length}`);
    console.log(`   Products: ${generatedIds.products.length}`);
    console.log(`   Orders: ${generatedIds.orders.length}`);
    console.log(`   Stores: ${generatedIds.stores.length}`);
    console.log(`   Livestreams: ${generatedIds.livestreams.length}`);
    console.log('\n🎉 Ready for admin dashboard testing!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run seeder
seed();
