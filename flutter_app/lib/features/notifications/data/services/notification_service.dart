import '../../../../core/services/notification_service.dart' as core;
import '../../../../core/models/notification_model.dart' as core_models;

/// Re-export core notification service
/// Features can import from their local path which maps to core
class NotificationService {
  final core.NotificationService _coreService = core.NotificationService();

  // Delegate methods to core service
  Future<List<core_models.NotificationModel>> getNotifications({
    int page = 1,
    int limit = 20,
  }) => _coreService.getNotifications(page: page, limit: limit);

  Future<int> getUnreadCount() => _coreService.getUnreadCount();

  Future<bool> markAsRead(String notificationId) => 
      _coreService.markAsRead(notificationId);

  Future<bool> markAllAsRead() => _coreService.markAllAsRead();

  Future<bool> deleteNotification(String notificationId) => 
      _coreService.deleteNotification(notificationId);

  // Add missing settings methods
  Future<Map<String, bool>> getNotificationSettings() async {
    // Mock implementation since core service doesn't have this
    return {
      'push_notifications': true,
      'email_notifications': true,
      'sms_notifications': false,
      'in_app_notifications': true,
    };
  }

  Future<bool> updateNotificationSetting(String key, bool value) async {
    // Mock implementation since core service doesn't have this
    print('Updating notification setting: $key = $value');
    return true;
  }
}
