/**
 * MongoDB Models Index - COMPLETE
 * All 64 models for Mixillo platform
 */

// Core & Authentication (2)
const User = require('./User');
const Follow = require('./Follow');

// Content & Social (9)
const Content = require('./Content');
const Comment = require('./Comment');
const Story = require('./Story');
const Like = require('./Like');
const Save = require('./Save');
const Share = require('./Share');
const View = require('./View');

// Messaging (2)
const Conversation = require('./Conversation');
const Message = require('./Message');

// Live Streaming (5)
const Livestream = require('./Livestream');
const PKBattle = require('./PKBattle');
const StreamProvider = require('./StreamProvider');
const MultiHostSession = require('./MultiHostSession');
const StreamFilter = require('./StreamFilter');

// E-commerce (8)
const Product = require('./Product');
const Store = require('./Store');
const Order = require('./Order');
const Cart = require('./Cart');
const Category = require('./Category');
const Coupon = require('./Coupon');
const Payment = require('./Payment');
const Shipping = require('./Shipping');

// Finance (4)
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const Gift = require('./Gift');
const GiftTransaction = require('./GiftTransaction');

// Creator Monetization (5)
const Subscription = require('./Subscription');
const SubscriptionTier = require('./SubscriptionTier');
const CreatorEarnings = require('./CreatorEarnings');
const CoinPackage = require('./CoinPackage');
const LiveShoppingSession = require('./LiveShoppingSession');

// System (5)
const Notification = require('./Notification');
const Report = require('./Report');
const Setting = require('./Setting');
const Banner = require('./Banner');
const AuditLog = require('./AuditLog');

// Analytics (4)
const Analytics = require('./Analytics');
const ContentMetrics = require('./ContentMetrics');
const UserActivity = require('./UserActivity');
const TrendingRecord = require('./TrendingRecord');

// AI & Moderation (2)
const AIModeration = require('./AIModeration');
const ModerationQueue = require('./ModerationQueue');

// Advanced Features (8)
const Sound = require('./Sound');
const ScheduledContent = require('./ScheduledContent');
const TranscodeJob = require('./TranscodeJob');
const UploadSession = require('./UploadSession');
const VideoQuality = require('./VideoQuality');
const ContentRights = require('./ContentRights');
const SellerApplication = require('./SellerApplication');
const Strike = require('./Strike');

// Recommendations & Search (3)
const ContentRecommendation = require('./ContentRecommendation');
const RecommendationMetadata = require('./RecommendationMetadata');
const SearchQuery = require('./SearchQuery');

// UI & Content (4)
const SupporterBadge = require('./SupporterBadge');
const Level = require('./Level');
const Tag = require('./Tag');
const Theme = require('./Theme');

// Support & Marketing (4)
const CustomerService = require('./CustomerService');
const AdCampaign = require('./AdCampaign');
const ExplorerSection = require('./ExplorerSection');
const TrendingConfig = require('./TrendingConfig');
const LiveChat = require('./LiveChat');
const ShippingMethod = require('./ShippingMethod');
const ShippingZone = require('./ShippingZone');

// i18n (2)
const Language = require('./Language');
const Translation = require('./Translation');

// Misc (2)
const Credit = require('./Credit');

// Export all 64 models
module.exports = {
  // Core & Authentication
  User,
  Follow,
  
  // Content & Social
  Content,
  Comment,
  Story,
  Like,
  Save,
  Share,
  View,
  
  // Messaging
  Conversation,
  Message,
  
  // Live Streaming
  Livestream,
  PKBattle,
  StreamProvider,
  MultiHostSession,
  StreamFilter,
  
  // E-commerce
  Product,
  Store,
  Order,
  Cart,
  Category,
  Coupon,
  Payment,
  Shipping,
  
  // Finance
  Wallet,
  Transaction,
  Gift,
  GiftTransaction,
  
  // Creator Monetization
  Subscription,
  SubscriptionTier,
  CreatorEarnings,
  CoinPackage,
  LiveShoppingSession,
  
  // System
  Notification,
  Report,
  Setting,
  Banner,
  AuditLog,
  
  // Analytics
  Analytics,
  ContentMetrics,
  UserActivity,
  TrendingRecord,
  
  // AI & Moderation
  AIModeration,
  ModerationQueue,
  Strike,
  
  // Advanced Features
  Sound,
  ScheduledContent,
  TranscodeJob,
  UploadSession,
  VideoQuality,
  ContentRights,
  SellerApplication,
  
  // Recommendations & Search
  ContentRecommendation,
  RecommendationMetadata,
  SearchQuery,
  
  // UI & Gamification
  SupporterBadge,
  Level,
  Tag,
  Theme,
  
  // Support & Marketing
  CustomerService,
  AdCampaign,
  ExplorerSection,
  TrendingConfig,
  LiveChat,
  ShippingMethod,
  ShippingZone,
  
  // i18n
  Language,
  Translation,
  
  // Misc
  Credit
};

