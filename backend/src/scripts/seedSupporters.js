const mongoose = require('mongoose');
require('dotenv').config();
const { CreditPackage } = require('../models/Credit');
const { Gift } = require('../models/Gift');
const { SupporterBadge, SupporterTier } = require('../models/SupporterBadge');

async function seedSupporters() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    // ============ Seed Credit Packages ============
    console.log('\n💰 Seeding credit packages...');
    
    const packages = [
      {
        name: 'starter',
        displayName: 'Starter Pack',
        description: 'Perfect for trying out gifts',
        credits: 100,
        bonusCredits: 0,
        price: { amount: 0.99, currency: 'USD' },
        popular: false,
        icon: '💎',
        order: 1
      },
      {
        name: 'basic',
        displayName: 'Basic Pack',
        description: 'Great value for regular gifters',
        credits: 500,
        bonusCredits: 50,
        price: { amount: 4.99, currency: 'USD' },
        popular: true,
        badge: 'POPULAR',
        icon: '💎💎',
        order: 2
      },
      {
        name: 'premium',
        displayName: 'Premium Pack',
        description: 'Best value - 20% bonus credits',
        credits: 1200,
        bonusCredits: 300,
        price: { amount: 9.99, currency: 'USD' },
        discountPercentage: 20,
        featured: true,
        badge: 'BEST VALUE',
        icon: '💎💎💎',
        order: 3
      },
      {
        name: 'mega',
        displayName: 'Mega Pack',
        description: 'For serious supporters',
        credits: 3000,
        bonusCredits: 1000,
        price: { amount: 24.99, currency: 'USD' },
        discountPercentage: 25,
        icon: '💎💎💎💎',
        firstTimeBonusCredits: 500,
        order: 4
      },
      {
        name: 'ultra',
        displayName: 'Ultra Pack',
        description: 'Maximum credits and bonuses',
        credits: 10000,
        bonusCredits: 5000,
        price: { amount: 99.99, currency: 'USD' },
        discountPercentage: 33,
        featured: true,
        icon: '💎💎💎💎💎',
        firstTimeBonusCredits: 2000,
        minUserLevel: 2,
        order: 5
      }
    ];
    
    let packagesCreated = 0;
    for (const pkg of packages) {
      const existing = await CreditPackage.findOne({ name: pkg.name });
      if (!existing) {
        await CreditPackage.create(pkg);
        console.log(`✨ Created package: ${pkg.displayName} - ${pkg.credits + pkg.bonusCredits} credits for $${pkg.price.amount}`);
        packagesCreated++;
      } else {
        console.log(`⏭️  Package "${pkg.displayName}" already exists`);
      }
    }
    
    // ============ Seed Gifts ============
    console.log('\n🎁 Seeding gifts...');
    
    const gifts = [
      // Common Emoji Gifts
      { name: 'heart', displayName: '❤️ Heart', description: 'Show some love', category: 'emoji', rarity: 'common', price: 10, media: { icon: '❤️', duration: 1000 }, effects: { screenEffect: 'hearts' }, order: 1 },
      { name: 'like', displayName: '👍 Like', description: 'Give a thumbs up', category: 'emoji', rarity: 'common', price: 5, media: { icon: '👍', duration: 500 }, order: 2 },
      { name: 'clap', displayName: '👏 Clap', description: 'Show appreciation', category: 'emoji', rarity: 'common', price: 8, media: { icon: '👏', duration: 800 }, order: 3 },
      { name: 'fire', displayName: '🔥 Fire', description: 'That\'s hot!', category: 'emoji', rarity: 'common', price: 15, media: { icon: '🔥', duration: 1200 }, order: 4 },
      
      // Rare Stickers
      { name: 'star', displayName: '⭐ Star', description: 'You\'re a star!', category: 'sticker', rarity: 'rare', price: 50, media: { icon: '⭐', duration: 2000 }, effects: { screenEffect: 'stars' }, popular: true, order: 5 },
      { name: 'crown', displayName: '👑 Crown', description: 'Royal treatment', category: 'sticker', rarity: 'rare', price: 100, media: { icon: '👑', duration: 2500 }, order: 6 },
      { name: 'diamond', displayName: '💎 Diamond', description: 'Precious and valuable', category: 'sticker', rarity: 'rare', price: 75, media: { icon: '💎', duration: 2000 }, effects: { screenEffect: 'sparkles' }, order: 7 },
      
      // Epic Animated Gifts
      { name: 'rainbow', displayName: '🌈 Rainbow', description: 'Colorful magic', category: 'animated', rarity: 'epic', price: 200, media: { icon: '🌈', duration: 3000 }, effects: { screenEffect: 'confetti' }, featured: true, order: 8 },
      { name: 'fireworks', displayName: '🎆 Fireworks', description: 'Explosive celebration', category: 'animated', rarity: 'epic', price: 250, media: { icon: '🎆', duration: 4000 }, effects: { screenEffect: 'fireworks', vibrate: true }, combo: { enabled: true, minCount: 3, bonusMultiplier: 1.5, comboWindow: 10 }, order: 9 },
      { name: 'rocket', displayName: '🚀 Rocket', description: 'To the moon!', category: 'animated', rarity: 'epic', price: 300, media: { icon: '🚀', duration: 3500 }, effects: { flashScreen: true }, order: 10 },
      
      // Legendary Luxury Gifts
      { name: 'golden_rose', displayName: '🌹 Golden Rose', description: 'Exclusive luxury gift', category: 'luxury', rarity: 'legendary', price: 1000, media: { icon: '🌹', duration: 5000 }, effects: { screenEffect: 'custom', customEffect: 'golden-petals', flashScreen: true }, receiverBenefits: { experiencePoints: 100, creditsBonus: 50 }, featured: true, order: 11 },
      { name: 'luxury_car', displayName: '🚗 Luxury Car', description: 'Dream car gift', category: 'luxury', rarity: 'legendary', price: 2500, media: { icon: '🚗', duration: 6000 }, effects: { screenEffect: 'custom', vibrate: true, flashScreen: true }, receiverBenefits: { experiencePoints: 250, creditsBonus: 150 }, order: 12 },
      { name: 'yacht', displayName: '🛥️ Yacht', description: 'Ultimate luxury', category: 'luxury', rarity: 'legendary', price: 5000, media: { icon: '🛥️', duration: 8000 }, effects: { screenEffect: 'custom', vibrate: true, flashScreen: true }, receiverBenefits: { experiencePoints: 500, creditsBonus: 500 }, availability: { requiredTier: 'gold' }, order: 13 },
      
      // Mythic Ultra-Rare Gifts
      { name: 'meteor_shower', displayName: '☄️ Meteor Shower', description: 'Cosmic spectacle', category: 'effect', rarity: 'mythic', price: 10000, media: { icon: '☄️', duration: 10000 }, effects: { screenEffect: 'custom', customEffect: 'meteor-rain', vibrate: true, flashScreen: true }, receiverBenefits: { experiencePoints: 1000, creditsBonus: 1000, badgeProgress: 100 }, availability: { requiredTier: 'platinum', limitedEdition: true, maxQuantity: 100 }, featured: true, newRelease: true, order: 14 },
      
      // Seasonal Gifts
      { name: 'christmas_tree', displayName: '🎄 Christmas Tree', description: 'Holiday spirit', category: 'seasonal', rarity: 'rare', price: 150, media: { icon: '🎄', duration: 3000 }, effects: { screenEffect: 'snow' }, tags: ['christmas', 'holiday'], order: 15 },
      { name: 'jack_o_lantern', displayName: '🎃 Jack-O-Lantern', description: 'Spooky fun', category: 'seasonal', rarity: 'rare', price: 120, media: { icon: '🎃', duration: 2500 }, tags: ['halloween'], order: 16 }
    ];
    
    let giftsCreated = 0;
    for (const gift of gifts) {
      const existing = await Gift.findOne({ name: gift.name });
      if (!existing) {
        await Gift.create(gift);
        console.log(`✨ Created gift: ${gift.displayName} (${gift.rarity}) - ${gift.price} credits`);
        giftsCreated++;
      } else {
        console.log(`⏭️  Gift "${gift.displayName}" already exists`);
      }
    }
    
    // ============ Seed Supporter Badges ============
    console.log('\n🏆 Seeding supporter badges...');
    
    const badges = [
      {
        name: 'first_gift',
        displayName: 'First Gift',
        description: 'Sent your first gift',
        category: 'milestone',
        tier: 1,
        appearance: { icon: '🎁', color: '#10B981', rarity: 'common' },
        requirements: { type: 'gifts_sent', value: 1 },
        pointValue: 10,
        order: 1
      },
      {
        name: 'generous',
        displayName: 'Generous',
        description: 'Spent 1,000 credits on gifts',
        category: 'spending',
        tier: 2,
        appearance: { icon: '💝', color: '#6366F1', rarity: 'rare' },
        requirements: { type: 'spending', value: 1000 },
        benefits: { discountPercentage: 5, chatBadge: true },
        pointValue: 50,
        order: 2
      },
      {
        name: 'super_supporter',
        displayName: 'Super Supporter',
        description: 'Spent 10,000 credits',
        category: 'spending',
        tier: 3,
        appearance: { icon: '🌟', color: '#EC4899', rarity: 'epic', glowEffect: true },
        requirements: { type: 'spending', value: 10000 },
        benefits: { discountPercentage: 10, creditsBonus: 500, profileBadge: true, chatBadge: true },
        pointValue: 200,
        featured: true,
        order: 3
      },
      {
        name: 'legendary_gifter',
        displayName: 'Legendary Gifter',
        description: 'Spent 50,000 credits',
        category: 'spending',
        tier: 5,
        appearance: { icon: '👑', color: '#F59E0B', rarity: 'legendary', glowEffect: true },
        requirements: { type: 'spending', value: 50000 },
        benefits: { discountPercentage: 20, creditsBonus: 5000, profileBadge: true, chatBadge: true, prioritySupport: true, specialFeatures: ['exclusive_gifts', 'custom_emoji'] },
        pointValue: 1000,
        featured: true,
        order: 4
      },
      {
        name: 'popular_creator',
        displayName: 'Popular Creator',
        description: 'Received gifts from 100 supporters',
        category: 'milestone',
        tier: 3,
        appearance: { icon: '⭐', color: '#8B5CF6', rarity: 'epic' },
        requirements: { type: 'supporters_count', value: 100 },
        benefits: { profileBadge: true },
        pointValue: 150,
        order: 5
      },
      {
        name: 'loyal_supporter',
        displayName: 'Loyal Supporter',
        description: 'Active for 30 consecutive days',
        category: 'loyalty',
        tier: 2,
        appearance: { icon: '🔥', color: '#EF4444', rarity: 'rare' },
        requirements: { type: 'days_active', value: 30, consecutiveDays: 30 },
        benefits: { chatBadge: true, creditsBonus: 100 },
        pointValue: 75,
        order: 6
      }
    ];
    
    let badgesCreated = 0;
    for (const badge of badges) {
      const existing = await SupporterBadge.findOne({ name: badge.name });
      if (!existing) {
        await SupporterBadge.create(badge);
        console.log(`✨ Created badge: ${badge.displayName} (${badge.appearance.rarity})`);
        badgesCreated++;
      } else {
        console.log(`⏭️  Badge "${badge.displayName}" already exists`);
      }
    }
    
    // ============ Seed Supporter Tiers ============
    console.log('\n🎯 Seeding supporter tiers...');
    
    const tiers = [
      {
        name: 'bronze',
        displayName: 'Bronze Supporter',
        description: 'Entry level supporter',
        tier: 1,
        appearance: { icon: '🥉', color: '#CD7F32' },
        requirements: { totalSpent: 0 },
        benefits: { discountPercentage: 0, bonusCreditsMultiplier: 1 }
      },
      {
        name: 'silver',
        displayName: 'Silver Supporter',
        description: 'Active supporter with benefits',
        tier: 2,
        appearance: { icon: '🥈', color: '#C0C0C0' },
        requirements: { totalSpent: 500 },
        benefits: { discountPercentage: 5, bonusCreditsMultiplier: 1.05, features: ['priority_notifications'] }
      },
      {
        name: 'gold',
        displayName: 'Gold Supporter',
        description: 'Premium supporter with exclusive gifts',
        tier: 3,
        appearance: { icon: '🥇', color: '#FFD700' },
        requirements: { totalSpent: 2000 },
        benefits: { discountPercentage: 10, bonusCreditsMultiplier: 1.1, features: ['priority_notifications', 'exclusive_emojis'] }
      },
      {
        name: 'platinum',
        displayName: 'Platinum Supporter',
        description: 'Elite supporter with VIP access',
        tier: 4,
        appearance: { icon: '💫', color: '#E5E4E2' },
        requirements: { totalSpent: 5000 },
        benefits: { discountPercentage: 15, bonusCreditsMultiplier: 1.15, features: ['priority_notifications', 'exclusive_emojis', 'vip_chat', 'early_access'] }
      },
      {
        name: 'diamond',
        displayName: 'Diamond Supporter',
        description: 'Ultimate supporter - highest tier',
        tier: 5,
        appearance: { icon: '💎', color: '#B9F2FF' },
        requirements: { totalSpent: 10000 },
        benefits: { discountPercentage: 20, bonusCreditsMultiplier: 1.2, features: ['priority_notifications', 'exclusive_emojis', 'vip_chat', 'early_access', 'custom_badge', 'personal_manager'] }
      }
    ];
    
    let tiersCreated = 0;
    for (const tier of tiers) {
      const existing = await SupporterTier.findOne({ name: tier.name });
      if (!existing) {
        await SupporterTier.create(tier);
        console.log(`✨ Created tier: ${tier.displayName} - ${tier.requirements.totalSpent}+ credits spent`);
        tiersCreated++;
      } else {
        console.log(`⏭️  Tier "${tier.displayName}" already exists`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   💰 Credit Packages: ${packagesCreated} created`);
    console.log(`   🎁 Gifts: ${giftsCreated} created`);
    console.log(`   🏆 Badges: ${badgesCreated} created`);
    console.log(`   🎯 Tiers: ${tiersCreated} created`);
    
    console.log('\n✅ Supporters system seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test credit purchase: POST /api/supporters/packages/purchase');
    console.log('   2. Get all gifts: GET /api/supporters/gifts');
    console.log('   3. Send a gift: POST /api/supporters/gifts/send');
    console.log('   4. View leaderboards: GET /api/supporters/leaderboard/gifting');
    console.log('   5. Check user badges: GET /api/supporters/badges/user');
    
  } catch (error) {
    console.error('❌ Error seeding supporters:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedSupporters()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedSupporters;
