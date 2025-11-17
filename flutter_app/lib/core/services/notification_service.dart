import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Notification Service - Push notifications with FCM
/// Integrates with backend /api/notifications endpoints
class NotificationService {
  final ApiService _apiService = ApiService();
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  /// Initialize FCM and local notifications
  Future<void> initialize() async {
    // Request notification permissions
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted notification permissions');
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print('User granted provisional notification permissions');
    } else {
      print('User declined or has not accepted notification permissions');
    }

    // Get FCM token
    final fcmToken = await _fcm.getToken();
    if (fcmToken != null) {
      await _saveFcmToken(fcmToken);
    }

    // Listen for token refresh
    _fcm.onTokenRefresh.listen(_saveFcmToken);

    // Initialize local notifications
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      ),
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _handleNotificationTap,
    );

    // Handle foreground notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);

    // Handle notification when app was terminated
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleBackgroundMessage(initialMessage);
    }
  }

  /// Save FCM token to backend
  Future<void> _saveFcmToken(String token) async {
    try {
      await _apiService.post('/users/fcm-token', data: {'token': token});
      print('FCM token saved: ${token.substring(0, 20)}...');
    } catch (e) {
      print('Error saving FCM token: $e');
    }
  }

  /// Handle foreground notification
  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'mixillo_channel',
          'Mixillo Notifications',
          channelDescription: 'Notifications from Mixillo',
          importance: Importance.max,
          priority: Priority.high,
          showWhen: true,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['actionUrl'],
    );
  }

  /// Handle background notification tap
  void _handleBackgroundMessage(RemoteMessage message) {
    final data = message.data;
    print('Background notification tapped: $data');
    // TODO: Navigate to relevant screen based on data
    // This should be handled in the main app with a navigation key
  }

  /// Handle local notification tap
  void _handleNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      print('Notification tapped with payload: ${response.payload}');
      // TODO: Navigate to relevant screen
    }
  }

  /// Get user's notifications
  Future<List<NotificationModel>> getNotifications({
    int page = 1,
    int limit = 20,
    String? type,
  }) async {
    try {
      final response = await _apiService.get(
        '/notifications',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (type != null) 'type': type,
        },
      );
      return (response['data']['notifications'] as List)
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _apiService.put('/notifications/$notificationId/read');
    } catch (e) {
      rethrow;
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      await _apiService.put('/notifications/read-all');
    } catch (e) {
      rethrow;
    }
  }

  /// Get unread count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get('/notifications/unread-count');
      return response['data']['count'] ?? 0;
    } catch (e) {
      rethrow;
    }
  }

  /// Delete notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _apiService.delete('/notifications/$notificationId');
    } catch (e) {
      rethrow;
    }
  }

  /// Get notification settings
  Future<Map<String, dynamic>> getSettings() async {
    try {
      final response = await _apiService.get('/notifications/settings');
      return response['data']['settings'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Update notification settings
  Future<void> updateSettings(Map<String, dynamic> settings) async {
    try {
      await _apiService.put('/notifications/settings', data: settings);
    } catch (e) {
      rethrow;
    }
  }

  /// Send test notification (development only)
  Future<void> sendTestNotification() async {
    try {
      await _apiService.post('/notifications/test');
    } catch (e) {
      rethrow;
    }
  }

  /// Dispose resources
  void dispose() {
    // Clean up if needed
  }
}
