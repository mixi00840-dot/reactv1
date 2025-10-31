import 'package:flutter/material.dart';
import '../../../data/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _token;
  String? _userId;
  
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get token => _token;
  String? get userId => _userId;
  
  AuthProvider() {
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();
    
    _token = await StorageService.getToken();
    _userId = StorageService.getUserId();
    _isAuthenticated = _token != null && _userId != null;
    
    _isLoading = false;
    notifyListeners();
  }
  
  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // TODO: Implement API call to backend
      await Future.delayed(const Duration(seconds: 2)); // Simulated delay
      
      // For now, just save dummy data
      await StorageService.saveToken('dummy_token');
      await StorageService.saveUserId('dummy_user_id');
      
      _isAuthenticated = true;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> register(String email, String password, String username) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // TODO: Implement API call to backend
      await Future.delayed(const Duration(seconds: 2)); // Simulated delay
      
      await StorageService.saveToken('dummy_token');
      await StorageService.saveUserId('dummy_user_id');
      
      _isAuthenticated = true;
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
      await StorageService.clearAll();
      _isAuthenticated = false;
      _token = null;
      _userId = null;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
