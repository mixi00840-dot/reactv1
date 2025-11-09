import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/user_profile_model.dart';

class ProfileStatsRow extends StatelessWidget {
  final UserProfile profile;
  final VoidCallback onFollowersTap;
  final VoidCallback onFollowingTap;

  const ProfileStatsRow({
    super.key,
    required this.profile,
    required this.onFollowersTap,
    required this.onFollowingTap,
  });

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStat(
            icon: Icons.favorite,
            count: _formatCount(profile.likesCount),
            label: 'Likes',
            color: AppColors.error,
            context: context,
          ),
          _buildDivider(isDark),
          GestureDetector(
            onTap: onFollowersTap,
            child: _buildStat(
              icon: Icons.people,
              count: _formatCount(profile.followersCount),
              label: 'Followers',
              color: AppColors.primary,
              context: context,
            ),
          ),
          _buildDivider(isDark),
          GestureDetector(
            onTap: onFollowingTap,
            child: _buildStat(
              icon: Icons.person_add,
              count: _formatCount(profile.followingCount),
              label: 'Following',
              color: AppColors.info,
              context: context,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStat({
    required IconData icon,
    required String count,
    required String label,
    required Color color,
    required BuildContext context,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          color: color,
          size: 24,
        ),
        const SizedBox(height: 4),
        Text(
          count,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildDivider(bool isDark) {
    return Container(
      width: 1,
      height: 40,
      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
    );
  }
}
