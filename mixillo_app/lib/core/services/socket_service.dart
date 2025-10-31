import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

/// Socket Service for real-time communication
/// Handles notifications, messages, typing indicators, and online status
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _userId;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 3);

  // Event streams
  final StreamController<NotificationEvent> _notificationController =
      StreamController<NotificationEvent>.broadcast();
  final StreamController<MessageEvent> _messageController =
      StreamController<MessageEvent>.broadcast();
  final StreamController<TypingEvent> _typingController =
      StreamController<TypingEvent>.broadcast();
  final StreamController<OnlineStatusEvent> _onlineStatusController =
      StreamController<OnlineStatusEvent>.broadcast();
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  // Getters for event streams
  Stream<NotificationEvent> get notificationStream => _notificationController.stream;
  Stream<MessageEvent> get messageStream => _messageController.stream;
  Stream<TypingEvent> get typingStream => _typingController.stream;
  Stream<OnlineStatusEvent> get onlineStatusStream => _onlineStatusController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _isConnected;

  /// Initialize socket connection
  Future<void> connect({
    required String serverUrl,
    required String userId,
    required String token,
  }) async {
    if (_isConnected && _socket != null) {
      debugPrint('Socket already connected');
      return;
    }

    _userId = userId;

    try {
      _socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(_reconnectDelay.inMilliseconds)
            .setReconnectionAttempts(_maxReconnectAttempts)
            .setAuth({'token': token, 'userId': userId})
            .build(),
      );

      _setupEventHandlers();
      _socket!.connect();
      
      debugPrint('Socket connection initiated for user: $userId');
    } catch (e) {
      debugPrint('Socket connection error: $e');
      _scheduleReconnect(serverUrl, userId, token);
    }
  }

  /// Setup all socket event handlers
  void _setupEventHandlers() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      debugPrint('Socket connected successfully');
      _isConnected = true;
      _reconnectAttempts = 0;
      _connectionController.add(true);
      
      // Join user's room
      if (_userId != null) {
        _socket!.emit('user:join', {'userId': _userId});
        debugPrint('Joined user room: $_userId');
      }
    });

    _socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
      _isConnected = false;
      _connectionController.add(false);
    });

    _socket!.onConnectError((data) {
      debugPrint('Socket connection error: $data');
      _isConnected = false;
      _connectionController.add(false);
    });

    _socket!.onError((data) {
      debugPrint('Socket error: $data');
    });

    // Notification events
    _socket!.on('notification:new', (data) {
      debugPrint('New notification received: $data');
      try {
        final event = NotificationEvent.fromJson(data as Map<String, dynamic>);
        _notificationController.add(event);
      } catch (e) {
        debugPrint('Error parsing notification: $e');
      }
    });

    _socket!.on('notification:read', (data) {
      debugPrint('Notification marked as read: $data');
      try {
        final event = NotificationEvent.fromJson(data as Map<String, dynamic>);
        _notificationController.add(event);
      } catch (e) {
        debugPrint('Error parsing notification read event: $e');
      }
    });

    // Message events
    _socket!.on('message:new', (data) {
      debugPrint('New message received: $data');
      try {
        final event = MessageEvent.fromJson(data as Map<String, dynamic>);
        _messageController.add(event);
      } catch (e) {
        debugPrint('Error parsing message: $e');
      }
    });

    _socket!.on('message:delivered', (data) {
      debugPrint('Message delivered: $data');
      try {
        final event = MessageEvent.fromJson(data as Map<String, dynamic>);
        _messageController.add(event);
      } catch (e) {
        debugPrint('Error parsing message delivery: $e');
      }
    });

    _socket!.on('message:read', (data) {
      debugPrint('Message read: $data');
      try {
        final event = MessageEvent.fromJson(data as Map<String, dynamic>);
        _messageController.add(event);
      } catch (e) {
        debugPrint('Error parsing message read event: $e');
      }
    });

    // Typing events
    _socket!.on('typing:start', (data) {
      debugPrint('User started typing: $data');
      try {
        final event = TypingEvent.fromJson(data as Map<String, dynamic>);
        _typingController.add(event);
      } catch (e) {
        debugPrint('Error parsing typing start: $e');
      }
    });

    _socket!.on('typing:stop', (data) {
      debugPrint('User stopped typing: $data');
      try {
        final event = TypingEvent.fromJson(data as Map<String, dynamic>);
        _typingController.add(event);
      } catch (e) {
        debugPrint('Error parsing typing stop: $e');
      }
    });

    // Online status events
    _socket!.on('user:online', (data) {
      debugPrint('User came online: $data');
      try {
        final event = OnlineStatusEvent.fromJson(data as Map<String, dynamic>);
        _onlineStatusController.add(event);
      } catch (e) {
        debugPrint('Error parsing online status: $e');
      }
    });

    _socket!.on('user:offline', (data) {
      debugPrint('User went offline: $data');
      try {
        final event = OnlineStatusEvent.fromJson(data as Map<String, dynamic>);
        _onlineStatusController.add(event);
      } catch (e) {
        debugPrint('Error parsing offline status: $e');
      }
    });

    // Call events (for future video/audio calls)
    _socket!.on('call:incoming', (data) {
      debugPrint('Incoming call: $data');
      // TODO: Implement call handling
    });

    _socket!.on('call:ended', (data) {
      debugPrint('Call ended: $data');
      // TODO: Implement call handling
    });
  }

  /// Schedule reconnection attempt
  void _scheduleReconnect(String serverUrl, String userId, String token) {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('Max reconnection attempts reached');
      return;
    }

    _reconnectAttempts++;
    debugPrint('Scheduling reconnect attempt $_reconnectAttempts/$_maxReconnectAttempts');

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      connect(serverUrl: serverUrl, userId: userId, token: token);
    });
  }

  /// Emit typing start event
  void emitTypingStart(String conversationId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('typing:start', {
      'conversationId': conversationId,
      'userId': _userId,
    });
    debugPrint('Emitted typing start for conversation: $conversationId');
  }

  /// Emit typing stop event
  void emitTypingStop(String conversationId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('typing:stop', {
      'conversationId': conversationId,
      'userId': _userId,
    });
    debugPrint('Emitted typing stop for conversation: $conversationId');
  }

  /// Mark notification as read
  void markNotificationAsRead(String notificationId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('notification:mark_read', {
      'notificationId': notificationId,
      'userId': _userId,
    });
    debugPrint('Marked notification as read: $notificationId');
  }

  /// Mark message as delivered
  void markMessageAsDelivered(String messageId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('message:delivered', {
      'messageId': messageId,
      'userId': _userId,
    });
    debugPrint('Marked message as delivered: $messageId');
  }

  /// Mark message as read
  void markMessageAsRead(String messageId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('message:read', {
      'messageId': messageId,
      'userId': _userId,
    });
    debugPrint('Marked message as read: $messageId');
  }

  /// Join a conversation room
  void joinConversation(String conversationId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('conversation:join', {
      'conversationId': conversationId,
      'userId': _userId,
    });
    debugPrint('Joined conversation: $conversationId');
  }

  /// Leave a conversation room
  void leaveConversation(String conversationId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('conversation:leave', {
      'conversationId': conversationId,
      'userId': _userId,
    });
    debugPrint('Left conversation: $conversationId');
  }

  /// Send presence update
  void updatePresence({required bool isOnline}) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('user:presence', {
      'userId': _userId,
      'isOnline': isOnline,
      'timestamp': DateTime.now().toIso8601String(),
    });
    debugPrint('Updated presence: ${isOnline ? "online" : "offline"}');
  }

  /// Disconnect socket
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    
    _reconnectTimer?.cancel();
    _isConnected = false;
    _userId = null;
    _reconnectAttempts = 0;
    
    debugPrint('Socket disconnected and cleaned up');
  }

  /// Dispose all resources
  void dispose() {
    disconnect();
    _notificationController.close();
    _messageController.close();
    _typingController.close();
    _onlineStatusController.close();
    _connectionController.close();
    
    debugPrint('Socket service disposed');
  }
}

/// Notification Event Model
class NotificationEvent {
  final String id;
  final String type; // 'like', 'comment', 'follow', 'mention'
  final String userId;
  final String username;
  final String? userAvatar;
  final bool isVerified;
  final String message;
  final String? contentId;
  final String? contentThumbnail;
  final DateTime timestamp;
  final bool isRead;

  NotificationEvent({
    required this.id,
    required this.type,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.isVerified,
    required this.message,
    this.contentId,
    this.contentThumbnail,
    required this.timestamp,
    this.isRead = false,
  });

  factory NotificationEvent.fromJson(Map<String, dynamic> json) {
    return NotificationEvent(
      id: json['id'] ?? json['_id'] ?? '',
      type: json['type'] ?? 'unknown',
      userId: json['userId'] ?? json['user']?['id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
      userAvatar: json['userAvatar'] ?? json['user']?['avatar'],
      isVerified: json['isVerified'] ?? json['user']?['isVerified'] ?? false,
      message: json['message'] ?? '',
      contentId: json['contentId'] ?? json['content']?['id'],
      contentThumbnail: json['contentThumbnail'] ?? json['content']?['thumbnail'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      isRead: json['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'userId': userId,
      'username': username,
      'userAvatar': userAvatar,
      'isVerified': isVerified,
      'message': message,
      'contentId': contentId,
      'contentThumbnail': contentThumbnail,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
    };
  }
}

/// Message Event Model
class MessageEvent {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderUsername;
  final String? senderAvatar;
  final String content;
  final String? mediaUrl;
  final String? mediaType;
  final DateTime timestamp;
  final String status; // 'sent', 'delivered', 'read'
  final bool isEdited;
  final bool isDeleted;

  MessageEvent({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderUsername,
    this.senderAvatar,
    required this.content,
    this.mediaUrl,
    this.mediaType,
    required this.timestamp,
    this.status = 'sent',
    this.isEdited = false,
    this.isDeleted = false,
  });

  factory MessageEvent.fromJson(Map<String, dynamic> json) {
    return MessageEvent(
      id: json['id'] ?? json['_id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] ?? json['sender']?['id'] ?? '',
      senderUsername: json['senderUsername'] ?? json['sender']?['username'] ?? 'Unknown',
      senderAvatar: json['senderAvatar'] ?? json['sender']?['avatar'],
      content: json['content'] ?? json['text'] ?? '',
      mediaUrl: json['mediaUrl'] ?? json['media']?['url'],
      mediaType: json['mediaType'] ?? json['media']?['type'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      status: json['status'] ?? 'sent',
      isEdited: json['isEdited'] ?? false,
      isDeleted: json['isDeleted'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'senderUsername': senderUsername,
      'senderAvatar': senderAvatar,
      'content': content,
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
      'isEdited': isEdited,
      'isDeleted': isDeleted,
    };
  }
}

/// Typing Event Model
class TypingEvent {
  final String conversationId;
  final String userId;
  final String username;
  final bool isTyping;

  TypingEvent({
    required this.conversationId,
    required this.userId,
    required this.username,
    required this.isTyping,
  });

  factory TypingEvent.fromJson(Map<String, dynamic> json) {
    return TypingEvent(
      conversationId: json['conversationId'] ?? '',
      userId: json['userId'] ?? json['user']?['id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
      isTyping: json['isTyping'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'conversationId': conversationId,
      'userId': userId,
      'username': username,
      'isTyping': isTyping,
    };
  }
}

/// Online Status Event Model
class OnlineStatusEvent {
  final String userId;
  final String username;
  final bool isOnline;
  final DateTime timestamp;
  final String? lastSeen;

  OnlineStatusEvent({
    required this.userId,
    required this.username,
    required this.isOnline,
    required this.timestamp,
    this.lastSeen,
  });

  factory OnlineStatusEvent.fromJson(Map<String, dynamic> json) {
    return OnlineStatusEvent(
      userId: json['userId'] ?? json['user']?['id'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
      isOnline: json['isOnline'] ?? false,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      lastSeen: json['lastSeen'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'isOnline': isOnline,
      'timestamp': timestamp.toIso8601String(),
      'lastSeen': lastSeen,
    };
  }
}
