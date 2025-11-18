import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
import '../../../profile/providers/profile_provider_riverpod.dart';
import '../../../profile/screens/wallet_screen.dart';
import '../../../profile/screens/settings_screen.dart';
import '../../../profile/screens/edit_profile_screen.dart';

/// User profile page with tabs
class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    // Load profile from API
    Future.microtask(() {
      ref.read(profileProvider.notifier).loadCurrentProfile();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);
    
    // Show loading or error states
    if (profileState.isLoading && profileState.currentProfile == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (profileState.error != null && profileState.currentProfile == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text('Failed to load profile', style: AppTypography.bodyLarge),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.read(profileProvider.notifier).loadCurrentProfile(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    
    final profile = profileState.currentProfile;
    if (profile == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: Text('No profile data')),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 400,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.background,
              flexibleSpace: FlexibleSpaceBar(
                background: profileState.isLoading 
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    )
                  : _buildProfileHeader(profile),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Iconsax.setting_2, color: AppColors.textPrimary),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SettingsScreen()),
                    );
                  },
                ),
              ],
            ),
          ];
        },
        body: profileState.isLoading
          ? const SizedBox.shrink()
          : Column(
              children: [
                _buildTabBar(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildPostsGrid(profile),
                      _buildReelsGrid(profile),
                      _buildTaggedGrid(profile),
                      _buildLikesGrid(profile),
                    ],
                  ),
                ),
              ],
            ),
      ),
    );
  }

  Widget _buildProfileHeader(UserProfile profile) {
    return Stack(
      children: [
        // Cover image
        Container(
          height: 200,
          decoration: BoxDecoration(
            image: DecorationImage(
              image: CachedNetworkImageProvider(profile.coverImageUrl),
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
                  AppColors.background.withValues(alpha: 0.8),
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
                      imageUrl: profile.avatarUrl,
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
                    profile.displayName,
                    style: AppTypography.titleLarge.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (profile.isVerified) ...[
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
                profile.username,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              // Bio
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Text(
                  profile.bio,
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              
              const SizedBox(height: AppSpacing.md),
              
              // Stats
              _buildStats(profile),
              
              const SizedBox(height: AppSpacing.md),
              
              // Action buttons
              _buildActionButtons(profile),
              
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStats(UserProfile profile) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildStatItem('Posts', profile.postsCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Followers', profile.followersCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Following', profile.followingCount),
        Container(width: 1, height: 30, color: AppColors.glassLight),
        _buildStatItem('Likes', profile.likesCount),
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

  Widget _buildActionButtons(UserProfile profile) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const WalletScreen()),
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
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                );
              },
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

  Widget _buildPostsGrid(UserProfile profile) {
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

  Widget _buildReelsGrid(UserProfile profile) {
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

  Widget _buildTaggedGrid(UserProfile profile) {
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

  Widget _buildLikesGrid(UserProfile profile) {
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
