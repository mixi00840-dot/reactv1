# 📱 FLUTTER APP MIGRATION PLAN - FIREBASE TO REST API + MONGODB

**Objective:** Migrate Flutter app from Firebase to REST API backend  
**Current State:** 100% Firebase dependent  
**Target State:** REST API + WebSocket + MongoDB backend  
**Timeline:** 2-3 weeks  
**Priority:** High (after backend stabilization)

---

## 📊 CURRENT FLUTTER APP STATE

### Firebase Dependencies (from pubspec.yaml)
```yaml
firebase_core: ^4.2.1          # Firebase initialization
firebase_auth: ^6.0.0          # Authentication
firebase_messaging: ^16.0.4    # Push notifications (FCM)
firebase_analytics: ^12.0.0    # Analytics tracking
cloud_firestore: (likely)      # Database queries
firebase_storage: (likely)     # File uploads
```

### Firebase Usage Areas
```
1. Authentication
   - Email/Password login
   - Social login (Google, Apple, etc.)
   - Phone authentication
   - Token management

2. Database (Firestore)
   - User profiles
   - Content (videos/posts)
   - Comments & likes
   - Followers/following
   - Messages
   - Notifications

3. Storage
   - Profile pictures
   - Video uploads
   - Thumbnails
   - Media files

4. Real-time Features
   - Live streaming
   - Chat messages
   - Notifications
   - Presence (online/offline)

5. Analytics
   - User events
   - Screen views
   - Custom events

6. Push Notifications
   - FCM tokens
   - Notification handling
   - Background messages
```

---

## 🎯 MIGRATION ARCHITECTURE

### BEFORE (Firebase)
```
┌─────────────────┐
│   Flutter App   │
│                 │
│  firebase_auth  │────┐
│  cloud_firestore│────┤
│  firebase_storage│───┤
│  firebase_messaging│─┤
└─────────────────┘   │
                      ▼
            ┌──────────────────┐
            │  Firebase Cloud  │
            │  (Auth, DB, FCM) │
            └──────────────────┘
```

### AFTER (REST API + MongoDB)
```
┌─────────────────────────┐
│      Flutter App        │
│                         │
│  http (REST client)     │────┐
│  socket_io_client       │────┤
│  firebase_messaging     │────┤  (Keep FCM only)
│  shared_preferences     │    │
└─────────────────────────┘    │
                               ▼
                  ┌─────────────────────────┐
                  │   Backend API           │
                  │  (Node.js + MongoDB)    │
                  │   + WebSocket Server    │
                  └─────────────────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │    MongoDB Atlas        │
                  │  (Primary Database)     │
                  └─────────────────────────┘
```

---

## 📋 MIGRATION PHASES

### Phase 1: Setup & Infrastructure (Week 1, Days 1-2)

**1.1 Add Dependencies**
```yaml
# pubspec.yaml
dependencies:
  # REST API
  http: ^1.1.0                    # HTTP client
  dio: ^5.4.0                     # Advanced HTTP client (alternative)
  
  # WebSocket
  socket_io_client: ^2.0.3        # Socket.IO for real-time
  web_socket_channel: ^2.4.0      # WebSocket support
  
  # State Management
  provider: ^6.1.1                # State management
  riverpod: ^2.4.9                # Alternative state management
  
  # Storage
  shared_preferences: ^2.2.2      # Local storage
  flutter_secure_storage: ^9.0.0  # Secure token storage
  
  # File Upload
  image_picker: ^1.0.5            # Image selection
  file_picker: ^6.1.1             # File selection
  http_parser: ^4.0.2             # Multipart uploads
  
  # Keep for notifications
  firebase_messaging: ^16.0.4     # Keep FCM only
  
  # Utilities
  json_annotation: ^4.8.1         # JSON serialization
  freezed_annotation: ^2.4.1      # Immutable models
  
dev_dependencies:
  build_runner: ^2.4.7            # Code generation
  json_serializable: ^6.7.1       # JSON code generation
  freezed: ^2.4.6                 # Model generation
```

**1.2 Create Folder Structure**
```
lib/
├── core/
│   ├── api/
│   │   ├── api_client.dart           # HTTP client wrapper
│   │   ├── api_endpoints.dart        # API URLs
│   │   ├── api_interceptor.dart      # Request/response interceptor
│   │   └── api_exception.dart        # Custom exceptions
│   ├── websocket/
│   │   ├── socket_service.dart       # WebSocket manager
│   │   └── socket_events.dart        # Socket event types
│   ├── storage/
│   │   ├── secure_storage.dart       # Token storage
│   │   └── local_storage.dart        # Preferences
│   └── constants/
│       └── app_constants.dart        # API URLs, etc.
├── models/
│   ├── user_model.dart
│   ├── content_model.dart
│   ├── comment_model.dart
│   └── ... (all models)
├── services/
│   ├── auth_service.dart
│   ├── user_service.dart
│   ├── content_service.dart
│   ├── upload_service.dart
│   ├── messaging_service.dart
│   └── notification_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── user_provider.dart
│   └── ... (state providers)
└── screens/
    └── ... (existing screens)
```

---

### Phase 2: Core Infrastructure (Week 1, Days 3-5)

**2.1 API Client Setup**

**lib/core/api/api_client.dart:**
```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'https://mixillo-backend-52242135857.europe-west1.run.app/api';
  
  late Dio _dio;
  final _storage = FlutterSecureStorage();
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add JWT token to all requests
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        print('🚀 ${options.method} ${options.path}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        print('✅ ${response.statusCode} ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (error, handler) async {
        print('❌ ${error.response?.statusCode} ${error.requestOptions.path}');
        
        // Handle 401 - refresh token
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry original request
            return handler.resolve(await _retry(error.requestOptions));
          }
        }
        
        return handler.next(error);
      },
    ));
  }
  
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;
      
      final response = await _dio.post('/auth/mongodb/refresh', data: {
        'refreshToken': refreshToken,
      });
      
      if (response.statusCode == 200) {
        final newToken = response.data['data']['token'];
        final newRefresh = response.data['data']['refreshToken'];
        
        await _storage.write(key: 'jwt_token', value: newToken);
        await _storage.write(key: 'refresh_token', value: newRefresh);
        
        return true;
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }
    return false;
  }
  
  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
  
  // GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) async {
    return await _dio.get(path, queryParameters: queryParams);
  }
  
  // POST request
  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }
  
  // PUT request
  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }
  
  // DELETE request
  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }
  
  // Multipart file upload
  Future<Response> uploadFile(
    String path,
    String filePath,
    String fieldName, {
    Map<String, dynamic>? data,
    Function(int, int)? onProgress,
  }) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath, filename: fileName),
      ...?data,
    });
    
    return await _dio.post(
      path,
      data: formData,
      onSendProgress: onProgress,
    );
  }
}
```

**2.2 WebSocket Service**

**lib/core/websocket/socket_service.dart:**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SocketService {
  static const String socketUrl = 'https://mixillo-backend-52242135857.europe-west1.run.app';
  
  IO.Socket? _socket;
  final _storage = FlutterSecureStorage();
  
  Future<void> connect() async {
    final token = await _storage.read(key: 'jwt_token');
    
    _socket = IO.io(socketUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .setAuth({'token': token})
        .build()
    );
    
    _socket?.connect();
    
    _socket?.onConnect((_) {
      print('🔌 Socket connected');
    });
    
    _socket?.onDisconnect((_) {
      print('🔌 Socket disconnected');
    });
    
    _socket?.onError((error) {
      print('🔌 Socket error: $error');
    });
  }
  
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
  }
  
  // Listen to events
  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }
  
  // Emit events
  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }
  
  // Join room
  void joinRoom(String roomId) {
    emit('room:join', {'roomId': roomId});
  }
  
  // Leave room
  void leaveRoom(String roomId) {
    emit('room:leave', {'roomId': roomId});
  }
  
  // Send message
  void sendMessage(String conversationId, String message) {
    emit('message:send', {
      'conversationId': conversationId,
      'message': message,
    });
  }
  
  // Typing indicator
  void startTyping(String conversationId) {
    emit('typing:start', {'conversationId': conversationId});
  }
  
  void stopTyping(String conversationId) {
    emit('typing:stop', {'conversationId': conversationId});
  }
}
```

---

### Phase 3: Authentication Migration (Week 1, Days 6-7)

**3.1 Auth Service**

**lib/services/auth_service.dart:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api/api_client.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final _storage = FlutterSecureStorage();
  
  // Login
  Future<UserModel> login(String identifier, String password) async {
    final response = await _api.post('/auth/mongodb/login', data: {
      'identifier': identifier,
      'password': password,
    });
    
    if (response.statusCode == 200 && response.data['success']) {
      final token = response.data['data']['token'];
      final refreshToken = response.data['data']['refreshToken'];
      final user = UserModel.fromJson(response.data['data']['user']);
      
      // Save tokens
      await _storage.write(key: 'jwt_token', value: token);
      await _storage.write(key: 'refresh_token', value: refreshToken);
      await _storage.write(key: 'user_id', value: user.id);
      
      return user;
    } else {
      throw Exception(response.data['message'] ?? 'Login failed');
    }
  }
  
  // Register
  Future<UserModel> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    final response = await _api.post('/auth/mongodb/register', data: {
      'username': username,
      'email': email,
      'password': password,
      'fullName': fullName,
    });
    
    if (response.statusCode == 201 && response.data['success']) {
      final token = response.data['data']['token'];
      final refreshToken = response.data['data']['refreshToken'];
      final user = UserModel.fromJson(response.data['data']['user']);
      
      await _storage.write(key: 'jwt_token', value: token);
      await _storage.write(key: 'refresh_token', value: refreshToken);
      await _storage.write(key: 'user_id', value: user.id);
      
      return user;
    } else {
      throw Exception(response.data['message'] ?? 'Registration failed');
    }
  }
  
  // Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/mongodb/me');
      
      if (response.statusCode == 200 && response.data['success']) {
        return UserModel.fromJson(response.data['data']['user']);
      }
    } catch (e) {
      print('Get current user error: $e');
    }
    return null;
  }
  
  // Logout
  Future<void> logout() async {
    try {
      await _api.post('/auth/mongodb/logout');
    } catch (e) {
      print('Logout error: $e');
    } finally {
      // Clear local storage
      await _storage.delete(key: 'jwt_token');
      await _storage.delete(key: 'refresh_token');
      await _storage.delete(key: 'user_id');
    }
  }
  
  // Check if logged in
  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'jwt_token');
    return token != null;
  }
}
```

---

### Phase 4: Data Services Migration (Week 2, Days 1-5)

**4.1 User Service**
```dart
// lib/services/user_service.dart
class UserService {
  final ApiClient _api = ApiClient();
  
  Future<UserModel> getUser(String userId) async {
    final response = await _api.get('/users/mongodb/$userId');
    return UserModel.fromJson(response.data['data']['user']);
  }
  
  Future<List<UserModel>> getUsers({int page = 1, int limit = 20}) async {
    final response = await _api.get('/users/mongodb', queryParams: {
      'page': page,
      'limit': limit,
    });
    return (response.data['data']['users'] as List)
        .map((json) => UserModel.fromJson(json))
        .toList();
  }
  
  Future<UserModel> updateProfile(String userId, Map<String, dynamic> data) async {
    final response = await _api.put('/users/mongodb/$userId', data: data);
    return UserModel.fromJson(response.data['data']['user']);
  }
  
  Future<void> followUser(String userId) async {
    await _api.post('/users/mongodb/$userId/follow');
  }
  
  Future<void> unfollowUser(String userId) async {
    await _api.delete('/users/mongodb/$userId/follow');
  }
}
```

**4.2 Content Service**
```dart
// lib/services/content_service.dart
class ContentService {
  final ApiClient _api = ApiClient();
  
  Future<List<ContentModel>> getFeed({int page = 1, int limit = 20}) async {
    final response = await _api.get('/content/mongodb', queryParams: {
      'page': page,
      'limit': limit,
    });
    return (response.data['data']['content'] as List)
        .map((json) => ContentModel.fromJson(json))
        .toList();
  }
  
  Future<ContentModel> getContent(String contentId) async {
    final response = await _api.get('/content/mongodb/$contentId');
    return ContentModel.fromJson(response.data['data']['content']);
  }
  
  Future<ContentModel> createContent({
    required String videoUrl,
    required String thumbnailUrl,
    String? title,
    String? description,
    List<String>? tags,
  }) async {
    final response = await _api.post('/content/mongodb', data: {
      'type': 'video',
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'title': title,
      'description': description,
      'tags': tags,
    });
    return ContentModel.fromJson(response.data['data']['content']);
  }
  
  Future<void> likeContent(String contentId) async {
    await _api.post('/content/mongodb/$contentId/like');
  }
  
  Future<void> unlikeContent(String contentId) async {
    await _api.delete('/content/mongodb/$contentId/like');
  }
}
```

**4.3 Upload Service**
```dart
// lib/services/upload_service.dart
class UploadService {
  final ApiClient _api = ApiClient();
  
  Future<String> uploadFile(
    String filePath, {
    Function(int, int)? onProgress,
  }) async {
    // Step 1: Get presigned URL
    final fileName = filePath.split('/').last;
    final fileExtension = fileName.split('.').last;
    final contentType = _getContentType(fileExtension);
    
    final presignedResponse = await _api.post('/uploads/mongodb/presigned-url', data: {
      'filename': fileName,
      'contentType': contentType,
    });
    
    final uploadUrl = presignedResponse.data['data']['uploadUrl'];
    final sessionId = presignedResponse.data['data']['sessionId'];
    
    // Step 2: Upload to cloud storage
    // (Use the presigned URL or direct upload based on backend response)
    final uploadResponse = await _api.uploadFile(
      uploadUrl,
      filePath,
      'file',
      onProgress: onProgress,
    );
    
    // Step 3: Complete upload
    final completeResponse = await _api.post('/uploads/mongodb/complete', data: {
      'sessionId': sessionId,
      'fileUrl': uploadResponse.data['url'],
    });
    
    return completeResponse.data['data']['content']['videoUrl'];
  }
  
  String _getContentType(String extension) {
    switch (extension.toLowerCase()) {
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }
}
```

---

### Phase 5: Real-time Features (Week 2, Days 6-7)

**5.1 Messaging Service**
```dart
// lib/services/messaging_service.dart
class MessagingService {
  final SocketService _socket = SocketService();
  final ApiClient _api = ApiClient();
  
  Future<void> initialize() async {
    await _socket.connect();
    
    // Listen to incoming messages
    _socket.on('message:new', (data) {
      // Handle new message
      print('📨 New message: $data');
    });
    
    // Listen to typing indicators
    _socket.on('typing:start', (data) {
      print('⌨️ User typing: $data');
    });
    
    _socket.on('typing:stop', (data) {
      print('⌨️ User stopped typing: $data');
    });
  }
  
  Future<List<MessageModel>> getMessages(String conversationId) async {
    final response = await _api.get('/messaging/mongodb/conversations/$conversationId/messages');
    return (response.data['data']['messages'] as List)
        .map((json) => MessageModel.fromJson(json))
        .toList();
  }
  
  void sendMessage(String conversationId, String message) {
    _socket.sendMessage(conversationId, message);
  }
  
  void startTyping(String conversationId) {
    _socket.startTyping(conversationId);
  }
  
  void stopTyping(String conversationId) {
    _socket.stopTyping(conversationId);
  }
}
```

**5.2 Notification Service (Keep FCM)**
```dart
// lib/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final ApiClient _api = ApiClient();
  
  Future<void> initialize() async {
    // Request permission
    await _fcm.requestPermission();
    
    // Get FCM token
    final token = await _fcm.getToken();
    if (token != null) {
      // Send token to backend
      await _api.post('/notifications/mongodb/fcm-token', data: {
        'token': token,
      });
    }
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📬 Foreground message: ${message.notification?.title}');
      // Show local notification
    });
    
    // Handle background messages
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('📬 Background message opened: ${message.notification?.title}');
      // Navigate to appropriate screen
    });
  }
}
```

---

### Phase 6: State Management (Week 3, Days 1-3)

**6.1 Auth Provider**
```dart
// lib/providers/auth_provider.dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  
  Future<void> login(String identifier, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _user = await _authService.login(identifier, password);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _user = await _authService.register(
        username: username,
        email: email,
        password: password,
        fullName: fullName,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> loadUser() async {
    _user = await _authService.getCurrentUser();
    notifyListeners();
  }
  
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}
```

---

### Phase 7: UI Migration (Week 3, Days 4-7)

**7.1 Update Screens**

All existing screens need to be updated to use new services instead of Firebase:

**Before (Firebase):**
```dart
// Old Firebase code
final user = FirebaseAuth.instance.currentUser;
final snapshot = await FirebaseFirestore.instance
    .collection('users')
    .doc(userId)
    .get();
```

**After (REST API):**
```dart
// New REST API code
final user = await UserService().getUser(userId);
```

**7.2 Replace StreamBuilder with FutureBuilder**

**Before:**
```dart
StreamBuilder<QuerySnapshot>(
  stream: FirebaseFirestore.instance.collection('content').snapshots(),
  builder: (context, snapshot) {
    // Handle data
  },
)
```

**After:**
```dart
FutureBuilder<List<ContentModel>>(
  future: ContentService().getFeed(),
  builder: (context, snapshot) {
    // Handle data
  },
)
```

---

## 🔧 MIGRATION CHECKLIST

### Week 1: Infrastructure
- [ ] Add new dependencies to pubspec.yaml
- [ ] Create folder structure
- [ ] Implement ApiClient with interceptors
- [ ] Implement SocketService
- [ ] Implement SecureStorage for tokens
- [ ] Implement AuthService
- [ ] Test login/register/logout

### Week 2: Data Services
- [ ] Implement UserService
- [ ] Implement ContentService
- [ ] Implement UploadService
- [ ] Implement MessagingService (with WebSocket)
- [ ] Implement NotificationService (keep FCM)
- [ ] Test all services

### Week 3: UI & Testing
- [ ] Create state providers
- [ ] Update all screens
- [ ] Replace StreamBuilder with FutureBuilder/Provider
- [ ] Test all user flows
- [ ] Performance testing
- [ ] Bug fixes

---

## ⚠️ IMPORTANT NOTES

### Keep Firebase Messaging
```yaml
# Keep ONLY this Firebase dependency:
firebase_messaging: ^16.0.4

# Remove all others:
# firebase_auth ❌
# cloud_firestore ❌
# firebase_storage ❌
# firebase_analytics ❌
```

### Testing Strategy
1. Create a separate branch for migration
2. Test one feature at a time
3. Keep Firebase code until REST API version works
4. Use feature flags to switch between old/new

### Rollback Plan
If issues occur:
1. Switch back to main branch
2. Firebase app still works (Firebase backend still exists temporarily)
3. Fix issues in migration branch
4. Deploy again

---

## 📊 ESTIMATED TIMELINE

```
Week 1: Infrastructure & Auth       7 days
Week 2: Data Services & Real-time   7 days
Week 3: UI Updates & Testing        7 days
─────────────────────────────────────────────
Total:                              21 days (3 weeks)
```

---

## 🎯 SUCCESS CRITERIA

- [ ] 100% of screens migrated to REST API
- [ ] All features working (auth, feed, upload, messaging)
- [ ] Real-time features working (WebSocket)
- [ ] Notifications working (FCM)
- [ ] No Firebase dependencies except FCM
- [ ] Performance equal or better than Firebase
- [ ] All tests passing

---

## 📝 NEXT STEPS

1. **Review this plan** with your team
2. **Create a Git branch** for migration
3. **Start with Phase 1** (infrastructure)
4. **Test incrementally** after each phase
5. **Deploy when stable**

---

**Ready to start when backend is fully stable!** 🚀


