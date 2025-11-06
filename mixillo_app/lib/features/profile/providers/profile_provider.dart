import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../../core/services/api_service.dart';
import '../models/user_settings_model.dart';

class ProfileProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  Map<String, dynamic>? _currentUserProfile;
  Map<String, dynamic>? _viewedUserProfile;
  List<Map<String, dynamic>> _followers = [];
  List<Map<String, dynamic>> _following = [];
  bool _isLoading = false;
  String? _error;
  
  Map<String, dynamic>? get currentUserProfile => _currentUserProfile;
  Map<String, dynamic>? get viewedUserProfile => _viewedUserProfile;
  List<Map<String, dynamic>> get followers => _followers;
  List<Map<String, dynamic>> get following => _following;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  /// Load current user profile
  Future<void> loadCurrentUserProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/users/profile');
      
      if (response.data['success'] == true) {
        _currentUserProfile = response.data['data']?['user'] ?? response.data['user'];
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load profile');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading current user profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load user profile by ID
  Future<void> loadUserProfile(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/users/$userId');
      
      if (response.data['success'] == true) {
        _viewedUserProfile = response.data['data']?['user'] ?? response.data['user'];
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load profile');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading user profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Update user profile
  Future<bool> updateProfile({
    String? fullName,
    String? bio,
    String? phone,
    DateTime? dateOfBirth,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.put(
        '/users/profile',
        data: {
          if (fullName != null) 'fullName': fullName,
          if (bio != null) 'bio': bio,
          if (phone != null) 'phone': phone,
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
        },
      );
      
      if (response.data['success'] == true) {
        _currentUserProfile = response.data['data']?['user'] ?? response.data['user'];
        _error = null;
        notifyListeners();
        return true;
      }
      
      throw Exception(response.data['message'] ?? 'Failed to update profile');
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error updating profile: $e');
      return false;
    }
  }
  
  /// Upload avatar
  Future<bool> uploadAvatar(String imagePath) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final file = File(imagePath);
      await _apiService.uploadAvatar(file);
      
      // Reload profile to get updated avatar
      await loadCurrentUserProfile();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error uploading avatar: $e');
      return false;
    }
  }
  
  /// Follow user
  Future<bool> followUser(String userId) async {
    try {
      final response = await _apiService.dio.post('/users/$userId/follow');
      
      if (response.data['success'] == true) {
        // Update local state
        if (_viewedUserProfile != null) {
          _viewedUserProfile!['isFollowing'] = response.data['data']?['isFollowing'] ?? true;
          _viewedUserProfile!['stats']?['followers'] = response.data['data']?['followerCount'] ?? 
              (_viewedUserProfile!['stats']?['followers'] ?? 0) + 1;
        }
        notifyListeners();
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error following user: $e');
      return false;
    }
  }
  
  /// Unfollow user
  Future<bool> unfollowUser(String userId) async {
    try {
      final response = await _apiService.dio.delete('/users/$userId/unfollow');
      
      if (response.data['success'] == true) {
        // Update local state
        if (_viewedUserProfile != null) {
          _viewedUserProfile!['isFollowing'] = false;
          _viewedUserProfile!['stats']?['followers'] = response.data['data']?['followerCount'] ?? 
              (_viewedUserProfile!['stats']?['followers'] ?? 0) - 1;
        }
        notifyListeners();
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error unfollowing user: $e');
      return false;
    }
  }
  
  /// Load followers
  Future<void> loadFollowers(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/users/$userId/followers');
      
      if (response.data['success'] == true) {
        _followers = List<Map<String, dynamic>>.from(
          response.data['data']?['followers'] ?? [],
        );
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load followers');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading followers: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load following
  Future<void> loadFollowing(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.get('/users/$userId/following');
      
      if (response.data['success'] == true) {
        _following = List<Map<String, dynamic>>.from(
          response.data['data']?['following'] ?? [],
        );
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load following');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading following: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.dio.post(
        '/users/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      
      if (response.data['success'] == true) {
        _error = null;
        notifyListeners();
        return true;
      }
      
      throw Exception(response.data['message'] ?? 'Failed to change password');
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error changing password: $e');
      return false;
    }
  }
  
  /// Get user stats
  Future<Map<String, dynamic>?> getUserStats() async {
    try {
      final response = await _apiService.dio.get('/users/stats');
      
      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }
      
      return null;
    } catch (e) {
      print('Error getting user stats: $e');
      return null;
    }
  }
  
  /// Clear viewed profile
  void clearViewedProfile() {
    _viewedUserProfile = null;
    _followers = [];
    _following = [];
    notifyListeners();
  }
}

