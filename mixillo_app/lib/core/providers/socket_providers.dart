import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/socket_service.dart';

/// Socket Service Provider
final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  
  // Cleanup when provider is disposed
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});

/// Connection Status Provider
final socketConnectionProvider = StreamProvider<bool>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.connectionStream;
});

/// Notifications Stream Provider
final notificationStreamProvider = StreamProvider<NotificationEvent>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.notificationStream;
});

/// Messages Stream Provider
final messageStreamProvider = StreamProvider<MessageEvent>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.messageStream;
});

/// Typing Indicator Stream Provider
final typingStreamProvider = StreamProvider<TypingEvent>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.typingStream;
});

/// Online Status Stream Provider
final onlineStatusStreamProvider = StreamProvider<OnlineStatusEvent>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.onlineStatusStream;
});
