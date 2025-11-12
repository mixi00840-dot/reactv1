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

  // Get stored token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Save token
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
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
    return token != null && token.isNotEmpty;
  }

  // Refresh token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) return false;

      final apiService = ApiService();
      final response = await apiService.post('/auth/mongodb/refresh', data: {
        'refreshToken': refreshToken,
      });

      if (response['success'] == true) {
        final newToken = response['data']['token'];
        final newRefreshToken = response['data']['refreshToken'];
        
        await saveToken(newToken);
        if (newRefreshToken != null) {
          await saveRefreshToken(newRefreshToken);
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error refreshing token: $e');
      return false;
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
