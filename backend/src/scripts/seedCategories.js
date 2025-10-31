const mongoose = require('mongoose');
const { Category } = require('../models/Category');

const defaultCategories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    status: 'active'
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel',
    status: 'active'
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    status: 'active'
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    status: 'active'
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    status: 'active'
  },
  {
    name: 'Health & Beauty',
    description: 'Health care and beauty products',
    status: 'active'
  },
  {
    name: 'Toys & Games',
    description: 'Toys and games for all ages',
    status: 'active'
  },
  {
    name: 'Automotive',
    description: 'Car parts and automotive accessories',
    status: 'active'
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create categories with slugs
    const categories = defaultCategories.map(cat => ({
      ...cat,
      slug: cat.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
    }));

    await Category.insertMany(categories);
    console.log('Categories seeded successfully');
    
    // Display created categories
    const createdCategories = await Category.find();
    console.log('\nCreated categories:');
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories, defaultCategories };