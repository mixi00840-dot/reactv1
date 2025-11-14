const mongoose = require('mongoose');
const User = require('./src/models/User');
const { Wallet } = require('./src/models/Wallet');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo';

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create Admin User
    console.log('\n📝 Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@mixillo.com' });
    
    let adminUser;
    if (adminExists) {
      console.log('ℹ️  Admin user already exists');
      adminUser = adminExists;
    } else {
      adminUser = new User({
        username: 'admin',
        email: 'admin@mixillo.com',
        fullName: 'System Administrator',
        password: 'Admin123!',
        role: 'admin',
        status: 'active',
        isVerified: true,
        dateOfBirth: new Date('1990-01-01'),
        phone: '+1234567890'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
      console.log(`   Email: admin@mixillo.com`);
      console.log(`   Password: Admin123!`);
    }

    // Create test users
    console.log('\n📝 Creating test users...');
    const testUsers = [];
    for (let i = 1; i <= 10; i++) {
      const userExists = await User.findOne({ username: `testuser${i}` });
      if (!userExists) {
        const user = new User({
          username: `testuser${i}`,
          email: `testuser${i}@mixillo.com`,
          fullName: `Test User ${i}`,
          password: 'Test123!',
          role: i <= 2 ? 'seller' : 'user',
          status: 'active',
          isVerified: i % 2 === 0,
          dateOfBirth: new Date(`199${i % 10}-01-01`),
          phone: `+12345${i.toString().padStart(5, '0')}`
        });
        await user.save();
        testUsers.push(user);
        console.log(`   ✅ Created ${user.username}`);
      }
    }

    // Create wallets for users
    console.log('\n💰 Creating wallets...');
    const users = await User.find({});
    for (const user of users) {
      const walletExists = await Wallet.findOne({ userId: user._id });
      if (!walletExists) {
        const wallet = new Wallet({
          userId: user._id,
          balance: Math.floor(Math.random() * 10000),
          totalEarnings: Math.floor(Math.random() * 50000),
          currency: 'USD'
        });
        await wallet.save();
        console.log(`   ✅ Created wallet for ${user.username}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Wallets: ${await Wallet.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
