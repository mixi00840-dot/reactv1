const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const SellerApplication = require('../models/SellerApplication');
const Strike = require('../models/Strike');

const connectDB = require('../utils/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await SellerApplication.deleteMany({});
    await Strike.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@mixillo.com',
      password: 'Admin123!',
      fullName: 'System Administrator',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin',
      isVerified: true,
      status: 'active'
    });
    await adminUser.save();
    console.log('👑 Created admin user');

    // Create admin wallet
    const adminWallet = new Wallet({
      userId: adminUser._id,
      balance: 10000,
      totalEarnings: 10000,
      supportLevel: 'diamond'
    });
    await adminWallet.save();

    // Create sample users
    const sampleUsers = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        fullName: 'John Doe',
        dateOfBirth: new Date('1995-05-15'),
        bio: 'Content creator and influencer',
        followersCount: 15420,
        followingCount: 234,
        videosCount: 89,
        postsCount: 156,
        likesReceived: 45230,
        isVerified: true,
        isFeatured: true
      },
      {
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
        dateOfBirth: new Date('1992-08-22'),
        bio: 'Dance and lifestyle content',
        followersCount: 8765,
        followingCount: 189,
        videosCount: 45,
        postsCount: 78,
        likesReceived: 23450,
        isVerified: true
      },
      {
        username: 'mikechen',
        email: 'mike@example.com',
        password: 'password123',
        fullName: 'Mike Chen',
        dateOfBirth: new Date('1988-12-03'),
        bio: 'Food and cooking videos',
        followersCount: 32100,
        followingCount: 567,
        videosCount: 134,
        postsCount: 289,
        likesReceived: 87650,
        isVerified: true,
        isFeatured: true
      },
      {
        username: 'sarahwilson',
        email: 'sarah@example.com',
        password: 'password123',
        fullName: 'Sarah Wilson',
        dateOfBirth: new Date('1996-03-18'),
        bio: 'Fashion and beauty content',
        followersCount: 12450,
        followingCount: 345,
        videosCount: 67,
        postsCount: 123,
        likesReceived: 34560
      },
      {
        username: 'alexbrown',
        email: 'alex@example.com',
        password: 'password123',
        fullName: 'Alex Brown',
        dateOfBirth: new Date('1991-07-09'),
        bio: 'Gaming and tech reviews',
        followersCount: 5670,
        followingCount: 123,
        videosCount: 34,
        postsCount: 56,
        likesReceived: 15670,
        status: 'suspended'
      },
      {
        username: 'emilydavis',
        email: 'emily@example.com',
        password: 'password123',
        fullName: 'Emily Davis',
        dateOfBirth: new Date('1993-11-25'),
        bio: 'Travel and adventure',
        followersCount: 9870,
        followingCount: 278,
        videosCount: 78,
        postsCount: 145,
        likesReceived: 28900
      },
      {
        username: 'davidlee',
        email: 'david@example.com',
        password: 'password123',
        fullName: 'David Lee',
        dateOfBirth: new Date('1989-04-14'),
        bio: 'Music and entertainment',
        followersCount: 18750,
        followingCount: 456,
        videosCount: 112,
        postsCount: 234,
        likesReceived: 52340,
        isVerified: true
      },
      {
        username: 'lisawhite',
        email: 'lisa@example.com',
        password: 'password123',
        fullName: 'Lisa White',
        dateOfBirth: new Date('1994-09-07'),
        bio: 'Fitness and wellness',
        followersCount: 6540,
        followingCount: 167,
        videosCount: 45,
        postsCount: 89,
        likesReceived: 19870
      },
      {
        username: 'tomjohnson',
        email: 'tom@example.com',
        password: 'password123',
        fullName: 'Tom Johnson',
        dateOfBirth: new Date('1987-06-12'),
        bio: 'Comedy and entertainment',
        followersCount: 25600,
        followingCount: 789,
        videosCount: 156,
        postsCount: 312,
        likesReceived: 78900,
        isVerified: true,
        isFeatured: true
      },
      {
        username: 'annagreen',
        email: 'anna@example.com',
        password: 'password123',
        fullName: 'Anna Green',
        dateOfBirth: new Date('1998-01-28'),
        bio: 'Art and creativity',
        followersCount: 3450,
        followingCount: 89,
        videosCount: 23,
        postsCount: 45,
        likesReceived: 8760,
        status: 'banned'
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`👥 Created ${createdUsers.length} sample users`);

    // Create wallets for users
    const walletData = [
      { userId: createdUsers[0]._id, balance: 2450.75, totalEarnings: 8750.50, supportLevel: 'gold' },
      { userId: createdUsers[1]._id, balance: 1250.30, totalEarnings: 5430.80, supportLevel: 'silver' },
      { userId: createdUsers[2]._id, balance: 5670.90, totalEarnings: 15240.25, supportLevel: 'platinum' },
      { userId: createdUsers[3]._id, balance: 890.45, totalEarnings: 3560.70, supportLevel: 'bronze' },
      { userId: createdUsers[4]._id, balance: 340.20, totalEarnings: 1780.30, supportLevel: 'bronze' },
      { userId: createdUsers[5]._id, balance: 1890.65, totalEarnings: 6780.40, supportLevel: 'silver' },
      { userId: createdUsers[6]._id, balance: 3450.80, totalEarnings: 12340.90, supportLevel: 'gold' },
      { userId: createdUsers[7]._id, balance: 670.25, totalEarnings: 2890.50, supportLevel: 'bronze' },
      { userId: createdUsers[8]._id, balance: 7890.40, totalEarnings: 23450.75, supportLevel: 'diamond' },
      { userId: createdUsers[9]._id, balance: 120.10, totalEarnings: 560.80, supportLevel: 'bronze' }
    ];

    for (const wallet of walletData) {
      const newWallet = new Wallet(wallet);
      await newWallet.save();
    }
    console.log('💰 Created user wallets');

    // Create seller applications
    const sellerApplications = [
      {
        userId: createdUsers[0]._id,
        status: 'approved',
        documentType: 'passport',
        documentNumber: 'P123456789',
        businessName: 'John Doe Media',
        businessType: 'individual',
        businessDescription: 'Content creation and social media marketing',
        expectedMonthlyRevenue: 5000,
        reviewedBy: adminUser._id,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        reviewNotes: 'All documents verified successfully'
      },
      {
        userId: createdUsers[2]._id,
        status: 'approved',
        documentType: 'national_id',
        documentNumber: 'ID987654321',
        businessName: 'Chen Food Productions',
        businessType: 'company',
        businessDescription: 'Food content and recipe development',
        expectedMonthlyRevenue: 8000,
        reviewedBy: adminUser._id,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        reviewNotes: 'Business registration verified'
      },
      {
        userId: createdUsers[5]._id,
        status: 'pending',
        documentType: 'passport',
        documentNumber: 'P555666777',
        businessName: 'Travel with Emily',
        businessType: 'individual',
        businessDescription: 'Travel content and destination guides',
        expectedMonthlyRevenue: 3000
      },
      {
        userId: createdUsers[7]._id,
        status: 'rejected',
        documentType: 'driving_license',
        documentNumber: 'DL123789456',
        businessName: 'Fitness Pro',
        businessType: 'individual',
        businessDescription: 'Fitness coaching and workout videos',
        expectedMonthlyRevenue: 2500,
        reviewedBy: adminUser._id,
        reviewedAt: new Date(),
        rejectionReason: 'Documents not clear enough',
        reviewNotes: 'Please resubmit with clearer images'
      }
    ];

    for (const appData of sellerApplications) {
      const app = new SellerApplication(appData);
      await app.save();
    }
    console.log('📋 Created seller applications');

    // Create sample strikes
    const strikes = [
      {
        userId: createdUsers[4]._id, // Alex Brown (suspended)
        type: 'warning',
        severity: 'medium',
        reason: 'Inappropriate language in comments',
        description: 'User posted comments containing inappropriate language',
        actionTaken: 'warning_issued',
        issuedBy: adminUser._id
      },
      {
        userId: createdUsers[4]._id,
        type: 'strike',
        severity: 'high',
        reason: 'Account suspended for repeated violations',
        description: 'Multiple violations of community guidelines',
        actionTaken: 'account_suspended',
        issuedBy: adminUser._id
      },
      {
        userId: createdUsers[9]._id, // Anna Green (banned)
        type: 'final_warning',
        severity: 'critical',
        reason: 'Spam and fake content',
        description: 'Posted multiple spam videos and fake information',
        actionTaken: 'account_banned',
        issuedBy: adminUser._id
      }
    ];

    for (const strikeData of strikes) {
      const strike = new Strike(strikeData);
      await strike.save();
    }
    console.log('⚠️  Created sample strikes');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Admin user: admin@mixillo.com / Admin123!`);
    console.log(`   • Sample users: ${createdUsers.length}`);
    console.log(`   • Wallets: ${walletData.length}`);
    console.log(`   • Seller applications: ${sellerApplications.length}`);
    console.log(`   • Strikes: ${strikes.length}`);
    console.log('\n🚀 You can now start the server and test the application!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;