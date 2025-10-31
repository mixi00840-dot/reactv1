const mongoose = require('mongoose');
const Product = require('../models/Product');
const { Category } = require('../models/Category');
const Store = require('../models/Store');
const User = require('../models/User');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    description: 'Premium quality cotton t-shirt perfect for everyday wear. Soft, breathable, and comfortable.',
    shortDescription: 'Comfortable cotton t-shirt',
    pricing: {
      basePrice: 19.99,
      salePrice: 14.99,
      onSale: true,
      costPrice: 8.00,
      taxable: true
    },
    inventory: {
      sku: 'TSH-WHT-001',
      stockQuantity: 100,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 10
    },
    shipping: {
      weight: 0.2,
      length: 30,
      width: 25,
      height: 2,
      requiresShipping: true,
      freeShipping: false,
      shippingClass: 'standard'
    },
    status: 'active',
    featured: true,
    tags: ['fashion', 'casual', 'summer'],
    brand: 'ClassicWear'
  },
  {
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless headphones with noise cancellation, 30-hour battery life, and premium sound quality.',
    shortDescription: 'Premium wireless headphones',
    pricing: {
      basePrice: 89.99,
      salePrice: 69.99,
      onSale: true,
      costPrice: 35.00,
      taxable: true
    },
    inventory: {
      sku: 'AUD-WH-001',
      stockQuantity: 50,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 5
    },
    shipping: {
      weight: 0.3,
      length: 20,
      width: 15,
      height: 8,
      requiresShipping: true,
      freeShipping: true,
      shippingClass: 'express'
    },
    status: 'active',
    featured: true,
    tags: ['electronics', 'audio', 'wireless'],
    brand: 'TechSound'
  },
  {
    name: 'Organic Green Tea - 100 Bags',
    slug: 'organic-green-tea-100-bags',
    description: 'Premium organic green tea sourced from the finest tea gardens. Rich in antioxidants and perfect for daily wellness.',
    shortDescription: '100% organic green tea',
    pricing: {
      basePrice: 24.99,
      costPrice: 10.00,
      taxable: true
    },
    inventory: {
      sku: 'TEA-GRN-100',
      stockQuantity: 200,
      trackInventory: true,
      allowBackorder: true,
      lowStockThreshold: 20
    },
    shipping: {
      weight: 0.3,
      length: 15,
      width: 10,
      height: 8,
      requiresShipping: true,
      freeShipping: false,
      shippingClass: 'standard'
    },
    status: 'active',
    featured: false,
    tags: ['organic', 'tea', 'wellness', 'beverage'],
    brand: 'TeaLife'
  },
  {
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracker with heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water resistant up to 50m.',
    shortDescription: 'Advanced fitness tracker',
    pricing: {
      basePrice: 149.99,
      salePrice: 119.99,
      onSale: true,
      costPrice: 60.00,
      taxable: true
    },
    inventory: {
      sku: 'FIT-WATCH-001',
      stockQuantity: 30,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 5
    },
    shipping: {
      weight: 0.1,
      length: 10,
      width: 10,
      height: 5,
      requiresShipping: true,
      freeShipping: true,
      shippingClass: 'express'
    },
    status: 'active',
    featured: true,
    tags: ['electronics', 'fitness', 'wearable', 'smart-device'],
    brand: 'FitTech'
  },
  {
    name: 'Premium Yoga Mat',
    slug: 'premium-yoga-mat',
    description: 'Extra thick, non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and general fitness exercises.',
    shortDescription: 'Eco-friendly yoga mat',
    pricing: {
      basePrice: 39.99,
      costPrice: 15.00,
      taxable: true
    },
    inventory: {
      sku: 'YOG-MAT-001',
      stockQuantity: 75,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 10
    },
    shipping: {
      weight: 1.2,
      length: 180,
      width: 60,
      height: 10,
      requiresShipping: true,
      freeShipping: false,
      shippingClass: 'standard'
    },
    status: 'active',
    featured: false,
    tags: ['fitness', 'yoga', 'exercise', 'eco-friendly'],
    brand: 'YogaLife'
  },
  {
    name: 'Ceramic Coffee Mug Set - 4 Pieces',
    slug: 'ceramic-coffee-mug-set-4-pieces',
    description: 'Beautiful handcrafted ceramic coffee mugs. Set of 4 in assorted colors. Microwave and dishwasher safe.',
    shortDescription: 'Handcrafted ceramic mug set',
    pricing: {
      basePrice: 34.99,
      salePrice: 27.99,
      onSale: true,
      costPrice: 12.00,
      taxable: true
    },
    inventory: {
      sku: 'HOM-MUG-004',
      stockQuantity: 60,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 10
    },
    shipping: {
      weight: 1.5,
      length: 25,
      width: 25,
      height: 15,
      requiresShipping: true,
      freeShipping: false,
      shippingClass: 'fragile'
    },
    status: 'active',
    featured: false,
    tags: ['home', 'kitchen', 'ceramic', 'drinkware'],
    brand: 'HomeStyle'
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Get categories
    const categories = await Category.find({ isActive: true }).limit(6);
    if (categories.length === 0) {
      console.log('⚠️  No categories found. Please run seedCategories.js first');
      process.exit(1);
    }

    // Create a demo store
    let demoStore = await Store.findOne({ name: 'Demo Store' });
    if (!demoStore) {
      // Find or create a demo user
      let demoUser = await User.findOne({ email: 'seller@mixillo.com' });
      if (!demoUser) {
        demoUser = await User.create({
          username: 'demoseller',
          email: 'seller@mixillo.com',
          password: 'password123',
          fullName: 'Demo Seller',
          dateOfBirth: new Date('1990-01-01'),
          phone: '+1234567890',
          role: 'seller',
          isVerified: true,
          status: 'active'
        });
        console.log('✅ Created demo seller user');
      }

      demoStore = await Store.create({
        storeName: 'Demo Store',
        storeSlug: 'demo-store',
        description: 'Official demo store showcasing various products',
        shortDescription: 'Quality products for everyone',
        ownerId: demoUser._id,
        status: 'active',
        isVerified: true,
        businessInfo: {
          businessType: 'business',
          taxId: 'TAX123456',
          businessLicense: 'BL123456'
        },
        contactInfo: {
          email: 'store@mixillo.com',
          phone: '+1234567890',
          website: 'https://mixillo.com'
        },
        address: {
          street: '123 Demo Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US'
        }
      });
      console.log('✅ Created demo store');
    }

    // Assign categories to products and create them
    const productsToCreate = sampleProducts.map((product, index) => ({
      ...product,
      category: categories[index % categories.length]._id,
      storeId: demoStore._id
    }));

    const createdProducts = await Product.insertMany(productsToCreate);
    console.log(`✅ Created ${createdProducts.length} sample products`);

    // Display summary
    console.log('\n📊 Product Summary:');
    createdProducts.forEach(product => {
      console.log(`   • ${product.name} - $${product.pricing.basePrice}`);
    });

    console.log('\n✅ Product seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
