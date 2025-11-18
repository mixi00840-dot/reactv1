import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  late Dio _dio;
  bool _isInitialized = false;
  bool _isRefreshing = false;

  // Storage keys
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _tokenExpiryKey = 'token_expiry';

  Future<void> initialize() async {
    if (_isInitialized) return;

    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
    
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _isInitialized = true;
  }

  // Get stored token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Check if token is expired
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

    // Store token expiry (default 24 hours if not provided)
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

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    if (token == null) return false;
    
    final isExpired = await isTokenExpired();
    return !isExpired;
  }

  // Refresh access token
  Future<bool> refreshToken() async {
    if (_isRefreshing) {
      // Wait for ongoing refresh to complete
      await Future.delayed(const Duration(milliseconds: 100));
      return await isLoggedIn();
    }

    _isRefreshing = true;

    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) {
        await clearAuthData();
        return false;
      }

      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final newAccessToken = data['accessToken'] ?? data['token'];
        final newRefreshToken = data['refreshToken'];

        if (newAccessToken != null) {
          await saveToken(newAccessToken);
          if (newRefreshToken != null) {
            await saveRefreshToken(newRefreshToken);
          }
          return true;
        }
      }

      await clearAuthData();
      return false;
    } catch (e) {
      await clearAuthData();
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['accessToken'] ?? data['token'];
        final refreshToken = data['refreshToken'];
        final user = data['user'];

        if (token != null && user != null) {
          await saveToken(token);
          if (refreshToken != null) {
            await saveRefreshToken(refreshToken);
          }
          if (user['_id'] != null || user['id'] != null) {
            await saveUserId(user['_id'] ?? user['id']);
          }

          return {
            'success': true,
            'user': user,
            'token': token,
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Login failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Register
  Future<Map<String, dynamic>> register(String username, String email, String password) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'username': username,
        'email': email,
        'password': password,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data;
        final token = data['accessToken'] ?? data['token'];
        final refreshToken = data['refreshToken'];
        final user = data['user'];

        if (token != null && user != null) {
          await saveToken(token);
          if (refreshToken != null) {
            await saveRefreshToken(refreshToken);
          }
          if (user['_id'] != null || user['id'] != null) {
            await saveUserId(user['_id'] ?? user['id']);
          }

          return {
            'success': true,
            'user': user,
            'token': token,
          };
        }
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Registration failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Get current user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await _dio.get('/users/me', 
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return response.data['user'] ?? response.data['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final token = await getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await _dio.put('/users/me', 
        data: data,
        options: Options(headers: {'Authorization': 'Bearer $token'})
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'user': response.data['user'] ?? response.data['data'],
        };
      }

      return {
        'success': false,
        'message': response.data['message'] ?? 'Update failed',
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Logout
  Future<void> logout() async {
    await clearAuthData();
  }

  // Clear all authentication data
  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_tokenExpiryKey);
  }

  // Get authorization header
  Future<Map<String, String>?> getAuthHeaders() async {
    final token = await getToken();
    if (token == null) return null;
    
    return {'Authorization': 'Bearer $token'};
  }
}
