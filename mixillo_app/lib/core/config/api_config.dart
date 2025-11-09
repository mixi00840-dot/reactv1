class ApiConfig {
  // Base URLs
  static const String baseUrl = 'https://your-backend-url.com/api';
  static const String mongodbApiUrl = '$baseUrl';
  
  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String usersEndpoint = '/users';
  static const String productsEndpoint = '/products';
  static const String cartEndpoint = '/cart';
  static const String ordersEndpoint = '/orders';
  static const String messagesEndpoint = '/messages';
  static const String videosEndpoint = '/videos';
  static const String sellersEndpoint = '/sellers';
  
  // WebSocket
  static const String wsUrl = 'wss://your-backend-url.com';
  
  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String refreshTokenKey = 'refresh_token';
}
