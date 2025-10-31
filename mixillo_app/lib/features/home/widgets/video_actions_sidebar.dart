import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../screens/video_feed_screen.dart';
import 'comment_bottom_sheet.dart';
import 'share_bottom_sheet.dart';

class VideoActionsSidebar extends StatefulWidget {
  final VideoModel video;

  const VideoActionsSidebar({
    super.key,
    required this.video,
  });

  @override
  State<VideoActionsSidebar> createState() => _VideoActionsSidebarState();
}

class _VideoActionsSidebarState extends State<VideoActionsSidebar> with SingleTickerProviderStateMixin {
  bool _isLiked = false;
  bool _isFollowing = false;
  int _likeCount = 0;
  late AnimationController _likeAnimationController;
  late Animation<double> _likeAnimation;

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.video.isFollowing;
    _likeCount = widget.video.likes;
    
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

  void _toggleLike() {
    setState(() {
      _isLiked = !_isLiked;
      _likeCount += _isLiked ? 1 : -1;
    });
    
    if (_isLiked) {
      _likeAnimationController.forward().then((_) {
        _likeAnimationController.reverse();
      });
    }
  }

  void _toggleFollow() {
    setState(() {
      _isFollowing = !_isFollowing;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isFollowing 
              ? 'Following ${widget.video.username}'
              : 'Unfollowed ${widget.video.username}',
        ),
        duration: const Duration(seconds: 1),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentBottomSheet(video: widget.video),
    );
  }

  void _showShareOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ShareBottomSheet(video: widget.video),
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

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 8,
      bottom: 100,
      child: Column(
        children: [
          // Profile Avatar with Follow Button
          Stack(
            clipBehavior: Clip.none,
            children: [
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
                      image: NetworkImage(widget.video.userAvatar),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              if (!_isFollowing)
                Positioned(
                  bottom: -8,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: _toggleFollow,
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Like Button
          _buildActionButton(
            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
            iconColor: _isLiked ? AppColors.error : Colors.white,
            count: _formatCount(_likeCount),
            onTap: _toggleLike,
            animation: _likeAnimation,
          ),
          
          const SizedBox(height: 16),
          
          // Comment Button
          _buildActionButton(
            icon: Icons.comment,
            iconColor: Colors.white,
            count: _formatCount(widget.video.comments),
            onTap: _showComments,
          ),
          
          const SizedBox(height: 16),
          
          // Share Button
          _buildActionButton(
            icon: Icons.share,
            iconColor: Colors.white,
            count: _formatCount(widget.video.shares),
            onTap: _showShareOptions,
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
          
          const SizedBox(height: 16),
          
          // Rotating Sound Disc
          GestureDetector(
            onTap: () {
              // Navigate to sound page
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.secondary,
                  ],
                ),
              ),
              child: const Icon(
                Icons.music_note,
                color: Colors.white,
                size: 20,
              ),
            ),
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
