import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Sound selector for adding music to videos
class SoundSelector extends StatelessWidget {
  const SoundSelector({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.darkBackground,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.darkTextTertiary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Sounds',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.search, color: Colors.white),
                  onPressed: () {},
                ),
              ],
            ),
          ),

          // Tabs
          _buildTabs(),

          const Divider(height: 1, color: AppColors.darkBorder),

          // Sound list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: 20,
              itemBuilder: (context, index) {
                return _buildSoundItem(
                  title: 'Trending Sound ${index + 1}',
                  artist: 'Artist Name',
                  duration: '0:${(15 + index).toString().padLeft(2, '0')}',
                  isUsed: index % 5 == 0,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          _buildTab('Trending', isSelected: true),
          const SizedBox(width: AppSpacing.lg),
          _buildTab('Favorites', isSelected: false),
          const SizedBox(width: AppSpacing.lg),
          _buildTab('Saved', isSelected: false),
        ],
      ),
    );
  }

  Widget _buildTab(String label, {required bool isSelected}) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.darkTextSecondary,
            fontSize: 15,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (isSelected)
          Container(
            height: 2,
            width: 32,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            ),
          ),
      ],
    );
  }

  Widget _buildSoundItem({
    required String title,
    required String artist,
    required String duration,
    required bool isUsed,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: const Icon(
          Icons.music_note,
          color: Colors.white,
          size: 24,
        ),
      ),
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Row(
        children: [
          Text(
            artist,
            style: const TextStyle(
              color: AppColors.darkTextSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const Text(
            '•',
            style: TextStyle(
              color: AppColors.darkTextTertiary,
              fontSize: 12,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            duration,
            style: const TextStyle(
              color: AppColors.darkTextSecondary,
              fontSize: 12,
            ),
          ),
          if (isUsed) ...[
            const SizedBox(width: AppSpacing.xs),
            const Text(
              '•',
              style: TextStyle(
                color: AppColors.darkTextTertiary,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            const Text(
              '1.2M videos',
              style: TextStyle(
                color: AppColors.darkTextSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
      trailing: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
        child: const Icon(
          Icons.add,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }
}
