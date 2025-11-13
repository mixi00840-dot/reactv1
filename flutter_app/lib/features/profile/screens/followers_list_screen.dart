import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/profile_provider.dart';
import '../data/models/user_profile_model.dart';

class FollowersListScreen extends StatefulWidget {
  final String userId;
  final int initialTab; // 0 = Followers, 1 = Following

  const FollowersListScreen({
    Key? key,
    required this.userId,
    this.initialTab = 0,
  }) : super(key: key);

  @override
  State<FollowersListScreen> createState() => _FollowersListScreenState();
}

class _FollowersListScreenState extends State<FollowersListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab,
    );
    _loadData();
  }

  Future<void> _loadData() async {
    final provider = context.read<ProfileProvider>();
    await provider.loadFollowers(widget.userId);
    await provider.loadFollowing(widget.userId);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Connections'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Followers'),
            Tab(text: 'Following'),
          ],
        ),
      ),
      body: Consumer<ProfileProvider>(
        builder: (context, provider, child) {
          return TabBarView(
            controller: _tabController,
            children: [
              // Followers Tab
              _buildUserList(provider.followers),
              // Following Tab
              _buildUserList(provider.following),
            ],
          );
        },
      ),
    );
  }

  Widget _buildUserList(List<UserProfile> users) {
    if (users.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No users found',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        return _UserListItem(user: user);
      },
    );
  }
}

class _UserListItem extends StatelessWidget {
  final UserProfile user;

  const _UserListItem({required this.user});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 25,
        backgroundColor: Colors.grey[800],
        backgroundImage: user.avatarUrl.isNotEmpty
            ? NetworkImage(user.avatarUrl)
            : null,
        child: user.avatarUrl.isEmpty
            ? Text(
                user.displayName.isNotEmpty
                    ? user.displayName[0].toUpperCase()
                    : '?',
                style: const TextStyle(fontSize: 20),
              )
            : null,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              user.displayName,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (user.isVerified)
            const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.verified, color: Colors.blue, size: 16),
            ),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '@${user.username}',
            style: TextStyle(color: Colors.grey[400], fontSize: 13),
          ),
          if (user.bio.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              user.bio,
              style: TextStyle(color: Colors.grey[500], fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
      trailing: _buildFollowButton(context, user),
      onTap: () {
        // TODO: Navigate to user profile
        // Navigator.push(
        //   context,
        //   MaterialPageRoute(
        //     builder: (_) => ProfileScreen(userId: user.id),
        //   ),
        // );
      },
    );
  }

  Widget _buildFollowButton(BuildContext context, UserProfile user) {
    // Check if it's current user
    final currentProfile = context.read<ProfileProvider>().currentProfile;
    if (currentProfile?.id == user.id) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      width: 100,
      child: ElevatedButton(
        onPressed: () {
          context.read<ProfileProvider>().toggleFollow(user.id);
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: user.isFollowing ? Colors.grey[800] : Colors.blue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: Text(
          user.isFollowing ? 'Following' : 'Follow',
          style: const TextStyle(fontSize: 13),
        ),
      ),
    );
  }
}
