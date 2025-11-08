# 📱 Flutter App: MongoDB Migration Guide

**Target**: Mixillo Flutter App  
**Current**: Firebase Authentication  
**Migration To**: MongoDB + JWT Authentication

---

## 🎯 MIGRATION OVERVIEW

### What Needs to Change:

1. **Authentication System** - Firebase Auth → JWT
2. **API Endpoints** - Add `/mongodb` to paths
3. **Token Storage** - Store JWT tokens securely
4. **API Calls** - Update all API service calls

### What Stays the Same:

1. **Firebase Messaging** - Keep for push notifications
2. **UI/UX** - No changes to screens or flows
3. **App Logic** - Business logic unchanged
4. **User Experience** - Same features, better performance

---

## 📝 STEP-BY-STEP MIGRATION

### Step 1: Update API Constants

**File**: `lib/core/constants/api_constants.dart`

```dart
class ApiConstants {
  // Base URL - No change
  static const String baseUrl = 'https://mixillo-backend-52242135857.europe-west1.run.app';
  static const String apiVersion = '/api';
  
  // ============================================
  // MONGODB ENDPOINTS (NEW)
  // ============================================
  
  // Auth Endpoints - UPDATED FOR MONGODB
  static const String login = '/auth/mongodb/login';  // Changed
  static const String register = '/auth/mongodb/register';  // Changed
  static const String logout = '/auth/mongodb/logout';  // Changed
  static const String me = '/auth/mongodb/me';  // Changed
  static const String forgotPassword = '/auth/mongodb/forgot-password';  // Changed
  static const String resetPassword = '/auth/mongodb/reset-password';  // Changed
  static const String refreshToken = '/auth/mongodb/refresh';  // Changed
  
  // User Endpoints - UPDATED FOR MONGODB
  static const String users = '/users/mongodb';  // Changed
  static String userProfile(String id) => '/users/mongodb/$id';  // Changed
  static String updateProfile(String id) => '/users/mongodb/$id';  // Changed
  static String followUser(String id) => '/users/mongodb/$id/follow';  // Changed
  static String unfollowUser(String id) => '/users/mongodb/$id/unfollow';  // Changed
  static String followers(String id) => '/users/mongodb/$id/followers';  // Changed
  static String following(String id) => '/users/mongodb/$id/following';  // Changed
  
  // Content Endpoints - UPDATED FOR MONGODB
  static const String content = '/content/mongodb';  // Changed
  static String contentById(String id) => '/content/mongodb/$id';  // Changed
  static const String contentFeed = '/content/mongodb/feed';  // Changed
  static const String contentTrending = '/content/mongodb/trending';  // Changed
  static String contentLike(String id) => '/content/mongodb/$id/like';  // Changed
  static String contentSave(String id) => '/content/mongodb/$id/save';  // Changed
  
  // Stories Endpoints - UPDATED FOR MONGODB
  static const String stories = '/stories/mongodb';  // Changed
  static String viewStory(String storyId) => '/stories/mongodb/$storyId/view';  // Changed
  
  // Live Stream Endpoints - UPDATED FOR MONGODB
  static const String livestreams = '/streaming/mongodb/livestreams';  // Changed
  static const String goLive = '/streaming/mongodb/start';  // Changed
  static const String endLive = '/streaming/mongodb/{id}/end';  // Changed
  static const String streamingProviders = '/streaming/mongodb/providers';  // Changed
  
  // Shop Endpoints - UPDATED FOR MONGODB
  static const String products = '/products/mongodb';  // Changed
  static const String stores = '/stores/mongodb';  // Changed
  static const String cart = '/cart/mongodb';  // Changed
  static const String orders = '/orders/mongodb';  // Changed
  
  // Wallet Endpoints - UPDATED FOR MONGODB
  static String wallet(String userId) => '/wallets/mongodb/$userId';  // Changed
  static String transactions(String userId) => '/wallets/mongodb/$userId/transactions';  // Changed
  static String balance(String userId) => '/wallets/mongodb/$userId/balance';  // Changed
  
  // Gifts Endpoints - UPDATED FOR MONGODB
  static const String gifts = '/gifts/mongodb';  // Changed
  static const String sendGift = '/gifts/mongodb/send';  // Changed
  
  // Messages Endpoints - UPDATED FOR MONGODB
  static const String conversations = '/messaging/mongodb/conversations';  // Changed
  static const String sendMessage = '/messaging/mongodb/send';  // Changed
  
  // Notifications Endpoints - UPDATED FOR MONGODB
  static const String notifications = '/notifications/mongodb';  // Changed
  static String markAsRead(String id) => '/notifications/mongodb/$id/read';  // Changed
  static const String markAllRead = '/notifications/mongodb/read-all';  // Changed
  
  // Keep Firebase Messaging for notifications
  // (firebase_messaging package stays)
}
```

### Step 2: Update Authentication Service

**File**: `lib/core/services/auth_service.dart`

**Changes Needed:**
1. Remove Firebase Auth dependency
2. Implement JWT token storage
3. Update login/register methods
4. Add token refresh logic

**New Implementation:**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';

class AuthService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final Dio _dio = Dio();
  
  // Store JWT tokens
  Future<void> saveTokens(String token, String refreshToken) async {
    await _storage.write(key: 'jwt_token', value: token);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }
  
  // Get JWT token
  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }
  
  // Register with MongoDB
  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.apiVersion}${ApiConstants.register}',
        data: {
          'username': username,
          'email': email,
          'password': password,
          'fullName': fullName,
        },
      );
      
      if (response.data['success']) {
        final token = response.data['data']['token'];
        final refreshToken = response.data['data']['refreshToken'];
        await saveTokens(token, refreshToken);
        return response.data;
      }
      
      throw Exception(response.data['message']);
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }
  
  // Login with MongoDB
  Future<Map<String, dynamic>> login({
    required String identifier, // email or username
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.apiVersion}${ApiConstants.login}',
        data: {
          'identifier': identifier,
          'password': password,
        },
      );
      
      if (response.data['success']) {
        final token = response.data['data']['token'];
        final refreshToken = response.data['data']['refreshToken'];
        await saveTokens(token, refreshToken);
        return response.data;
      }
      
      throw Exception(response.data['message']);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }
  
  // Logout
  Future<void> logout() async {
    await _storage.deleteAll();
  }
  
  // Refresh token
  Future<String?> refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return null;
      
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.apiVersion}${ApiConstants.refreshToken}',
        data: {'refreshToken': refreshToken},
      );
      
      if (response.data['success']) {
        final newToken = response.data['data']['token'];
        await _storage.write(key: 'jwt_token', value: newToken);
        return newToken;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }
}
```

### Step 3: Update API Service

**File**: `lib/core/services/api_service.dart`

**Update the request interceptor:**

```dart
_dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    // Get JWT token from secure storage
    final token = await AuthService().getToken();
    
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    return handler.next(options);
  },
  onError: (error, handler) async {
    // Handle 401 - refresh token
    if (error.response?.statusCode == 401) {
      final newToken = await AuthService().refreshToken();
      
      if (newToken != null) {
        // Retry request with new token
        final opts = error.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newToken';
        final response = await _dio.fetch(opts);
        return handler.resolve(response);
      } else {
        // Refresh failed - logout user
        await AuthService().logout();
      }
    }
    
    return handler.next(error);
  },
));
```

### Step 4: Update pubspec.yaml

**Remove (or comment out):**
```yaml
# dependencies:
  # firebase_auth: ^6.0.0  # REMOVE - Using MongoDB JWT now
  
  # KEEP these:
  firebase_core: ^4.2.1  # Keep for FCM
  firebase_messaging: ^16.0.4  # Keep for push notifications
  firebase_analytics: ^12.0.0  # Keep for analytics (optional)
```

**Make sure you have:**
```yaml
dependencies:
  flutter_secure_storage: ^9.0.0  # For JWT token storage
  dio: ^5.4.0  # Already present
  jwt_decoder: ^2.0.1  # Already present
```

---

## 🧪 TESTING CHECKLIST

After making changes, test:

### Authentication Flow:
- [ ] Register new user
- [ ] Login with email
- [ ] Login with username
- [ ] Token stored securely
- [ ] Auto-refresh on 401
- [ ] Logout clears tokens

### API Calls:
- [ ] Get user profile
- [ ] Update profile
- [ ] Get content feed
- [ ] Like content
- [ ] Post comment
- [ ] Send message
- [ ] View notifications

### Edge Cases:
- [ ] Network offline
- [ ] Token expired
- [ ] Invalid credentials
- [ ] Server error handling

---

## ⚠️ IMPORTANT NOTES

### FCM Token Handling:
Keep Firebase Messaging for push notifications. When user logs in:

```dart
// After successful login/register:
final fcmToken = await FirebaseMessaging.instance.getToken();

// Send to backend to store
await api.post('/users/mongodb/profile', {
  'fcmTokens': [
    {
      'token': fcmToken,
      'device': Platform.isIOS ? 'ios' : 'android'
    }
  ]
});
```

### Gradual Migration Strategy:
1. **Phase 1**: Deploy new app version with MongoDB support
2. **Phase 2**: New users use MongoDB automatically
3. **Phase 3**: Existing users migrated gradually
4. **Phase 4**: Deprecate Firebase Auth entirely

### Backward Compatibility:
During transition, support both:
- Check which auth backend user is on
- Route API calls appropriately
- Seamless user experience

---

## 🚀 DEPLOYMENT PLAN

### Testing (1 week):
1. Test on emulators
2. Test on real devices
3. Fix any issues
4. QA approval

### Staged Rollout:
1. **Alpha**: Internal team only (3 days)
2. **Beta**: 10% of users (1 week)
3. **Gradual**: 25% → 50% → 100% (2 weeks)

### Monitoring:
- Track crash rates
- Monitor API errors
- Check authentication success rate
- User feedback

---

**Flutter App Migration Guide Created!**  
**Ready to implement when you are!** 🚀


