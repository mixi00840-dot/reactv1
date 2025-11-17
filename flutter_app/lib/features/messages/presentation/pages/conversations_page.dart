import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../../../core/services/messaging_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/conversation_item.dart';
import 'package:timeago/timeago.dart' as timeago;

/// Conversations list page
class ConversationsPage extends ConsumerStatefulWidget {
  const ConversationsPage({super.key});

  @override
  ConsumerState<ConversationsPage> createState() => _ConversationsPageState();
}

class _ConversationsPageState extends ConsumerState<ConversationsPage> {
  final MessagingService _messagingService = MessagingService();
  List<ConversationModel> _conversations = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _initializeMessaging();
    _loadConversations();
    _loadUnreadCount();
  }

  Future<void> _initializeMessaging() async {
    await _messagingService.initialize();

    // Listen for new messages
    _messagingService.onNewMessage((message) {
      if (mounted) {
        _refreshConversations();
        _loadUnreadCount();
      }
    });
  }

  @override
  void dispose() {
    _messagingService.dispose();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final conversations = await _messagingService.getConversations(
        page: _currentPage,
        limit: 20,
      );

      setState(() {
        if (conversations.isEmpty) {
          _hasMore = false;
        } else {
          _conversations.addAll(conversations);
          _currentPage++;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadUnreadCount() async {
    try {
      final count = await _messagingService.getUnreadCount();
      if (mounted) {
        setState(() {
          _unreadCount = count;
        });
      }
    } catch (e) {
      // Silent fail
    }
  }

  Future<void> _refreshConversations() async {
    setState(() {
      _conversations.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadConversations();
    await _loadUnreadCount();
  }

  Future<void> _archiveConversation(String conversationId) async {
    try {
      await _messagingService.archiveConversation(conversationId);
      setState(() {
        _conversations.removeWhere((c) => c.id == conversationId);
      });
      if (mounted) {
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

  Future<void> _deleteMessage(String messageId) async {
    try {
      await _messagingService.deleteMessage(messageId);
      await _refreshConversations();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Messages'),
            if (_unreadCount > 0)
              Text(
                '$_unreadCount unread',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.normal,
                ),
              ),
          ],
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              Navigator.pushNamed(context, '/messages/new');
            },
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.pushNamed(context, '/messages/search');
            },
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _conversations.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _conversations.isEmpty) {
      return Center(
        child: AppErrorWidget(
          message: _error!,
          onRetry: _loadConversations,
        ),
      );
    }

    if (_conversations.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshConversations,
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (scrollInfo.metrics.pixels >=
              scrollInfo.metrics.maxScrollExtent * 0.8) {
            _loadConversations();
          }
          return false;
        },
        child: ListView.builder(
          itemCount: _conversations.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _conversations.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: LoadingIndicator(),
                ),
              );
            }

            final conversation = _conversations[index];
            return ConversationItem(
              conversation: conversation,
              onTap: () => _openConversation(conversation),
              onArchive: () => _archiveConversation(conversation.id),
              onMute: () => _muteConversation(conversation),
            );
          },
        ),
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
            'Start a conversation with someone',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamed(context, '/messages/new');
            },
            icon: const Icon(Icons.edit),
            label: const Text('New Message'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _openConversation(ConversationModel conversation) {
    Navigator.pushNamed(
      context,
      '/messages/${conversation.id}',
      arguments: conversation,
    ).then((_) {
      _refreshConversations();
    });
  }

  Future<void> _muteConversation(ConversationModel conversation) async {
    try {
      if (conversation.muted) {
        await _messagingService.unmuteConversation(conversation.id);
      } else {
        await _messagingService.muteConversation(conversation.id);
      }
      await _refreshConversations();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              conversation.muted
                  ? 'Conversation unmuted'
                  : 'Conversation muted',
            ),
          ),
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
}
