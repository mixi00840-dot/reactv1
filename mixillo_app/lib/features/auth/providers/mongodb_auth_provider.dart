import 'package:flutter/material.dart';
import '../../../core/services/mongodb_auth_service.dart';

/// MongoDB-based Authentication Provider
/// Manages authentication state using JWT tokens
class MongoDBAuthProvider extends ChangeNotifier {
  final MongoDBAuthService _authService = MongoDBAuthService();
  
  bool _isAuthenticated = false;
  bool _isLoading = false;
  Map<String, dynamic>? _user;
  String? _errorMessage;
  
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get userId => _user?['_id'];
  String? get errorMessage => _errorMessage;
  
  MongoDBAuthProvider() {
    _initializeAuth();
  }
  
  /// Initialize authentication service and check auth status
  Future<void> _initializeAuth() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _authService.initialize();
      await _checkAuthStatus();
    } catch (e) {
      print('Error initializing auth: $e');
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Check if user is authenticated
  Future<void> _checkAuthStatus() async {
    _isAuthenticated = _authService.isAuthenticated;
    _user = _authService.currentUser;
    
    // If we have a token, try to get fresh user data
    if (_isAuthenticated) {
      try {
        _user = await _authService.getCurrentUser();
      } catch (e) {
        print('Error loading user: $e');
        // Token might be expired, logout
        await logout();
      }
    }
  }
  
  /// Login with email/username and password
  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final result = await _authService.login(
        identifier: identifier,
        password: password,
      );
      
      _user = result['user'] as Map<String, dynamic>?;
      _isAuthenticated = result['success'] == true;
      
      return _isAuthenticated;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isAuthenticated = false;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Register new user
  Future<bool> register({
    required String email,
    required String password,
    required String username,
    required String fullName,
    String? phone,
    String? dateOfBirth,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      // Parse dateOfBirth string to DateTime if provided
      DateTime? dob;
      if (dateOfBirth != null && dateOfBirth.isNotEmpty) {
        try {
          dob = DateTime.parse(dateOfBirth);
        } catch (e) {
          print('Error parsing date of birth: $e');
        }
      }
      
      final result = await _authService.register(
        email: email,
        password: password,
        username: username,
        fullName: fullName,
        phone: phone,
        dateOfBirth: dob,
      );
      
      _user = result['user'] as Map<String, dynamic>?;
      _isAuthenticated = result['success'] == true;
      
      return _isAuthenticated;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isAuthenticated = false;
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _authService.logout();
    } catch (e) {
      print('Error during logout: $e');
    } finally {
      _isAuthenticated = false;
      _user = null;
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Forgot password
  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      await _authService.forgotPassword(email);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Reset password
  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      await _authService.resetPassword(
        token: token,
        newPassword: newPassword,
      );
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Refresh user data
  Future<void> refreshUser() async {
    if (!_isAuthenticated) return;
    
    try {
      _user = await _authService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      print('Error refreshing user: $e');
      // If refresh fails, might be logged out
      await logout();
    }
  }
  
  /// Get user profile by ID
  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      return await _authService.getUserProfile(userId);
    } catch (e) {
      print('Error getting user profile: $e');
      return null;
    }
  }
  
  /// Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
