import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/feed_post_model.dart';
import 'post_media_widget.dart';

/// Feed post card with video/image support
class FeedPostCard extends StatelessWidget {
  final FeedPost post;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onBookmark;
  final Function(String giftId)? onGift;

  const FeedPostCard({
    super.key,
    required this.post,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onBookmark,
    this.onGift,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        _buildHeader(context),

        // Media (image or video)
        PostMediaWidget(
          mediaUrls: post.mediaUrls,
          isVideo: post.isVideo,
          thumbnailUrl: post.thumbnailUrl,
          duration: post.duration,
        ),

        // Action buttons
        _buildActionButtons(),

        // Likes count
        if (post.likesCount > 0)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Text(
              '${_formatCount(post.likesCount)} likes',
              style: AppTypography.labelMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

        // Caption
        if (post.caption.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.xs,
            ),
            child: RichText(
              text: TextSpan(
                style: AppTypography.bodyMedium,
                children: [
                  TextSpan(
                    text: '${post.username} ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(text: post.caption),
                ],
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),

        // View comments button
        if (post.commentsCount > 0)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: GestureDetector(
              onTap: onComment,
              child: Text(
                'View all ${post.commentsCount} comments',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ),
          ),

        // Timestamp
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.xs,
            AppSpacing.md,
            AppSpacing.lg,
          ),
          child: Text(
            timeago.format(post.createdAt, locale: 'en_short'),
            style: AppTypography.caption.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ),

        // Divider
        const Divider(
          color: AppColors.glassLight,
          thickness: 1,
          height: 1,
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          // User avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.primary,
                width: 2,
              ),
              image: DecorationImage(
                image: NetworkImage(post.userAvatar),
                fit: BoxFit.cover,
              ),
            ),
          ),

          const SizedBox(width: AppSpacing.sm),

          // Username
          Expanded(
            child: Row(
              children: [
                Text(
                  post.username,
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (post.isVerified) ...[
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.verified,
                    size: 14,
                    color: AppColors.primary,
                  ),
                ],
                if (post.location != null) ...[
                  const SizedBox(width: 4),
                  Text(
                    ' • ${post.location}',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // More options
          IconButton(
            icon: const Icon(Icons.more_horiz, color: AppColors.textPrimary),
            onPressed: () {
              // TODO: Show options menu
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          // Like button
          IconButton(
            icon: Icon(
              post.isLiked ? Icons.favorite : Icons.favorite_border,
              color: post.isLiked ? AppColors.error : AppColors.textPrimary,
            ),
            onPressed: onLike,
          ),

          // Comment button
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline, color: AppColors.textPrimary),
            onPressed: onComment,
          ),

          // Share button
          IconButton(
            icon: const Icon(Icons.send_outlined, color: AppColors.textPrimary),
            onPressed: onShare,
          ),

          // Gift button
          if (onGift != null)
            IconButton(
              icon: const Icon(Icons.card_giftcard_outlined, color: AppColors.textPrimary),
              onPressed: () {
                // TODO: Show gift selector
                onGift!('default_gift');
              },
            ),

          const Spacer(),

          // Bookmark button
          IconButton(
            icon: Icon(
              post.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
              color: post.isBookmarked ? AppColors.primary : AppColors.textPrimary,
            ),
            onPressed: onBookmark,
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
