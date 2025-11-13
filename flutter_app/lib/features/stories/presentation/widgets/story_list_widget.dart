import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/story_model.dart';

/// Horizontal story list widget
class StoryListWidget extends StatelessWidget {
  final List<Story> stories;
  final Function(Story, int) onStoryTap;
  final VoidCallback? onAddStory;

  const StoryListWidget({
    super.key,
    required this.stories,
    required this.onStoryTap,
    this.onAddStory,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 110,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        itemCount: stories.length + 1, // +1 for "Add Story" button
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildAddStoryButton(context);
          }

          final story = stories[index - 1];
          return _buildStoryAvatar(context, story, index - 1);
        },
      ),
    );
  }

  Widget _buildAddStoryButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: GestureDetector(
        onTap: onAddStory,
        child: Column(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                gradient: AppGradients.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.add,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            const Text(
              'Your Story',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryAvatar(BuildContext context, Story story, int index) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: GestureDetector(
        onTap: () => onStoryTap(story, index),
        child: Column(
          children: [
            Container(
              width: 74,
              height: 74,
              decoration: BoxDecoration(
                gradient: story.isViewed
                    ? const LinearGradient(
                        colors: [AppColors.textTertiary, AppColors.textTertiary],
                      )
                    : AppGradients.primary,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(3),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.backgroundDark,
                  border: Border.all(
                    color: AppColors.backgroundDark,
                    width: 3,
                  ),
                ),
                child: ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: story.userAvatar,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: AppColors.glassMedium,
                      child: const Icon(
                        Icons.person,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: AppColors.glassMedium,
                      child: const Icon(
                        Icons.person,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            SizedBox(
              width: 70,
              child: Text(
                story.username,
                style: TextStyle(
                  color: story.isViewed
                      ? AppColors.textTertiary
                      : AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
