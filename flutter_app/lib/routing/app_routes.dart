/// App route names
class AppRoutes {
  // Auth routes
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';

  // Main navigation routes
  static const String home = '/home';
  static const String explore = '/explore';
  static const String createPost = '/create-post';
  static const String notifications = '/notifications';
  static const String profile = '/profile';

  // Profile routes
  static const String editProfile = '/edit-profile';
  static const String settings = '/settings';
  static const String accountSettings = '/account-settings';
  static const String privacySettings = '/privacy-settings';
  static const String notificationSettings = '/notification-settings';
  static const String security = '/security';

  // Content routes
  static const String contentDetail = '/content/:id';
  static const String scheduledPosts = '/scheduled-posts';
  static const String schedulePost = '/schedule-post';

  // Shopping routes
  static const String shop = '/shop';
  static const String productList = '/products';
  static const String productDetail = '/product/:id';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orders = '/orders';
  static const String orderDetail = '/order/:id';

  // Live streaming routes
  static const String liveStreams = '/live-streams';
  static const String liveRoom = '/live/:id';
  static const String liveSchedule = '/live-schedule';
  static const String startLive = '/start-live';

  // Messages routes
  static const String messages = '/messages';
  static const String chat = '/chat/:id';

  // Wallet routes
  static const String wallet = '/wallet';
  static const String topUp = '/top-up';
  static const String transactionHistory = '/transaction-history';
  static const String coins = '/coins';

  // Gift routes
  static const String giftShop = '/gift-shop';
  static const String badges = '/badges';

  // Other routes
  static const String analytics = '/analytics';
  static const String addresses = '/addresses';
  static const String paymentMethods = '/payment-methods';
  static const String coupons = '/coupons';
  static const String userProfile = '/user/:id';
}
