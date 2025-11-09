/// API Endpoints for Mixillo Backend
/// All backend endpoints mapped for easy access
/// Base URL: /api/*
class ApiEndpoints {
  // ==================== AUTHENTICATION ====================
  /// MongoDB Auth Routes
  static const String authBase = '/api/auth/mongodb';
  static const String login = '$authBase/login';
  static const String register = '$authBase/register';
  static const String refreshToken = '$authBase/refresh';
  static const String logout = '$authBase/logout';
  static const String getCurrentUser = '$authBase/me';
  static const String updatePassword = '$authBase/password';
  static const String forgotPassword = '$authBase/forgot-password';
  static const String resetPassword = '$authBase/reset-password';
  
  // ==================== USERS ====================
  static const String usersBase = '/api/users/mongodb';
  static String getUserById(String userId) => '$usersBase/$userId';
  static const String updateProfile = '$usersBase/profile';
  static const String uploadAvatar = '$usersBase/avatar';
  static String getUserFollowers(String userId) => '$usersBase/$userId/followers';
  static String getUserFollowing(String userId) => '$usersBase/$userId/following';
  static String followUser(String userId) => '$usersBase/$userId/follow';
  static String unfollowUser(String userId) => '$usersBase/$userId/unfollow';
  static String blockUser(String userId) => '$usersBase/$userId/block';
  static String getUserStats(String userId) => '$usersBase/$userId/stats';
  
  // ==================== CONTENT (Videos/Posts) ====================
  static const String contentBase = '/api/content/mongodb';
  static const String contentFeed = '$contentBase/feed';
  static const String contentUpload = '$contentBase/upload';
  static const String initiateUpload = '$contentBase/upload/initiate';
  static const String uploadChunk = '$contentBase/upload/chunk';
  static const String completeUpload = '$contentBase/upload/complete';
  static String getContentById(String contentId) => '$contentBase/$contentId';
  static String updateContent(String contentId) => '$contentBase/$contentId';
  static String deleteContent(String contentId) => '$contentBase/$contentId';
  static String likeContent(String contentId) => '$contentBase/$contentId/like';
  static String unlikeContent(String contentId) => '$contentBase/$contentId/unlike';
  static String getUserContent(String userId) => '$contentBase/user/$userId';
  static const String trendingContent = '$contentBase/trending';
  static const String forYouFeed = '$contentBase/for-you';
  static const String followingFeed = '$contentBase/following';
  
  // ==================== COMMENTS ====================
  static const String commentsBase = '/api/comments/mongodb';
  static String getContentComments(String contentId) => '$commentsBase/content/$contentId';
  static const String createComment = '$commentsBase';
  static String updateComment(String commentId) => '$commentsBase/$commentId';
  static String deleteComment(String commentId) => '$commentsBase/$commentId';
  static String likeComment(String commentId) => '$commentsBase/$commentId/like';
  static String replyToComment(String commentId) => '$commentsBase/$commentId/reply';
  
  // ==================== STORIES ====================
  static const String storiesBase = '/api/stories/mongodb';
  static const String getActiveStories = '$storiesBase/active';
  static const String createStory = '$storiesBase';
  static String getStoryById(String storyId) => '$storiesBase/$storyId';
  static String deleteStory(String storyId) => '$storiesBase/$storyId';
  static String viewStory(String storyId) => '$storiesBase/$storyId/view';
  
  // ==================== LIVE STREAMING ====================
  static const String streamingBase = '/api/streaming/mongodb';
  static const String getStreamProviders = '$streamingBase/providers';
  static const String getLiveStreams = '$streamingBase/livestreams';
  static const String startStream = '$streamingBase/start';
  static const String endStream = '$streamingBase/end';
  static String joinStream(String streamId) => '$streamingBase/$streamId/join';
  static String leaveStream(String streamId) => '$streamingBase/$streamId/leave';
  static String getStreamDetails(String streamId) => '$streamingBase/$streamId';
  
  // ==================== PK BATTLES ====================
  static const String pkBattlesBase = '/api/pkBattles/mongodb';
  static const String startPkBattle = '$pkBattlesBase/start';
  static String joinPkBattle(String battleId) => '$pkBattlesBase/$battleId/join';
  static String endPkBattle(String battleId) => '$pkBattlesBase/$battleId/end';
  static String getPkBattleDetails(String battleId) => '$pkBattlesBase/$battleId';
  
  // ==================== MULTI-HOST ====================
  static const String multiHostBase = '/api/multiHost/mongodb';
  static const String createMultiHostSession = '$multiHostBase/create';
  static String inviteToMultiHost(String sessionId) => '$multiHostBase/$sessionId/invite';
  static String joinMultiHost(String sessionId) => '$multiHostBase/$sessionId/join';
  static String leaveMultiHost(String sessionId) => '$multiHostBase/$sessionId/leave';
  
  // ==================== GIFTS ====================
  static const String giftsBase = '/api/gifts/mongodb';
  static const String getGiftsCatalog = '$giftsBase/catalog';
  static const String sendGift = '$giftsBase/send';
  static String getGiftTransactions(String userId) => '$giftsBase/transactions/$userId';
  
  // ==================== MESSAGING ====================
  static const String messagingBase = '/api/messaging/mongodb';
  static const String getConversations = '$messagingBase/conversations';
  static String getMessages(String conversationId) => '$messagingBase/$conversationId/messages';
  static const String sendMessage = '$messagingBase/send';
  static String markAsRead(String conversationId) => '$messagingBase/$conversationId/read';
  static String deleteMessage(String messageId) => '$messagingBase/$messageId';
  
  // ==================== NOTIFICATIONS ====================
  static const String notificationsBase = '/api/notifications/mongodb';
  static const String getNotifications = '$notificationsBase';
  static const String markNotificationRead = '$notificationsBase/read';
  static const String markAllRead = '$notificationsBase/read-all';
  static String deleteNotification(String notificationId) => '$notificationsBase/$notificationId';
  static const String getUnreadCount = '$notificationsBase/unread-count';
  
  // ==================== SEARCH ====================
  static const String searchBase = '/api/search/mongodb';
  static const String searchAll = '$searchBase';
  static const String searchUsers = '$searchBase/users';
  static const String searchVideos = '$searchBase/videos';
  static const String searchHashtags = '$searchBase/hashtags';
  static const String searchSounds = '$searchBase/sounds';
  static const String getTrendingHashtags = '$searchBase/trending/hashtags';
  static const String getTrendingSounds = '$searchBase/trending/sounds';
  
  // ==================== PRODUCTS ====================
  static const String productsBase = '/api/products/mongodb';
  static const String getProducts = '$productsBase';
  static const String createProduct = '$productsBase';
  static String getProductById(String productId) => '$productsBase/$productId';
  static String updateProduct(String productId) => '$productsBase/$productId';
  static String deleteProduct(String productId) => '$productsBase/$productId';
  static const String getBestSellers = '$productsBase/featured/best-sellers';
  static String getSellerProducts(String sellerId) => '$productsBase?sellerId=$sellerId';
  
  // ==================== CART ====================
  static const String cartBase = '/api/cart/mongodb';
  static const String getCart = '$cartBase';
  static const String addToCart = '$cartBase/add';
  static String updateCartItem(String itemId) => '$cartBase/$itemId';
  static String removeFromCart(String itemId) => '$cartBase/$itemId';
  static const String clearCart = '$cartBase/clear';
  
  // ==================== ORDERS ====================
  static const String ordersBase = '/api/orders/mongodb';
  static const String createOrder = '$ordersBase';
  static const String getUserOrders = '$ordersBase';
  static String getOrderById(String orderId) => '$ordersBase/$orderId';
  static String updateOrderStatus(String orderId) => '$ordersBase/$orderId/status';
  static String cancelOrder(String orderId) => '$ordersBase/$orderId/cancel';
  
  // ==================== CATEGORIES ====================
  static const String categoriesBase = '/api/categories/mongodb';
  static const String getCategories = '$categoriesBase';
  static String getCategoryById(String categoryId) => '$categoriesBase/$categoryId';
  
  // ==================== WALLETS ====================
  static const String walletsBase = '/api/wallets/mongodb';
  static String getWallet(String userId) => '$walletsBase/$userId';
  static const String purchaseCoins = '$walletsBase/purchase';
  static const String withdrawFunds = '$walletsBase/withdraw';
  static String getTransactions(String userId) => '$walletsBase/$userId/transactions';
  static String getTransactionById(String transactionId) => '$walletsBase/transactions/$transactionId';
  
  // ==================== STORES ====================
  static const String storesBase = '/api/stores/mongodb';
  static const String applyForStore = '$storesBase/apply';
  static String getStoreById(String storeId) => '$storesBase/$storeId';
  static String getStoreByUserId(String userId) => '$storesBase/user/$userId';
  static String updateStore(String storeId) => '$storesBase/$storeId';
  
  // ==================== ANALYTICS ====================
  static const String analyticsBase = '/api/analytics/mongodb';
  static const String getOverview = '$analyticsBase/overview';
  static String getUserAnalytics(String userId) => '$analyticsBase/user/$userId';
  static String getContentAnalytics(String contentId) => '$analyticsBase/content/$contentId';
  
  // ==================== SETTINGS ====================
  static const String settingsBase = '/api/settings/mongodb';
  static const String getSettings = '$settingsBase';
  static const String updateSettings = '$settingsBase';
  
  // ==================== CLOUDINARY ====================
  static const String cloudinaryBase = '/api/cloudinary';
  static const String getSignature = '$cloudinaryBase/signature';
  static const String uploadToCloudinary = '$cloudinaryBase/upload';
  
  // ==================== ADMIN ====================
  static const String adminBase = '/api/admin/mongodb';
  static const String getAdminDashboard = '$adminBase/dashboard';
  static const String getAllUsers = '$adminBase/users';
  static String updateUserStatus(String userId) => '$adminBase/users/$userId/status';
  static String makeUserSeller(String userId) => '$adminBase/users/$userId/make-seller';
  static const String getSellerApplications = '$adminBase/seller-applications';
  static String approveSellerApplication(String appId) => '$adminBase/seller-applications/$appId/approve';
  static String rejectSellerApplication(String appId) => '$adminBase/seller-applications/$appId/reject';
  
  // ==================== MODERATION ====================
  static const String moderationBase = '/api/moderation/mongodb';
  static const String reportContent = '$moderationBase/report';
  static const String getModerationQueue = '$moderationBase/queue';
  static String moderateContent(String contentId) => '$moderationBase/$contentId/moderate';
}
