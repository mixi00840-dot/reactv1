import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final String _baseUrl = 'http://localhost:5000';

  // Stream controllers for real-time events
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _notificationController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _xpUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _sellerStatusController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _activityController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Streams for components to listen to
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<Map<String, dynamic>> get xpUpdateStream => _xpUpdateController.stream;
  Stream<Map<String, dynamic>> get sellerStatusStream => _sellerStatusController.stream;
  Stream<Map<String, dynamic>> get activityStream => _activityController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) {
      print('Socket already connected');
      return;
    }

    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null) {
        throw Exception('No authentication token found');
      }

      _socket = IO.io(
        _baseUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .setAuth({'token': token})
            .build(),
      );

      _setupEventListeners();

      _socket!.connect();
      print('Socket connection initiated');
    } catch (e) {
      print('Socket connection error: $e');
      rethrow;
    }
  }

  void _setupEventListeners() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      print('Socket connected successfully');
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.onError((error) {
      print('Socket error: $error');
    });

    // Message events
    _socket!.on('new_message', (data) {
      print('New message received: $data');
      _messageController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('message_read', (data) {
      print('Message read: $data');
      _messageController.add(Map<String, dynamic>.from(data));
    });

    // Notification events
    _socket!.on('notification', (data) {
      print('New notification: $data');
      _notificationController.add(Map<String, dynamic>.from(data));
    });

    // Activity events
    _socket!.on('activity_event', (data) {
      print('New activity event: $data');
      _activityController.add(Map<String, dynamic>.from(data));
    });

    // XP and level events
    _socket!.on('xp_gained', (data) {
      print('XP gained: $data');
      _xpUpdateController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('level_up', (data) {
      print('Level up: $data');
      _xpUpdateController.add({
        ...Map<String, dynamic>.from(data),
        'type': 'level_up',
      });
    });

    // Seller status events
    _socket!.on('seller_status_update', (data) {
      print('Seller status update: $data');
      _sellerStatusController.add(Map<String, dynamic>.from(data));
    });

    // Badge events
    _socket!.on('badge_earned', (data) {
      print('Badge earned: $data');
      _notificationController.add({
        ...Map<String, dynamic>.from(data),
        'type': 'badge_earned',
      });
    });

    // Wallet events
    _socket!.on('balance_update', (data) {
      print('Balance update: $data');
      _notificationController.add({
        ...Map<String, dynamic>.from(data),
        'type': 'balance_update',
      });
    });

    // User status events
    _socket!.on('user_online', (data) {
      print('User online: $data');
      _messageController.add({
        ...Map<String, dynamic>.from(data),
        'type': 'user_online',
      });
    });

    _socket!.on('user_offline', (data) {
      print('User offline: $data');
      _messageController.add({
        ...Map<String, dynamic>.from(data),
        'type': 'user_offline',
      });
    });
  }

  // Emit events
  void sendMessage(String conversationId, String message) {
    if (_socket == null || !_socket!.connected) {
      print('Socket not connected. Cannot send message.');
      return;
    }

    _socket!.emit('send_message', {
      'conversationId': conversationId,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void markMessageAsRead(String messageId) {
    if (_socket == null || !_socket!.connected) {
      print('Socket not connected. Cannot mark message as read.');
      return;
    }

    _socket!.emit('mark_read', {
      'messageId': messageId,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void joinConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) {
      print('Socket not connected. Cannot join conversation.');
      return;
    }

    _socket!.emit('join_conversation', {
      'conversationId': conversationId,
    });
  }

  void leaveConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) {
      return;
    }

    _socket!.emit('leave_conversation', {
      'conversationId': conversationId,
    });
  }

  void updateTypingStatus(String conversationId, bool isTyping) {
    if (_socket == null || !_socket!.connected) {
      return;
    }

    _socket!.emit('typing_status', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    print('Socket disconnected and disposed');
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _notificationController.close();
    _xpUpdateController.close();
    _sellerStatusController.close();
    _activityController.close();
  }
}
