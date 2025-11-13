import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/profile_provider.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_stats_row.dart';
import '../widgets/video_grid.dart';
import 'edit_profile_screen.dart';
import 'followers_list_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId; // If null, show current user profile

  const ProfileScreen({
    Key? key,
    this.userId,
  }) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final provider = context.read<ProfileProvider>();
    
    setState(() => _isLoading = true);
    
    if (widget.userId == null) {
      // Load current user profile
      await provider.loadCurrentProfile();
    } else {
      // Load other user's profile
      await provider.loadUserProfile(widget.userId!);
    }
    
    setState(() => _isLoading = false);
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
      body: Consumer<ProfileProvider>(
        builder: (context, profileProvider, child) {
          final profile = widget.userId == null
              ? profileProvider.currentProfile
              : profileProvider.viewedProfile;

          if (_isLoading || profile == null) {
            return const Center(
              child: CircularProgressIndicator(color: Colors.white),
            );
          }

          final isOwnProfile = profileProvider.isOwnProfile || widget.userId == null;

          return RefreshIndicator(
            onRefresh: _loadProfile,
            child: CustomScrollView(
              slivers: [
                // App Bar
                SliverAppBar(
                  backgroundColor: Colors.black,
                  floating: true,
                  pinned: true,
                  title: Text(
                    profile.username,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  actions: [
                    if (isOwnProfile) ...[
                      IconButton(
                        icon: const Icon(Icons.add_box_outlined),
                        onPressed: () {
                          // TODO: Navigate to upload screen
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.menu),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const SettingsScreen(),
                            ),
                          );
                        },
                      ),
                    ] else ...[
                      IconButton(
                        icon: const Icon(Icons.more_vert),
                        onPressed: () => _showOptionsMenu(context, profile.id),
                      ),
                    ],
                  ],
                ),

                // Profile Header
                SliverToBoxAdapter(
                  child: ProfileHeader(
                    profile: profile,
                    isOwnProfile: isOwnProfile,
                    onEditProfile: isOwnProfile
                        ? () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const EditProfileScreen(),
                              ),
                            )
                        : null,
                    onFollow: isOwnProfile
                        ? null
                        : () => profileProvider.toggleFollow(profile.id),
                    isFollowLoading: profileProvider.isFollowLoading,
                  ),
                ),

                // Stats Row
                SliverToBoxAdapter(
                  child: ProfileStatsRow(
                    followersCount: profile.followersCount,
                    followingCount: profile.followingCount,
                    likesCount: profile.likesCount,
                    onFollowersTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => FollowersListScreen(
                            userId: profile.id,
                            initialTab: 0,
                          ),
                        ),
                      );
                    },
                    onFollowingTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => FollowersListScreen(
                            userId: profile.id,
                            initialTab: 1,
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Tab Bar
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _StickyTabBarDelegate(
                    TabBar(
                      controller: _tabController,
                      indicatorColor: Colors.white,
                      indicatorWeight: 2,
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.grey,
                      tabs: const [
                        Tab(icon: Icon(Icons.grid_on)),
                        Tab(icon: Icon(Icons.favorite_border)),
                        Tab(icon: Icon(Icons.bookmark_border)),
                      ],
                    ),
                  ),
                ),

                // Tab Views
                SliverFillRemaining(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Videos Tab
                      VideoGrid(
                        videos: profileProvider.userVideos,
                        onVideoTap: (video) {
                          // TODO: Navigate to video player
                        },
                      ),

                      // Liked Tab
                      if (isOwnProfile)
                        VideoGrid(
                          videos: const [], // TODO: Load liked videos
                          emptyMessage: 'No liked videos yet',
                        )
                      else
                        const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.lock_outline, size: 60, color: Colors.grey),
                              SizedBox(height: 16),
                              Text(
                                'This content is private',
                                style: TextStyle(color: Colors.grey, fontSize: 16),
                              ),
                            ],
                          ),
                        ),

                      // Saved Tab
                      if (isOwnProfile)
                        VideoGrid(
                          videos: const [], // TODO: Load saved videos
                          emptyMessage: 'No saved videos yet',
                        )
                      else
                        const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.lock_outline, size: 60, color: Colors.grey),
                              SizedBox(height: 16),
                              Text(
                                'This content is private',
                                style: TextStyle(color: Colors.grey, fontSize: 16),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showOptionsMenu(BuildContext context, String userId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share, color: Colors.white),
              title: const Text('Share Profile', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement share
              },
            ),
            ListTile(
              leading: const Icon(Icons.link, color: Colors.white),
              title: const Text('Copy Profile Link', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                // TODO: Copy link
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: Colors.red),
              title: const Text('Block User', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _showBlockDialog(context, userId);
              },
            ),
            ListTile(
              leading: const Icon(Icons.report, color: Colors.red),
              title: const Text('Report', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                // TODO: Report user
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showBlockDialog(BuildContext context, String userId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('Block User?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Blocked users won\'t be able to follow you or view your profile.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement block
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('User blocked')),
              );
            },
            child: const Text('Block', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

// Sticky Tab Bar Delegate
class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _StickyTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.black,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_StickyTabBarDelegate oldDelegate) => false;
}
