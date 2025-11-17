import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/models/user.dart';
import '../../features/auth/data/services/auth_service.dart';

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
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authService.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> register(String username, String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authService.register(username, email, password);
      state = AsyncValue.data(user);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
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
      final updatedUser = await _authService.updateProfile(data);
      state = AsyncValue.data(updatedUser);
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
