import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/repositories/posts_repository.dart';
import '../../../presentation/screens/posts/posts_grid_screen.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_stats_row.dart';
import '../widgets/edit_profile_sheet.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId; // null = current user, otherwise other user's profile
  
  const ProfileScreen({
    super.key,
    this.userId,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isCurrentUser = true;
  bool _isFollowing = false;
  
  // Sample user data - Replace with API
  final UserProfile _userProfile = UserProfile(
    id: '1',
    username: '@sarah_designs',
    displayName: 'Sarah Mitchell',
    bio: '🎨 Digital Creator | Flutter Dev\n✨ Making magic with code\n📍 San Francisco, CA',
    avatarUrl: 'https://i.pravatar.cc/300?img=1',
    followersCount: 125600,
    followingCount: 892,
    likesCount: 2340000,
    videosCount: 156,
    isVerified: true,
    website: 'https://sarahdesigns.com',
    instagramHandle: '@sarah_designs',
    youtubeHandle: '@SarahDesigns',
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _isCurrentUser = widget.userId == null;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showEditProfile() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => EditProfileSheet(profile: _userProfile),
    );
  }

  void _toggleFollow() {
    setState(() {
      _isFollowing = !_isFollowing;
      if (_isFollowing) {
        _userProfile.followersCount++;
      } else {
        _userProfile.followersCount--;
      }
    });
  }

  void _showFollowers() {
    context.push('/profile/followers', extra: _userProfile.id);
  }

  void _showFollowing() {
    context.push('/profile/following', extra: _userProfile.id);
  }

  void _showMoreOptions() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Profile'),
              onTap: () {
                Navigator.pop(context);
                // Share profile
              },
            ),
            ListTile(
              leading: const Icon(Icons.qr_code),
              title: const Text('QR Code'),
              onTap: () {
                Navigator.pop(context);
                // Show QR code
              },
            ),
            if (!_isCurrentUser) ...[
              ListTile(
                leading: const Icon(Icons.block),
                title: const Text('Block'),
                onTap: () {
                  Navigator.pop(context);
                  // Block user
                },
              ),
              ListTile(
                leading: const Icon(Icons.flag, color: AppColors.error),
                title: const Text('Report', style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(context);
                  // Report user
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // App Bar
            SliverAppBar(
              backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
              elevation: 0,
              pinned: true,
              floating: false,
              title: Row(
                children: [
                  Text(
                    _userProfile.username,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  if (_userProfile.isVerified) ...[
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.verified,
                      color: AppColors.primary,
                      size: 18,
                    ),
                  ],
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () {
                    context.push('/notifications');
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: _showMoreOptions,
                ),
              ],
            ),
            
            // Profile Header
            SliverToBoxAdapter(
              child: ProfileHeader(
                profile: _userProfile,
                isCurrentUser: _isCurrentUser,
                isFollowing: _isFollowing,
                onEditProfile: _showEditProfile,
                onFollow: _toggleFollow,
              ),
            ),
            
            // Stats Row
            SliverToBoxAdapter(
              child: ProfileStatsRow(
                profile: _userProfile,
                onFollowersTap: _showFollowers,
                onFollowingTap: _showFollowing,
              ),
            ),
            
            // Tab Bar
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverTabBarDelegate(
                TabBar(
                  controller: _tabController,
                  indicatorColor: AppColors.primary,
                  labelColor: isDark ? AppColors.darkText : AppColors.lightText,
                  unselectedLabelColor: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  tabs: const [
                    Tab(icon: Icon(Icons.grid_on), text: 'Posts'),
                    Tab(icon: Icon(Icons.video_library), text: 'Reels'),
                    Tab(icon: Icon(Icons.person_pin_outlined), text: 'Tagged'),
                    Tab(icon: Icon(Icons.bookmark_border), text: 'Saved'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            // Posts Grid (Photos)
            PostsGridScreen(
              userId: _userProfile.id,
              contentType: PostContentType.posts,
            ),
            // Reels Grid (Short Videos)
            PostsGridScreen(
              userId: _userProfile.id,
              contentType: PostContentType.reels,
            ),
            // Tagged Posts
            PostsGridScreen(
              userId: _userProfile.id,
              contentType: PostContentType.tagged,
            ),
            // Saved Posts
            _isCurrentUser
                ? PostsGridScreen(
                    userId: _userProfile.id,
                    contentType: PostContentType.saved,
                  )
                : Center(
                    child: Text(
                      'Saved posts are private',
                      style: TextStyle(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

// Sliver Tab Bar Delegate
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverTabBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}

// User Profile Model
class UserProfile {
  String id;
  String username;
  String displayName;
  String bio;
  String avatarUrl;
  int followersCount;
  int followingCount;
  int likesCount;
  int videosCount;
  bool isVerified;
  String? website;
  String? instagramHandle;
  String? youtubeHandle;

  UserProfile({
    required this.id,
    required this.username,
    required this.displayName,
    required this.bio,
    required this.avatarUrl,
    required this.followersCount,
    required this.followingCount,
    required this.likesCount,
    required this.videosCount,
    required this.isVerified,
    this.website,
    this.instagramHandle,
    this.youtubeHandle,
  });
}
