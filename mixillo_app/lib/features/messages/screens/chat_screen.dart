import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';

class ChatScreen extends StatefulWidget {
  final String name;
  final String username;
  final bool isOnline;
  final bool isVerified;

  const ChatScreen({
    Key? key,
    required this.name,
    required this.username,
    this.isOnline = false,
    this.isVerified = false,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;

  final List<Map<String, dynamic>> _messages = [
    {
      'id': '1',
      'text': 'Hey! How are you doing? 👋',
      'isSent': false,
      'timestamp': '10:30 AM',
      'isRead': true,
    },
    {
      'id': '2',
      'text': 'Hi! I\'m good, thanks! How about you?',
      'isSent': true,
      'timestamp': '10:32 AM',
      'isRead': true,
    },
    {
      'id': '3',
      'text': 'Did you see my latest video? I\'d love to hear your thoughts! 🎥',
      'isSent': false,
      'timestamp': '10:33 AM',
      'isRead': true,
    },
    {
      'id': '4',
      'text': 'Yes! It was amazing! The editing was really professional 🔥',
      'isSent': true,
      'timestamp': '10:35 AM',
      'isRead': true,
    },
    {
      'id': '5',
      'text': 'Thanks so much! That means a lot ❤️',
      'isSent': false,
      'timestamp': '10:36 AM',
      'isRead': false,
    },
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    setState(() {
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'text': _messageController.text.trim(),
        'isSent': true,
        'timestamp': 'Just now',
        'isRead': false,
      });
      _messageController.clear();
    });

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
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      appBar: _buildAppBar(isDark),
      body: Column(
        children: [
          Expanded(
            child: _buildMessagesList(isDark),
          ),
          _buildMessageInput(isDark),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(bool isDark) {
    return AppBar(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        children: [
          Stack(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: DesignTokens.brandGradient),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.person,
                    color: DesignTokens.darkTextPrimary,
                    size: 20,
                  ),
                ),
              ),
              if (widget.isOnline)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: DesignTokens.successDefault,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                        width: 2,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: DesignTokens.space2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        widget.name,
                        style: AppTypography.titleSmall(context).copyWith(
                          fontWeight: DesignTokens.fontWeightSemiBold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (widget.isVerified) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.verified,
                        size: 16,
                        color: DesignTokens.brandSecondary,
                      ),
                    ],
                  ],
                ),
                Text(
                  widget.isOnline ? 'Active now' : 'Offline',
                  style: AppTypography.labelSmall(context).copyWith(
                    color: widget.isOnline
                        ? DesignTokens.successDefault
                        : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.phone),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.videocam),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.info_outline),
          onPressed: () {},
        ),
      ],
    );
  }

  Widget _buildMessagesList(bool isDark) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(DesignTokens.space4),
      itemCount: _messages.length + (_isTyping ? 1 : 0),
      itemBuilder: (context, index) {
        if (_isTyping && index == _messages.length) {
          return _buildTypingIndicator(isDark);
        }
        
        final message = _messages[index];
        final isSent = message['isSent'] as bool;
        
        return _buildMessageBubble(
          message: message['text'],
          isSent: isSent,
          timestamp: message['timestamp'],
          isRead: message['isRead'],
          isDark: isDark,
        );
      },
    );
  }

  Widget _buildMessageBubble({
    required String message,
    required bool isSent,
    required String timestamp,
    required bool isRead,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignTokens.space3),
      child: Row(
        mainAxisAlignment: isSent ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isSent) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.person,
                  color: DesignTokens.darkTextPrimary,
                  size: 16,
                ),
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
          ],
          
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.7,
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space3,
                vertical: DesignTokens.space2,
              ),
              decoration: BoxDecoration(
                gradient: isSent
                    ? LinearGradient(colors: DesignTokens.brandGradient)
                    : null,
                color: !isSent
                    ? (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface)
                    : null,
                borderRadius: BorderRadius.circular(DesignTokens.radiusLg),
                border: !isSent
                    ? Border.all(
                        color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                      )
                    : null,
                boxShadow: isSent ? DesignTokens.shadowSm : null,
              ),
              child: Column(
                crossAxisAlignment: isSent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Text(
                    message,
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: isSent
                          ? DesignTokens.darkTextPrimary
                          : (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        timestamp,
                        style: AppTypography.labelSmall(context).copyWith(
                          color: isSent
                              ? DesignTokens.darkTextPrimary.withOpacity(0.7)
                              : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary),
                          fontSize: 10,
                        ),
                      ),
                      if (isSent) ...[
                        const SizedBox(width: 4),
                        Icon(
                          isRead ? Icons.done_all : Icons.done,
                          size: 14,
                          color: isRead
                              ? DesignTokens.brandSecondary
                              : DesignTokens.darkTextPrimary.withOpacity(0.7),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignTokens.space3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: DesignTokens.brandGradient),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(
                Icons.person,
                color: DesignTokens.darkTextPrimary,
                size: 16,
              ),
            ),
          ),
          const SizedBox(width: DesignTokens.space2),
          Container(
            padding: const EdgeInsets.all(DesignTokens.space3),
            decoration: BoxDecoration(
              color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              borderRadius: BorderRadius.circular(DesignTokens.radiusLg),
              border: Border.all(
                color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(isDark, 0),
                const SizedBox(width: 4),
                _buildDot(isDark, 1),
                const SizedBox(width: 4),
                _buildDot(isDark, 2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(bool isDark, int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (context, value, child) {
        final delay = index * 0.2;
        final animValue = ((value + delay) % 1.0);
        return Transform.translate(
          offset: Offset(0, -4 * (1 - (animValue - 0.5).abs() * 2)),
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  Widget _buildMessageInput(bool isDark) {
    return Container(
      padding: EdgeInsets.only(
        left: DesignTokens.space4,
        right: DesignTokens.space4,
        top: DesignTokens.space3,
        bottom: MediaQuery.of(context).padding.bottom + DesignTokens.space3,
      ),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        border: Border(
          top: BorderSide(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              Icons.camera_alt,
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: Icon(
              Icons.image,
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
            onPressed: () {},
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space3,
                vertical: DesignTokens.space1,
              ),
              decoration: BoxDecoration(
                color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                border: Border.all(
                  color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      style: AppTypography.bodyMedium(context),
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Message...',
                        hintStyle: AppTypography.bodyMedium(context).copyWith(
                          color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      onChanged: (value) {
                        setState(() {});
                      },
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.emoji_emotions_outlined,
                      color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                    ),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: DesignTokens.space2),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                shape: BoxShape.circle,
                boxShadow: DesignTokens.shadowMd,
              ),
              child: const Center(
                child: Icon(
                  Icons.send,
                  color: DesignTokens.darkTextPrimary,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
