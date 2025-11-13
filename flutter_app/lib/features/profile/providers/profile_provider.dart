import 'package:flutter/material.dart';
import '../services/profile_service.dart';
import '../data/models/user_profile_model.dart';

class ProfileProvider with ChangeNotifier {
  final ProfileService _profileService;
  
  UserProfile? _currentProfile;
  UserProfile? _viewedProfile;
  List<dynamic> _userVideos = [];
  List<UserProfile> _followers = [];
  List<UserProfile> _following = [];
  
  bool _isLoading = false;
  bool _isFollowLoading = false;
  String? _error;

  ProfileProvider({required ProfileService profileService})
      : _profileService = profileService;

  // Getters
  UserProfile? get currentProfile => _currentProfile;
  UserProfile? get viewedProfile => _viewedProfile;
  List<dynamic> get userVideos => _userVideos;
  List<UserProfile> get followers => _followers;
  List<UserProfile> get following => _following;
  bool get isLoading => _isLoading;
  bool get isFollowLoading => _isFollowLoading;
  String? get error => _error;

  bool get isOwnProfile => _currentProfile?.id == _viewedProfile?.id;

  /// Load current user profile
  Future<void> loadCurrentProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentProfile = await _profileService.getCurrentUserProfile();
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading current profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load any user profile by ID
  Future<void> loadUserProfile(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _viewedProfile = await _profileService.getUserProfile(userId);
      
      // Also load user's content
      await loadUserContent(userId);
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading user profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Update current user profile
  Future<bool> updateProfile({
    String? fullName,
    String? bio,
    String? website,
    String? phone,
    String? gender,
    DateTime? dateOfBirth,
    Map<String, String>? socialLinks,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentProfile = await _profileService.updateProfile(
        fullName: fullName,
        bio: bio,
        website: website,
        phone: phone,
        gender: gender,
        dateOfBirth: dateOfBirth,
        socialLinks: socialLinks,
      );
      
      // Update viewed profile if it's own profile
      if (isOwnProfile) {
        _viewedProfile = _currentProfile;
      }
      
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Error updating profile: $e');
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Toggle follow/unfollow
  Future<bool> toggleFollow(String userId) async {
    if (_viewedProfile == null) return false;

    _isFollowLoading = true;
    notifyListeners();

    try {
      final result = await _profileService.toggleFollow(userId);
      
      // Update follow status
      _viewedProfile = _viewedProfile!.copyWith(
        isFollowing: result['isFollowing'],
        followersCount: result['isFollowing']
            ? _viewedProfile!.followersCount + 1
            : _viewedProfile!.followersCount - 1,
      );
      
      // Update current user's following count
      if (_currentProfile != null) {
        _currentProfile = _currentProfile!.copyWith(
          followingCount: result['isFollowing']
              ? _currentProfile!.followingCount + 1
              : _currentProfile!.followingCount - 1,
        );
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Error toggling follow: $e');
      return false;
    } finally {
      _isFollowLoading = false;
      notifyListeners();
    }
  }

  /// Load user content
  Future<void> loadUserContent(String userId, {int page = 1}) async {
    try {
      _userVideos = await _profileService.getUserContent(userId, page: page);
      notifyListeners();
    } catch (e) {
      print('Error loading user content: $e');
    }
  }

  /// Load followers
  Future<void> loadFollowers(String userId, {int page = 1}) async {
    try {
      _followers = await _profileService.getFollowers(userId, page: page);
      notifyListeners();
    } catch (e) {
      print('Error loading followers: $e');
    }
  }

  /// Load following
  Future<void> loadFollowing(String userId, {int page = 1}) async {
    try {
      _following = await _profileService.getFollowing(userId, page: page);
      notifyListeners();
    } catch (e) {
      print('Error loading following: $e');
    }
  }

  /// Upload avatar
  Future<bool> uploadAvatar(String filePath) async {
    _isLoading = true;
    notifyListeners();

    try {
      final avatarUrl = await _profileService.uploadAvatar(filePath);
      
      if (_currentProfile != null) {
        _currentProfile = _currentProfile!.copyWith(avatarUrl: avatarUrl);
      }
      if (isOwnProfile && _viewedProfile != null) {
        _viewedProfile = _viewedProfile!.copyWith(avatarUrl: avatarUrl);
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Error uploading avatar: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Refresh profile
  Future<void> refresh() async {
    if (_viewedProfile != null) {
      await loadUserProfile(_viewedProfile!.id);
    }
  }
}
