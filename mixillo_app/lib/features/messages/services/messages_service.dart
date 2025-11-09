import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/services/api_service.dart';
import '../../../core/config/api_config.dart';

class MessagesService {
  final ApiService _api = ApiService();
  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _messageController;

  // Get conversations list
  Future<Map<String, dynamic>> getConversations({
    int page = 1,
    int limit = 20,
  }) async {
    return await _api.get(
      ApiConfig.messagesEndpoint,
      queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
  }

  // Get messages for a conversation
  Future<Map<String, dynamic>> getMessages({
    required String conversationId,
    int page = 1,
    int limit = 50,
  }) async {
    return await _api.get(
      '${ApiConfig.messagesEndpoint}/$conversationId/messages',
      queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
  }

  // Send a message
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String text,
    String? mediaUrl,
    String? mediaType,
  }) async {
    return await _api.post(
      '${ApiConfig.messagesEndpoint}/$conversationId/send',
      {
        'text': text,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        if (mediaType != null) 'mediaType': mediaType,
      },
    );
  }

  // Mark message as read
  Future<void> markAsRead(String messageId) async {
    await _api.put(
      '${ApiConfig.messagesEndpoint}/$messageId/read',
      {},
    );
  }

  // Mark conversation as read
  Future<void> markConversationAsRead(String conversationId) async {
    await _api.put(
      '${ApiConfig.messagesEndpoint}/$conversationId/mark-read',
      {},
    );
  }

  // Delete message
  Future<void> deleteMessage(String messageId) async {
    await _api.delete('${ApiConfig.messagesEndpoint}/$messageId');
  }

  // Create new conversation
  Future<Map<String, dynamic>> createConversation({
    required String userId,
    String? initialMessage,
  }) async {
    return await _api.post(
      ApiConfig.messagesEndpoint,
      {
        'userId': userId,
        if (initialMessage != null) 'message': initialMessage,
      },
    );
  }

  // WebSocket connection for real-time messages
  Stream<Map<String, dynamic>> connectWebSocket(String token) {
    _messageController = StreamController<Map<String, dynamic>>.broadcast();
    
    final wsUrl = '${ApiConfig.wsUrl}?token=$token';
    _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

    _channel!.stream.listen(
      (data) {
        final message = jsonDecode(data as String) as Map<String, dynamic>;
        _messageController!.add(message);
      },
      onError: (error) {
        print('WebSocket error: $error');
        _messageController!.addError(error);
      },
      onDone: () {
        print('WebSocket connection closed');
        _messageController!.close();
      },
    );

    return _messageController!.stream;
  }

  // Send message through WebSocket
  void sendWebSocketMessage(Map<String, dynamic> message) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  // Close WebSocket connection
  void closeWebSocket() {
    _channel?.sink.close();
    _messageController?.close();
    _channel = null;
    _messageController = null;
  }

  // Get unread count
  Future<Map<String, dynamic>> getUnreadCount() async {
    return await _api.get('${ApiConfig.messagesEndpoint}/unread-count');
  }

  // Search conversations
  Future<List<dynamic>> searchConversations(String query) async {
    final response = await _api.get(
      '${ApiConfig.messagesEndpoint}/search',
      queryParameters: {'q': query},
    );
    return response['conversations'] ?? [];
  }
}
