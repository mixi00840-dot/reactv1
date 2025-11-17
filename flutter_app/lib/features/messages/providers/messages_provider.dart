import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/message.dart';
import '../data/models/conversation.dart';
import '../data/services/message_service.dart';

// Message service provider
final messageServiceProvider = Provider<MessageService>((ref) {
  return MessageService();
});

// Conversations list provider
final conversationsProvider = StateNotifierProvider<ConversationsNotifier,
    AsyncValue<List<Conversation>>>((ref) {
  final service = ref.watch(messageServiceProvider);
  return ConversationsNotifier(service);
});

class ConversationsNotifier
    extends StateNotifier<AsyncValue<List<Conversation>>> {
  final MessageService _service;

  ConversationsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadConversations();
  }

  Future<void> loadConversations() async {
    state = const AsyncValue.loading();
    try {
      final conversations = await _service.getConversations();
      state = AsyncValue.data(conversations);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      await _service.deleteConversation(conversationId);

      state.whenData((conversations) {
        final updatedList =
            conversations.where((c) => c.id != conversationId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadConversations();
  }
}

// Messages for specific conversation
final conversationMessagesProvider = StateNotifierProvider.family<
    ConversationMessagesNotifier,
    AsyncValue<List<Message>>,
    String>((ref, conversationId) {
  final service = ref.watch(messageServiceProvider);
  return ConversationMessagesNotifier(service, conversationId);
});

class ConversationMessagesNotifier
    extends StateNotifier<AsyncValue<List<Message>>> {
  final MessageService _service;
  final String _conversationId;

  ConversationMessagesNotifier(this._service, this._conversationId)
      : super(const AsyncValue.loading()) {
    loadMessages();
  }

  Future<void> loadMessages() async {
    state = const AsyncValue.loading();
    try {
      final messages = await _service.getMessages(_conversationId);
      state = AsyncValue.data(messages);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> sendMessage(String content,
      {String? mediaUrl, String? mediaType}) async {
    try {
      final message = await _service.sendMessage(
        _conversationId,
        content,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
      );

      state.whenData((messages) {
        state = AsyncValue.data([...messages, message]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteMessage(String messageId) async {
    try {
      await _service.deleteMessage(messageId);

      state.whenData((messages) {
        final updatedList = messages.where((m) => m.id != messageId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void addMessage(Message message) {
    state.whenData((messages) {
      state = AsyncValue.data([...messages, message]);
    });
  }

  Future<void> refresh() async {
    await loadMessages();
  }
}

// Unread messages count
final unreadMessagesCountProvider = Provider<int>((ref) {
  final conversationsState = ref.watch(conversationsProvider);
  return conversationsState.when(
    data: (conversations) =>
        conversations.fold(0, (sum, conv) => sum + conv.unreadCount),
    loading: () => 0,
    error: (_, __) => 0,
  );
});

// Typing indicator provider
final typingIndicatorProvider =
    StateProvider.family<bool, String>((ref, conversationId) => false);
