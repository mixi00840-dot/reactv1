import 'package:dio/dio.dart';
import 'dart:developer' as developer;
import '../constants/api_constants.dart';
import '../network/api_endpoints.dart';
import '../storage/secure_storage.dart';

/// MongoDB Authentication Service
/// Handles JWT-based authentication with MongoDB backend
/// Uses SecureStorage for encrypted token persistence
class MongoDBAuthService {
  static final MongoDBAuthService _instance = MongoDBAuthService._internal();
  factory MongoDBAuthService() => _instance;
  MongoDBAuthService._internal();

  Dio? _dioInstance;
  Dio get dio {
    if (_dioInstance == null) {
      throw StateError('MongoDBAuthService not initialized. Call initialize() first.');
    }
    return _dioInstance!;
  }
  
  final SecureStorageService _secureStorage = SecureStorageService();
  
  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _currentUser;

  /// Initialize the auth service
  Future<void> initialize() async {
    // Setup Dio instance if not already initialized
    if (_dioInstance == null) {
      _dioInstance = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      // Add interceptors
      _dioInstance!.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) async {
            // Attach access token if available
            if (_accessToken != null) {
              options.headers['Authorization'] = 'Bearer $_accessToken';
            }
            developer.log('🌐 ${options.method} ${options.uri}');
            return handler.next(options);
          },
          onError: (error, handler) async {
            // Auto-retry on 401 with token refresh
            if (error.response?.statusCode == 401 && _refreshToken != null) {
              developer.log('🔄 Token expired, attempting refresh...');
              
              try {
                final refreshed = await refreshAccessToken();
                if (refreshed) {
                  // Retry original request with new token
                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $_accessToken';
                  final response = await _dioInstance!.fetch(opts);
                  return handler.resolve(response);
                }
              } catch (e) {
                developer.log('❌ Token refresh failed: $e');
              }
            }
            return handler.next(error);
          },
        ),
      );

      developer.log('✅ MongoDBAuthService initialized');
    }

    // Load saved authentication data
    await _loadSavedAuth();
  }

  /// Load saved authentication data from SecureStorage
  Future<void> _loadSavedAuth() async {
    try {
      _accessToken = await _secureStorage.getAccessToken();
      _refreshToken = await _secureStorage.getRefreshToken();
      final userData = await _secureStorage.getUserData();
      
      if (userData != null) {
        _currentUser = userData;
        developer.log('✅ Restored auth session for user: ${userData['username']}');
      }
    } catch (e) {
      developer.log('⚠️ Error loading saved auth: $e');
    }
  }

  /// Save authentication data to SecureStorage
  Future<void> _saveAuthData(String accessToken, String refreshToken, Map<String, dynamic> user) async {
    try {
      _accessToken = accessToken;
      _refreshToken = refreshToken;
      _currentUser = user;
      
      await _secureStorage.saveAccessToken(accessToken);
      await _secureStorage.saveRefreshToken(refreshToken);
      await _secureStorage.saveUserData(user);
      
      final userId = user['_id'] ?? user['id'];
      if (userId != null) {
        await _secureStorage.saveUserId(userId);
      }
      
      developer.log('✅ Auth data saved to secure storage');
    } catch (e) {
      developer.log('❌ Error saving auth data: $e');
      rethrow;
    }
  }

  /// Clear authentication data
  Future<void> clearAuthData() async {
    try {
      _accessToken = null;
      _refreshToken = null;
      _currentUser = null;
      
      await _secureStorage.clearAll();
      developer.log('✅ Auth data cleared');
    } catch (e) {
      developer.log('❌ Error clearing auth data: $e');
    }
  }

  /// Register a new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String username,
    required String fullName,
    String? phone,
    DateTime? dateOfBirth,
  }) async {
    try {
      developer.log('📝 Registering user: $email');

      final response = await dio.post(
        ApiEndpoints.register,
        data: {
          'email': email,
          'password': password,
          'username': username,
          'fullName': fullName,
          if (phone != null) 'phone': phone,
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
        },
      );

      // Handle different response formats
      final success = response.data['success'] ?? (response.statusCode == 200 || response.statusCode == 201);
      final data = response.data['data'] ?? response.data;

      if (success) {
        // Extract tokens and user data
        final accessToken = data['accessToken'] ?? data['access_token'];
        final refreshToken = data['refreshToken'] ?? data['refresh_token'];
        final user = data['user'];

        if (accessToken != null && user != null) {
          await _saveAuthData(accessToken, refreshToken ?? '', user);
        }

        developer.log('✅ Registration successful');
        return {
          'success': true,
          'user': user,
          'message': data['message'] ?? 'Registration successful',
        };
      } else {
        final errorMessage = data['message'] ?? 'Registration failed';
        developer.log('❌ Registration failed: $errorMessage');
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioError(e);
      developer.log('❌ Registration error: $errorMessage');
      throw Exception(errorMessage);
    }
  }

  /// Login with email/username and password
  Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      developer.log('🔐 Logging in: $identifier');

      final response = await dio.post(
        ApiEndpoints.login,
        data: {
          'identifier': identifier,
          'password': password,
        },
      );

      // Handle different response formats
      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      if (success) {
        final accessToken = data['accessToken'] ?? data['access_token'];
        final refreshToken = data['refreshToken'] ?? data['refresh_token'];
        final user = data['user'];

        if (accessToken != null && user != null) {
          await _saveAuthData(accessToken, refreshToken ?? '', user);
        }

        developer.log('✅ Login successful');
        return {
          'success': true,
          'user': user,
          'message': data['message'] ?? 'Login successful',
        };
      } else {
        final errorMessage = data['message'] ?? 'Login failed';
        developer.log('❌ Login failed: $errorMessage');
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      final errorMessage = _handleDioError(e);
      developer.log('❌ Login error: $errorMessage');
      throw Exception(errorMessage);
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      developer.log('👋 Logging out...');
      
      // Call logout endpoint if we have a token
      if (_accessToken != null) {
        try {
          await dio.post(ApiEndpoints.logout);
        } catch (e) {
          developer.log('⚠️ Logout endpoint error (continuing): $e');
        }
      }
      
      await clearAuthData();
      developer.log('✅ Logout successful');
    } catch (e) {
      developer.log('❌ Logout error: $e');
      await clearAuthData(); // Clear anyway
    }
  }

  /// Refresh access token
  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) {
      developer.log('❌ No refresh token available');
      return false;
    }

    try {
      developer.log('🔄 Refreshing access token...');

      final response = await dio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': _refreshToken},
      );

      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      if (success) {
        final accessToken = data['accessToken'] ?? data['access_token'];
        
        if (accessToken != null) {
          _accessToken = accessToken;
          await _secureStorage.saveAccessToken(accessToken);
          developer.log('✅ Token refreshed successfully');
          return true;
        }
      }

      developer.log('❌ Token refresh failed');
      return false;
    } on DioException catch (e) {
      developer.log('❌ Token refresh error: ${_handleDioError(e)}');
      return false;
    }
  }

  /// Get current user from backend
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      developer.log('👤 Fetching current user...');

      final response = await dio.get(ApiEndpoints.getCurrentUser);

      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      if (success) {
        final user = data['user'] ?? data;
        _currentUser = user;
        await _secureStorage.saveUserData(user);
        developer.log('✅ Current user fetched');
        return user;
      }

      return null;
    } on DioException catch (e) {
      developer.log('❌ Get current user error: ${_handleDioError(e)}');
      return null;
    }
  }

  /// Get user profile by ID
  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      developer.log('👤 Fetching user profile: $userId');

      final response = await dio.get(ApiEndpoints.getUserById(userId));

      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      if (success) {
        final user = data['user'] ?? data;
        developer.log('✅ User profile fetched');
        return user;
      }

      return null;
    } on DioException catch (e) {
      developer.log('❌ Get user profile error: ${_handleDioError(e)}');
      return null;
    }
  }

  /// Forgot password
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      developer.log('📧 Requesting password reset: $email');

      final response = await dio.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );

      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      developer.log(success ? '✅ Reset email sent' : '❌ Reset request failed');

      return {
        'success': success,
        'message': data['message'] ?? (success ? 'Reset email sent' : 'Request failed'),
      };
    } on DioException catch (e) {
      final errorMessage = _handleDioError(e);
      developer.log('❌ Forgot password error: $errorMessage');
      throw Exception(errorMessage);
    }
  }

  /// Reset password with token
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      developer.log('🔑 Resetting password...');

      final response = await dio.post(
        ApiEndpoints.resetPassword,
        data: {
          'token': token,
          'newPassword': newPassword,
        },
      );

      final success = response.data['success'] ?? (response.statusCode == 200);
      final data = response.data['data'] ?? response.data;

      developer.log(success ? '✅ Password reset successful' : '❌ Password reset failed');

      return {
        'success': success,
        'message': data['message'] ?? (success ? 'Password reset successful' : 'Reset failed'),
      };
    } on DioException catch (e) {
      final errorMessage = _handleDioError(e);
      developer.log('❌ Reset password error: $errorMessage');
      throw Exception(errorMessage);
    }
  }

  /// Handle Dio errors
  String _handleDioError(DioException error) {
    if (error.response?.data != null) {
      final data = error.response!.data;
      if (data is Map) {
        return data['message'] ?? data['error'] ?? 'Request failed';
      }
      return data.toString();
    }
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please check your internet connection.';
      case DioExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      case DioExceptionType.badResponse:
        return 'Server error. Please try again later.';
      case DioExceptionType.cancel:
        return 'Request cancelled.';
      default:
        return error.message ?? 'An unexpected error occurred.';
    }
  }

  // Getters
  bool get isAuthenticated => _accessToken != null && _currentUser != null;
  String? get accessToken => _accessToken;
  String? get userId => _currentUser?['_id'] ?? _currentUser?['id'];
  Map<String, dynamic>? get currentUser => _currentUser;
}
