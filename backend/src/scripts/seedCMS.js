const mongoose = require('mongoose');
require('dotenv').config();
const { Banner } = require('../models/Banner');
const { Page } = require('../models/Page');
const { Theme } = require('../models/Theme');
const User = require('../models/User');

// Create sample banners, pages, and theme

async function seedCMS() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    // Get or create system user for CMS seeding
    let systemUser = await User.findOne({ email: 'system@mixillo.com' });
    if (!systemUser) {
      systemUser = await User.create({
        username: 'system',
        email: 'system@mixillo.com',
        password: 'system123', // Will be hashed by pre-save hook
        firstName: 'System',
        lastName: 'Admin',
        fullName: 'System Admin',
        dateOfBirth: new Date('1990-01-01'),
        role: 'admin',
        verified: true
      });
      console.log('✅ Created system user for CMS seeding');
    }
    
    // Seed Default Theme
    console.log('\n🎨 Seeding default theme...');
    let theme = await Theme.findOne({ name: 'default' });
    if (!theme) {
      theme = await Theme.create({
        name: 'default',
        displayName: 'Mixillo Modern',
        description: 'Clean and modern theme for Mixillo social commerce platform',
        version: '1.0.0',
        status: 'active',
        isDefault: true,
        category: 'modern',
        createdBy: systemUser._id,
        colors: {
          primary: '#6366F1',
          primaryDark: '#4F46E5',
          primaryLight: '#818CF8',
          secondary: '#EC4899',
          secondaryDark: '#DB2777',
          secondaryLight: '#F472B6',
          background: '#FFFFFF',
          backgroundSecondary: '#F9FAFB',
          textPrimary: '#111827',
          textSecondary: '#6B7280',
          textInverse: '#FFFFFF',
          border: '#E5E7EB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        }
      });
      console.log('✨ Created default theme');
    } else {
      console.log('⏭️  Default theme already exists');
    }
    
    // Seed Sample Banners
    console.log('\n📢 Seeding sample banners...');
    const banners = [
      {
        title: 'Welcome to Mixillo',
        type: 'image',
        placement: 'home_hero',
        priority: 10,
        status: 'active',
        createdBy: systemUser._id,
        content: {
          mediaUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200',
          title: 'Discover Amazing Products',
          description: 'Shop from livestreams and get exclusive deals'
        },
        action: {
          type: 'link',
          url: '/shop',
          target: '_self'
        }
      },
      {
        title: 'Black Friday Sale',
        type: 'image',
        placement: 'shop_hero',
        priority: 5,
        status: 'active',
        createdBy: systemUser._id,
        content: {
          mediaUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
          title: 'Up to 70% Off',
          description: 'Limited time offer on selected items'
        },
        schedule: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    ];
    
    let bannersCreated = 0;
    for (const bannerData of banners) {
      const existing = await Banner.findOne({ title: bannerData.title });
      if (!existing) {
        await Banner.create(bannerData);
        console.log(`✨ Created banner: ${bannerData.title}`);
        bannersCreated++;
      } else {
        console.log(`⏭️  Banner "${bannerData.title}" already exists`);
      }
    }
    
    // Seed Sample Pages
    console.log('\n📄 Seeding sample pages...');
    const pages = [
      {
        title: 'About Us',
        slug: 'about',
        type: 'standard',
        status: 'published',
        createdBy: systemUser._id,
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            order: 1,
            config: {
              heading: 'About Mixillo',
              subheading: 'The Future of Social Commerce',
              backgroundImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200'
            }
          },
          {
            id: 'text-1',
            type: 'text',
            order: 2,
            config: {
              content: 'Mixillo is a revolutionary platform that combines social media, livestreaming, and e-commerce. Shop directly from livestreams, discover new products, and connect with sellers in real-time.',
              alignment: 'center'
            }
          }
        ],
        seo: {
          metaTitle: 'About Mixillo - Social Commerce Platform',
          metaDescription: 'Learn about Mixillo, the innovative platform combining social media with livestream shopping.',
        }
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy',
        type: 'legal',
        status: 'published',
        createdBy: systemUser._id,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            order: 1,
            config: {
              text: 'Privacy Policy',
              level: 1
            }
          },
          {
            id: 'text-1',
            type: 'text',
            order: 2,
            config: {
              content: 'Last updated: ' + new Date().toLocaleDateString() + '\n\nYour privacy is important to us. This policy explains how we collect, use, and protect your personal information.'
            }
          }
        ]
      },
      {
        title: 'Help Center',
        slug: 'help',
        type: 'help',
        status: 'published',
        createdBy: systemUser._id,
        blocks: [
          {
            id: 'faq-1',
            type: 'faq',
            order: 1,
            config: {
              items: [
                {
                  question: 'How do I start selling on Mixillo?',
                  answer: 'To become a seller, go to your profile settings and apply for a seller account. Once approved, you can create your store and start listing products.'
                },
                {
                  question: 'How do livestream shopping work?',
                  answer: 'Sellers can broadcast live video streams showcasing their products. Viewers can ask questions, interact, and purchase products directly during the stream.'
                },
                {
                  question: 'What payment methods are accepted?',
                  answer: 'We accept credit cards, debit cards, PayPal, and various digital wallets.'
                }
              ]
            }
          }
        ]
      }
    ];
    
    let pagesCreated = 0;
    for (const pageData of pages) {
      const existing = await Page.findOne({ slug: pageData.slug });
      if (!existing) {
        await Page.create(pageData);
        console.log(`✨ Created page: ${pageData.title} (/${pageData.slug})`);
        pagesCreated++;
      } else {
        console.log(`⏭️  Page "${pageData.title}" already exists`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   🎨 Theme: ${theme.isDefault ? '✅ Active' : '📝 Ready'}`);
    console.log(`   📢 Banners: ${bannersCreated} created`);
    console.log(`   📄 Pages: ${pagesCreated} created`);
    
    console.log('\n✅ CMS seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Access CMS APIs:');
    console.log('      - GET /api/cms/banners (admin)');
    console.log('      - GET /api/cms/pages (public)');
    console.log('      - GET /api/cms/themes/active (public)');
    console.log('   2. View public pages: /api/cms/pages/slug/about');
    console.log('   3. Get active banners: /api/cms/banners/active?placement=home_hero');
    
  } catch (error) {
    console.error('❌ Error seeding CMS:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedCMS()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedCMS;
