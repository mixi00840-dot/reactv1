import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/video_interaction_service.dart';
import '../models/feed_video_model.dart';
import './comments_bottom_sheet.dart';
import './share_bottom_sheet.dart';

/// Individual video item in the feed
/// Displays video with overlay UI (user info, actions, caption)
class VideoFeedItem extends StatefulWidget {
  final FeedVideoModel video;
  final bool isPlaying;
  final Function(FeedVideoModel)? onVideoUpdated;

  const VideoFeedItem({
    Key? key,
    required this.video,
    required this.isPlaying,
    this.onVideoUpdated,
  }) : super(key: key);

  @override
  State<VideoFeedItem> createState() => _VideoFeedItemState();
}

class _VideoFeedItemState extends State<VideoFeedItem> {
  final VideoInteractionService _interactionService = VideoInteractionService();
  bool _showCaption = true;
  
  // Local state for optimistic updates
  late bool _isLiked;
  late int _likeCount;
  late bool _isFollowing;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.video.isLiked;
    _likeCount = widget.video.likes;
    _isFollowing = widget.video.isFollowing;
  }

  @override
  void didUpdateWidget(VideoFeedItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.video.id != widget.video.id) {
      setState(() {
        _isLiked = widget.video.isLiked;
        _likeCount = widget.video.likes;
        _isFollowing = widget.video.isFollowing;
      });
    }
  }

  /// Handle like/unlike with optimistic update
  Future<void> _handleLike() async {
    // Optimistic update
    setState(() {
      _isLiked = !_isLiked;
      _likeCount += _isLiked ? 1 : -1;
    });

    // API call
    final success = _isLiked
        ? await _interactionService.likeVideo(widget.video.id)
        : await _interactionService.unlikeVideo(widget.video.id);

    // Revert if failed
    if (!success) {
      setState(() {
        _isLiked = !_isLiked;
        _likeCount += _isLiked ? 1 : -1;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update like status'),
            duration: Duration(seconds: 2),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } else {
      // Update parent if callback provided
      widget.onVideoUpdated?.call(widget.video.copyWith(
        isLiked: _isLiked,
        likes: _likeCount,
      ));
    }
  }

  /// Handle follow/unfollow with optimistic update
  Future<void> _handleFollow() async {
    // Optimistic update
    setState(() {
      _isFollowing = !_isFollowing;
    });

    // API call
    final success = _isFollowing
        ? await _interactionService.followUser(widget.video.userId)
        : await _interactionService.unfollowUser(widget.video.userId);

    // Revert if failed
    if (!success) {
      setState(() {
        _isFollowing = !_isFollowing;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update follow status'),
            duration: Duration(seconds: 2),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } else {
      // Update parent if callback provided
      widget.onVideoUpdated?.call(widget.video.copyWith(
        isFollowing: _isFollowing,
      ));
    }
  }

  /// Show comments bottom sheet
  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsBottomSheet(
        contentId: widget.video.id,
        initialCommentCount: widget.video.comments,
      ),
    );
  }

  /// Show share bottom sheet
  void _showShare() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ShareBottomSheet(
        contentId: widget.video.id,
        videoUrl: widget.video.videoUrl,
        caption: widget.video.caption,
        username: widget.video.username,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.video.controller;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Video player
        if (controller != null && controller.value.isInitialized)
          GestureDetector(
            onTap: () {
              // Toggle play/pause
              if (controller.value.isPlaying) {
                controller.pause();
              } else {
                controller.play();
              }
              setState(() {});
            },
            child: Center(
              child: AspectRatio(
                aspectRatio: controller.value.aspectRatio,
                child: VideoPlayer(controller),
              ),
            ),
          )
        else
          // Thumbnail while loading
          Image.network(
            widget.video.thumbnailUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: Colors.black,
                child: const Center(
                  child: Icon(
                    Icons.play_circle_outline,
                    size: 80,
                    color: Colors.white38,
                  ),
                ),
              );
            },
          ),

        // Gradient overlays
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.7),
                ],
                stops: const [0.5, 1.0],
              ),
            ),
          ),
        ),

        // UI Overlays
        Positioned.fill(
          child: SafeArea(
            child: Column(
              children: [
                // Top bar (optional)
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'For You',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.search, color: Colors.white),
                        onPressed: () {
                          // Navigate to search
                        },
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Bottom section
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Left side: User info and caption
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // User info
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: AppColors.primary,
                                  backgroundImage: widget.video.userAvatar != null
                                      ? NetworkImage(widget.video.userAvatar!)
                                      : null,
                                  child: widget.video.userAvatar == null
                                      ? Text(
                                          widget.video.username[0].toUpperCase(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        )
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          '@${widget.video.username}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        if (widget.video.isVerified) ...[
                                          const SizedBox(width: 4),
                                          const Icon(
                                            Icons.verified,
                                            color: AppColors.primary,
                                            size: 16,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 12),
                                if (!_isFollowing)
                                  OutlinedButton(
                                    onPressed: _handleFollow,
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Colors.white),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text(
                                      'Follow',
                                      style: TextStyle(color: Colors.white),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            
                            // Caption
                            if (_showCaption && widget.video.caption.isNotEmpty)
                              Text(
                                widget.video.caption,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(width: 16),
                      
                      // Right side: Action buttons
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Like
                          _buildActionButton(
                            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
                            label: _formatCount(_likeCount),
                            color: _isLiked ? Colors.red : Colors.white,
                            onTap: _handleLike,
                          ),
                          const SizedBox(height: 20),
                          
                          // Comment
                          _buildActionButton(
                            icon: Icons.comment,
                            label: _formatCount(widget.video.comments),
                            color: Colors.white,
                            onTap: _showComments,
                          ),
                          const SizedBox(height: 20),
                          
                          // Share
                          _buildActionButton(
                            icon: Icons.share,
                            label: _formatCount(widget.video.shares),
                            color: Colors.white,
                            onTap: _showShare,
                          ),
                          const SizedBox(height: 20),
                          
                          // More options
                          _buildActionButton(
                            icon: Icons.more_horiz,
                            label: '',
                            color: Colors.white,
                            onTap: () {
                              // Handle more options
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Play/pause indicator
        if (controller != null && !controller.value.isPlaying)
          Center(
            child: Icon(
              Icons.play_circle_outline,
              size: 80,
              color: Colors.white.withOpacity(0.8),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: color,
            size: 32,
          ),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
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
