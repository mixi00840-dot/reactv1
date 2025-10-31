import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/chat_model.dart';
import '../widgets/chat_list_item.dart';
import 'conversation_screen.dart';
import 'new_message_screen.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  // Sample chat data
  final List<ChatModel> _chats = [
    ChatModel(
      id: '1',
      userId: 'user1',
      username: '@sarah_designs',
      displayName: 'Sarah Wilson',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Hey! Did you see my latest video?',
      lastMessageTime: DateTime.now().subtract(const Duration(minutes: 5)),
      unreadCount: 2,
      isOnline: true,
      isTyping: false,
    ),
    ChatModel(
      id: '2',
      userId: 'user2',
      username: '@tech_master',
      displayName: 'Alex Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'Thanks for the follow! 🎉',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 1)),
      unreadCount: 0,
      isOnline: true,
      isTyping: false,
    ),
    ChatModel(
      id: '3',
      userId: 'user3',
      username: '@creative_soul',
      displayName: 'Emma Davis',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'Love your content! Keep it up 💪',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 3)),
      unreadCount: 1,
      isOnline: false,
      isTyping: false,
    ),
    ChatModel(
      id: '4',
      userId: 'user4',
      username: '@mike_photos',
      displayName: 'Mike Anderson',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      lastMessage: 'Can we collaborate on a project?',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 5)),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
    ),
    ChatModel(
      id: '5',
      userId: 'user5',
      username: '@lisa_art',
      displayName: 'Lisa Martinez',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      lastMessage: 'That\'s awesome! 😊',
      lastMessageTime: DateTime.now().subtract(const Duration(days: 1)),
      unreadCount: 0,
      isOnline: true,
      isTyping: false,
    ),
    ChatModel(
      id: '6',
      userId: 'user6',
      username: '@john_dev',
      displayName: 'John Smith',
      avatarUrl: 'https://i.pravatar.cc/150?img=6',
      lastMessage: 'See you tomorrow!',
      lastMessageTime: DateTime.now().subtract(const Duration(days: 2)),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _openChat(ChatModel chat) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ConversationScreen(chat: chat),
      ),
    );
  }

  void _openNewMessage() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NewMessageScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: TextStyle(color: isDark ? Colors.white : Colors.black),
                decoration: InputDecoration(
                  hintText: 'Search messages...',
                  hintStyle: TextStyle(
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (value) {
                  setState(() {});
                },
              )
            : const Text('Messages'),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                }
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: _openNewMessage,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: isDark ? Colors.white70 : Colors.black54,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Unread'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChatList(_chats),
          _buildChatList(_chats.where((chat) => chat.unreadCount > 0).toList()),
        ],
      ),
    );
  }

  Widget _buildChatList(List<ChatModel> chats) {
    if (chats.isEmpty) {
      return _buildEmptyState();
    }

    final filteredChats = _searchController.text.isEmpty
        ? chats
        : chats.where((chat) {
            final query = _searchController.text.toLowerCase();
            return chat.displayName.toLowerCase().contains(query) ||
                   chat.username.toLowerCase().contains(query) ||
                   chat.lastMessage.toLowerCase().contains(query);
          }).toList();

    if (filteredChats.isEmpty) {
      return _buildNoResults();
    }

    return ListView.builder(
      itemCount: filteredChats.length,
      itemBuilder: (context, index) {
        return ChatListItem(
          chat: filteredChats[index],
          onTap: () => _openChat(filteredChats[index]),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 80,
            color: isDark ? Colors.white24 : Colors.black12,
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start a conversation',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white54 : Colors.black45,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _openNewMessage,
            icon: const Icon(Icons.add),
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

  Widget _buildNoResults() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: isDark ? Colors.white24 : Colors.black12,
          ),
          const SizedBox(height: 16),
          Text(
            'No results found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white70 : Colors.black54,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different search',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white54 : Colors.black45,
            ),
          ),
        ],
      ),
    );
  }
}
