import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

// Current user state provider
final currentUserProvider =
    StateNotifierProvider<CurrentUserNotifier, AsyncValue<User?>>((ref) {
  final authService = ref.watch(authServiceProvider);
  return CurrentUserNotifier(authService);
});

class CurrentUserNotifier extends StateNotifier<AsyncValue<User?>> {
  final AuthService _authService;

  CurrentUserNotifier(this._authService) : super(const AsyncValue.loading()) {
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    state = const AsyncValue.loading();
    try {
      final userData = await _authService.getCurrentUser();
      if (userData != null) {
        final user = User.fromJson(userData);
        state = AsyncValue.data(user);
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _authService.login(email, password);
      if (response['success'] == true) {
        final user = User.fromJson(response['user']);
        state = AsyncValue.data(user);
        return true;
      } else {
        state = AsyncValue.error(response['message'] ?? 'Login failed', StackTrace.current);
        return false;
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }

  Future<bool> register(String username, String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _authService.register(username, email, password);
      if (response['success'] == true) {
        final user = User.fromJson(response['user']);
        state = AsyncValue.data(user);
        return true;
      } else {
        state = AsyncValue.error(response['message'] ?? 'Registration failed', StackTrace.current);
        return false;
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      final userData = await _authService.updateProfile(data);
      if (userData != null) {
        final user = User.fromJson(userData);
        state = AsyncValue.data(user);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await _loadCurrentUser();
  }
}

// Auth state helpers
final isAuthenticatedProvider = Provider<bool>((ref) {
  final userState = ref.watch(currentUserProvider);
  return userState.asData?.value != null;
});

final userIdProvider = Provider<String?>((ref) {
  final userState = ref.watch(currentUserProvider);
  return userState.asData?.value?.id;
});

final userRoleProvider = Provider<String?>((ref) {
  final userState = ref.watch(currentUserProvider);
  return userState.asData?.value?.role;
});
