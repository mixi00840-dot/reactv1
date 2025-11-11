import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/socket_service.dart';

// Socket connection state
enum SocketConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

// Socket state notifier
class SocketNotifier extends StateNotifier<SocketConnectionState> {
  final SocketService _socketService;

  SocketNotifier(this._socketService) : super(SocketConnectionState.disconnected);

  Future<void> connect() async {
    state = SocketConnectionState.connecting;
    try {
      await _socketService.connect();
      state = SocketConnectionState.connected;
    } catch (e) {
      state = SocketConnectionState.error;
    }
  }

  void disconnect() {
    _socketService.disconnect();
    state = SocketConnectionState.disconnected;
  }

  bool get isConnected => state == SocketConnectionState.connected;
}

// Socket provider instance
final socketProvider = StateNotifierProvider<SocketNotifier, SocketConnectionState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return SocketNotifier(socketService);
});

// Socket service provider (from video_feed_provider)
final socketServiceProvider = Provider((ref) => SocketService());
