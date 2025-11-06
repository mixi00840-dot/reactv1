import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../core/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ApiService _apiService = ApiService();
  
  bool _isAuthenticated = false;
  bool _isLoading = false;
  User? _user;
  Map<String, dynamic>? _userProfile;
  
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  User? get user => _user;
  Map<String, dynamic>? get userProfile => _userProfile;
  String? get userId => _user?.uid;
  
  AuthProvider() {
    _checkAuthStatus();
    // Listen to auth state changes
    _auth.authStateChanges().listen((User? user) {
      _user = user;
      _isAuthenticated = user != null;
      if (user != null) {
        _loadUserProfile();
      } else {
        _userProfile = null;
      }
      notifyListeners();
    });
  }
  
  Future<void> _checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();
    
    _user = _auth.currentUser;
    _isAuthenticated = _user != null;
    
    if (_isAuthenticated) {
      await _loadUserProfile();
    }
    
    _isLoading = false;
    notifyListeners();
  }
  
  Future<void> _loadUserProfile() async {
    if (_user == null) return;
    
    try {
      _userProfile = await _apiService.getUserProfile(_user!.uid);
    } catch (e) {
      print('Error loading user profile: $e');
    }
  }
  
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final result = await _apiService.login(
        email: email,
        password: password,
      );
      
      _user = result['user'] as User?;
      _userProfile = result['profile'] as Map<String, dynamic>?;
      _isAuthenticated = _user != null;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> register({
    required String email,
    required String password,
    required String username,
    required String fullName,
    String? phone,
    String? dateOfBirth,
  }) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final result = await _apiService.register(
        email: email,
        password: password,
        username: username,
        fullName: fullName,
        phone: phone,
        dateOfBirth: dateOfBirth,
      );
      
      _user = result['user'] as User?;
      _userProfile = result['profile'] as Map<String, dynamic>?;
      _isAuthenticated = _user != null;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _apiService.logout();
      _user = null;
      _userProfile = null;
      _isAuthenticated = false;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> refreshProfile() async {
    if (_user != null) {
      await _loadUserProfile();
      notifyListeners();
    }
  }
}
