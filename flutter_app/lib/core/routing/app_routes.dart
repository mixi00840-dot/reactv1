class AppRoutes {
  // Auth routes
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';

  // Main navigation routes
  static const String home = '/home';
  static const String explore = '/explore';
  static const String create = '/create';
  static const String messages = '/messages';
  static const String profile = '/profile';

  // Content routes
  static const String contentDetail = '/content/:id';
  static const String contentComments = '/content/:id/comments';
  static const String scheduledPosts = '/scheduled-posts';
  static const String schedulePost = '/schedule-post';

  // User routes
  static const String userProfile = '/user/:id';
  static const String editProfile = '/edit-profile';
  static const String followers = '/followers';
  static const String following = '/following';

  // Messaging routes
  static const String chat = '/chat/:id';
  static const String chatRooms = '/chat-rooms';
  static const String chatRoom = '/chat-room/:id';

  // Shopping routes
  static const String products = '/products';
  static const String productDetail = '/product/:id';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String orders = '/orders';
  static const String orderDetail = '/order/:id';
  static const String wishlist = '/wishlist';

  // Wallet routes
  static const String wallet = '/wallet';
  static const String transactions = '/transactions';
  static const String topUp = '/top-up';
  static const String withdrawal = '/withdrawal';

  // Live streaming routes
  static const String liveStreams = '/live-streams';
  static const String liveStream = '/live-stream/:id';
  static const String startLive = '/start-live';
  static const String liveSchedule = '/live-schedule';
  static const String scheduleLive = '/schedule-live';

  // Notifications routes
  static const String notifications = '/notifications';
  static const String notificationSettings = '/notification-settings';

  // Settings routes
  static const String settings = '/settings';
  static const String privacySettings = '/privacy-settings';
  static const String accountSettings = '/account-settings';
  static const String languageSettings = '/language-settings';
  static const String about = '/about';

  // Profile features routes
  static const String addresses = '/addresses';
  static const String addEditAddress = '/add-edit-address';
  static const String paymentMethods = '/payment-methods';
  static const String addPaymentMethod = '/add-payment-method';
  static const String coupons = '/coupons';
  static const String badges = '/badges';
  static const String analytics = '/analytics';
  static const String coins = '/coins';

  // Support routes
  static const String faq = '/faq';
  static const String report = '/report';

  // Helper methods
  static String contentDetailRoute(String id) => '/content/$id';
  static String contentCommentsRoute(String id) => '/content/$id/comments';
  static String userProfileRoute(String id) => '/user/$id';
  static String chatRoute(String id) => '/chat/$id';
  static String chatRoomRoute(String id) => '/chat-room/$id';
  static String productDetailRoute(String id) => '/product/$id';
  static String orderDetailRoute(String id) => '/order/$id';
  static String liveStreamRoute(String id) => '/live-stream/$id';
}
