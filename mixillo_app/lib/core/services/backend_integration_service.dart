import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

/// Backend Integration Service
/// Handles all API calls to the Node.js backend
class BackendIntegrationService {
  static final BackendIntegrationService _instance = BackendIntegrationService._internal();
  factory BackendIntegrationService() => _instance;
  BackendIntegrationService._internal();

  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _accessToken;
  String? _refreshToken;

  /// Initialize service with base configuration
  Future<void> initialize() async {
    _dio.options.baseUrl = '${ApiConstants.baseUrl}${ApiConstants.apiVersion}';
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    
    // Add interceptors
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token if available
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - refresh token
        if (error.response?.statusCode == 401 && _refreshToken != null) {
          try {
            await _refreshAccessToken();
            // Retry original request
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $_accessToken';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          } catch (e) {
            // Refresh failed, logout user
            await logout();
            return handler.reject(error);
          }
        }
        return handler.next(error);
      },
    ));

    // Load stored tokens
    _accessToken = await _storage.read(key: 'access_token');
    _refreshToken = await _storage.read(key: 'refresh_token');
  }

  // ====================
  // AUTHENTICATION
  // ====================

  /// Register new user
  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
    required String dateOfBirth,
    String? phone,
    String? bio,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.register,
        data: {
          'username': username,
          'email': email,
          'password': password,
          'fullName': fullName,
          'dateOfBirth': dateOfBirth,
          'phone': phone,
          'bio': bio,
        },
      );

      if (response.data['success'] == true) {
        // Store tokens
        _accessToken = response.data['data']['token'];
        _refreshToken = response.data['data']['refreshToken'];
        
        await _storage.write(key: 'access_token', value: _accessToken);
        await _storage.write(key: 'refresh_token', value: _refreshToken);
        
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Registration failed');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Login user
  Future<Map<String, dynamic>> login({
    required String login, // email or username
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'login': login,
          'password': password,
        },
      );

      if (response.data['success'] == true) {
        // Store tokens
        _accessToken = response.data['data']['token'];
        _refreshToken = response.data['data']['refreshToken'];
        
        await _storage.write(key: 'access_token', value: _accessToken);
        await _storage.write(key: 'refresh_token', value: _refreshToken);
        
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Login failed');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Refresh access token
  Future<void> _refreshAccessToken() async {
    final response = await _dio.post(
      '/auth/refresh',
      data: {'refreshToken': _refreshToken},
    );

    if (response.data['success'] == true) {
      _accessToken = response.data['data']['token'];
      await _storage.write(key: 'access_token', value: _accessToken);
    } else {
      throw Exception('Token refresh failed');
    }
  }

  /// Logout user
  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  // ====================
  // USER PROFILE
  // ====================

  /// Get current user profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/users/profile');
      
      if (response.data['success'] == true) {
        return response.data['data']['user'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to get profile');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateProfile({
    String? fullName,
    String? bio,
    String? phone,
    String? dateOfBirth,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (fullName != null) data['fullName'] = fullName;
      if (bio != null) data['bio'] = bio;
      if (phone != null) data['phone'] = phone;
      if (dateOfBirth != null) data['dateOfBirth'] = dateOfBirth;

      final response = await _dio.put('/users/profile', data: data);
      
      if (response.data['success'] == true) {
        return response.data['data']['user'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to update profile');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Search users
  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    try {
      final response = await _dio.get(
        '/users/search',
        queryParameters: {'q': query, 'limit': 20},
      );
      
      if (response.data['success'] == true) {
        final users = response.data['data']['users'] as List;
        return users.cast<Map<String, dynamic>>();
      }
      
      throw Exception(response.data['message'] ?? 'Search failed');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Follow user
  Future<void> followUser(String userId) async {
    try {
      final response = await _dio.post('/users/$userId/follow');
      
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to follow user');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Unfollow user
  Future<void> unfollowUser(String userId) async {
    try {
      final response = await _dio.delete('/users/$userId/follow');
      
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to unfollow user');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // ====================
  // CONTENT MANAGEMENT
  // ====================

  /// Create simple text post
  Future<Map<String, dynamic>> createPost({
    required String title,
    required String description,
    List<String>? hashtags,
    String visibility = 'public',
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.content,
        data: {
          'title': title,
          'description': description,
          'type': 'post',
          'hashtags': hashtags ?? [],
          'visibility': visibility,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data']['content'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to create post');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Get content feed
  Future<List<Map<String, dynamic>>> getContentFeed({
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (type != null) queryParams['type'] = type;

      final response = await _dio.get(
        ApiConstants.content,
        queryParameters: queryParams,
      );
      
      if (response.data['success'] == true) {
        final contents = response.data['data']['contents'] ?? 
                        response.data['data'] ?? [];
        return (contents as List).cast<Map<String, dynamic>>();
      }
      
      return [];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Search content
  Future<List<Map<String, dynamic>>> searchContent(String query) async {
    try {
      final response = await _dio.get(
        '/content/search',
        queryParameters: {'q': query},
      );
      
      if (response.data['success'] == true) {
        final contents = response.data['data']['contents'] ?? 
                        response.data['data'] ?? [];
        return (contents as List).cast<Map<String, dynamic>>();
      }
      
      return [];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  /// Like content
  Future<void> likeContent(String contentId) async {
    try {
      final response = await _dio.post('/content/$contentId/like');
      
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to like content');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // ====================
  // NOTIFICATIONS
  // ====================

  /// Get notifications
  Future<Map<String, dynamic>> getNotifications({
    int limit = 50,
    int offset = 0,
    String? type,
    bool unreadOnly = false,
  }) async {
    try {
      final response = await _dio.get(
        '/notifications',
        queryParameters: {
          'limit': limit,
          'offset': offset,
          if (type != null) 'type': type,
          'unreadOnly': unreadOnly,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to get notifications');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // ====================
  // ANALYTICS
  // ====================

  /// Send interaction data to backend
  Future<void> sendInteractions(List<Map<String, dynamic>> interactions) async {
    try {
      final response = await _dio.post(
        '/analytics/interactions',
        data: {'interactions': interactions},
      );
      
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to send interactions');
      }
    } on DioException catch (e) {
      // Don't throw error for analytics - just log
      print('Analytics error: ${_handleError(e)}');
    }
  }

  /// Get user analytics
  Future<Map<String, dynamic>> getUserAnalytics(String userId) async {
    try {
      final response = await _dio.get('/analytics/user/$userId');
      
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to get analytics');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // ====================
  // WALLET
  // ====================

  /// Get wallet balance
  Future<Map<String, dynamic>> getWalletBalance() async {
    try {
      final response = await _dio.get('/wallets/balance');
      
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      
      throw Exception(response.data['message'] ?? 'Failed to get balance');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // ====================
  // ERROR HANDLING
  // ====================

  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map && data['message'] != null) {
        return data['message'];
      }
      return 'Server error: ${error.response!.statusCode}';
    }
    
    if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    }
    
    if (error.type == DioExceptionType.receiveTimeout) {
      return 'Server is taking too long to respond.';
    }
    
    if (error.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }
    
    return 'An unexpected error occurred.';
  }

  /// Check if user is authenticated
  bool get isAuthenticated => _accessToken != null;

  /// Get current access token
  String? get accessToken => _accessToken;
}
