const mongoose = require('mongoose');
require('dotenv').config();
const { Language } = require('../models/Language');

const defaultLanguages = [
  {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    enabled: true,
    isDefault: true,
    regionalSettings: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      numberFormat: 'en-US',
      currencyFormat: '$0,0.00',
      firstDayOfWeek: 0
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'AR',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    enabled: true,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      numberFormat: 'ar-SA',
      currencyFormat: '0,0.00 ر.س',
      firstDayOfWeek: 6
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'ES',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    enabled: true,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: 'es-ES',
      currencyFormat: '0,0.00 €',
      firstDayOfWeek: 1
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'FR',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    enabled: true,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: 'fr-FR',
      currencyFormat: '0,0.00 €',
      firstDayOfWeek: 1
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'DE',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      numberFormat: 'de-DE',
      currencyFormat: '0.0,00 €',
      firstDayOfWeek: 1
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'ZH',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: '24h',
      numberFormat: 'zh-CN',
      currencyFormat: '¥0,0.00',
      firstDayOfWeek: 1
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'HI',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      numberFormat: 'hi-IN',
      currencyFormat: '₹0,0.00',
      firstDayOfWeek: 0
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'JA',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: '24h',
      numberFormat: 'ja-JP',
      currencyFormat: '¥0,0',
      firstDayOfWeek: 0
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'PT',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: 'pt-BR',
      currencyFormat: 'R$ 0,0.00',
      firstDayOfWeek: 0
    },
    autoTranslateProvider: 'google'
  },
  {
    code: 'RU',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    enabled: false,
    isDefault: false,
    regionalSettings: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      numberFormat: 'ru-RU',
      currencyFormat: '0 0,00 ₽',
      firstDayOfWeek: 1
    },
    autoTranslateProvider: 'google'
  }
];

async function seedLanguages() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mixillo');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🌍 Seeding languages...');
    
    let created = 0;
    let updated = 0;
    
    for (const langData of defaultLanguages) {
      const existing = await Language.findOne({ code: langData.code });
      
      if (existing) {
        console.log(`⏭️  Language ${langData.code} (${langData.name}) already exists`);
        updated++;
      } else {
        await Language.create(langData);
        console.log(`✨ Created language: ${langData.code} - ${langData.name} (${langData.nativeName})`);
        created++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✨ Created: ${created} languages`);
    console.log(`   ⏭️  Skipped: ${updated} languages (already exist)`);
    console.log(`   🌍 Total: ${defaultLanguages.length} languages`);
    
    // Display enabled languages
    const enabledLangs = await Language.find({ enabled: true });
    console.log(`\n✅ Enabled languages (${enabledLangs.length}):`);
    enabledLangs.forEach(lang => {
      const defaultMark = lang.isDefault ? ' (DEFAULT)' : '';
      const rtlMark = lang.direction === 'rtl' ? ' [RTL]' : '';
      console.log(`   - ${lang.code}: ${lang.name} (${lang.nativeName})${defaultMark}${rtlMark}`);
    });
    
    console.log('\n✅ Language seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding languages:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedLanguages()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedLanguages;
