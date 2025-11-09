import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';

/// Instagram/TikTok-style Profile Screen
class ProfileScreenNew extends StatefulWidget {
  final String? userId; // null = current user, otherwise other user's profile
  
  const ProfileScreenNew({
    Key? key,
    this.userId,
  }) : super(key: key);

  @override
  State<ProfileScreenNew> createState() => _ProfileScreenNewState();
}

class _ProfileScreenNewState extends State<ProfileScreenNew> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isCurrentUser = true;
  bool _isFollowing = false;
  
  // Mock user data - will be replaced with MongoDB API
  final Map<String, dynamic> _userProfile = {
    'id': '1',
    'username': 'sarah_designs',
    'displayName': 'Sarah Mitchell',
    'bio': '🎨 Digital Creator | Flutter Dev\n✨ Making magic with code\n📍 San Francisco, CA',
    'avatarUrl': null,
    'followersCount': 125600,
    'followingCount': 892,
    'likesCount': 2340000,
    'videosCount': 156,
    'isVerified': true,
    'isPremium': false,
    'website': 'sarahdesigns.com',
    'instagramHandle': 'sarah_designs',
    'youtubeHandle': 'SarahDesigns',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _isCurrentUser = widget.userId == null;
  }

  @override
  void dispose() {
    _tabController.dispose();
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
          SliverToBoxAdapter(child: _buildProfileHeader(isDark)),
          SliverToBoxAdapter(child: _buildBio(isDark)),
          SliverToBoxAdapter(child: _buildActionButtons(isDark)),
          SliverToBoxAdapter(child: _buildStats(isDark)),
          SliverPersistentHeader(
            pinned: true,
            delegate: _ProfileTabBarDelegate(
              TabBar(
                controller: _tabController,
                indicatorColor: DesignTokens.brandPrimary,
                indicatorWeight: 2,
                labelColor: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
                unselectedLabelColor: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                tabs: const [
                  Tab(icon: Icon(Icons.grid_on)),
                  Tab(icon: Icon(Icons.favorite_border)),
                  Tab(icon: Icon(Icons.lock_outline)),
                ],
              ),
              isDark,
            ),
          ),
          _buildTabContent(),
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${_userProfile['username']}',
            style: AppTypography.titleLarge(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
          if (_userProfile['isVerified'] == true) ...[
            const SizedBox(width: DesignTokens.space1),
            const Icon(
              Icons.verified,
              color: DesignTokens.verifiedBlue,
              size: 20,
            ),
          ],
        ],
      ),
      actions: [
        if (_isCurrentUser) ...[
          IconButton(
            icon: const Icon(Icons.add_box_outlined),
            onPressed: () {
              // Navigate to upload
            },
          ),
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: _showMenu,
          ),
        ] else ...[
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: _showMoreOptions,
          ),
        ],
        const SizedBox(width: DesignTokens.space2),
      ],
    );
  }

  Widget _buildProfileHeader(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Row(
        children: [
          // Avatar
          UserAvatar(
            imageUrl: _userProfile['avatarUrl'] as String?,
            size: DesignTokens.avatarXl,
            isVerified: _userProfile['isVerified'] as bool,
            placeholderText: _userProfile['displayName'] as String,
            showBorder: true,
          ),
          
          const SizedBox(width: DesignTokens.space4),
          
          // Stats
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Posts', _userProfile['videosCount'] as int),
                _buildStatItem('Followers', _userProfile['followersCount'] as int, onTap: _showFollowers),
                _buildStatItem('Following', _userProfile['followingCount'] as int, onTap: _showFollowing),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, int count, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _formatCount(count),
            style: AppTypography.count(context),
          ),
          const SizedBox(height: DesignTokens.space1),
          Text(
            label,
            style: AppTypography.countLabel(context),
          ),
        ],
      ),
    );
  }

  Widget _buildBio(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_userProfile['displayName']}',
            style: AppTypography.titleMedium(context).copyWith(
              fontWeight: DesignTokens.fontWeightSemiBold,
            ),
          ),
          const SizedBox(height: DesignTokens.space2),
          Text(
            '${_userProfile['bio']}',
            style: AppTypography.bodyMedium(context),
          ),
          if (_userProfile['website'] != null) ...[
            const SizedBox(height: DesignTokens.space2),
            GestureDetector(
              onTap: () {
                // Open website
              },
              child: Text(
                '${_userProfile['website']}',
                style: AppTypography.link(context),
              ),
            ),
          ],
          const SizedBox(height: DesignTokens.space4),
        ],
      ),
    );
  }

  Widget _buildActionButtons(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
      child: Row(
        children: [
          if (_isCurrentUser) ...[
            Expanded(
              child: PrimaryButton(
                text: 'Edit Profile',
                height: 36,
                backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                textColor: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
                gradient: null,
                onPressed: _showEditProfile,
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            PrimaryButton(
              text: 'Share Profile',
              height: 36,
              width: 140,
              backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              textColor: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
              gradient: null,
              icon: Icons.share_outlined,
              onPressed: _shareProfile,
            ),
          ] else ...[
            Expanded(
              flex: 3,
              child: PrimaryButton(
                text: _isFollowing ? 'Following' : 'Follow',
                height: 36,
                backgroundColor: _isFollowing
                    ? (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface)
                    : null,
                textColor: _isFollowing
                    ? (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                    : DesignTokens.darkTextPrimary,
                gradient: _isFollowing ? null : LinearGradient(colors: DesignTokens.brandGradient),
                onPressed: _toggleFollow,
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                text: 'Message',
                height: 36,
                backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                textColor: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
                gradient: null,
                onPressed: _sendMessage,
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            GestureDetector(
              onTap: _showMoreOptions,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusButton),
                ),
                child: Icon(
                  Icons.person_add_outlined,
                  size: 20,
                  color: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStats(bool isDark) {
    return Container(
      margin: const EdgeInsets.all(DesignTokens.space4),
      padding: const EdgeInsets.all(DesignTokens.space4),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
        border: Border.all(
          color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatBadge(Icons.favorite, _formatCount(_userProfile['likesCount'] as int), 'Total Likes'),
          Container(
            width: 1,
            height: 40,
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
          _buildStatBadge(Icons.visibility, _formatCount((_userProfile['followersCount'] as int) * 15), 'Profile Views'),
        ],
      ),
    );
  }

  Widget _buildStatBadge(IconData icon, String count, String label) {
    return Column(
      children: [
        Icon(icon, color: DesignTokens.brandPrimary, size: 24),
        const SizedBox(height: DesignTokens.space1),
        Text(
          count,
          style: AppTypography.titleLarge(context).copyWith(
            fontWeight: DesignTokens.fontWeightBold,
          ),
        ),
        Text(
          label,
          style: AppTypography.labelSmall(context),
        ),
      ],
    );
  }

  Widget _buildTabContent() {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildVideosGrid(),
          _buildLikesGrid(),
          _buildPrivateContent(),
        ],
      ),
    );
  }

  Widget _buildVideosGrid() {
    // Mock video thumbnails
    final videos = List.generate(24, (index) => {
      'id': 'video_$index',
      'thumbnail': null,
      'views': (index + 1) * 12500,
    });

    return GridView.builder(
      padding: const EdgeInsets.all(1),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 1,
        crossAxisSpacing: 1,
        childAspectRatio: 9 / 16,
      ),
      itemCount: videos.length,
      itemBuilder: (context, index) {
        final video = videos[index];
        return _buildVideoThumbnail(video);
      },
    );
  }

  Widget _buildVideoThumbnail(Map<String, dynamic> video) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () {
        // Open video player
      },
      child: Container(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Thumbnail placeholder
            Center(
              child: Icon(
                Icons.play_circle_outline,
                size: 48,
                color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary).withOpacity(0.5),
              ),
            ),
            
            // View count overlay
            Positioned(
              bottom: DesignTokens.space2,
              left: DesignTokens.space2,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.play_arrow,
                    color: DesignTokens.darkTextPrimary,
                    size: 16,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    _formatCount(video['views']),
                    style: AppTypography.labelSmall(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLikesGrid() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.favorite_border,
            size: 64,
            color: AppTypography.getTextColor(context, secondary: true),
          ),
          const SizedBox(height: DesignTokens.space3),
          Text(
            'Liked Videos',
            style: AppTypography.h3(context),
          ),
          const SizedBox(height: DesignTokens.space2),
          Text(
            'Videos you\'ve liked will appear here',
            style: AppTypography.bodyMedium(context),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivateContent() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.lock_outline,
            size: 64,
            color: AppTypography.getTextColor(context, secondary: true),
          ),
          const SizedBox(height: DesignTokens.space3),
          Text(
            'Private',
            style: AppTypography.h3(context),
          ),
          const SizedBox(height: DesignTokens.space2),
          Text(
            'Only you can see these videos',
            style: AppTypography.bodyMedium(context),
          ),
        ],
      ),
    );
  }

  // Actions
  void _showMenu() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(DesignTokens.radiusModal),
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildMenuItem(Icons.settings_outlined, 'Settings', () {}),
              _buildMenuItem(Icons.qr_code, 'QR Code', () {}),
              _buildMenuItem(Icons.bookmark_border, 'Saved', () {}),
              _buildMenuItem(Icons.history, 'Archive', () {}),
              _buildMenuItem(Icons.access_time, 'Activity', () {}),
              const SizedBox(height: DesignTokens.space2),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: AppTypography.titleMedium(context)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }

  void _showMoreOptions() {}
  void _showEditProfile() {}
  void _shareProfile() {}
  void _toggleFollow() {
    setState(() {
      _isFollowing = !_isFollowing;
    });
  }
  void _sendMessage() {}
  void _showFollowers() {}
  void _showFollowing() {}

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

// Tab Bar Delegate for sticky tabs
class _ProfileTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final bool isDark;

  _ProfileTabBarDelegate(this.tabBar, this.isDark);

  @override
  double get minExtent => 48;
  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_ProfileTabBarDelegate oldDelegate) {
    return false;
  }
}
