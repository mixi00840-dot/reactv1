import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/models/models.dart';

/// Messaging Service - Real-time chat with Socket.IO
/// Integrates with backend /api/messaging endpoints
class MessagingService {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  IO.Socket? _socket;

  static final MessagingService _instance = MessagingService._internal();
  factory MessagingService() => _instance;
  MessagingService._internal();

  /// Initialize Socket.IO connection
  Future<void> initialize() async {
    final token = await _authService.getToken();
    if (token == null) {
      print('Cannot initialize messaging: no auth token');
      return;
    }

    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000';
    final socketUrl = baseUrl.replaceAll('/api', '');

    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket?.connect();

    _socket?.on('connect', (_) {
      print('Socket connected: ${_socket?.id}');
    });

    _socket?.on('disconnect', (_) {
      print('Socket disconnected');
    });

    _socket?.on('error', (error) {
      print('Socket error: $error');
    });
  }

  /// Disconnect socket
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  /// Listen for new messages
  void onNewMessage(Function(MessageModel) callback) {
    _socket?.on('newMessage', (data) {
      try {
        callback(MessageModel.fromJson(data));
      } catch (e) {
        print('Error parsing new message: $e');
      }
    });
  }

  /// Listen for message read status
  void onMessageRead(Function(String messageId) callback) {
    _socket?.on('messageRead', (data) {
      try {
        callback(data['messageId'] ?? data['id']);
      } catch (e) {
        print('Error parsing message read event: $e');
      }
    });
  }

  /// Listen for typing indicators
  void onTyping(Function(String userId, String conversationId) callback) {
    _socket?.on('userTyping', (data) {
      try {
        callback(data['userId'], data['conversationId']);
      } catch (e) {
        print('Error parsing typing event: $e');
      }
    });
  }

  /// Emit typing indicator
  void emitTyping(String conversationId) {
    _socket?.emit('typing', {'conversationId': conversationId});
  }

  /// Get all conversations
  Future<List<ConversationModel>> getConversations({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/messaging/conversations',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['conversations'] as List)
          .map((json) => ConversationModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get conversation by ID
  Future<ConversationModel> getConversation(String conversationId) async {
    try {
      final response =
          await _apiService.get('/messaging/conversations/$conversationId');
      return ConversationModel.fromJson(response['data']['conversation']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get messages in a conversation
  Future<List<MessageModel>> getMessages({
    required String conversationId,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.get(
        '/messaging/conversations/$conversationId/messages',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['messages'] as List)
          .map((json) => MessageModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Send message
  Future<MessageModel> sendMessage({
    required String recipientId,
    required String content,
    String type = 'text',
    String? mediaUrl,
    String? replyToId,
  }) async {
    try {
      final response = await _apiService.post('/messaging/send', data: {
        'recipientId': recipientId,
        'content': content,
        'type': type,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        if (replyToId != null) 'replyTo': replyToId,
      });
      return MessageModel.fromJson(response['data']['message']);
    } catch (e) {
      rethrow;
    }
  }

  /// Send message to existing conversation
  Future<MessageModel> sendMessageToConversation({
    required String conversationId,
    required String content,
    String type = 'text',
    String? mediaUrl,
    String? replyToId,
  }) async {
    try {
      final response = await _apiService.post(
        '/messaging/conversations/$conversationId/messages',
        data: {
          'content': content,
          'type': type,
          if (mediaUrl != null) 'mediaUrl': mediaUrl,
          if (replyToId != null) 'replyTo': replyToId,
        },
      );
      return MessageModel.fromJson(response['data']['message']);
    } catch (e) {
      rethrow;
    }
  }

  /// Delete message
  Future<void> deleteMessage(String messageId) async {
    try {
      await _apiService.delete('/messaging/messages/$messageId');
    } catch (e) {
      rethrow;
    }
  }

  /// Mark conversation as read
  Future<void> markAsRead(String conversationId) async {
    try {
      await _apiService.put('/messaging/conversations/$conversationId/read');
    } catch (e) {
      rethrow;
    }
  }

  /// Archive conversation
  Future<void> archiveConversation(String conversationId) async {
    try {
      await _apiService.put('/messaging/conversations/$conversationId/archive');
    } catch (e) {
      rethrow;
    }
  }

  /// Unarchive conversation
  Future<void> unarchiveConversation(String conversationId) async {
    try {
      await _apiService
          .put('/messaging/conversations/$conversationId/unarchive');
    } catch (e) {
      rethrow;
    }
  }

  /// Mute conversation
  Future<void> muteConversation(String conversationId) async {
    try {
      await _apiService.put('/messaging/conversations/$conversationId/mute');
    } catch (e) {
      rethrow;
    }
  }

  /// Unmute conversation
  Future<void> unmuteConversation(String conversationId) async {
    try {
      await _apiService.put('/messaging/conversations/$conversationId/unmute');
    } catch (e) {
      rethrow;
    }
  }

  /// Search messages
  Future<List<MessageModel>> searchMessages({
    required String query,
    String? conversationId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/messaging/search',
        queryParameters: {
          'query': query,
          if (conversationId != null) 'conversationId': conversationId,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['messages'] as List)
          .map((json) => MessageModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get unread count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiService.get('/messaging/unread-count');
      return response['data']['count'] ?? 0;
    } catch (e) {
      rethrow;
    }
  }

  /// Dispose resources
  void dispose() {
    disconnect();
  }
}
