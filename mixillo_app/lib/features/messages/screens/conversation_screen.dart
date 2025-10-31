import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/chat_model.dart';
import '../widgets/message_bubble.dart';
import '../widgets/message_input.dart';

class ConversationScreen extends StatefulWidget {
  final ChatModel chat;

  const ConversationScreen({
    super.key,
    required this.chat,
  });

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();
  
  // Sample messages
  late List<MessageModel> _messages;
  final String _currentUserId = 'currentUser';

  @override
  void initState() {
    super.initState();
    _messages = [
      MessageModel(
        id: '1',
        senderId: widget.chat.userId,
        receiverId: _currentUserId,
        content: 'Hey! How are you doing?',
        type: MessageType.text,
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        isRead: true,
      ),
      MessageModel(
        id: '2',
        senderId: _currentUserId,
        receiverId: widget.chat.userId,
        content: 'I\'m great! Thanks for asking 😊',
        type: MessageType.text,
        timestamp: DateTime.now().subtract(const Duration(hours: 2, minutes: 58)),
        isRead: true,
      ),
      MessageModel(
        id: '3',
        senderId: widget.chat.userId,
        receiverId: _currentUserId,
        content: 'Did you see my latest video?',
        type: MessageType.text,
        timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 30)),
        isRead: true,
      ),
      MessageModel(
        id: '4',
        senderId: _currentUserId,
        receiverId: widget.chat.userId,
        content: 'Yes! It was amazing 🎉',
        type: MessageType.text,
        timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 25)),
        isRead: true,
      ),
      MessageModel(
        id: '5',
        senderId: widget.chat.userId,
        receiverId: _currentUserId,
        content: widget.chat.lastMessage,
        type: MessageType.text,
        timestamp: widget.chat.lastMessageTime,
        isRead: false,
      ),
    ];
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage(String content, MessageType type, {String? mediaUrl}) {
    if (content.trim().isEmpty && type == MessageType.text) return;

    final message = MessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: _currentUserId,
      receiverId: widget.chat.userId,
      content: content,
      type: type,
      timestamp: DateTime.now(),
      isRead: false,
      mediaUrl: mediaUrl,
    );

    setState(() {
      _messages.add(message);
    });

    _messageController.clear();
    
    // Scroll to bottom
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: NetworkImage(widget.chat.avatarUrl),
                ),
                if (widget.chat.isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? AppColors.darkCard : AppColors.lightCard,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.chat.displayName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (widget.chat.isOnline)
                    Text(
                      'Active now',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.success,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_outlined),
            onPressed: () {
              // Start video call
            },
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              // Show chat info
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isSentByMe = message.senderId == _currentUserId;
                final showAvatar = index == _messages.length - 1 ||
                    _messages[index + 1].senderId != message.senderId;

                return MessageBubble(
                  message: message,
                  isSentByMe: isSentByMe,
                  showAvatar: showAvatar,
                  avatarUrl: isSentByMe ? null : widget.chat.avatarUrl,
                );
              },
            ),
          ),

          // Message Input
          MessageInput(
            controller: _messageController,
            onSendMessage: (content) => _sendMessage(content, MessageType.text),
            onSendMedia: (path, type) {
              _sendMessage(
                type == MessageType.image ? '📷 Photo' : '🎥 Video',
                type,
                mediaUrl: path,
              );
            },
          ),
        ],
      ),
    );
  }
}
