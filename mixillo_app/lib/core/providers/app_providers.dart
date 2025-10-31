import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../network/dio_client.dart';
import '../constants/api_constants.dart';

// ========== Core Providers ==========

/// Secure storage provider
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

/// Hive box provider
final hiveBoxProvider = Provider<Box>((ref) {
  throw UnimplementedError('Hive box must be initialized before use');
});

/// Connectivity provider
final connectivityProvider = Provider<Connectivity>((ref) {
  return Connectivity();
});

/// Network status stream provider
final networkStatusProvider = StreamProvider<List<ConnectivityResult>>((ref) async* {
  final connectivity = ref.watch(connectivityProvider);
  await for (final result in connectivity.onConnectivityChanged) {
    yield [result];
  }
});

/// Check if device is online
final isOnlineProvider = StreamProvider<bool>((ref) {
  return ref.watch(networkStatusProvider.stream).map((results) {
    return results.contains(ConnectivityResult.mobile) ||
           results.contains(ConnectivityResult.wifi) ||
           results.contains(ConnectivityResult.ethernet);
  });
});

// ========== Network Providers ==========

/// Dio client provider with auth interceptors
final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  
  return DioClient(
    baseUrl: ApiConstants.baseUrl,
    storage: storage,
    connectTimeout: 30000, // milliseconds
    receiveTimeout: 30000, // milliseconds
  );
});

// ========== Authentication Providers ==========

/// Current user ID provider
final currentUserIdProvider = FutureProvider<String?>((ref) async {
  final storage = ref.watch(secureStorageProvider);
  return await storage.read(key: 'user_id');
});

/// Auth token provider
final authTokenProvider = FutureProvider<String?>((ref) async {
  final storage = ref.watch(secureStorageProvider);
  return await storage.read(key: 'auth_token');
});

/// Check if user is authenticated
final isAuthenticatedProvider = FutureProvider<bool>((ref) async {
  final token = await ref.watch(authTokenProvider.future);
  return token != null && token.isNotEmpty;
});

// ========== App State Providers ==========

/// App initialization provider
final appInitializationProvider = FutureProvider<bool>((ref) async {
  try {
    // Initialize Hive
    await Hive.initFlutter();
    
    // Open Hive boxes
    await Hive.openBox('cache');
    await Hive.openBox('settings');
    
    // Check authentication status
    await ref.watch(isAuthenticatedProvider.future);
    
    return true;
  } catch (e) {
    return false;
  }
});

/// Current theme mode provider (light/dark)
final themeModeProvider = StateProvider<bool>((ref) {
  final box = Hive.box('settings');
  return box.get('isDarkMode', defaultValue: false);
});

/// Save theme mode
void saveThemeMode(WidgetRef ref, bool isDark) {
  final box = Hive.box('settings');
  box.put('isDarkMode', isDark);
  ref.read(themeModeProvider.notifier).state = isDark;
}

// ========== Cache Providers ==========

/// Cache service provider
final cacheProvider = Provider((ref) {
  return Hive.box('cache');
});

/// Clear cache function
Future<void> clearCache(WidgetRef ref) async {
  final cache = ref.read(cacheProvider);
  await cache.clear();
}

// ========== Error Handling Provider ==========

/// Global error handler
final errorHandlerProvider = Provider<ErrorHandler>((ref) {
  return ErrorHandler();
});

class ErrorHandler {
  void handleError(Object error, StackTrace stackTrace) {
    // Log error (integrate with Sentry/Crashlytics later)
    print('Error: $error');
    print('StackTrace: $stackTrace');
  }
}
