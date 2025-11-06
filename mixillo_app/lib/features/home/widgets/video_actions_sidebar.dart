import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../feed/models/video_model.dart';
import '../../../presentation/screens/comments/comments_bottom_sheet.dart';
import 'share_bottom_sheet.dart';

class VideoActionsSidebar extends StatefulWidget {
  final VideoModel video;
  final VoidCallback? onLikeTap;
  final VoidCallback? onCommentTap;
  final VoidCallback? onShareTap;

  const VideoActionsSidebar({
    super.key,
    required this.video,
    this.onLikeTap,
    this.onCommentTap,
    this.onShareTap,
  });

  @override
  State<VideoActionsSidebar> createState() => _VideoActionsSidebarState();
}

class _VideoActionsSidebarState extends State<VideoActionsSidebar> with SingleTickerProviderStateMixin {
  late AnimationController _likeAnimationController;
  late Animation<double> _likeAnimation;

  @override
  void initState() {
    super.initState();
    
    _likeAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    
    _likeAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(
        parent: _likeAnimationController,
        curve: Curves.elasticOut,
      ),
    );
  }

  @override
  void dispose() {
    _likeAnimationController.dispose();
    super.dispose();
  }

  void _handleLike() {
    if (widget.video.isLiked) {
      _likeAnimationController.reverse();
    } else {
      _likeAnimationController.forward().then((_) {
        _likeAnimationController.reverse();
      });
    }
    widget.onLikeTap?.call();
  }

  void _handleComment() {
    widget.onCommentTap?.call();
  }

  void _handleShare() {
    widget.onShareTap?.call();
  }

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
    return Positioned(
      right: 8,
      bottom: 100,
      child: Column(
        children: [
          // Profile Avatar
          GestureDetector(
            onTap: () {
              // Navigate to user profile
            },
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white,
                  width: 2,
                ),
                image: DecorationImage(
                  image: NetworkImage(widget.video.creator.avatar.isNotEmpty 
                      ? widget.video.creator.avatar 
                      : 'https://via.placeholder.com/150'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Like Button
          _buildActionButton(
            icon: widget.video.isLiked ? Icons.favorite : Icons.favorite_border,
            iconColor: widget.video.isLiked ? AppColors.error : Colors.white,
            count: _formatCount(widget.video.stats.likes),
            onTap: _handleLike,
            animation: widget.video.isLiked ? _likeAnimation : null,
          ),
          
          const SizedBox(height: 16),
          
          // Comment Button
          _buildActionButton(
            icon: Icons.comment,
            iconColor: Colors.white,
            count: _formatCount(widget.video.stats.comments),
            onTap: _handleComment,
          ),
          
          const SizedBox(height: 16),
          
          // Share Button
          _buildActionButton(
            icon: Icons.share,
            iconColor: Colors.white,
            count: _formatCount(widget.video.stats.shares),
            onTap: _handleShare,
          ),
          
          const SizedBox(height: 16),
          
          // Favorite/Bookmark Button
          _buildActionButton(
            icon: Icons.bookmark_border,
            iconColor: Colors.white,
            count: null,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Added to favorites'),
                  duration: Duration(seconds: 1),
                  backgroundColor: AppColors.primary,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required Color iconColor,
    required String? count,
    required VoidCallback onTap,
    Animation<double>? animation,
  }) {
    Widget iconWidget = Icon(
      icon,
      color: iconColor,
      size: 32,
    );
    
    if (animation != null) {
      iconWidget = ScaleTransition(
        scale: animation,
        child: iconWidget,
      );
    }
    
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(8),
            child: iconWidget,
          ),
        ),
        if (count != null) ...[
          const SizedBox(height: 4),
          Text(
            count,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              shadows: [
                Shadow(
                  color: Colors.black,
                  blurRadius: 4,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
