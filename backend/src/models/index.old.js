/**
 * MongoDB Models Index
 * Central export point for all Mongoose models
 */

// Import models
const User = require('./User');
const Content = require('./Content');
const Follow = require('./Follow');
const Comment = require('./Comment');
const Story = require('./Story');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const Gift = require('./Gift');
const GiftTransaction = require('./GiftTransaction');
const Livestream = require('./Livestream');
const Product = require('./Product');
const Store = require('./Store');
const Order = require('./Order');
const Notification = require('./Notification');
const Message = require('./Message');
const Conversation = require('./Conversation');
const Like = require('./Like');
const Save = require('./Save');
const Share = require('./Share');
const View = require('./View');
const Category = require('./Category');
const Cart = require('./Cart');
const Sound = require('./Sound');
const Setting = require('./Setting');
const Banner = require('./Banner');
const Report = require('./Report');
const Analytics = require('./Analytics');
const PKBattle = require('./PKBattle');
const StreamProvider = require('./StreamProvider');
const Coupon = require('./Coupon');
const Subscription = require('./Subscription');
const SubscriptionTier = require('./SubscriptionTier');

// TODO: Import remaining models as they are created (32 more)
// ... and 32+ more

// Export all models
module.exports = {
  // ✅ Completed Core Models (32/64 = 50%)
  User,
  Content,
  Follow,
  Comment,
  Story,
  Wallet,
  Transaction,
  Gift,
  GiftTransaction,
  Livestream,
  Product,
  Store,
  Order,
  Notification,
  Message,
  Conversation,
  Like,
  Save,
  Share,
  View,
  Category,
  Cart,
  Sound,
  Setting,
  Banner,
  Report,
  Analytics,
  PKBattle,
  StreamProvider,
  Coupon,
  Subscription,
  SubscriptionTier,
  
  // 🚧 TODO: Add as models are created (41 more)
  // Like,
  // Save,
  // Share,
  // View,
  // Sound,
  // Category,
  // Cart,
  // Payment,
  // Shipping,
  // Banner,
  // Setting,
  // AuditLog,
  // Analytics,
  // ContentMetrics,
  // UserActivity,
  // ModerationQueue,
  // Report,
  // Strike,
  // PKBattle,
  // MultiHostSession,
  // LiveShoppingSession,
  // StreamFilter,
  // StreamProvider,
  // CreatorEarnings,
  // CreatorSubscription,
  // SubscriptionTier,
  // CoinPackage,
  // AdCampaign,
  // AITag,
  // AIModeration,
  // ModerationResult,
  // ContentRecommendation,
  // RecommendationMetadata,
  // TrendingRecord,
  // TrendingConfig,
  // ExplorerSection,
  // ScheduledContent,
  // TranscodeJob,
  // UploadSession,
  // VideoQuality,
  // ViewEvent,
  // ContentRights,
  // SellerApplication,
  // SupporterBadge,
  // Level,
  // Tag,
  // Theme,
  // Page,
  // Language,
  // Translation,
  // CustomerService,
  // Coupon,
  // Credit,
};

