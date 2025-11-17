// Core providers
export 'package:flutter_riverpod/flutter_riverpod.dart';

// Core app providers
export '../../core/providers/auth_provider.dart';
export '../../core/providers/theme_provider.dart';
export '../../core/providers/language_provider.dart';
export '../../core/providers/socket_provider.dart';
export '../../core/providers/settings_provider.dart';

// Feature providers
export '../../features/notifications/providers/notifications_provider.dart';
export '../../features/messages/providers/messages_provider.dart';
export '../../features/wallet/providers/wallet_provider.dart';
export '../../features/cart/providers/cart_provider.dart';
export '../../features/content/providers/content_provider.dart';
export '../../features/products/providers/products_provider.dart';
export '../../features/orders/providers/orders_provider.dart';
export '../../features/live/providers/live_provider.dart';
export '../../features/analytics/providers/analytics_provider.dart';

// Provider initialization helper
class Providers {
  // Core providers
  static final auth = authServiceProvider;
  static final currentUser = currentUserProvider;
  static final isAuthenticated = isAuthenticatedProvider;
  static final themeMode = themeModeProvider;
  static final language = languageProvider;
  static final socket = socketProvider;
  static final socketConnection = socketConnectionProvider;
  static final appSettings = appSettingsProvider;

  // Notification providers
  static final notifications = notificationsProvider;
  static final unreadNotificationsCount = unreadNotificationsCountProvider;
  static final notificationSettings = notificationSettingsProvider;

  // Message providers
  static final conversations = conversationsProvider;
  static final unreadMessagesCount = unreadMessagesCountProvider;

  // Wallet providers
  static final wallet = walletProvider;
  static final walletBalance = walletBalanceProvider;
  static final transactions = transactionsProvider;

  // Cart providers
  static final cart = cartProvider;
  static final cartItemCount = cartItemCountProvider;
  static final cartTotal = cartTotalProvider;

  // Content providers
  static final contentFeed = contentFeedProvider;
  static final scheduledPosts = scheduledPostsProvider;

  // Product providers
  static final products = productsProvider;
  static final featuredProducts = featuredProductsProvider;
  static final wishlist = wishlistProvider;

  // Order providers
  static final orders = ordersProvider;
  static final orderCounts = orderCountsProvider;

  // Live providers
  static final liveStreams = liveStreamsProvider;
  static final scheduledLiveStreams = scheduledLiveStreamsProvider;

  // Analytics providers
  static final analytics = analyticsProvider;
  static final earningsAnalytics = earningsAnalyticsProvider;
}

// Provider observer for debugging
class ProviderLogger extends ProviderObserver {
  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    print('''
{
  "provider": "${provider.name ?? provider.runtimeType}",
  "newValue": "$newValue"
}''');
  }

  @override
  void providerDidFail(
    ProviderBase provider,
    Object error,
    StackTrace stackTrace,
    ProviderContainer container,
  ) {
    print('''
{
  "provider": "${provider.name ?? provider.runtimeType}",
  "error": "$error"
}''');
  }
}
