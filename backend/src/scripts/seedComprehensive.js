const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models (with proper destructuring where needed)
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const SellerApplication = require('../models/SellerApplication');
const Strike = require('../models/Strike');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Comment = require('../models/Comment');
const { Gift } = require('../models/Gift');
const Sound = require('../models/Sound');
const Story = require('../models/Story');
const { Banner } = require('../models/Banner');
const { Coupon } = require('../models/Coupon');
const Notification = require('../models/Notification');
const { Translation } = require('../models/Translation');
const { Language } = require('../models/Language');
const { Setting } = require('../models/Setting');
const Content = require('../models/Content');
const { LiveStream } = require('../models/LiveStream');
const { Category } = require('../models/Category');
const { Transaction } = require('../models/Transaction');

const connectDB = require('../utils/database');

const seedComprehensive = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await SellerApplication.deleteMany({});
    await Strike.deleteMany({});
    await Product.deleteMany({});
    await Store.deleteMany({});
    await Order.deleteMany({});
    await Comment.deleteMany({});
    await Gift.deleteMany({});
    await Sound.deleteMany({});
    await Story.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await Notification.deleteMany({});
    await Translation.deleteMany({});
    await Language.deleteMany({});
    await Setting.deleteMany({});
    await Content.deleteMany({});
    await LiveStream.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // ==================== USERS & AUTHENTICATION ====================
    console.log('👥 Creating users...');
    
    // Admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@mixillo.com',
      password: 'Admin123!',
      fullName: 'System Administrator',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin',
      isVerified: true,
      status: 'active',
      profilePicture: 'https://i.pravatar.cc/300?img=1'
    });
    await adminUser.save();

    // Regular users
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password123!',
        fullName: 'John Doe',
        dateOfBirth: new Date('1995-05-15'),
        bio: '🎬 Content creator and influencer | 🌍 Travel enthusiast',
        followersCount: 15420,
        followingCount: 234,
        videosCount: 89,
        postsCount: 156,
        likesReceived: 45230,
        isVerified: true,
        isFeatured: true,
        profilePicture: 'https://i.pravatar.cc/300?img=11',
        phoneNumber: '+1234567890'
      },
      {
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'Password123!',
        fullName: 'Jane Smith',
        dateOfBirth: new Date('1992-08-22'),
        bio: '💃 Dance and lifestyle content | ✨ Living my best life',
        followersCount: 8765,
        followingCount: 189,
        videosCount: 45,
        postsCount: 78,
        likesReceived: 23450,
        isVerified: true,
        profilePicture: 'https://i.pravatar.cc/300?img=5',
        phoneNumber: '+1234567891'
      },
      {
        username: 'mikechen',
        email: 'mike@example.com',
        password: 'Password123!',
        fullName: 'Mike Chen',
        dateOfBirth: new Date('1988-12-03'),
        bio: '🍜 Food and cooking videos | 👨‍🍳 Chef & Food Blogger',
        followersCount: 32100,
        followingCount: 567,
        videosCount: 134,
        postsCount: 289,
        likesReceived: 87650,
        isVerified: true,
        isFeatured: true,
        profilePicture: 'https://i.pravatar.cc/300?img=12',
        phoneNumber: '+1234567892'
      },
      {
        username: 'sarahwilson',
        email: 'sarah@example.com',
        password: 'Password123!',
        fullName: 'Sarah Wilson',
        dateOfBirth: new Date('1996-03-18'),
        bio: '👗 Fashion and beauty content | 💄 Makeup artist',
        followersCount: 12450,
        followingCount: 345,
        videosCount: 67,
        postsCount: 123,
        likesReceived: 34560,
        isVerified: false,
        profilePicture: 'https://i.pravatar.cc/300?img=9',
        phoneNumber: '+1234567893'
      },
      {
        username: 'alexbrown',
        email: 'alex@example.com',
        password: 'Password123!',
        fullName: 'Alex Brown',
        dateOfBirth: new Date('1991-07-09'),
        bio: '🎮 Gaming and tech reviews | 💻 Techie',
        followersCount: 5670,
        followingCount: 123,
        videosCount: 34,
        postsCount: 56,
        likesReceived: 15670,
        status: 'suspended',
        profilePicture: 'https://i.pravatar.cc/300?img=13',
        phoneNumber: '+1234567894'
      },
      {
        username: 'emilydavis',
        email: 'emily@example.com',
        password: 'Password123!',
        fullName: 'Emily Davis',
        dateOfBirth: new Date('1993-11-25'),
        bio: '✈️ Travel and adventure | 🌎 World explorer',
        followersCount: 9870,
        followingCount: 278,
        videosCount: 78,
        postsCount: 145,
        likesReceived: 28900,
        isVerified: true,
        profilePicture: 'https://i.pravatar.cc/300?img=20',
        phoneNumber: '+1234567895'
      },
      {
        username: 'davidlee',
        email: 'david@example.com',
        password: 'Password123!',
        fullName: 'David Lee',
        dateOfBirth: new Date('1989-04-14'),
        bio: '🎵 Music and entertainment | 🎸 Musician',
        followersCount: 18750,
        followingCount: 456,
        videosCount: 112,
        postsCount: 234,
        likesReceived: 52340,
        isVerified: true,
        profilePicture: 'https://i.pravatar.cc/300?img=14',
        phoneNumber: '+1234567896'
      },
      {
        username: 'lisagarcia',
        email: 'lisa@example.com',
        password: 'Password123!',
        fullName: 'Lisa Garcia',
        dateOfBirth: new Date('1994-09-30'),
        bio: '🏋️ Fitness and wellness | 💪 Personal trainer',
        followersCount: 6540,
        followingCount: 198,
        videosCount: 56,
        postsCount: 89,
        likesReceived: 19870,
        isVerified: false,
        profilePicture: 'https://i.pravatar.cc/300?img=27',
        phoneNumber: '+1234567897'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    
    console.log(`✅ Created ${createdUsers.length + 1} users (including admin)\n`);

    // ==================== WALLETS ====================
    console.log('💰 Creating wallets...');
    
    const wallets = [
      { userId: adminUser._id, balance: 10000, totalEarnings: 10000, supportLevel: 'diamond' },
      { userId: createdUsers[0]._id, balance: 2500, totalEarnings: 5600, supportLevel: 'gold' },
      { userId: createdUsers[1]._id, balance: 1200, totalEarnings: 3400, supportLevel: 'silver' },
      { userId: createdUsers[2]._id, balance: 5600, totalEarnings: 12300, supportLevel: 'diamond' },
      { userId: createdUsers[3]._id, balance: 800, totalEarnings: 1500, supportLevel: 'bronze' },
      { userId: createdUsers[4]._id, balance: 0, totalEarnings: 890, supportLevel: 'bronze' },
      { userId: createdUsers[5]._id, balance: 3400, totalEarnings: 7800, supportLevel: 'gold' },
      { userId: createdUsers[6]._id, balance: 4200, totalEarnings: 9600, supportLevel: 'platinum' },
      { userId: createdUsers[7]._id, balance: 950, totalEarnings: 2100, supportLevel: 'silver' }
    ];

    await Wallet.insertMany(wallets);
    console.log(`✅ Created ${wallets.length} wallets\n`);

    // ==================== CATEGORIES ====================
    console.log('📁 Creating categories...');
    
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', isActive: true },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', isActive: true },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and gardening', isActive: true },
      { name: 'Beauty', slug: 'beauty', description: 'Beauty and cosmetics products', isActive: true },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and gear', isActive: true },
      { name: 'Books', slug: 'books', description: 'Books and educational materials', isActive: true },
      { name: 'Toys', slug: 'toys', description: 'Toys and games', isActive: true },
      { name: 'Food & Beverages', slug: 'food-beverages', description: 'Food and drink products', isActive: true }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${categories.length} categories\n`);

    // ==================== SELLER APPLICATIONS ====================
    console.log('📋 Creating seller applications...');
    
    const sellerApplications = [
      {
        userId: createdUsers[1]._id,
        businessName: 'Jane\'s Fashion Store',
        businessType: 'company',
        businessDescription: 'High-quality fashion items for modern women',
        documentType: 'passport',
        documentNumber: 'P12345678',
        documentImages: [
          { url: '/uploads/documents/passport1-front.jpg', uploadedAt: new Date() },
          { url: '/uploads/documents/passport1-back.jpg', uploadedAt: new Date() }
        ],
        expectedMonthlyRevenue: 5000,
        status: 'pending'
      },
      {
        userId: createdUsers[3]._id,
        businessName: 'Sarah\'s Beauty Hub',
        businessType: 'company',
        businessDescription: 'Professional beauty and makeup products',
        documentType: 'national_id',
        documentNumber: 'ID987654321',
        documentImages: [
          { url: '/uploads/documents/id2-front.jpg', uploadedAt: new Date() },
          { url: '/uploads/documents/id2-back.jpg', uploadedAt: new Date() }
        ],
        expectedMonthlyRevenue: 8000,
        status: 'approved',
        approvedAt: new Date(),
        reviewedBy: adminUser._id,
        reviewNotes: 'All documents verified. Approved for selling.'
      },
      {
        userId: createdUsers[7]._id,
        businessName: 'Fit Life Gear',
        businessType: 'individual',
        businessDescription: 'Premium fitness equipment and accessories',
        documentType: 'driving_license',
        documentNumber: 'DL456789012',
        documentImages: [
          { url: '/uploads/documents/license3.jpg', uploadedAt: new Date() }
        ],
        expectedMonthlyRevenue: 3000,
        status: 'rejected',
        rejectionReason: 'Incomplete documentation - missing back of license',
        reviewedBy: adminUser._id,
        reviewedAt: new Date()
      }
    ];

    await SellerApplication.insertMany(sellerApplications);
    console.log(`✅ Created ${sellerApplications.length} seller applications\n`);

    // ==================== STORES ====================
    console.log('🏪 Creating stores...');
    
    const stores = [
      {
        ownerId: createdUsers[3]._id,
        name: 'Sarah\'s Beauty Hub',
        slug: 'sarahs-beauty-hub',
        description: 'Your one-stop shop for all beauty needs',
        logo: 'https://via.placeholder.com/200',
        banner: 'https://via.placeholder.com/1200x400',
        isActive: true,
        isVerified: true,
        rating: 4.8,
        totalOrders: 156,
        totalRevenue: 12450
      },
      {
        ownerId: createdUsers[2]._id,
        name: 'Mike\'s Food Paradise',
        slug: 'mikes-food-paradise',
        description: 'Gourmet foods and cooking supplies',
        logo: 'https://via.placeholder.com/200',
        banner: 'https://via.placeholder.com/1200x400',
        isActive: true,
        isVerified: true,
        rating: 4.9,
        totalOrders: 289,
        totalRevenue: 28900
      }
    ];

    const createdStores = await Store.insertMany(stores);
    console.log(`✅ Created ${stores.length} stores\n`);

    // ==================== PRODUCTS ====================
    console.log('📦 Creating products...');
    
    const products = [
      {
        storeId: createdStores[0]._id,
        sellerId: createdUsers[3]._id,
        name: 'Premium Makeup Brush Set',
        description: 'Professional 12-piece makeup brush set with synthetic bristles',
        price: 49.99,
        compareAtPrice: 79.99,
        category: createdCategories.find(c => c.slug === 'beauty')._id,
        images: [
          'https://via.placeholder.com/600x600/FFB6C1/000000?text=Brush+Set',
          'https://via.placeholder.com/600x600/FFC0CB/000000?text=Brushes'
        ],
        stock: 45,
        sku: 'BRUSH-001',
        isActive: true,
        isFeatured: true,
        rating: 4.7,
        reviewCount: 23,
        tags: ['makeup', 'brushes', 'beauty', 'professional']
      },
      {
        storeId: createdStores[0]._id,
        sellerId: createdUsers[3]._id,
        name: 'Organic Face Serum',
        description: 'Natural anti-aging serum with vitamin C and hyaluronic acid',
        price: 34.99,
        category: createdCategories.find(c => c.slug === 'beauty')._id,
        images: [
          'https://via.placeholder.com/600x600/E6E6FA/000000?text=Face+Serum'
        ],
        stock: 78,
        sku: 'SERUM-001',
        isActive: true,
        rating: 4.9,
        reviewCount: 67,
        tags: ['skincare', 'serum', 'organic', 'anti-aging']
      },
      {
        storeId: createdStores[1]._id,
        sellerId: createdUsers[2]._id,
        name: 'Artisan Olive Oil',
        description: 'Extra virgin olive oil from Italian orchards',
        price: 24.99,
        category: createdCategories.find(c => c.slug === 'food-beverages')._id,
        images: [
          'https://via.placeholder.com/600x600/F0E68C/000000?text=Olive+Oil'
        ],
        stock: 120,
        sku: 'OIL-001',
        isActive: true,
        isFeatured: true,
        rating: 5.0,
        reviewCount: 45,
        tags: ['food', 'olive oil', 'italian', 'organic']
      },
      {
        storeId: createdStores[1]._id,
        sellerId: createdUsers[2]._id,
        name: 'Gourmet Spice Collection',
        description: 'Premium selection of 10 exotic spices',
        price: 39.99,
        category: createdCategories.find(c => c.slug === 'food-beverages')._id,
        images: [
          'https://via.placeholder.com/600x600/DEB887/000000?text=Spices'
        ],
        stock: 65,
        sku: 'SPICE-001',
        isActive: true,
        rating: 4.6,
        reviewCount: 34,
        tags: ['spices', 'gourmet', 'cooking', 'exotic']
      },
      {
        storeId: createdStores[0]._id,
        sellerId: createdUsers[3]._id,
        name: 'Luxury Perfume Set',
        description: 'Three signature fragrances in travel sizes',
        price: 89.99,
        compareAtPrice: 120.00,
        category: createdCategories.find(c => c.slug === 'beauty')._id,
        images: [
          'https://via.placeholder.com/600x600/DDA0DD/000000?text=Perfume'
        ],
        stock: 32,
        sku: 'PERF-001',
        isActive: true,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 56,
        tags: ['perfume', 'luxury', 'fragrance', 'gift']
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${products.length} products\n`);

    // ==================== ORDERS ====================
    console.log('🛒 Creating orders...');
    
    const orders = [
      {
        orderNumber: 'ORD-2025-00001',
        customerId: createdUsers[0]._id,
        items: [
          {
            productId: createdProducts[0]._id,
            name: createdProducts[0].name,
            price: createdProducts[0].price,
            quantity: 1,
            image: createdProducts[0].images[0]
          }
        ],
        subtotal: 49.99,
        tax: 4.50,
        shipping: 5.99,
        total: 60.48,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          phone: '+1234567890'
        }
      },
      {
        orderNumber: 'ORD-2025-00002',
        customerId: createdUsers[1]._id,
        items: [
          {
            productId: createdProducts[2]._id,
            name: createdProducts[2].name,
            price: createdProducts[2].price,
            quantity: 2,
            image: createdProducts[2].images[0]
          },
          {
            productId: createdProducts[3]._id,
            name: createdProducts[3].name,
            price: createdProducts[3].price,
            quantity: 1,
            image: createdProducts[3].images[0]
          }
        ],
        subtotal: 89.97,
        tax: 8.10,
        shipping: 7.99,
        total: 106.06,
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        shippingAddress: {
          fullName: 'Jane Smith',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
          phone: '+1234567891'
        }
      },
      {
        orderNumber: 'ORD-2025-00003',
        customerId: createdUsers[5]._id,
        items: [
          {
            productId: createdProducts[4]._id,
            name: createdProducts[4].name,
            price: createdProducts[4].price,
            quantity: 1,
            image: createdProducts[4].images[0]
          }
        ],
        subtotal: 89.99,
        tax: 8.10,
        shipping: 0,
        total: 98.09,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        shippingAddress: {
          fullName: 'Emily Davis',
          address: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
          phone: '+1234567895'
        }
      }
    ];

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} orders\n`);

    // ==================== CONTENT (Videos/Posts) ====================
    console.log('🎬 Creating content...');
    
    const contents = [
      {
        userId: createdUsers[0]._id,
        type: 'video',
        title: 'Amazing Travel Vlog - Dubai',
        description: 'Exploring the beautiful city of Dubai! 🌍✈️',
        videoUrl: 'https://example.com/videos/dubai-vlog.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x600/87CEEB/000000?text=Dubai+Vlog',
        duration: 245,
        views: 12450,
        likes: 3456,
        comments: 234,
        shares: 89,
        isPublic: true,
        status: 'published',
        tags: ['travel', 'dubai', 'vlog', 'adventure']
      },
      {
        userId: createdUsers[1]._id,
        type: 'video',
        title: 'Dance Tutorial - Hip Hop Basics',
        description: 'Learn basic hip hop moves with me! 💃🎵',
        videoUrl: 'https://example.com/videos/dance-tutorial.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x600/FFB6C1/000000?text=Dance+Tutorial',
        duration: 180,
        views: 8765,
        likes: 2345,
        comments: 156,
        shares: 67,
        isPublic: true,
        status: 'published',
        tags: ['dance', 'tutorial', 'hiphop', 'music']
      },
      {
        userId: createdUsers[2]._id,
        type: 'video',
        title: 'Cooking Italian Pasta',
        description: 'Authentic Italian pasta recipe from scratch! 🍝👨‍🍳',
        videoUrl: 'https://example.com/videos/pasta-recipe.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x600/F0E68C/000000?text=Pasta+Recipe',
        duration: 420,
        views: 32100,
        likes: 8765,
        comments: 567,
        shares: 234,
        isPublic: true,
        status: 'published',
        isFeatured: true,
        tags: ['cooking', 'food', 'italian', 'recipe', 'pasta']
      },
      {
        userId: createdUsers[3]._id,
        type: 'post',
        title: 'Summer Makeup Look',
        description: 'Fresh and natural summer makeup tutorial! ☀️💄',
        images: [
          'https://via.placeholder.com/600x600/FFE4E1/000000?text=Summer+Makeup'
        ],
        views: 6543,
        likes: 1987,
        comments: 89,
        shares: 34,
        isPublic: true,
        status: 'published',
        tags: ['makeup', 'beauty', 'summer', 'tutorial']
      },
      {
        userId: createdUsers[6]._id,
        type: 'video',
        title: 'New Music Release - Ocean Waves',
        description: 'My latest single is out now! 🎵🌊',
        videoUrl: 'https://example.com/videos/ocean-waves.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x600/4682B4/FFFFFF?text=Ocean+Waves',
        duration: 195,
        views: 18750,
        likes: 5234,
        comments: 456,
        shares: 123,
        isPublic: true,
        status: 'published',
        isFeatured: true,
        tags: ['music', 'newrelease', 'ocean', 'waves']
      }
    ];

    const createdContents = await Content.insertMany(contents);
    console.log(`✅ Created ${contents.length} content items\n`);

    // ==================== COMMENTS ====================
    console.log('💬 Creating comments...');
    
    const comments = [
      {
        contentId: createdContents[0]._id,
        userId: createdUsers[1]._id,
        text: 'Amazing video! Dubai looks stunning! 😍',
        likes: 45,
        status: 'approved'
      },
      {
        contentId: createdContents[0]._id,
        userId: createdUsers[2]._id,
        text: 'Great content! Which camera did you use?',
        likes: 23,
        status: 'approved'
      },
      {
        contentId: createdContents[2]._id,
        userId: createdUsers[0]._id,
        text: 'I tried this recipe and it was delicious! Thank you! 🍝',
        likes: 156,
        status: 'approved'
      },
      {
        contentId: createdContents[2]._id,
        userId: createdUsers[4]._id,
        text: 'This is spam content!!!',
        likes: 0,
        status: 'pending',
        isReported: true,
        reportReason: 'Spam'
      },
      {
        contentId: createdContents[1]._id,
        userId: createdUsers[3]._id,
        text: 'Your moves are so smooth! Love it! 💃',
        likes: 67,
        status: 'approved'
      },
      {
        contentId: createdContents[4]._id,
        userId: createdUsers[5]._id,
        text: 'Beautiful song! Can\'t stop listening! 🎵',
        likes: 234,
        status: 'approved'
      },
      {
        contentId: createdContents[3]._id,
        userId: createdUsers[6]._id,
        text: 'Love this makeup look! What products did you use?',
        likes: 45,
        status: 'approved'
      },
      {
        contentId: createdContents[0]._id,
        userId: createdUsers[4]._id,
        text: 'Inappropriate comment here',
        likes: 0,
        status: 'blocked',
        isReported: true,
        reportReason: 'Inappropriate content'
      }
    ];

    await Comment.insertMany(comments);
    console.log(`✅ Created ${comments.length} comments\n`);

    // ==================== GIFTS ====================
    console.log('🎁 Creating virtual gifts...');
    
    const gifts = [
      {
        name: 'Heart',
        description: 'Send some love! ❤️',
        imageUrl: 'https://via.placeholder.com/200x200/FF69B4/FFFFFF?text=❤️',
        animationUrl: 'https://example.com/animations/heart.json',
        price: 10,
        category: 'emotions',
        isActive: true,
        popularity: 9850
      },
      {
        name: 'Rose',
        description: 'Beautiful virtual rose 🌹',
        imageUrl: 'https://via.placeholder.com/200x200/FF0000/FFFFFF?text=🌹',
        animationUrl: 'https://example.com/animations/rose.json',
        price: 50,
        category: 'romantic',
        isActive: true,
        popularity: 6543
      },
      {
        name: 'Diamond',
        description: 'Luxurious diamond gift 💎',
        imageUrl: 'https://via.placeholder.com/200x200/4169E1/FFFFFF?text=💎',
        animationUrl: 'https://example.com/animations/diamond.json',
        price: 500,
        category: 'luxury',
        isActive: true,
        isFeatured: true,
        popularity: 2345
      },
      {
        name: 'Rocket',
        description: 'Blast off! 🚀',
        imageUrl: 'https://via.placeholder.com/200x200/FF4500/FFFFFF?text=🚀',
        animationUrl: 'https://example.com/animations/rocket.json',
        price: 100,
        category: 'fun',
        isActive: true,
        popularity: 4567
      },
      {
        name: 'Crown',
        description: 'Royal crown 👑',
        imageUrl: 'https://via.placeholder.com/200x200/FFD700/000000?text=👑',
        animationUrl: 'https://example.com/animations/crown.json',
        price: 1000,
        category: 'luxury',
        isActive: true,
        isFeatured: true,
        popularity: 1234
      },
      {
        name: 'Cake',
        description: 'Birthday cake 🎂',
        imageUrl: 'https://via.placeholder.com/200x200/FFC0CB/000000?text=🎂',
        animationUrl: 'https://example.com/animations/cake.json',
        price: 25,
        category: 'celebration',
        isActive: true,
        popularity: 5678
      }
    ];

    await Gift.insertMany(gifts);
    console.log(`✅ Created ${gifts.length} virtual gifts\n`);

    // ==================== SOUNDS ====================
    console.log('🎵 Creating sounds...');
    
    const sounds = [
      {
        title: 'Summer Vibes',
        artist: 'DJ Cool',
        duration: 180,
        url: 'https://example.com/sounds/summer-vibes.mp3',
        coverImage: 'https://via.placeholder.com/300x300/FF6347/FFFFFF?text=Summer+Vibes',
        category: 'trending',
        usageCount: 12450,
        isActive: true,
        isTrending: true,
        tags: ['summer', 'upbeat', 'dance']
      },
      {
        title: 'Chill Beats',
        artist: 'Lo-Fi Master',
        duration: 165,
        url: 'https://example.com/sounds/chill-beats.mp3',
        coverImage: 'https://via.placeholder.com/300x300/9370DB/FFFFFF?text=Chill+Beats',
        category: 'lofi',
        usageCount: 8765,
        isActive: true,
        tags: ['lofi', 'chill', 'relax']
      },
      {
        title: 'Epic Cinematic',
        artist: 'Orchestra Pro',
        duration: 240,
        url: 'https://example.com/sounds/epic-cinematic.mp3',
        coverImage: 'https://via.placeholder.com/300x300/2F4F4F/FFFFFF?text=Epic+Cinema',
        category: 'cinematic',
        usageCount: 5432,
        isActive: true,
        isFeatured: true,
        tags: ['epic', 'cinematic', 'dramatic']
      },
      {
        title: 'Happy Pop',
        artist: 'Pop Star',
        duration: 150,
        url: 'https://example.com/sounds/happy-pop.mp3',
        coverImage: 'https://via.placeholder.com/300x300/FFB6C1/000000?text=Happy+Pop',
        category: 'pop',
        usageCount: 9876,
        isActive: true,
        isTrending: true,
        tags: ['pop', 'happy', 'upbeat']
      },
      {
        title: 'Hip Hop Beat',
        artist: 'Beat Maker',
        duration: 195,
        url: 'https://example.com/sounds/hiphop-beat.mp3',
        coverImage: 'https://via.placeholder.com/300x300/000000/FFD700?text=Hip+Hop',
        category: 'hiphop',
        usageCount: 7654,
        isActive: true,
        tags: ['hiphop', 'rap', 'urban']
      }
    ];

    await Sound.insertMany(sounds);
    console.log(`✅ Created ${sounds.length} sounds\n`);

    // ==================== STORIES ====================
    console.log('📖 Creating stories...');
    
    const stories = [
      {
        userId: createdUsers[0]._id,
        type: 'image',
        mediaUrl: 'https://via.placeholder.com/400x800/87CEEB/000000?text=Story+1',
        caption: 'Great day at the beach! ☀️🏖️',
        views: 2345,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        userId: createdUsers[1]._id,
        type: 'video',
        mediaUrl: 'https://example.com/stories/dance-story.mp4',
        thumbnailUrl: 'https://via.placeholder.com/400x800/FFB6C1/000000?text=Dance+Story',
        caption: 'New dance routine! 💃',
        duration: 15,
        views: 3456,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        userId: createdUsers[2]._id,
        type: 'image',
        mediaUrl: 'https://via.placeholder.com/400x800/F0E68C/000000?text=Food+Story',
        caption: 'Cooking something special! 👨‍🍳',
        views: 4567,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    await Story.insertMany(stories);
    console.log(`✅ Created ${stories.length} stories\n`);

    // ==================== BANNERS ====================
    console.log('🎨 Creating banners...');
    
    const banners = [
      {
        title: 'Welcome to Mixillo',
        description: 'Join the fastest growing social platform!',
        imageUrl: 'https://via.placeholder.com/1200x400/4169E1/FFFFFF?text=Welcome+Banner',
        link: '/explore',
        type: 'promotional',
        position: 'home_top',
        isActive: true,
        priority: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Black Friday Sale',
        description: 'Up to 50% off on all products!',
        imageUrl: 'https://via.placeholder.com/1200x400/000000/FFD700?text=Black+Friday',
        link: '/products',
        type: 'promotional',
        position: 'marketplace_top',
        isActive: true,
        priority: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Creator Program',
        description: 'Join our creator program and earn money!',
        imageUrl: 'https://via.placeholder.com/1200x400/32CD32/FFFFFF?text=Creator+Program',
        link: '/creator-program',
        type: 'informational',
        position: 'home_middle',
        isActive: true,
        priority: 3
      }
    ];

    await Banner.insertMany(banners);
    console.log(`✅ Created ${banners.length} banners\n`);

    // ==================== COUPONS ====================
    console.log('🎫 Creating coupons...');
    
    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new users',
        discountType: 'percentage',
        discountValue: 10,
        minimumPurchase: 50,
        maxUses: 1000,
        usedCount: 234,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'SAVE20',
        description: '20% off on orders above $100',
        discountType: 'percentage',
        discountValue: 20,
        minimumPurchase: 100,
        maxUses: 500,
        usedCount: 89,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'FREESHIP',
        description: 'Free shipping on all orders',
        discountType: 'fixed',
        discountValue: 10,
        maxUses: 2000,
        usedCount: 567,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];

    await Coupon.insertMany(coupons);
    console.log(`✅ Created ${coupons.length} coupons\n`);

    // ==================== LANGUAGES ====================
    console.log('🌍 Creating languages...');
    
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', isActive: true, isDefault: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', isActive: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', isActive: true },
      { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', isActive: true },
      { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', isActive: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', isActive: true },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', isActive: true }
    ];

    await Language.insertMany(languages);
    console.log(`✅ Created ${languages.length} languages\n`);

    // ==================== TRANSLATIONS ====================
    console.log('📝 Creating translations...');
    
    const translations = [
      {
        key: 'common.welcome',
        translations: {
          en: 'Welcome to Mixillo',
          ar: 'مرحبا بك في ميكسيلو',
          es: 'Bienvenido a Mixillo',
          fr: 'Bienvenue sur Mixillo',
          de: 'Willkommen bei Mixillo'
        },
        category: 'common',
        isActive: true
      },
      {
        key: 'common.login',
        translations: {
          en: 'Login',
          ar: 'تسجيل الدخول',
          es: 'Iniciar sesión',
          fr: 'Connexion',
          de: 'Anmelden'
        },
        category: 'common',
        isActive: true
      },
      {
        key: 'common.register',
        translations: {
          en: 'Register',
          ar: 'تسجيل',
          es: 'Registrarse',
          fr: 'S\'inscrire',
          de: 'Registrieren'
        },
        category: 'common',
        isActive: true
      },
      {
        key: 'product.addToCart',
        translations: {
          en: 'Add to Cart',
          ar: 'أضف إلى السلة',
          es: 'Añadir al carrito',
          fr: 'Ajouter au panier',
          de: 'In den Warenkorb'
        },
        category: 'ecommerce',
        isActive: true
      },
      {
        key: 'product.buyNow',
        translations: {
          en: 'Buy Now',
          ar: 'اشتري الآن',
          es: 'Comprar ahora',
          fr: 'Acheter maintenant',
          de: 'Jetzt kaufen'
        },
        category: 'ecommerce',
        isActive: true
      }
    ];

    await Translation.insertMany(translations);
    console.log(`✅ Created ${translations.length} translations\n`);

    // ==================== TRANSACTIONS ====================
    console.log('💳 Creating transactions...');
    
    const transactions = [
      {
        userId: createdUsers[0]._id,
        type: 'purchase',
        amount: 60.48,
        currency: 'USD',
        status: 'completed',
        description: 'Order #ORD-2025-00001',
        paymentMethod: 'stripe',
        paymentId: 'ch_1234567890'
      },
      {
        userId: createdUsers[1]._id,
        type: 'purchase',
        amount: 106.06,
        currency: 'USD',
        status: 'completed',
        description: 'Order #ORD-2025-00002',
        paymentMethod: 'stripe',
        paymentId: 'ch_0987654321'
      },
      {
        userId: createdUsers[2]._id,
        type: 'earning',
        amount: 250.00,
        currency: 'USD',
        status: 'completed',
        description: 'Creator earnings - September 2025',
        paymentMethod: 'bank_transfer'
      },
      {
        userId: createdUsers[3]._id,
        type: 'earning',
        amount: 450.00,
        currency: 'USD',
        status: 'completed',
        description: 'Store sales earnings',
        paymentMethod: 'bank_transfer'
      }
    ];

    await Transaction.insertMany(transactions);
    console.log(`✅ Created ${transactions.length} transactions\n`);

    // ==================== NOTIFICATIONS ====================
    console.log('🔔 Creating notifications...');
    
    const notifications = [
      {
        userId: createdUsers[0]._id,
        type: 'like',
        title: 'New Like',
        message: 'Jane Smith liked your video',
        isRead: false,
        data: { contentId: createdContents[0]._id }
      },
      {
        userId: createdUsers[0]._id,
        type: 'comment',
        title: 'New Comment',
        message: 'Mike Chen commented on your video',
        isRead: true,
        data: { contentId: createdContents[0]._id }
      },
      {
        userId: createdUsers[2]._id,
        type: 'follow',
        title: 'New Follower',
        message: 'Emily Davis started following you',
        isRead: false
      },
      {
        userId: createdUsers[3]._id,
        type: 'order',
        title: 'New Order',
        message: 'You have a new order #ORD-2025-00001',
        isRead: false,
        data: { orderId: orders[0]._id }
      },
      {
        userId: createdUsers[1]._id,
        type: 'system',
        title: 'Welcome to Mixillo',
        message: 'Thank you for joining our community!',
        isRead: true
      }
    ];

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications\n`);

    // ==================== STRIKES ====================
    console.log('⚠️  Creating strikes...');
    
    const strikes = [
      {
        userId: createdUsers[4]._id,
        reason: 'Spam comments',
        description: 'Multiple spam comments reported by users',
        issuedBy: adminUser._id,
        severity: 'minor',
        isActive: true
      },
      {
        userId: createdUsers[4]._id,
        reason: 'Inappropriate content',
        description: 'Posted inappropriate content violating community guidelines',
        issuedBy: adminUser._id,
        severity: 'major',
        isActive: true
      }
    ];

    await Strike.insertMany(strikes);
    console.log(`✅ Created ${strikes.length} strikes\n`);

    // ==================== SETTINGS ====================
    console.log('⚙️  Creating platform settings...');
    
    const settings = [
      {
        key: 'platform.name',
        value: 'Mixillo',
        type: 'string',
        category: 'general',
        description: 'Platform name'
      },
      {
        key: 'platform.supportEmail',
        value: 'support@mixillo.com',
        type: 'string',
        category: 'general',
        description: 'Support email address'
      },
      {
        key: 'platform.currency',
        value: 'USD',
        type: 'string',
        category: 'general',
        description: 'Default currency'
      },
      {
        key: 'feature.marketplace',
        value: 'true',
        type: 'boolean',
        category: 'features',
        description: 'Enable marketplace feature'
      },
      {
        key: 'feature.livestream',
        value: 'true',
        type: 'boolean',
        category: 'features',
        description: 'Enable livestream feature'
      },
      {
        key: 'moderation.autoApprove',
        value: 'false',
        type: 'boolean',
        category: 'moderation',
        description: 'Auto-approve new content'
      },
      {
        key: 'payment.stripe.enabled',
        value: 'true',
        type: 'boolean',
        category: 'payment',
        description: 'Enable Stripe payments'
      }
    ];

    await Setting.insertMany(settings);
    console.log(`✅ Created ${settings.length} platform settings\n`);

    // ==================== SUMMARY ====================
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 Data Summary:');
    console.log(`   ✅ Users: ${createdUsers.length + 1} (including admin)`);
    console.log(`   ✅ Wallets: ${wallets.length}`);
    console.log(`   ✅ Categories: ${categories.length}`);
    console.log(`   ✅ Seller Applications: ${sellerApplications.length}`);
    console.log(`   ✅ Stores: ${stores.length}`);
    console.log(`   ✅ Products: ${products.length}`);
    console.log(`   ✅ Orders: ${orders.length}`);
    console.log(`   ✅ Content: ${contents.length}`);
    console.log(`   ✅ Comments: ${comments.length}`);
    console.log(`   ✅ Gifts: ${gifts.length}`);
    console.log(`   ✅ Sounds: ${sounds.length}`);
    console.log(`   ✅ Stories: ${stories.length}`);
    console.log(`   ✅ Banners: ${banners.length}`);
    console.log(`   ✅ Coupons: ${coupons.length}`);
    console.log(`   ✅ Languages: ${languages.length}`);
    console.log(`   ✅ Translations: ${translations.length}`);
    console.log(`   ✅ Transactions: ${transactions.length}`);
    console.log(`   ✅ Notifications: ${notifications.length}`);
    console.log(`   ✅ Strikes: ${strikes.length}`);
    console.log(`   ✅ Settings: ${settings.length}`);

    console.log('\n🔑 Test Credentials:');
    console.log('   Admin: admin@mixillo.com / Admin123!');
    console.log('   User 1: john@example.com / Password123!');
    console.log('   User 2: jane@example.com / Password123!');
    console.log('   User 3: mike@example.com / Password123!');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start dashboard: cd admin-dashboard && npm start');
    console.log('   3. Run comprehensive tests: npm run test:comprehensive');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
if (require.main === module) {
  seedComprehensive();
}

module.exports = seedComprehensive;
