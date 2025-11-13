import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/user_profile_model.dart';
import '../services/profile_service.dart';
import '../../../core/services/auth_service.dart';

/// StateNotifier for managing profile state
class ProfileNotifier extends StateNotifier<ProfileState> {
  final ProfileService _profileService;
  final AuthService _authService;

  ProfileNotifier(this._profileService, this._authService) : super(const ProfileState());

  /// Initialize profile service with auth token
  Future<void> _initializeService() async {
    final token = await _authService.getValidToken();
    if (token != null) {
      _profileService.authToken = 'Bearer $token';
    }
  }

  /// Load current user's profile
  Future<void> loadCurrentProfile() async {
    await _initializeService(); // Ensure auth token is set
    state = state.copyWith(isLoading: true, error: null);

    try {
      final profile = await _profileService.getCurrentUserProfile();
      state = state.copyWith(
        currentProfile: profile,
        isLoading: false,
      );
    } catch (e) {
      // Silently fail and use mock data in the UI
      print('Profile load failed (using mock data): $e');
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  /// Load another user's profile
  Future<void> loadUserProfile(String userId) async {
    await _initializeService(); // Ensure auth token is set
    state = state.copyWith(isLoading: true, error: null);

    try {
      final profile = await _profileService.getUserProfile(userId);
      state = state.copyWith(
        viewedProfile: profile,
        isLoading: false,
      );
      
      // Also load their content
      await loadUserContent(userId);
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  /// Update profile
  Future<bool> updateProfile({
    String? fullName,
    String? bio,
    String? website,
    String? phone,
    Map<String, String>? socialLinks,
  }) async {
    try {
      final updatedProfile = await _profileService.updateProfile(
        fullName: fullName,
        bio: bio,
        website: website,
        phone: phone,
        socialLinks: socialLinks,
      );

      state = state.copyWith(currentProfile: updatedProfile);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Toggle follow/unfollow
  Future<bool> toggleFollow(String userId) async {
    state = state.copyWith(isFollowLoading: true);

    try {
      final result = await _profileService.toggleFollow(userId);
      
      // Update follow status and counts
      if (state.viewedProfile != null && state.viewedProfile!.id == userId) {
        final isNowFollowing = result['isFollowing'] as bool;
        final updatedProfile = state.viewedProfile!.copyWith(
          isFollowing: isNowFollowing,
          followersCount: state.viewedProfile!.followersCount + (isNowFollowing ? 1 : -1),
        );
        
        state = state.copyWith(
          viewedProfile: updatedProfile,
          isFollowLoading: false,
        );
      }

      return true;
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isFollowLoading: false,
      );
      return false;
    }
  }

  /// Load user content (videos)
  Future<void> loadUserContent(String userId) async {
    try {
      final content = await _profileService.getUserContent(userId);
      state = state.copyWith(userVideos: content);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Load followers
  Future<void> loadFollowers(String userId) async {
    try {
      final followers = await _profileService.getFollowers(userId);
      state = state.copyWith(followers: followers);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Load following
  Future<void> loadFollowing(String userId) async {
    try {
      final following = await _profileService.getFollowing(userId);
      state = state.copyWith(following: following);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Upload avatar
  Future<bool> uploadAvatar(String filePath) async {
    try {
      final avatarUrl = await _profileService.uploadAvatar(filePath);
      
      if (state.currentProfile != null) {
        final updatedProfile = state.currentProfile!.copyWith(avatarUrl: avatarUrl);
        state = state.copyWith(currentProfile: updatedProfile);
      }
      
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Refresh current profile
  Future<void> refresh() async {
    if (state.currentProfile != null) {
      await loadCurrentProfile();
    } else if (state.viewedProfile != null) {
      await loadUserProfile(state.viewedProfile!.id);
    }
  }

  /// Check if viewing own profile
  bool get isOwnProfile {
    if (state.currentProfile == null || state.viewedProfile == null) {
      return false;
    }
    return state.currentProfile!.id == state.viewedProfile!.id;
  }
}

/// Profile state class
class ProfileState {
  final UserProfile? currentProfile;
  final UserProfile? viewedProfile;
  final List<dynamic> userVideos;
  final List<UserProfile> followers;
  final List<UserProfile> following;
  final bool isLoading;
  final bool isFollowLoading;
  final String? error;

  const ProfileState({
    this.currentProfile,
    this.viewedProfile,
    this.userVideos = const [],
    this.followers = const [],
    this.following = const [],
    this.isLoading = false,
    this.isFollowLoading = false,
    this.error,
  });

  ProfileState copyWith({
    UserProfile? currentProfile,
    UserProfile? viewedProfile,
    List<dynamic>? userVideos,
    List<UserProfile>? followers,
    List<UserProfile>? following,
    bool? isLoading,
    bool? isFollowLoading,
    String? error,
  }) {
    return ProfileState(
      currentProfile: currentProfile ?? this.currentProfile,
      viewedProfile: viewedProfile ?? this.viewedProfile,
      userVideos: userVideos ?? this.userVideos,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      isLoading: isLoading ?? this.isLoading,
      isFollowLoading: isFollowLoading ?? this.isFollowLoading,
      error: error,
    );
  }
}

/// Provider for ProfileService
final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(
    baseUrl: 'https://mixillo-backend-52242135857.europe-west1.run.app',
    authToken: '', // Will be set by ProfileNotifier
  );
});

/// Provider for AuthService
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// Provider for ProfileNotifier
final profileProvider = StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  final profileService = ref.watch(profileServiceProvider);
  final authService = ref.watch(authServiceProvider);
  return ProfileNotifier(profileService, authService);
});
