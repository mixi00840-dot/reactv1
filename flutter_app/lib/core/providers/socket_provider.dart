import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

// Socket.IO client provider
final socketProvider = Provider<IO.Socket>((ref) {
  final socket = IO.io(
    'https://mixillo-backend.eur.run', // Your backend URL
    IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build(),
  );

  // Dispose socket when provider is disposed
  ref.onDispose(() {
    socket.dispose();
  });

  return socket;
});

// Socket connection state provider
final socketConnectionProvider =
    StateNotifierProvider<SocketConnectionNotifier, SocketConnectionState>(
        (ref) {
  final socket = ref.watch(socketProvider);
  return SocketConnectionNotifier(socket);
});

class SocketConnectionNotifier extends StateNotifier<SocketConnectionState> {
  final IO.Socket _socket;

  SocketConnectionNotifier(this._socket)
      : super(SocketConnectionState.disconnected) {
    _setupListeners();
  }

  void _setupListeners() {
    _socket.onConnect((_) {
      state = SocketConnectionState.connected;
    });

    _socket.onDisconnect((_) {
      state = SocketConnectionState.disconnected;
    });

    _socket.onConnecting((_) {
      state = SocketConnectionState.connecting;
    });

    _socket.onError((error) {
      state = SocketConnectionState.error;
    });
  }

  void connect(String token) {
    _socket.io.options?['extraHeaders'] = {
      'Authorization': 'Bearer $token',
    };
    _socket.connect();
  }

  void disconnect() {
    _socket.disconnect();
  }

  void emit(String event, dynamic data) {
    if (state == SocketConnectionState.connected) {
      _socket.emit(event, data);
    }
  }

  void on(String event, Function(dynamic) handler) {
    _socket.on(event, handler);
  }

  void off(String event) {
    _socket.off(event);
  }
}

enum SocketConnectionState {
  connecting,
  connected,
  disconnected,
  error,
}

// Real-time notification listener
final realtimeNotificationProvider =
    StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);

  return Stream.multi((controller) {
    void listener(dynamic data) {
      controller.add(data as Map<String, dynamic>);
    }

    socket.on('notification', listener);

    controller.onCancel = () {
      socket.off('notification');
    };
  });
});

// Real-time message listener
final realtimeMessageProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);

  return Stream.multi((controller) {
    void listener(dynamic data) {
      controller.add(data as Map<String, dynamic>);
    }

    socket.on('message', listener);

    controller.onCancel = () {
      socket.off('message');
    };
  });
});

// Real-time typing indicator listener
final realtimeTypingProvider =
    StreamProvider.family<Map<String, dynamic>, String>((ref, conversationId) {
  final socket = ref.watch(socketProvider);

  return Stream.multi((controller) {
    void listener(dynamic data) {
      final typingData = data as Map<String, dynamic>;
      if (typingData['conversationId'] == conversationId) {
        controller.add(typingData);
      }
    }

    socket.on('typing', listener);

    controller.onCancel = () {
      socket.off('typing');
    };
  });
});

// Real-time live stream updates
final realtimeLiveUpdateProvider =
    StreamProvider.family<Map<String, dynamic>, String>((ref, streamId) {
  final socket = ref.watch(socketProvider);

  return Stream.multi((controller) {
    void listener(dynamic data) {
      controller.add(data as Map<String, dynamic>);
    }

    socket.on('live:update:$streamId', listener);

    controller.onCancel = () {
      socket.off('live:update:$streamId');
    };
  });
});

// Real-time content view updates
final realtimeContentViewProvider =
    StreamProvider.family<Map<String, dynamic>, String>((ref, contentId) {
  final socket = ref.watch(socketProvider);

  return Stream.multi((controller) {
    void listener(dynamic data) {
      controller.add(data as Map<String, dynamic>);
    }

    socket.on('content:view:$contentId', listener);

    controller.onCancel = () {
      socket.off('content:view:$contentId');
    };
  });
});

// Socket event emitter helper
class SocketEventEmitter {
  final IO.Socket _socket;

  SocketEventEmitter(this._socket);

  void joinRoom(String roomId) {
    _socket.emit('join', roomId);
  }

  void leaveRoom(String roomId) {
    _socket.emit('leave', roomId);
  }

  void sendTyping(String conversationId, bool isTyping) {
    _socket.emit('typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void sendMessage(String conversationId, String message) {
    _socket.emit('message', {
      'conversationId': conversationId,
      'message': message,
    });
  }

  void sendLiveComment(String streamId, String comment) {
    _socket.emit('live:comment', {
      'streamId': streamId,
      'comment': comment,
    });
  }
}

final socketEmitterProvider = Provider<SocketEventEmitter>((ref) {
  final socket = ref.watch(socketProvider);
  return SocketEventEmitter(socket);
});
