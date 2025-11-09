class ApiConstants {
  // Base URL - Production backend on Google Cloud Run
  static const String baseUrl = 'https://mixillo-backend-52242135857.europe-west1.run.app';
  
  // For local development, uncomment below:
  // static const String baseUrl = 'http://localhost:5000';
  
  // API Version
  static const String apiVersion = '/api';
  
  // Timeout durations (in milliseconds)
  static const Duration connectTimeout = Duration(milliseconds: 30000);
  static const Duration receiveTimeout = Duration(milliseconds: 30000);
  static const Duration sendTimeout = Duration(milliseconds: 30000);
  
  // Default headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyOtp = '/auth/verify-otp';
  
  // User Endpoints
  static const String users = '/users';
  static String userProfile(String id) => '/users/$id';
  static String updateProfile(String id) => '/users/$id';
  static String followUser(String id) => '/users/$id/follow';
  static String unfollowUser(String id) => '/users/$id/unfollow';
  static String followers(String id) => '/users/$id/followers';
  static String following(String id) => '/users/$id/following';
  static String userContent(String userId) => '/users/$userId/content';
  
  // Content Endpoints
  static const String content = '/content';
  static String contentById(String id) => '/content/$id';
  static const String contentFeed = '/content/feed';
  static const String contentTrending = '/content/trending';
  static String contentLike(String id) => '/content/$id/like';
  static String contentSave(String id) => '/content/$id/save';
  static const String uploadContent = '/content/upload';
  
  // Comments Endpoints
  static const String comments = '/comments';
  static String getContentComments(String contentId) => '/content/$contentId/comments';
  static String createComment(String contentId) => '/content/$contentId/comments';
  static String getComment(String commentId) => '/comments/$commentId';
  static String updateComment(String commentId) => '/comments/$commentId';
  static String deleteComment(String commentId) => '/comments/$commentId';
  static String likeComment(String commentId) => '/comments/$commentId/like';
  static String unlikeComment(String commentId) => '/comments/$commentId/like';
  static String reportComment(String commentId) => '/comments/$commentId/report';
  
  // Stories Endpoints
  static const String stories = '/stories';
  static const String storiesFeed = '/stories/feed';
  static String userStories(String userId) => '/stories/user/$userId';
  static String viewStory(String storyId) => '/stories/$storyId/view';
  static String storyById(String storyId) => '/stories/$storyId';
  static String storyViewers(String storyId) => '/stories/$storyId/viewers';
  static const String myStories = '/stories/my';
  static const String archivedStories = '/stories/archived';
  
  // Sounds Endpoints
  static const String sounds = '/sounds';
  static const String trendingSounds = '/sounds/trending';
  static const String searchSounds = '/sounds/search';
  
  // Live Stream Endpoints
  static const String livestreams = '/streaming/livestreams';
  static const String goLive = '/streaming/livestreams/start';
  static const String endLive = '/streaming/livestreams/{id}/end';
  
  // Shop Endpoints
  static const String products = '/products';
  static const String productById = '/products/{id}';
  static const String stores = '/stores';
  static const String storeById = '/stores/{id}';
  static const String cart = '/cart';
  static const String orders = '/orders';
  static const String createOrder = '/orders';
  
  // Wallet Endpoints
  static const String wallet = '/wallets/{userId}';
  static const String transactions = '/wallets/{userId}/transactions';
  static const String balance = '/wallets/{userId}/balance';
  
  // Gifts Endpoints
  static const String gifts = '/gifts';
  static const String sendGift = '/gifts/send';
  
  // Messages Endpoints
  static const String messages = '/messages';
  static const String conversations = '/messages/conversations';
  static const String sendMessage = '/messages/send';
  
  // Notifications Endpoints
  static const String notifications = '/notifications';
  static const String markAsRead = '/notifications/{id}/read';
  
  // Search Endpoints
  static const String search = '/search';
  static const String searchUsers = '/search/users';
  static const String searchVideos = '/search/videos';
  static const String searchHashtags = '/search/hashtags';
  
  // Analytics Endpoints
  static const String analytics = '/analytics';
  static const String userAnalytics = '/analytics/user';
  
  // Recommendation Endpoints
  static const String recommendations = '/recommendations';
  static const String refreshRecommendations = '/recommendations/refresh';
  static const String recommendationPreferences = '/recommendations/preferences';
  
  // Interaction Tracking Endpoints
  static const String trackInteraction = '/feed/interaction';
  static const String notInterested = '/feed/not-interested';
}
