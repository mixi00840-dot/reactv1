import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/notification.dart';
import '../data/services/notification_service.dart';

// Notification service provider
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

// Notifications list provider
final notificationsProvider = StateNotifierProvider<NotificationsNotifier,
    AsyncValue<List<NotificationModel>>>((ref) {
  final service = ref.watch(notificationServiceProvider);
  return NotificationsNotifier(service);
});

class NotificationsNotifier
    extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  final NotificationService _service;

  NotificationsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    state = const AsyncValue.loading();
    try {
      final notifications = await _service.getNotifications();
      state = AsyncValue.data(notifications);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _service.markAsRead(notificationId);

      state.whenData((notifications) {
        final updatedList = notifications.map((notif) {
          if (notif.id == notificationId) {
            return notif.copyWith(isRead: true);
          }
          return notif;
        }).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _service.markAllAsRead();

      state.whenData((notifications) {
        final updatedList =
            notifications.map((notif) => notif.copyWith(isRead: true)).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      await _service.deleteNotification(notificationId);

      state.whenData((notifications) {
        final updatedList =
            notifications.where((notif) => notif.id != notificationId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadNotifications();
  }
}

// Unread count provider
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notificationsState = ref.watch(notificationsProvider);
  return notificationsState.when(
    data: (notifications) => notifications.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

// Filtered notifications by type
final filteredNotificationsProvider =
    Provider.family<List<NotificationModel>, String?>((ref, type) {
  final notificationsState = ref.watch(notificationsProvider);
  return notificationsState.when(
    data: (notifications) {
      if (type == null || type == 'all') {
        return notifications;
      }
      return notifications.where((n) => n.type == type).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

// Notification settings provider
final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, AsyncValue<Map<String, bool>>>((ref) {
  final service = ref.watch(notificationServiceProvider);
  return NotificationSettingsNotifier(service);
});

class NotificationSettingsNotifier
    extends StateNotifier<AsyncValue<Map<String, bool>>> {
  final NotificationService _service;

  NotificationSettingsNotifier(this._service)
      : super(const AsyncValue.loading()) {
    loadSettings();
  }

  Future<void> loadSettings() async {
    state = const AsyncValue.loading();
    try {
      final settings = await _service.getNotificationSettings();
      state = AsyncValue.data(settings);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> updateSetting(String key, bool value) async {
    try {
      await _service.updateNotificationSetting(key, value);

      state.whenData((settings) {
        final updatedSettings = Map<String, bool>.from(settings);
        updatedSettings[key] = value;
        state = AsyncValue.data(updatedSettings);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
