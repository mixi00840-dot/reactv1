require('dotenv').config();
const mongoose = require('mongoose');
const Currency = require('../models/Currency');

const currencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchangeRate: 1.00,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: true,
    decimalPlaces: 2,
    country: 'United States',
    flag: '🇺🇸'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    exchangeRate: 0.92,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'European Union',
    flag: '🇪🇺'
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    exchangeRate: 0.79,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'United Kingdom',
    flag: '🇬🇧'
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    exchangeRate: 149.50,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 0,
    country: 'Japan',
    flag: '🇯🇵'
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    exchangeRate: 7.24,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'China',
    flag: '🇨🇳'
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    exchangeRate: 83.12,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'India',
    flag: '🇮🇳'
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    exchangeRate: 1.53,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Australia',
    flag: '🇦🇺'
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    exchangeRate: 1.36,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Canada',
    flag: '🇨🇦'
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    exchangeRate: 0.88,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Switzerland',
    flag: '🇨🇭'
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    exchangeRate: 4.97,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Brazil',
    flag: '🇧🇷'
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    exchangeRate: 17.08,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Mexico',
    flag: '🇲🇽'
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    exchangeRate: 18.65,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'South Africa',
    flag: '🇿🇦'
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    exchangeRate: 1.34,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Singapore',
    flag: '🇸🇬'
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    exchangeRate: 7.83,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Hong Kong',
    flag: '🇭🇰'
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    exchangeRate: 1319.50,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 0,
    country: 'South Korea',
    flag: '🇰🇷'
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    exchangeRate: 10.87,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Sweden',
    flag: '🇸🇪'
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    exchangeRate: 10.93,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Norway',
    flag: '🇳🇴'
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    exchangeRate: 6.89,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Denmark',
    flag: '🇩🇰'
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    exchangeRate: 4.02,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Poland',
    flag: '🇵🇱'
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    exchangeRate: 35.70,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Thailand',
    flag: '🇹🇭'
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    exchangeRate: 15650.00,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 0,
    country: 'Indonesia',
    flag: '🇮🇩'
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    exchangeRate: 4.72,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Malaysia',
    flag: '🇲🇾'
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    exchangeRate: 56.25,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Philippines',
    flag: '🇵🇭'
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    exchangeRate: 24450.00,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 0,
    country: 'Vietnam',
    flag: '🇻🇳'
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    exchangeRate: 3.67,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'United Arab Emirates',
    flag: '🇦🇪'
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: '﷼',
    exchangeRate: 3.75,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Saudi Arabia',
    flag: '🇸🇦'
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    exchangeRate: 28.75,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Turkey',
    flag: '🇹🇷'
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    exchangeRate: 92.50,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Russia',
    flag: '🇷🇺'
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    exchangeRate: 1.65,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'New Zealand',
    flag: '🇳🇿'
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    exchangeRate: 350.00,
    baseCurrency: 'USD',
    isActive: true,
    isDefault: false,
    decimalPlaces: 2,
    country: 'Argentina',
    flag: '🇦🇷'
  }
];

async function seedCurrencies() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing currencies...');
    await Currency.deleteMany({});

    console.log('📝 Seeding currencies...');
    const created = await Currency.insertMany(currencies);

    console.log(`✅ Successfully seeded ${created.length} currencies`);
    console.log('\nCurrencies added:');
    created.forEach(currency => {
      console.log(`  ${currency.flag} ${currency.code} - ${currency.name} (${currency.symbol})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedCurrencies();
