import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../screens/profile_screen.dart';

class ProfileHeader extends StatelessWidget {
  final UserProfile profile;
  final bool isCurrentUser;
  final bool isFollowing;
  final VoidCallback onEditProfile;
  final VoidCallback onFollow;

  const ProfileHeader({
    super.key,
    required this.profile,
    required this.isCurrentUser,
    required this.isFollowing,
    required this.onEditProfile,
    required this.onFollow,
  });

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar and Counts Row
          Row(
            children: [
              // Profile Avatar
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary,
                    width: 2,
                  ),
                  image: DecorationImage(
                    image: NetworkImage(profile.avatarUrl),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 24),
              
              // Stats
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatColumn(
                      _formatCount(profile.videosCount),
                      'Posts',
                      context,
                    ),
                    _buildStatColumn(
                      _formatCount(profile.followersCount),
                      'Followers',
                      context,
                    ),
                    _buildStatColumn(
                      _formatCount(profile.followingCount),
                      'Following',
                      context,
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Display Name
          Text(
            profile.displayName,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 4),
          
          // Bio
          Text(
            profile.bio,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? AppColors.darkText : AppColors.lightText,
            ),
          ),
          
          // Links
          if (profile.website != null) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => _launchUrl(profile.website!),
              child: Row(
                children: [
                  const Icon(
                    Icons.link,
                    size: 16,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      profile.website!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Social Links
          if (profile.instagramHandle != null || profile.youtubeHandle != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (profile.instagramHandle != null)
                  _buildSocialLink(
                    icon: Icons.camera_alt,
                    label: profile.instagramHandle!,
                    onTap: () => _launchUrl('https://instagram.com/${profile.instagramHandle!.replaceAll('@', '')}'),
                  ),
                if (profile.instagramHandle != null && profile.youtubeHandle != null)
                  const SizedBox(width: 12),
                if (profile.youtubeHandle != null)
                  _buildSocialLink(
                    icon: Icons.play_circle_outline,
                    label: profile.youtubeHandle!,
                    onTap: () => _launchUrl('https://youtube.com/${profile.youtubeHandle!}'),
                  ),
              ],
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                flex: isCurrentUser ? 1 : 2,
                child: _buildActionButton(
                  context,
                  text: isCurrentUser
                      ? 'Edit Profile'
                      : (isFollowing ? 'Following' : 'Follow'),
                  isPrimary: !isCurrentUser && !isFollowing,
                  onPressed: isCurrentUser ? onEditProfile : onFollow,
                ),
              ),
              if (!isCurrentUser) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionButton(
                    context,
                    text: 'Message',
                    isPrimary: false,
                    onPressed: () {
                      // Open message
                    },
                  ),
                ),
              ],
              if (isCurrentUser) ...[
                const SizedBox(width: 8),
                _buildIconButton(
                  context,
                  icon: Icons.person_add_outlined,
                  onPressed: () {
                    // Invite friends
                  },
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String count, String label, BuildContext context) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildSocialLink({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: AppColors.primary,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required String text,
    required bool isPrimary,
    required VoidCallback onPressed,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SizedBox(
      height: 40,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimary
              ? AppColors.primary
              : (isDark ? AppColors.darkCard : AppColors.lightCard),
          foregroundColor: isPrimary
              ? Colors.white
              : (isDark ? AppColors.darkText : AppColors.lightText),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: isPrimary
                ? BorderSide.none
                : BorderSide(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
          ),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildIconButton(
    BuildContext context, {
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SizedBox(
      width: 40,
      height: 40,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
          foregroundColor: isDark ? AppColors.darkText : AppColors.lightText,
          elevation: 0,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
        ),
        child: Icon(icon, size: 20),
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
