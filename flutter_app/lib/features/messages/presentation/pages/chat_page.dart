import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../../../core/services/messaging_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/message_bubble.dart';
import '../widgets/message_input.dart';
import 'package:timeago/timeago.dart' as timeago;

/// Chat page - individual conversation view
class ChatPage extends ConsumerStatefulWidget {
  final String conversationId;
  final ConversationModel? conversation;

  const ChatPage({
    super.key,
    required this.conversationId,
    this.conversation,
  });

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final MessagingService _messagingService = MessagingService();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();

  List<MessageModel> _messages = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isSending = false;
  bool _isTyping = false;
  String? _typingUserId;

  @override
  void initState() {
    super.initState();
    _initializeChat();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _initializeChat() async {
    await _messagingService.initialize();

    // Listen for new messages
    _messagingService.onNewMessage((message) {
      if (message.conversationId == widget.conversationId && mounted) {
        setState(() {
          _messages.insert(0, message);
        });
        _scrollToBottom();
      }
    });

    // Listen for typing indicators
    _messagingService.onTyping((userId, conversationId) {
      if (conversationId == widget.conversationId && mounted) {
        setState(() {
          _isTyping = true;
          _typingUserId = userId;
        });

        // Clear typing indicator after 3 seconds
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            setState(() {
              _isTyping = false;
              _typingUserId = null;
            });
          }
        });
      }
    });

    await _loadMessages();
    await _markAsRead();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      _loadMoreMessages();
    }
  }

  Future<void> _loadMessages() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final messages = await _messagingService.getMessages(
        conversationId: widget.conversationId,
        page: _currentPage,
        limit: 50,
      );

      setState(() {
        if (messages.isEmpty) {
          _hasMore = false;
        } else {
          _messages.addAll(messages);
          _currentPage++;
        }
        _isLoading = false;
      });

      if (_currentPage == 2) {
        _scrollToBottom();
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreMessages() async {
    if (!_hasMore || _isLoading) return;
    await _loadMessages();
  }

  Future<void> _markAsRead() async {
    try {
      await _messagingService.markAsRead(widget.conversationId);
    } catch (e) {
      // Silent fail
    }
  }

  Future<void> _sendMessage(String content, {String type = 'text'}) async {
    if (content.trim().isEmpty) return;

    setState(() => _isSending = true);

    try {
      final message = await _messagingService.sendMessageToConversation(
        conversationId: widget.conversationId,
        content: content,
        type: type,
      );

      setState(() {
        _messages.insert(0, message);
        _messageController.clear();
        _isSending = false;
      });

      _scrollToBottom();
    } catch (e) {
      setState(() => _isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  void _onTyping() {
    _messagingService.emitTyping(widget.conversationId);
  }

  @override
  Widget build(BuildContext context) {
    // Get display name from conversation
    const currentUserId = 'current-user-id'; // TODO: Get from auth provider
    final displayName =
        widget.conversation?.getDisplayName(currentUserId) ?? 'Chat';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(displayName),
            if (_isTyping)
              Text(
                'typing...',
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                ),
              ),
          ],
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam),
            onPressed: () {
              // TODO: Start video call
            },
          ),
          IconButton(
            icon: const Icon(Icons.call),
            onPressed: () {
              // TODO: Start voice call
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'mute':
                  _muteConversation();
                  break;
                case 'archive':
                  _archiveConversation();
                  break;
                case 'delete':
                  _deleteConversation();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'mute',
                child: Text('Mute'),
              ),
              const PopupMenuItem(
                value: 'archive',
                child: Text('Archive'),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Text('Delete'),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(child: _buildMessageList()),
          MessageInput(
            controller: _messageController,
            onSend: _sendMessage,
            onTyping: _onTyping,
            isSending: _isSending,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    if (_isLoading && _messages.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _messages.isEmpty) {
      return Center(
        child: AppErrorWidget(
          message: _error!,
          onRetry: _loadMessages,
        ),
      );
    }

    if (_messages.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: LoadingIndicator(),
            ),
          );
        }

        final message = _messages[index];
        final isMe = message.senderId == currentUserId;

        // Show date separator
        bool showDateSeparator = false;
        if (index == _messages.length - 1) {
          showDateSeparator = true;
        } else {
          final nextMessage = _messages[index + 1];
          final currentDate = DateTime(
            message.createdAt.year,
            message.createdAt.month,
            message.createdAt.day,
          );
          final nextDate = DateTime(
            nextMessage.createdAt.year,
            nextMessage.createdAt.month,
            nextMessage.createdAt.day,
          );
          showDateSeparator = currentDate != nextDate;
        }

        return Column(
          children: [
            if (showDateSeparator) _buildDateSeparator(message.createdAt),
            MessageBubble(
              message: message,
              isMe: isMe,
              onDelete: () => _deleteMessage(message.id),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(date.year, date.month, date.day);

    String dateText;
    if (messageDate == today) {
      dateText = 'Today';
    } else if (messageDate == yesterday) {
      dateText = 'Yesterday';
    } else {
      dateText = '${date.day}/${date.month}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppColors.border)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              dateText,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(child: Divider(color: AppColors.border)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start the conversation',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteMessage(String messageId) async {
    try {
      await _messagingService.deleteMessage(messageId);
      setState(() {
        _messages.removeWhere((m) => m.id == messageId);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _muteConversation() async {
    try {
      await _messagingService.muteConversation(widget.conversationId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Conversation muted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _archiveConversation() async {
    try {
      await _messagingService.archiveConversation(widget.conversationId);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Conversation archived')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _deleteConversation() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation'),
        content:
            const Text('Are you sure you want to delete this conversation?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: Implement delete conversation API
      Navigator.pop(context);
    }
  }
}
