import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/chat_model.dart';
import 'conversation_screen.dart';

class NewMessageScreen extends StatefulWidget {
  const NewMessageScreen({super.key});

  @override
  State<NewMessageScreen> createState() => _NewMessageScreenState();
}

class _NewMessageScreenState extends State<NewMessageScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  // Sample suggested users
  final List<ChatModel> _suggestedUsers = [
    ChatModel(
      id: '7',
      userId: 'user7',
      username: '@jane_creative',
      displayName: 'Jane Cooper',
      avatarUrl: 'https://i.pravatar.cc/150?img=7',
      lastMessage: '',
      lastMessageTime: DateTime.now(),
      unreadCount: 0,
      isOnline: true,
      isTyping: false,
    ),
    ChatModel(
      id: '8',
      userId: 'user8',
      username: '@robert_tech',
      displayName: 'Robert Fox',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
      lastMessage: '',
      lastMessageTime: DateTime.now(),
      unreadCount: 0,
      isOnline: false,
      isTyping: false,
    ),
    ChatModel(
      id: '9',
      userId: 'user9',
      username: '@jenny_designs',
      displayName: 'Jenny Wilson',
      avatarUrl: 'https://i.pravatar.cc/150?img=9',
      lastMessage: '',
      lastMessageTime: DateTime.now(),
      unreadCount: 0,
      isOnline: true,
      isTyping: false,
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _startChat(ChatModel user) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ConversationScreen(chat: user),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final filteredUsers = _searchController.text.isEmpty
        ? _suggestedUsers
        : _suggestedUsers.where((user) {
            final query = _searchController.text.toLowerCase();
            return user.displayName.toLowerCase().contains(query) ||
                   user.username.toLowerCase().contains(query);
          }).toList();

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        title: const Text('New Message'),
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : AppColors.lightCard,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? Colors.white10 : Colors.black12,
                ),
              ),
            ),
            child: TextField(
              controller: _searchController,
              style: TextStyle(color: isDark ? Colors.white : Colors.black),
              decoration: InputDecoration(
                hintText: 'Search users...',
                hintStyle: TextStyle(
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
                prefixIcon: Icon(
                  Icons.search,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
                filled: true,
                fillColor: isDark ? Colors.white10 : Colors.black12,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              onChanged: (value) {
                setState(() {});
              },
            ),
          ),

          // Suggested Users
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                if (_searchController.text.isEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Suggested',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white70 : Colors.black54,
                      ),
                    ),
                  ),
                ],
                
                ...filteredUsers.map((user) => _buildUserItem(user, isDark)),

                if (filteredUsers.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 64,
                            color: isDark ? Colors.white24 : Colors.black12,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No users found',
                            style: TextStyle(
                              fontSize: 16,
                              color: isDark ? Colors.white54 : Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserItem(ChatModel user, bool isDark) {
    return ListTile(
      onTap: () => _startChat(user),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundImage: NetworkImage(user.avatarUrl),
          ),
          if (user.isOnline)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
                    width: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
      title: Text(
        user.displayName,
        style: TextStyle(
          color: isDark ? Colors.white : Colors.black,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        user.username,
        style: TextStyle(
          color: isDark ? Colors.white70 : Colors.black54,
          fontSize: 13,
        ),
      ),
      trailing: Icon(
        Icons.send_outlined,
        color: AppColors.primary,
      ),
    );
  }
}
