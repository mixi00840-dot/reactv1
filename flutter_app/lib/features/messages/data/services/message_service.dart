import '../../../../core/services/api_service.dart';
import '../models/message.dart';
import '../models/conversation.dart';

class MessageService {
  final ApiService _apiService = ApiService();

  /// Get conversations
  Future<List<Conversation>> getConversations({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/messages/conversations',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response['success'] == true && response['conversations'] != null) {
        return (response['conversations'] as List)
            .map((json) => Conversation.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching conversations: $e');
      return [];
    }
  }

  /// Get messages in a conversation
  Future<List<Message>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.get(
        '/messages/$conversationId',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response['success'] == true && response['messages'] != null) {
        return (response['messages'] as List)
            .map((json) => Message.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching messages: $e');
      return [];
    }
  }

  /// Send message
  Future<Message?> sendMessage({
    required String conversationId,
    required String text,
    String? mediaUrl,
    String? mediaType,
  }) async {
    try {
      final response = await _apiService.post(
        '/messages/$conversationId/send',
        data: {
          'text': text,
          if (mediaUrl != null) 'mediaUrl': mediaUrl,
          if (mediaType != null) 'mediaType': mediaType,
        },
      );

      if (response['success'] == true && response['message'] != null) {
        return Message.fromJson(response['message']);
      }

      return null;
    } catch (e) {
      print('Error sending message: $e');
      return null;
    }
  }

  /// Mark messages as read
  Future<bool> markAsRead(String conversationId) async {
    try {
      final response = await _apiService.put(
        '/messages/$conversationId/read',
      );

      return response['success'] == true;
    } catch (e) {
      print('Error marking as read: $e');
      return false;
    }
  }

  /// Start new conversation

    /// Delete conversation
    Future<bool> deleteConversation(String conversationId) async {
      try {
        final response = await _apiService.delete('/messages/conversations/$conversationId');

        return response['success'] == true;
      } catch (e) {
        print('Error deleting conversation: $e');
        return false;
      }
    }

    /// Start new conversation
  Future<Conversation?> startConversation(String userId) async {
    try {
      final response = await _apiService.post(
        '/messages/conversations/start',
        data: {'userId': userId},
      );

      if (response['success'] == true && response['conversation'] != null) {
        return Conversation.fromJson(response['conversation']);
      }

      return null;
    } catch (e) {
      print('Error starting conversation: $e');
      return null;
    }
  }
}
