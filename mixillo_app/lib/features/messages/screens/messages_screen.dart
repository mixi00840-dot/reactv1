import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({Key? key}) : super(key: key);

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  final List<Map<String, dynamic>> _messages = [
    {
      'id': '1',
      'name': 'Sarah Wilson',
      'username': '@sarah_designs',
      'lastMessage': 'Hey! Did you see my latest video? 🎥',
      'time': '5m',
      'unread': 2,
      'online': true,
      'typing': false,
      'verified': true,
    },
    {
      'id': '2',
      'name': 'Alex Johnson',
      'username': '@tech_master',
      'lastMessage': 'Thanks for the follow! 🎉',
      'time': '1h',
      'unread': 0,
      'online': true,
      'typing': false,
      'verified': false,
    },
    {
      'id': '3',
      'name': 'Emma Davis',
      'username': '@creative_soul',
      'lastMessage': 'Love your content! Keep it up 💖',
      'time': '2h',
      'unread': 0,
      'online': false,
      'typing': false,
      'verified': true,
    },
    {
      'id': '4',
      'name': 'Michael Brown',
      'username': '@mike_photo',
      'lastMessage': null,
      'time': '3h',
      'unread': 0,
      'online': false,
      'typing': true,
      'verified': false,
    },
    {
      'id': '5',
      'name': 'TechStore Official',
      'username': '@techstore',
      'lastMessage': 'Your order has been shipped! 📦',
      'time': '1d',
      'unread': 1,
      'online': true,
      'typing': false,
      'verified': true,
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(isDark),
          SliverToBoxAdapter(child: _buildSearchBar(isDark)),
          SliverToBoxAdapter(child: _buildStoriesSection(isDark)),
          _buildMessagesList(isDark),
        ],
      ),
    );
  }

  Widget _buildAppBar(bool isDark) {
    return SliverAppBar(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      elevation: 0,
      pinned: true,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: DesignTokens.space2,
              vertical: DesignTokens.space1,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: DesignTokens.brandGradient),
              borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
            ),
            child: const Icon(
              Icons.chat_bubble,
              color: DesignTokens.darkTextPrimary,
              size: 20,
            ),
          ),
          const SizedBox(width: DesignTokens.space2),
          Text(
            'Messages',
            style: AppTypography.h2(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.video_call_outlined),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.edit_outlined),
          onPressed: () {},
        ),
        const SizedBox(width: DesignTokens.space2),
      ],
    );
  }

  Widget _buildSearchBar(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space3),
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.search,
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
            const SizedBox(width: DesignTokens.space2),
            Expanded(
              child: TextField(
                controller: _searchController,
                style: AppTypography.bodyMedium(context),
                decoration: InputDecoration(
                  hintText: 'Search messages...',
                  hintStyle: AppTypography.bodyMedium(context).copyWith(
                    color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onChanged: (value) => setState(() {}),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoriesSection(bool isDark) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
        itemCount: 5,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: DesignTokens.space3),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: index == 0
                        ? LinearGradient(colors: DesignTokens.brandGradient)
                        : null,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: index == 0
                          ? Colors.transparent
                          : (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        index == 0 ? Icons.add : Icons.person,
                        color: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
                        size: 28,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: DesignTokens.space1),
                Text(
                  index == 0 ? 'Your story' : 'User $index',
                  style: AppTypography.labelSmall(context),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMessagesList(bool isDark) {
    final filteredMessages = _searchController.text.isEmpty
        ? _messages
        : _messages.where((msg) {
            final query = _searchController.text.toLowerCase();
            return (msg['name'] as String).toLowerCase().contains(query) ||
                (msg['username'] as String).toLowerCase().contains(query) ||
                ((msg['lastMessage'] as String?) ?? '').toLowerCase().contains(query);
          }).toList();

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final message = filteredMessages[index];
          return _buildMessageItem(message, isDark);
        },
        childCount: filteredMessages.length,
      ),
    );
  }

  Widget _buildMessageItem(Map<String, dynamic> message, bool isDark) {
    final hasUnread = (message['unread'] as int) > 0;
    final isTyping = message['typing'] as bool;
    final isOnline = message['online'] as bool;
    final isVerified = message['verified'] as bool;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              name: message['name'],
              username: message['username'],
              isOnline: isOnline,
              isVerified: isVerified,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: DesignTokens.space4,
          vertical: DesignTokens.space3,
        ),
        decoration: BoxDecoration(
          color: hasUnread
              ? (isDark
                  ? DesignTokens.brandPrimary.withOpacity(0.05)
                  : DesignTokens.brandPrimary.withOpacity(0.03))
              : null,
        ),
        child: Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: hasUnread
                        ? LinearGradient(colors: DesignTokens.brandGradient)
                        : LinearGradient(
                            colors: [
                              isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                              isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                            ],
                          ),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.person,
                      color: hasUnread
                          ? DesignTokens.darkTextPrimary
                          : (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary),
                      size: 28,
                    ),
                  ),
                ),
                if (isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 16,
                      height: 16,
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
            const SizedBox(width: DesignTokens.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                message['name'],
                                style: AppTypography.titleSmall(context).copyWith(
                                  fontWeight: hasUnread
                                      ? DesignTokens.fontWeightBold
                                      : DesignTokens.fontWeightSemiBold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.verified,
                                size: 16,
                                color: DesignTokens.brandSecondary,
                              ),
                            ],
                          ],
                        ),
                      ),
                      Text(
                        message['time'],
                        style: AppTypography.labelSmall(context).copyWith(
                          color: hasUnread
                              ? DesignTokens.brandPrimary
                              : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary),
                          fontWeight: hasUnread ? DesignTokens.fontWeightSemiBold : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          isTyping
                              ? 'Typing...'
                              : (message['lastMessage'] ?? 'Sent a photo'),
                          style: AppTypography.bodyMedium(context).copyWith(
                            color: isTyping
                                ? DesignTokens.brandPrimary
                                : hasUnread
                                    ? (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                                    : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary),
                            fontWeight: hasUnread ? DesignTokens.fontWeightSemiBold : null,
                            fontStyle: isTyping ? FontStyle.italic : null,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (hasUnread)
                        Container(
                          margin: const EdgeInsets.only(left: DesignTokens.space2),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: DesignTokens.brandGradient),
                            borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                          ),
                          child: Text(
                            '${message['unread']}',
                            style: AppTypography.labelSmall(context).copyWith(
                              color: DesignTokens.darkTextPrimary,
                              fontWeight: DesignTokens.fontWeightBold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
