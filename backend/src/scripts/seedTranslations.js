const mongoose = require('mongoose');
require('dotenv').config();
const { Translation } = require('../models/Translation');
const { Language } = require('../models/Language');

// Base translation keys for the app
const baseTranslations = [
  // Authentication
  { key: 'auth.login', category: 'auth', defaultText: 'Login', description: 'Login button text' },
  { key: 'auth.logout', category: 'auth', defaultText: 'Logout', description: 'Logout button text' },
  { key: 'auth.register', category: 'auth', defaultText: 'Register', description: 'Register button text' },
  { key: 'auth.email', category: 'auth', defaultText: 'Email', description: 'Email input label' },
  { key: 'auth.password', category: 'auth', defaultText: 'Password', description: 'Password input label' },
  { key: 'auth.forgot_password', category: 'auth', defaultText: 'Forgot Password?', description: 'Forgot password link' },
  { key: 'auth.welcome', category: 'auth', defaultText: 'Welcome to Mixillo', description: 'Welcome message' },
  
  // Navigation
  { key: 'nav.home', category: 'common', defaultText: 'Home', description: 'Home navigation item' },
  { key: 'nav.explore', category: 'common', defaultText: 'Explore', description: 'Explore navigation item' },
  { key: 'nav.notifications', category: 'common', defaultText: 'Notifications', description: 'Notifications navigation item' },
  { key: 'nav.profile', category: 'common', defaultText: 'Profile', description: 'Profile navigation item' },
  { key: 'nav.settings', category: 'common', defaultText: 'Settings', description: 'Settings navigation item' },
  { key: 'nav.shop', category: 'store', defaultText: 'Shop', description: 'Shop navigation item' },
  { key: 'nav.cart', category: 'store', defaultText: 'Cart', description: 'Shopping cart navigation item' },
  
  // Common Actions
  { key: 'common.save', category: 'buttons', defaultText: 'Save', description: 'Save button' },
  { key: 'common.cancel', category: 'buttons', defaultText: 'Cancel', description: 'Cancel button' },
  { key: 'common.delete', category: 'buttons', defaultText: 'Delete', description: 'Delete button' },
  { key: 'common.edit', category: 'buttons', defaultText: 'Edit', description: 'Edit button' },
  { key: 'common.search', category: 'common', defaultText: 'Search', description: 'Search placeholder' },
  { key: 'common.loading', category: 'messages', defaultText: 'Loading...', description: 'Loading state text' },
  { key: 'common.error', category: 'errors', defaultText: 'Error', description: 'Error message title' },
  { key: 'common.success', category: 'messages', defaultText: 'Success', description: 'Success message title' },
  { key: 'common.confirm', category: 'buttons', defaultText: 'Confirm', description: 'Confirm button' },
  { key: 'common.back', category: 'buttons', defaultText: 'Back', description: 'Back button' },
  
  // Video/Content
  { key: 'video.like', category: 'common', defaultText: 'Like', description: 'Like button' },
  { key: 'video.comment', category: 'common', defaultText: 'Comment', description: 'Comment button' },
  { key: 'video.share', category: 'common', defaultText: 'Share', description: 'Share button' },
  { key: 'video.follow', category: 'common', defaultText: 'Follow', description: 'Follow button' },
  { key: 'video.following', category: 'common', defaultText: 'Following', description: 'Following status' },
  { key: 'video.views', category: 'labels', defaultText: 'Views', description: 'Video views label' },
  
  // E-commerce
  { key: 'shop.add_to_cart', category: 'store', defaultText: 'Add to Cart', description: 'Add to cart button' },
  { key: 'shop.buy_now', category: 'store', defaultText: 'Buy Now', description: 'Buy now button' },
  { key: 'shop.price', category: 'store', defaultText: 'Price', description: 'Price label' },
  { key: 'shop.quantity', category: 'store', defaultText: 'Quantity', description: 'Quantity label' },
  { key: 'shop.checkout', category: 'checkout', defaultText: 'Checkout', description: 'Checkout button' },
  { key: 'shop.total', category: 'checkout', defaultText: 'Total', description: 'Total amount label' },
  { key: 'shop.shipping', category: 'shipping', defaultText: 'Shipping', description: 'Shipping label' },
  { key: 'shop.payment', category: 'payments', defaultText: 'Payment', description: 'Payment label' },
  
  // Profile
  { key: 'profile.edit_profile', category: 'profile', defaultText: 'Edit Profile', description: 'Edit profile button' },
  { key: 'profile.followers', category: 'profile', defaultText: 'Followers', description: 'Followers count label' },
  { key: 'profile.following', category: 'profile', defaultText: 'Following', description: 'Following count label' },
  { key: 'profile.likes', category: 'profile', defaultText: 'Likes', description: 'Likes count label' },
  { key: 'profile.bio', category: 'profile', defaultText: 'Bio', description: 'Bio section label' },
  
  // Messages/Notifications
  { key: 'notif.new_follower', category: 'notifications', defaultText: 'started following you', description: 'New follower notification' },
  { key: 'notif.new_like', category: 'notifications', defaultText: 'liked your video', description: 'New like notification' },
  { key: 'notif.new_comment', category: 'notifications', defaultText: 'commented on your video', description: 'New comment notification' },
  { key: 'notif.order_shipped', category: 'notifications', defaultText: 'Your order has been shipped', description: 'Order shipped notification' },
  
  // Errors
  { key: 'error.network', category: 'errors', defaultText: 'Network error. Please check your connection.', description: 'Network error message' },
  { key: 'error.server', category: 'errors', defaultText: 'Server error. Please try again later.', description: 'Server error message' },
  { key: 'error.not_found', category: 'errors', defaultText: 'Not found', description: '404 error message' },
  { key: 'error.unauthorized', category: 'errors', defaultText: 'Unauthorized access', description: '401 error message' },
  
  // Validation
  { key: 'validation.required', category: 'validation', defaultText: 'This field is required', description: 'Required field error' },
  { key: 'validation.email_invalid', category: 'validation', defaultText: 'Please enter a valid email', description: 'Invalid email error' },
  { key: 'validation.password_short', category: 'validation', defaultText: 'Password must be at least 8 characters', description: 'Password too short error' },
  { key: 'validation.password_mismatch', category: 'validation', defaultText: 'Passwords do not match', description: 'Password mismatch error' },
  
  // Wallet
  { key: 'wallet.balance', category: 'payments', defaultText: 'Balance', description: 'Wallet balance label' },
  { key: 'wallet.withdraw', category: 'payments', defaultText: 'Withdraw', description: 'Withdraw button' },
  { key: 'wallet.deposit', category: 'payments', defaultText: 'Deposit', description: 'Deposit button' },
  { key: 'wallet.transactions', category: 'payments', defaultText: 'Transactions', description: 'Transactions list title' }
];

async function seedTranslations() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📝 Seeding base translations...');
    
    // Check if English language exists
    const englishLang = await Language.findOne({ code: 'EN' });
    if (!englishLang) {
      console.log('⚠️  Warning: English language not found. Run seedLanguages.js first!');
    }
    
    let created = 0;
    let skipped = 0;
    
    for (const transData of baseTranslations) {
      const existing = await Translation.findOne({ key: transData.key });
      
      if (existing) {
        console.log(`⏭️  Translation key ${transData.key} already exists`);
        skipped++;
      } else {
        await Translation.create(transData);
        console.log(`✨ Created translation: ${transData.key} = "${transData.defaultText}"`);
        created++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✨ Created: ${created} translation keys`);
    console.log(`   ⏭️  Skipped: ${skipped} translation keys (already exist)`);
    console.log(`   📝 Total: ${baseTranslations.length} translation keys`);
    
    // Display by category
    const categories = [...new Set(baseTranslations.map(t => t.category))];
    console.log(`\n📂 Keys by category:`);
    for (const cat of categories) {
      const count = baseTranslations.filter(t => t.category === cat).length;
      console.log(`   - ${cat}: ${count} keys`);
    }
    
    console.log('\n✅ Translation seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Use the admin panel to add translations for other languages');
    console.log('   2. Or use the auto-translate feature for initial translations');
    console.log('   3. Review and verify auto-translated content before publishing');
    
  } catch (error) {
    console.error('❌ Error seeding translations:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedTranslations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedTranslations;
