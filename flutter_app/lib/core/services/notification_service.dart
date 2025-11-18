// Firebase dependencies temporarily disabled - add when configured
// import 'package:firebase_messaging/firebase_messaging.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Notification Service - Push notifications (Firebase disabled for now)
/// TODO: Add Firebase dependencies and configure before enabling
/// Integrates with backend /api/notifications endpoints
class NotificationService {
  final ApiService _apiService = ApiService();

  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  /// Initialize notifications (Firebase disabled)
  Future<void> initialize() async {
    print('NotificationService initialized (Firebase disabled)');
  }

  //============================================================================
  // API METHODS - Fetch notifications from backend
  //============================================================================

  /// Get user notifications (paginated)
  Future<List<NotificationModel>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/notifications',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response['success'] == true) {
        return (response['notifications'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get('/notifications/unread-count');
      return response['count'] ?? 0;
    } catch (e) {
      print('Error fetching unread count: $e');
      return 0;
    }
  }

  /// Mark notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await _apiService.put(
        '/notifications/$notificationId/read',
      );
      return response['success'] ?? false;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiService.put('/notifications/read-all');
      return response['success'] ?? false;
    } catch (e) {
      print('Error marking all as read: $e');
      return false;
    }
  }

  /// Delete notification
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final response = await _apiService.delete(
        '/notifications/$notificationId',
      );
      return response['success'] ?? false;
    } catch (e) {
      print('Error deleting notification: $e');
      return false;
    }
  }

  /// Update notification settings
  Future<bool> updateSettings({
    bool? pushEnabled,
    bool? emailEnabled,
    bool? likesEnabled,
    bool? commentsEnabled,
    bool? followsEnabled,
    bool? messagesEnabled,
    bool? liveEnabled,
  }) async {
    try {
      final response = await _apiService.put(
        '/users/notification-settings',
        data: {
          if (pushEnabled != null) 'pushEnabled': pushEnabled,
          if (emailEnabled != null) 'emailEnabled': emailEnabled,
          if (likesEnabled != null) 'likesEnabled': likesEnabled,
          if (commentsEnabled != null) 'commentsEnabled': commentsEnabled,
          if (followsEnabled != null) 'followsEnabled': followsEnabled,
          if (messagesEnabled != null) 'messagesEnabled': messagesEnabled,
          if (liveEnabled != null) 'liveEnabled': liveEnabled,
        },
      );

      return response['success'] ?? false;
    } catch (e) {
      print('Error updating notification settings: $e');
      return false;
    }
  }
}
