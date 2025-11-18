// Core providers
export 'package:flutter_riverpod/flutter_riverpod.dart';

// Core app providers
export 'auth_provider.dart';
export 'theme_provider.dart';
export 'language_provider.dart';
export 'socket_provider.dart';
export 'settings_provider.dart';

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

// Provider observer for debugging
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
