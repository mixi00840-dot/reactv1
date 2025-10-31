import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_settings_model.dart';
import '../models/seller_application_model.dart';
import '../models/activity_model.dart';
import '../models/wallet_model.dart';
import '../models/conversation_model.dart';
import '../services/profile_service.dart';
import '../services/socket_service.dart';

// Service Providers
final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService();
});

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

// Settings Providers
final userSettingsProvider = StateNotifierProvider<UserSettingsNotifier, AsyncValue<UserSettings>>((ref) {
  return UserSettingsNotifier(ref.watch(profileServiceProvider));
});

class UserSettingsNotifier extends StateNotifier<AsyncValue<UserSettings>> {
  final ProfileService _service;

  UserSettingsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadSettings();
  }

  Future<void> loadSettings() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.getUserSettings());
  }

  Future<void> updateSettings(UserSettings settings) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.updateUserSettings(settings));
  }

  Future<void> updateTheme(ThemePreference theme) async {
    final current = state.value;
    if (current != null) {
      await updateSettings(current.copyWith(theme: theme));
    }
  }

  Future<void> updatePrivacy(PrivacySettings privacy) async {
    final current = state.value;
    if (current != null) {
      await updateSettings(current.copyWith(privacy: privacy));
    }
  }
}

// Seller Application Providers
final sellerApplicationProvider = StateNotifierProvider<SellerApplicationNotifier, AsyncValue<SellerApplication?>>((ref) {
  return SellerApplicationNotifier(
    ref.watch(profileServiceProvider),
    ref.watch(socketServiceProvider),
  );
});

class SellerApplicationNotifier extends StateNotifier<AsyncValue<SellerApplication?>> {
  final ProfileService _service;
  final SocketService _socketService;

  SellerApplicationNotifier(this._service, this._socketService) : super(const AsyncValue.loading()) {
    loadSellerStatus();
    _listenToStatusUpdates();
  }

  Future<void> loadSellerStatus() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.getSellerStatus());
  }

  Future<void> submitApplication({
    required String businessName,
    required String businessType,
    required String businessDescription,
    required Map<String, dynamic> businessAddress,
    required String phoneNumber,
    required String email,
    required List<dynamic> documents,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.submitSellerApplication(
          businessName: businessName,
          businessType: businessType,
          businessDescription: businessDescription,
          businessAddress: businessAddress,
          phoneNumber: phoneNumber,
          email: email,
          documents: documents.cast(),
        ));
  }

  void _listenToStatusUpdates() {
    _socketService.sellerStatusStream.listen((data) {
      loadSellerStatus(); // Refresh status when update received
    });
  }
}

// Activity Feed Providers
final activityFeedProvider = StateNotifierProvider<ActivityFeedNotifier, AsyncValue<List<ActivityEvent>>>((ref) {
  return ActivityFeedNotifier(
    ref.watch(profileServiceProvider),
    ref.watch(socketServiceProvider),
  );
});

class ActivityFeedNotifier extends StateNotifier<AsyncValue<List<ActivityEvent>>> {
  final ProfileService _service;
  final SocketService _socketService;

  ActivityFeedNotifier(this._service, this._socketService) : super(const AsyncValue.loading()) {
    loadActivityFeed();
    _listenToActivityUpdates();
  }

  Future<void> loadActivityFeed({String? type, bool? unreadOnly}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.getActivityFeed(
          type: type,
          unreadOnly: unreadOnly,
        ));
  }

  Future<void> markAsRead(String activityId) async {
    await _service.markActivityAsRead(activityId);
    // Update local state
    final currentList = state.value;
    if (currentList != null) {
      state = AsyncValue.data(
        currentList.map((event) {
          if (event.id == activityId) {
            return event.copyWith(isRead: true);
          }
          return event;
        }).toList(),
      );
    }
  }

  Future<void> markAllAsRead() async {
    await _service.markAllActivitiesAsRead();
    await loadActivityFeed();
  }

  void _listenToActivityUpdates() {
    _socketService.activityStream.listen((data) {
      // Add new activity to the list
      final currentList = state.value;
      if (currentList != null) {
        final newEvent = ActivityEvent.fromJson(data);
        state = AsyncValue.data([newEvent, ...currentList]);
      }
    });
  }
}

// Levels & Badges Providers
final userLevelProvider = FutureProvider.family<UserLevel, String>((ref, userId) async {
  final service = ref.watch(profileServiceProvider);
  return service.getUserLevel(userId);
});

final userBadgesProvider = FutureProvider.family<List<UserBadge>, String>((ref, userId) async {
  final service = ref.watch(profileServiceProvider);
  return service.getUserBadges(userId);
});

// Wallet Providers
final walletDataProvider = StateNotifierProvider<WalletNotifier, AsyncValue<WalletData>>((ref) {
  return WalletNotifier(ref.watch(profileServiceProvider));
});

class WalletNotifier extends StateNotifier<AsyncValue<WalletData>> {
  final ProfileService _service;

  WalletNotifier(this._service) : super(const AsyncValue.loading()) {
    loadWalletData();
  }

  Future<void> loadWalletData() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.getWalletData());
  }

  Future<void> purchaseCoins(double amount) async {
    await _service.purchaseCoins(amount);
    await loadWalletData();
  }

  Future<void> withdrawFunds(double amount, Map<String, dynamic> withdrawalDetails) async {
    await _service.withdrawFunds(amount, withdrawalDetails);
    await loadWalletData();
  }
}

final transactionsProvider = FutureProvider.autoDispose<List<Transaction>>((ref) async {
  final service = ref.watch(profileServiceProvider);
  return service.getTransactions();
});

// Inbox/Conversations Providers
final conversationsProvider = StateNotifierProvider<ConversationsNotifier, AsyncValue<List<Conversation>>>((ref) {
  return ConversationsNotifier(
    ref.watch(profileServiceProvider),
    ref.watch(socketServiceProvider),
  );
});

class ConversationsNotifier extends StateNotifier<AsyncValue<List<Conversation>>> {
  final ProfileService _service;
  final SocketService _socketService;

  ConversationsNotifier(this._service, this._socketService) : super(const AsyncValue.loading()) {
    loadConversations();
    _listenToMessageUpdates();
  }

  Future<void> loadConversations() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _service.getConversations());
  }

  Future<void> markAsRead(String conversationId) async {
    await _service.markConversationAsRead(conversationId);
    await loadConversations();
  }

  void _listenToMessageUpdates() {
    _socketService.messageStream.listen((data) {
      loadConversations(); // Refresh conversations on new message
    });
  }

  int get totalUnreadCount {
    final conversations = state.value;
    if (conversations == null) return 0;
    return conversations.fold(0, (sum, conv) => sum + conv.unreadCount);
  }
}

// Content Providers
final savedContentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.watch(profileServiceProvider);
  return service.getSavedContent();
});

final likedContentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.watch(profileServiceProvider);
  return service.getLikedContent();
});
