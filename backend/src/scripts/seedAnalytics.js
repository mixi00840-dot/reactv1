const mongoose = require('mongoose');
require('dotenv').config();
const { PlatformAnalytics, UserAnalytics, EventTracking } = require('../models/AdvancedAnalytics');
const User = require('../models/User');

async function seedAnalytics() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    // ============ Seed Platform Analytics (Last 30 Days) ============
    console.log('\n📊 Seeding platform analytics...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let analyticsCreated = 0;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const existing = await PlatformAnalytics.findOne({ date, period: 'daily' });
      
      if (!existing) {
        // Generate realistic data with growth trend
        const baseUsers = 1000 + (30 - i) * 10;
        const baseRevenue = 5000 + (30 - i) * 200 + Math.random() * 1000;
        const baseGifts = 100 + (30 - i) * 5 + Math.random() * 50;
        
        await PlatformAnalytics.create({
          date,
          period: 'daily',
          users: {
            total: baseUsers,
            new: Math.floor(10 + Math.random() * 20),
            active: Math.floor(baseUsers * 0.3 + Math.random() * 50),
            sellers: Math.floor(baseUsers * 0.1),
            newSellers: Math.floor(Math.random() * 5),
            verified: Math.floor(baseUsers * 0.8)
          },
          revenue: {
            total: baseRevenue,
            credits: baseRevenue * 0.6,
            products: baseRevenue * 0.3,
            subscriptions: baseRevenue * 0.1,
            avgOrderValue: 45 + Math.random() * 20
          },
          transactions: {
            total: Math.floor(baseRevenue / 50),
            completed: Math.floor(baseRevenue / 55),
            pending: Math.floor(Math.random() * 10),
            failed: Math.floor(Math.random() * 5),
            refunded: Math.floor(Math.random() * 3)
          },
          credits: {
            purchased: Math.floor(baseRevenue * 0.6 / 10),
            spent: Math.floor(baseRevenue * 0.6 / 12),
            gifted: Math.floor(baseRevenue * 0.4 / 10),
            totalRevenue: baseRevenue * 0.6,
            avgPackageSize: 500 + Math.random() * 500
          },
          gifts: {
            sent: Math.floor(baseGifts),
            totalValue: Math.floor(baseGifts * 150),
            uniqueSenders: Math.floor(baseGifts * 0.6),
            uniqueReceivers: Math.floor(baseGifts * 0.7),
            avgGiftValue: 100 + Math.random() * 100
          },
          livestreams: {
            total: Math.floor(20 + Math.random() * 30),
            active: Math.floor(5 + Math.random() * 10),
            completed: Math.floor(15 + Math.random() * 20),
            totalViewers: Math.floor(500 + Math.random() * 1000),
            avgViewers: Math.floor(25 + Math.random() * 50),
            totalDuration: Math.floor(3600 + Math.random() * 7200),
            avgDuration: Math.floor(1800 + Math.random() * 1800),
            giftsReceived: Math.floor(baseGifts * 0.3)
          },
          products: {
            total: 500 + (30 - i) * 5,
            new: Math.floor(Math.random() * 10),
            sold: Math.floor(50 + Math.random() * 100),
            views: Math.floor(1000 + Math.random() * 2000),
            avgPrice: 25 + Math.random() * 50
          },
          orders: {
            total: Math.floor(30 + Math.random() * 70),
            completed: Math.floor(25 + Math.random() * 60),
            pending: Math.floor(Math.random() * 10),
            cancelled: Math.floor(Math.random() * 5),
            avgValue: 45 + Math.random() * 20
          },
          engagement: {
            pageViews: Math.floor(5000 + Math.random() * 3000),
            uniqueVisitors: Math.floor(baseUsers * 0.5 + Math.random() * 100),
            avgSessionDuration: Math.floor(300 + Math.random() * 600),
            bounceRate: 40 + Math.random() * 20,
            interactions: Math.floor(2000 + Math.random() * 1000)
          },
          devices: {
            mobile: Math.floor(baseUsers * 0.6),
            tablet: Math.floor(baseUsers * 0.1),
            desktop: Math.floor(baseUsers * 0.3)
          }
        });
        
        analyticsCreated++;
        if (i % 10 === 0) {
          console.log(`   ✨ Created analytics for ${date.toDateString()}`);
        }
      }
    }
    
    console.log(`   ✅ Created ${analyticsCreated} daily analytics records`);
    
    // ============ Seed User Analytics ============
    console.log('\n👤 Seeding user analytics...');
    
    const users = await User.find({ role: { $in: ['user', 'seller'] } }).limit(50);
    let userAnalyticsCreated = 0;
    
    for (const user of users) {
      for (let i = 7; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const existing = await UserAnalytics.findOne({ user: user._id, date });
        
        if (!existing) {
          const sessions = Math.floor(Math.random() * 5) + 1;
          const spent = Math.random() * 100;
          
          await UserAnalytics.create({
            user: user._id,
            date,
            sessions: {
              count: sessions,
              totalDuration: sessions * (300 + Math.random() * 600),
              avgDuration: 300 + Math.random() * 600
            },
            activity: {
              pageViews: sessions * (5 + Math.floor(Math.random() * 15)),
              uniquePages: sessions * (3 + Math.floor(Math.random() * 7)),
              searches: Math.floor(Math.random() * 5),
              clicks: sessions * (10 + Math.floor(Math.random() * 20)),
              interactions: sessions * (5 + Math.floor(Math.random() * 10))
            },
            shopping: {
              productsViewed: Math.floor(Math.random() * 20),
              addedToCart: Math.floor(Math.random() * 5),
              ordersPlaced: Math.random() > 0.7 ? 1 : 0,
              totalSpent: spent,
              avgOrderValue: spent
            },
            credits: {
              purchased: Math.random() > 0.8 ? Math.floor(Math.random() * 500) : 0,
              spent: Math.floor(Math.random() * 100),
              balance: Math.floor(Math.random() * 1000)
            },
            gifting: {
              giftsSent: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
              giftsReceived: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
              totalSpent: Math.floor(Math.random() * 200),
              totalReceived: Math.floor(Math.random() * 100)
            },
            devices: {
              mobile: Math.random() > 0.5 ? 1 : 0,
              tablet: 0,
              desktop: Math.random() > 0.5 ? 1 : 0
            },
            rfm: {
              recency: i,
              frequency: sessions,
              monetary: spent,
              score: Math.floor((10 - i) + sessions + (spent / 10))
            }
          });
          
          userAnalyticsCreated++;
        }
      }
    }
    
    console.log(`   ✅ Created ${userAnalyticsCreated} user analytics records for ${users.length} users`);
    
    // ============ Seed Event Tracking ============
    console.log('\n🎯 Seeding event tracking...');
    
    const eventTypes = [
      'user_login', 'product_view', 'product_search', 'credit_purchase',
      'gift_send', 'stream_join', 'page_view', 'banner_click'
    ];
    
    let eventsCreated = 0;
    const now = new Date();
    
    for (let i = 0; i < 1000; i++) {
      const eventDate = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      await EventTracking.create({
        eventType: randomEventType,
        user: randomUser._id,
        timestamp: eventDate,
        device: {
          type: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          os: ['iOS', 'Android', 'Windows', 'MacOS'][Math.floor(Math.random() * 4)],
          browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)]
        },
        location: {
          country: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
          city: ['New York', 'London', 'Toronto', 'Sydney', 'Berlin'][Math.floor(Math.random() * 5)]
        }
      });
      
      eventsCreated++;
      if (i % 200 === 0) {
        console.log(`   ✨ Created ${i} events...`);
      }
    }
    
    console.log(`   ✅ Created ${eventsCreated} event tracking records`);
    
    console.log(`\n📊 Summary:`);
    console.log(`   📈 Platform Analytics: ${analyticsCreated} days`);
    console.log(`   👤 User Analytics: ${userAnalyticsCreated} records`);
    console.log(`   🎯 Events Tracked: ${eventsCreated} events`);
    
    console.log('\n✅ Analytics seeding completed successfully!');
    console.log('\n💡 Test endpoints:');
    console.log('   1. Platform Overview: GET /api/analytics/dashboard/overview');
    console.log('   2. Revenue Analytics: GET /api/analytics/dashboard/revenue');
    console.log('   3. Real-time Metrics: GET /api/analytics/realtime');
    console.log('   4. Trend Analysis: GET /api/analytics/trends?metric=revenue.total&days=30');
    console.log('   5. User Insights: GET /api/analytics/users/:userId');
    
  } catch (error) {
    console.error('❌ Error seeding analytics:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedAnalytics()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedAnalytics;
