import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../data/models/user_profile_model.dart';
import '../../data/mock_profile_data.dart';
import '../pages/wallet_page.dart';
import '../pages/settings_page.dart';

/// User profile page with tabs
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late UserProfile _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _userProfile = MockProfileData.getCurrentUserProfile();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 400,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.background,
              flexibleSpace: FlexibleSpaceBar(
                background: _buildProfileHeader(),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Iconsax.setting_2, color: AppColors.textPrimary),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SettingsPage()),
                    );
                  },
                ),
              ],
            ),
          ];
        },
        body: Column(
          children: [
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildPostsGrid(),
                  _buildReelsGrid(),
                  _buildTaggedGrid(),
                  _buildLikesGrid(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Stack(
      children: [
        // Cover image
        Container(
          height: 200,
          decoration: BoxDecoration(
            image: DecorationImage(
              image: CachedNetworkImageProvider(_userProfile.coverImageUrl),
              fit: BoxFit.cover,
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  AppColors.background.withOpacity(0.8),
                ],
              ),
            ),
          ),
        ),
        
        // Profile info
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Column(
            children: [
              // Avatar
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    width: 4,
                    color: AppColors.background,
                  ),
                  gradient: AppGradients.primary,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: _userProfile.avatarUrl,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              // Username
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _userProfile.displayName,
                    style: AppTypography.titleLarge.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_userProfile.isVerified) ...[
                    const SizedBox(width: AppSpacing.xs),
                    const Icon(
                      Iconsax.verify5,
                      color: AppColors.softSkyBlue,
                      size: 20,
                    ),
                  ],
                ],
              ),
              
              Text(
                _userProfile.username,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              // Bio
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Text(
                  _userProfile.bio,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              
              const SizedBox(height: AppSpacing.md),
              
              // Stats
              _buildStats(),
              
              const SizedBox(height: AppSpacing.md),
              
              // Action buttons
              _buildActionButtons(),
              
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStats() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildStatItem('Posts', _userProfile.postsCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Followers', _userProfile.followersCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Following', _userProfile.followingCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Likes', _userProfile.likesCount),
      ],
    );
  }

  Widget _buildStatItem(String label, int count) {
    return Column(
      children: [
        Text(
          _formatCount(count),
          style: AppTypography.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: AppTypography.caption.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const WalletPage()),
                );
              },
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  gradient: AppGradients.accent,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Iconsax.wallet_2, color: AppColors.textPrimary, size: 20),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Wallet',
                      style: AppTypography.labelLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          Expanded(
            child: GlassContainer(
              child: Container(
                height: 40,
                alignment: Alignment.center,
                child: Text(
                  'Edit Profile',
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.glassLight, width: 1),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        indicatorColor: AppColors.primary,
        indicatorWeight: 2,
        labelColor: AppColors.textPrimary,
        unselectedLabelColor: AppColors.textSecondary,
        tabs: const [
          Tab(icon: Icon(Iconsax.grid_1)),
          Tab(icon: Icon(Iconsax.video_square)),
          Tab(icon: Icon(Iconsax.tag_user)),
          Tab(icon: Icon(Iconsax.heart)),
        ],
      ),
    );
  }

  Widget _buildPostsGrid() {
    final posts = MockProfileData.getUserPostImages();
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        return CachedNetworkImage(
          imageUrl: posts[index],
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: AppColors.glassMedium,
          ),
        );
      },
    );
  }

  Widget _buildReelsGrid() {
    final reels = MockProfileData.getUserReelsThumbnails();
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
        childAspectRatio: 9 / 16,
      ),
      itemCount: reels.length,
      itemBuilder: (context, index) {
        return Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: reels[index],
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: AppColors.glassMedium,
              ),
            ),
            Positioned(
              bottom: 8,
              left: 8,
              child: Row(
                children: [
                  const Icon(Iconsax.play, color: AppColors.textPrimary, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${(index + 1) * 12}K',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTaggedGrid() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.tag_user, size: 64, color: AppColors.textTertiary),
          SizedBox(height: AppSpacing.md),
          Text(
            'No tagged posts yet',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildLikesGrid() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.heart, size: 64, color: AppColors.textTertiary),
          SizedBox(height: AppSpacing.md),
          Text(
            'Posts you liked',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
