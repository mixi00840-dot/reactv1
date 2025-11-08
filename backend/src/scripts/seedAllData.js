require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('../models/User');
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Sound = require('../models/Sound');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Gift = require('../models/Gift');
const Currency = require('../models/Currency');
const Setting = require('../models/Setting');

async function seedAllData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. SEED CURRENCIES
    console.log('💰 Seeding Currencies...');
    await Currency.deleteMany({});
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.00, isDefault: true, isActive: true, decimalPlaces: 2, country: 'United States', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isActive: true, decimalPlaces: 2, country: 'European Union', flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, isActive: true, decimalPlaces: 2, country: 'United Kingdom', flag: '🇬🇧' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', exchangeRate: 3.75, isActive: true, decimalPlaces: 2, country: 'Saudi Arabia', flag: '🇸🇦' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67, isActive: true, decimalPlaces: 2, country: 'UAE', flag: '🇦🇪' }
    ];
    const createdCurrencies = await Currency.insertMany(currencies);
    console.log(`✅ Created ${createdCurrencies.length} currencies\n`);

    // 2. SEED USERS
    console.log('👥 Seeding Users...');
    await User.deleteMany({});
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        username: 'admin',
        email: 'admin@mixillo.com',
        password: hashedPassword,
        fullName: 'Admin User',
        role: 'admin',
        isVerified: true,
        emailVerified: true,
        profilePicture: 'https://i.pravatar.cc/150?img=1',
        bio: 'Platform Administrator',
        followers: [],
        following: []
      },
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        fullName: 'John Doe',
        role: 'user',
        isVerified: true,
        emailVerified: true,
        profilePicture: 'https://i.pravatar.cc/150?img=12',
        bio: 'Content creator and TikTok enthusiast',
        followers: [],
        following: []
      },
      {
        username: 'sarahsmith',
        email: 'sarah@example.com',
        password: hashedPassword,
        fullName: 'Sarah Smith',
        role: 'creator',
        isVerified: true,
        emailVerified: true,
        profilePicture: 'https://i.pravatar.cc/150?img=5',
        bio: 'Dance & Music | Follow for daily content',
        followers: [],
        following: []
      },
      {
        username: 'miketech',
        email: 'mike@example.com',
        password: hashedPassword,
        fullName: 'Mike Technology',
        role: 'user',
        isVerified: true,
        emailVerified: true,
        profilePicture: 'https://i.pravatar.cc/150?img=33',
        bio: 'Tech reviews and tutorials',
        followers: [],
        following: []
      },
      {
        username: 'emilyfashion',
        email: 'emily@example.com',
        password: hashedPassword,
        fullName: 'Emily Fashion',
        role: 'seller',
        isVerified: true,
        emailVerified: true,
        profilePicture: 'https://i.pravatar.cc/150?img=47',
        bio: 'Fashion & Style | Shop my store',
        followers: [],
        following: []
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // 3. SEED CATEGORIES
    console.log('📁 Seeding Categories...');
    await Category.deleteMany({});
    const categories = [
      { name: 'Entertainment', slug: 'entertainment', description: 'Fun and entertaining content', icon: '🎭', isActive: true },
      { name: 'Education', slug: 'education', description: 'Educational and informative content', icon: '📚', isActive: true },
      { name: 'Music', slug: 'music', description: 'Music videos and performances', icon: '🎵', isActive: true },
      { name: 'Dance', slug: 'dance', description: 'Dance challenges and performances', icon: '💃', isActive: true },
      { name: 'Comedy', slug: 'comedy', description: 'Funny and comedy content', icon: '😂', isActive: true },
      { name: 'Tech', slug: 'tech', description: 'Technology reviews and tutorials', icon: '💻', isActive: true },
      { name: 'Fashion', slug: 'fashion', description: 'Fashion and style content', icon: '👗', isActive: true },
      { name: 'Food', slug: 'food', description: 'Cooking and food content', icon: '🍔', isActive: true },
      { name: 'Sports', slug: 'sports', description: 'Sports and fitness content', icon: '⚽', isActive: true },
      { name: 'Gaming', slug: 'gaming', description: 'Gaming content and streams', icon: '🎮', isActive: true }
    ];
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories\n`);

    // 4. SEED SOUNDS
    console.log('🎵 Seeding Sounds...');
    await Sound.deleteMany({});
    const sounds = [
      {
        title: 'Upbeat Dance Track',
        artist: 'DJ MixMaster',
        duration: 180,
        fileUrl: 'https://example.com/sounds/dance-track.mp3',
        coverImage: 'https://picsum.photos/300/300?random=1',
        uploadedBy: createdUsers[0]._id,
        category: 'dance',
        isOriginal: true,
        isActive: true
      },
      {
        title: 'Chill Vibes',
        artist: 'Relaxation Station',
        duration: 240,
        fileUrl: 'https://example.com/sounds/chill-vibes.mp3',
        coverImage: 'https://picsum.photos/300/300?random=2',
        uploadedBy: createdUsers[1]._id,
        category: 'music',
        isOriginal: true,
        isActive: true
      },
      {
        title: 'Comedy Effect',
        artist: 'Sound Effects Library',
        duration: 15,
        fileUrl: 'https://example.com/sounds/comedy-effect.mp3',
        coverImage: 'https://picsum.photos/300/300?random=3',
        uploadedBy: createdUsers[0]._id,
        category: 'comedy',
        isOriginal: false,
        isActive: true
      }
    ];
    const createdSounds = await Sound.insertMany(sounds);
    console.log(`✅ Created ${createdSounds.length} sounds\n`);

    // 5. SEED CONTENT (Videos)
    console.log('🎬 Seeding Content...');
    await Content.deleteMany({});
    const contents = [
      {
        creator: createdUsers[1]._id,
        caption: 'Check out this amazing dance move! 💃 #dance #trending',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnailUrl: 'https://picsum.photos/400/600?random=10',
        duration: 15,
        category: createdCategories.find(c => c.slug === 'dance')?._id,
        sound: createdSounds[0]?._id,
        views: 15420,
        likes: 1234,
        shares: 89,
        comments: 156,
        hashtags: ['dance', 'trending', 'viral'],
        isPublic: true,
        allowComments: true,
        allowDuet: true,
        allowStitch: true
      },
      {
        creator: createdUsers[2]._id,
        caption: 'New music cover! Let me know what you think 🎵',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4',
        thumbnailUrl: 'https://picsum.photos/400/600?random=11',
        duration: 30,
        category: createdCategories.find(c => c.slug === 'music')?._id,
        sound: createdSounds[1]?._id,
        views: 8932,
        likes: 567,
        shares: 34,
        comments: 78,
        hashtags: ['music', 'cover', 'singing'],
        isPublic: true,
        allowComments: true,
        allowDuet: true,
        allowStitch: false
      },
      {
        creator: createdUsers[3]._id,
        caption: 'Quick tech tip of the day! 💻 #tech #tutorial',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnailUrl: 'https://picsum.photos/400/600?random=12',
        duration: 25,
        category: createdCategories.find(c => c.slug === 'tech')?._id,
        views: 12456,
        likes: 892,
        shares: 67,
        comments: 123,
        hashtags: ['tech', 'tutorial', 'tips'],
        isPublic: true,
        allowComments: true,
        allowDuet: false,
        allowStitch: true
      },
      {
        creator: createdUsers[4]._id,
        caption: 'Today\'s outfit inspiration ✨ #fashion #style',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4',
        thumbnailUrl: 'https://picsum.photos/400/600?random=13',
        duration: 20,
        category: createdCategories.find(c => c.slug === 'fashion')?._id,
        views: 23567,
        likes: 2134,
        shares: 234,
        comments: 345,
        hashtags: ['fashion', 'style', 'ootd'],
        isPublic: true,
        allowComments: true,
        allowDuet: true,
        allowStitch: true
      }
    ];
    const createdContents = await Content.insertMany(contents);
    console.log(`✅ Created ${createdContents.length} content items\n`);

    // 6. SEED COMMENTS
    console.log('💬 Seeding Comments...');
    await Comment.deleteMany({});
    const comments = [
      {
        content: createdContents[0]._id,
        user: createdUsers[2]._id,
        text: 'This is amazing! Love your moves! 🔥',
        likes: 45
      },
      {
        content: createdContents[0]._id,
        user: createdUsers[3]._id,
        text: 'Can you make a tutorial for this?',
        likes: 23
      },
      {
        content: createdContents[1]._id,
        user: createdUsers[1]._id,
        text: 'Beautiful voice! Keep it up! ❤️',
        likes: 67
      },
      {
        content: createdContents[2]._id,
        user: createdUsers[4]._id,
        text: 'Super helpful, thanks for sharing!',
        likes: 34
      },
      {
        content: createdContents[3]._id,
        user: createdUsers[1]._id,
        text: 'Where did you get that jacket? 😍',
        likes: 89
      }
    ];
    const createdComments = await Comment.insertMany(comments);
    console.log(`✅ Created ${createdComments.length} comments\n`);

    // 7. SEED PRODUCTS
    console.log('🛍️ Seeding Products...');
    await Product.deleteMany({});
    const products = [
      {
        seller: createdUsers[4]._id,
        name: 'Stylish Denim Jacket',
        description: 'Premium quality denim jacket, perfect for any occasion',
        price: 89.99,
        currency: 'USD',
        category: 'fashion',
        images: [
          'https://picsum.photos/600/800?random=20',
          'https://picsum.photos/600/800?random=21'
        ],
        stock: 50,
        isActive: true,
        rating: 4.5,
        reviewCount: 23
      },
      {
        seller: createdUsers[4]._id,
        name: 'Wireless Earbuds Pro',
        description: 'High-quality wireless earbuds with noise cancellation',
        price: 129.99,
        currency: 'USD',
        category: 'tech',
        images: [
          'https://picsum.photos/600/800?random=22',
          'https://picsum.photos/600/800?random=23'
        ],
        stock: 100,
        isActive: true,
        rating: 4.8,
        reviewCount: 156
      },
      {
        seller: createdUsers[3]._id,
        name: 'Smart Watch Series X',
        description: 'Latest smartwatch with health tracking and notifications',
        price: 299.99,
        currency: 'USD',
        category: 'tech',
        images: [
          'https://picsum.photos/600/800?random=24',
          'https://picsum.photos/600/800?random=25'
        ],
        stock: 75,
        isActive: true,
        rating: 4.7,
        reviewCount: 89
      }
    ];
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products\n`);

    // 8. SEED WALLETS
    console.log('💰 Seeding Wallets...');
    await Wallet.deleteMany({});
    const wallets = await Promise.all(
      createdUsers.map(user => 
        Wallet.create({
          user: user._id,
          balance: Math.floor(Math.random() * 10000) + 100,
          currency: 'USD',
          transactions: []
        })
      )
    );
    console.log(`✅ Created ${wallets.length} wallets\n`);

    // 9. SEED GIFTS
    console.log('🎁 Seeding Gifts...');
    await Gift.deleteMany({});
    const gifts = [
      {
        name: 'Rose',
        icon: '🌹',
        coinValue: 10,
        description: 'Send a beautiful rose',
        rarity: 'common',
        isActive: true,
        category: 'romantic'
      },
      {
        name: 'Diamond',
        icon: '💎',
        coinValue: 100,
        description: 'Rare and precious diamond',
        rarity: 'rare',
        isActive: true,
        category: 'premium'
      },
      {
        name: 'Fire',
        icon: '🔥',
        coinValue: 50,
        description: 'Show some fire support',
        rarity: 'uncommon',
        isActive: true,
        category: 'energy'
      },
      {
        name: 'Crown',
        icon: '👑',
        coinValue: 500,
        description: 'Ultimate royal gift',
        rarity: 'legendary',
        isActive: true,
        category: 'premium'
      }
    ];
    const createdGifts = await Gift.insertMany(gifts);
    console.log(`✅ Created ${createdGifts.length} gifts\n`);

    // 10. SEED SETTINGS
    console.log('⚙️ Seeding Settings...');
    await Setting.deleteMany({});
    const settings = [
      { key: 'general.siteName', value: 'Mixillo', type: 'string', category: 'general', isPublic: true },
      { key: 'general.siteDescription', value: 'Social media platform for creators', type: 'string', category: 'general', isPublic: true },
      { key: 'general.maintenanceMode', value: false, type: 'boolean', category: 'general', isPublic: true },
      { key: 'features.liveStreamingEnabled', value: true, type: 'boolean', category: 'features', isPublic: true },
      { key: 'features.ecommerceEnabled', value: true, type: 'boolean', category: 'features', isPublic: true },
      { key: 'features.walletEnabled', value: true, type: 'boolean', category: 'features', isPublic: true },
      { key: 'payment.currency', value: 'USD', type: 'string', category: 'payment', isPublic: false },
      { key: 'moderation.autoModeration', value: true, type: 'boolean', category: 'moderation', isPublic: false }
    ];
    const createdSettings = await Setting.insertMany(settings);
    console.log(`✅ Created ${createdSettings.length} settings\n`);

    console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log(`   - ${createdCurrencies.length} Currencies`);
    console.log(`   - ${createdUsers.length} Users`);
    console.log(`   - ${createdCategories.length} Categories`);
    console.log(`   - ${createdSounds.length} Sounds`);
    console.log(`   - ${createdContents.length} Content Items`);
    console.log(`   - ${createdComments.length} Comments`);
    console.log(`   - ${createdProducts.length} Products`);
    console.log(`   - ${wallets.length} Wallets`);
    console.log(`   - ${createdGifts.length} Gifts`);
    console.log(`   - ${createdSettings.length} Settings`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedAllData();
