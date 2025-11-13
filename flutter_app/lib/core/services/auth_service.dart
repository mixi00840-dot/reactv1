import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _tokenExpiryKey = 'token_expiry';

  // ✅ NEW: Track refresh attempts to prevent infinite loops
  bool _isRefreshing = false;

  // Get stored token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // ✅ NEW: Get token with automatic refresh if expired
  Future<String?> getValidToken() async {
    final token = await getToken();
    if (token == null) return null;

    // Check if token is expired
    final isExpired = await isTokenExpired();
    if (isExpired && !_isRefreshing) {
      debugPrint('Token expired, attempting refresh...');
      final refreshed = await refreshToken();
      if (refreshed) {
        return await getToken();
      } else {
        debugPrint('Token refresh failed, user needs to re-login');
        return null;
      }
    }

    return token;
  }

  // ✅ NEW: Check if token is expired
  Future<bool> isTokenExpired() async {
    final prefs = await SharedPreferences.getInstance();
    final expiryTimestamp = prefs.getInt(_tokenExpiryKey);
    
    if (expiryTimestamp == null) {
      // If no expiry stored, assume token might be expired
      return true;
    }

    final expiryDate = DateTime.fromMillisecondsSinceEpoch(expiryTimestamp);
    final now = DateTime.now();
    
    // Consider token expired 5 minutes before actual expiry
    final bufferTime = const Duration(minutes: 5);
    return now.isAfter(expiryDate.subtract(bufferTime));
  }

  // Save token
  Future<void> saveToken(String token, {DateTime? expiresAt}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    
    // ✅ NEW: Store token expiry (default 24 hours if not provided)
    final expiry = expiresAt ?? DateTime.now().add(const Duration(hours: 24));
    await prefs.setInt(_tokenExpiryKey, expiry.millisecondsSinceEpoch);
  }

  // Get refresh token
  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  // Save refresh token
  Future<void> saveRefreshToken(String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_refreshTokenKey, refreshToken);
  }

  // Get user ID
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userIdKey);
  }

  // Save user ID
  Future<void> saveUserId(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userIdKey, userId);
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await getToken();
    if (token == null || token.isEmpty) return false;
    
    // ✅ NEW: Also check if token is still valid
    final isExpired = await isTokenExpired();
    return !isExpired;
  }

  // Refresh token
  Future<bool> refreshToken() async {
    // ✅ NEW: Prevent multiple simultaneous refresh attempts
    if (_isRefreshing) {
      debugPrint('Token refresh already in progress, waiting...');
      await Future.delayed(const Duration(seconds: 2));
      return await isAuthenticated();
    }

    _isRefreshing = true;
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) {
        debugPrint('No refresh token available');
        return false;
      }

      final apiService = ApiService();
      final response = await apiService.post('/auth/mongodb/refresh', data: {
        'refreshToken': refreshToken,
      });

      if (response['success'] == true) {
        final newToken = response['data']['token'];
        final newRefreshToken = response['data']['refreshToken'];
        
        // ✅ IMPROVED: Parse token expiry if provided by backend
        DateTime? expiresAt;
        if (response['data']['expiresAt'] != null) {
          expiresAt = DateTime.parse(response['data']['expiresAt']);
        }
        
        await saveToken(newToken, expiresAt: expiresAt);
        if (newRefreshToken != null) {
          await saveRefreshToken(newRefreshToken);
        }
        
        debugPrint('✅ Token refreshed successfully');
        return true;
      }
      
      debugPrint('❌ Token refresh failed: ${response['message']}');
      return false;
    } catch (e) {
      debugPrint('❌ Error refreshing token: $e');
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final apiService = ApiService();
      final response = await apiService.post('/auth/mongodb/login', data: {
        'email': email,
        'password': password,
      });

      if (response['success'] == true) {
        final token = response['data']['token'];
        final refreshToken = response['data']['refreshToken'];
        final userId = response['data']['user']['_id'];

        await saveToken(token);
        if (refreshToken != null) {
          await saveRefreshToken(refreshToken);
        }
        await saveUserId(userId);

        return {'success': true, 'user': response['data']['user']};
      }
      return {'success': false, 'message': response['message']};
    } catch (e) {
      debugPrint('Login error: $e');
      return {'success': false, 'message': 'Login failed. Please try again.'};
    }
  }

  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userIdKey);
  }

  // Clear all auth data
  Future<void> clearAuthData() async {
    await logout();
  }
}
