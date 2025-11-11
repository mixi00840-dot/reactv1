import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/post_model.dart';

/// Instagram-style post card widget
class PostCard extends StatefulWidget {
  final Post post;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;
  final VoidCallback? onBookmark;

  const PostCard({
    super.key,
    required this.post,
    this.onLike,
    this.onComment,
    this.onShare,
    this.onBookmark,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> with SingleTickerProviderStateMixin {
  late AnimationController _likeAnimController;
  late bool _isLiked;
  late bool _isBookmarked;
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _isBookmarked = widget.post.isBookmarked;
    _likeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
  }

  @override
  void dispose() {
    _likeAnimController.dispose();
    super.dispose();
  }

  void _toggleLike() {
    setState(() => _isLiked = !_isLiked);
    _likeAnimController.forward().then((_) => _likeAnimController.reverse());
    widget.onLike?.call();
  }

  void _toggleBookmark() {
    setState(() => _isBookmarked = !_isBookmarked);
    widget.onBookmark?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User header
          _buildHeader(),
          
          // Post images
          _buildImageCarousel(),
          
          // Action buttons
          _buildActionButtons(),
          
          // Likes count
          _buildLikesCount(),
          
          // Caption
          _buildCaption(),
          
          // View comments
          _buildViewComments(),
          
          // Time
          _buildTime(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
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
            ),
            child: ClipOval(
              child: CachedNetworkImage(
                imageUrl: widget.post.userAvatar,
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => const Icon(
                  Icons.person,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          // Username
          Expanded(
            child: Text(
              widget.post.username,
              style: AppTypography.labelLarge.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          
          // More options
          IconButton(
            icon: const Icon(
              Icons.more_vert,
              color: AppColors.textPrimary,
            ),
            onPressed: () {
              // TODO: Show options menu
            },
          ),
        ],
      ),
    );
  }

  Widget _buildImageCarousel() {
    if (widget.post.imageUrls.length == 1) {
      return AspectRatio(
        aspectRatio: 1,
        child: CachedNetworkImage(
          imageUrl: widget.post.imageUrls[0],
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: AppColors.glassMedium,
            child: const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      );
    }

    return Stack(
      children: [
        AspectRatio(
          aspectRatio: 1,
          child: PageView.builder(
            itemCount: widget.post.imageUrls.length,
            onPageChanged: (index) {
              setState(() => _currentImageIndex = index);
            },
            itemBuilder: (context, index) {
              return CachedNetworkImage(
                imageUrl: widget.post.imageUrls[index],
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (context, url) => Container(
                  color: AppColors.glassMedium,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        
        // Image indicators
        if (widget.post.imageUrls.length > 1)
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.post.imageUrls.length,
                (index) => Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentImageIndex == index
                        ? AppColors.primary
                        : AppColors.glassLight,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          // Like button
          GestureDetector(
            onTap: _toggleLike,
            child: ScaleTransition(
              scale: Tween<double>(begin: 1.0, end: 1.3).animate(
                CurvedAnimation(
                  parent: _likeAnimController,
                  curve: Curves.easeInOut,
                ),
              ),
              child: Icon(
                _isLiked ? Iconsax.heart5 : Iconsax.heart,
                color: _isLiked ? AppColors.error : AppColors.textPrimary,
                size: 28,
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.lg),
          
          // Comment button
          GestureDetector(
            onTap: widget.onComment,
            child: const Icon(
              Iconsax.message,
              color: AppColors.textPrimary,
              size: 28,
            ),
          ),
          
          const SizedBox(width: AppSpacing.lg),
          
          // Share button
          GestureDetector(
            onTap: widget.onShare,
            child: const Icon(
              Iconsax.send_2,
              color: AppColors.textPrimary,
              size: 28,
            ),
          ),
          
          const Spacer(),
          
          // Bookmark button
          GestureDetector(
            onTap: _toggleBookmark,
            child: Icon(
              _isBookmarked ? Iconsax.archive_tick5 : Iconsax.archive_minus,
              color: _isBookmarked ? AppColors.accentLight : AppColors.textPrimary,
              size: 28,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLikesCount() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Text(
        '${_formatCount(widget.post.likes)} likes',
        style: AppTypography.labelLarge.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildCaption() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: RichText(
        text: TextSpan(
          style: AppTypography.bodyMedium,
          children: [
            TextSpan(
              text: '${widget.post.username} ',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
            TextSpan(text: widget.post.caption),
          ],
        ),
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildViewComments() {
    if (widget.post.comments == 0) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: GestureDetector(
        onTap: widget.onComment,
        child: Text(
          'View all ${widget.post.comments} comments',
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textTertiary,
          ),
        ),
      ),
    );
  }

  Widget _buildTime() {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        top: AppSpacing.xs,
        bottom: AppSpacing.md,
      ),
      child: Text(
        _getTimeAgo(widget.post.createdAt),
        style: AppTypography.caption.copyWith(
          color: AppColors.textTertiary,
        ),
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

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${(difference.inDays / 7).floor()}w ago';
    }
  }
}
