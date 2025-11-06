import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/widgets/custom_video_player.dart';
import '../widgets/video_actions_sidebar.dart';
import '../widgets/video_info_overlay.dart';
import '../../feed/models/video_model.dart';
import '../../feed/providers/feed_provider.dart';
import '../../../presentation/screens/comments/comments_bottom_sheet.dart';

class VideoFeedScreen extends StatefulWidget {
  const VideoFeedScreen({super.key});

  @override
  State<VideoFeedScreen> createState() => _VideoFeedScreenState();
}

class _VideoFeedScreenState extends State<VideoFeedScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load feed when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FeedProvider>().loadFeed(refresh: true);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Consumer<FeedProvider>(
        builder: (context, feedProvider, _) {
          if (feedProvider.isLoading && feedProvider.videos.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: Colors.white),
            );
          }

          if (feedProvider.error != null && feedProvider.videos.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Error loading feed',
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => feedProvider.refresh(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (feedProvider.videos.isEmpty) {
            return const Center(
              child: Text(
                'No videos available',
                style: TextStyle(color: Colors.white),
              ),
            );
          }

          return PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: feedProvider.videos.length + (feedProvider.hasMore ? 1 : 0),
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
              feedProvider.setCurrentVideoIndex(index);
              
              // Load more when near the end
              if (index >= feedProvider.videos.length - 3 && feedProvider.hasMore) {
                feedProvider.loadMore();
              }
            },
            itemBuilder: (context, index) {
              if (index >= feedProvider.videos.length) {
                return const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                );
              }

              final video = feedProvider.videos[index];
              return VideoPlayerItem(
                video: video,
                isActive: index == _currentIndex,
                feedProvider: feedProvider,
              );
            },
          );
        },
      ),
    );
  }
}

class VideoPlayerItem extends StatefulWidget {
  final VideoModel video;
  final bool isActive;
  final FeedProvider feedProvider;

  const VideoPlayerItem({
    super.key,
    required this.video,
    required this.isActive,
    required this.feedProvider,
  });

  @override
  State<VideoPlayerItem> createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem> {
  bool _showLikeAnimation = false;

  void _handleDoubleTap() {
    setState(() {
      _showLikeAnimation = true;
    });

    // Toggle like
    widget.feedProvider.toggleLike(widget.video.id);

    // Hide animation after 1 second
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _showLikeAnimation = false;
        });
      }
    });
  }

  void _handleLike() {
    widget.feedProvider.toggleLike(widget.video.id);
  }

  void _handleComment() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsBottomSheet(contentId: widget.video.id),
    );
  }

  void _handleShare() {
    // TODO: Implement share functionality
  }

  void _handleFollow() {
    widget.feedProvider.toggleFollow(widget.video.creator.id);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video Player
        CustomVideoPlayer(
          videoUrl: widget.video.videoUrl,
          autoPlay: widget.isActive,
          looping: true,
          showControls: false,
          onDoubleTap: _handleDoubleTap,
        ),

        // Gradient Overlays
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: 150,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.7),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          height: 250,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.8),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // Like Animation (center) - Double tap feedback
        if (_showLikeAnimation)
          Center(
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 400),
              builder: (context, value, child) {
                return Transform.scale(
                  scale: value * 3,
                  child: Opacity(
                    opacity: 1.0 - value,
                    child: const Icon(
                      Icons.favorite,
                      color: Colors.white,
                      size: 100,
                    ),
                  ),
                );
              },
            ),
          ),

        // Video Info Overlay (bottom left)
        VideoInfoOverlay(
          video: widget.video,
          onFollowTap: _handleFollow,
        ),

        // Actions Sidebar (bottom right)
        VideoActionsSidebar(
          video: widget.video,
          onLikeTap: _handleLike,
          onCommentTap: _handleComment,
          onShareTap: _handleShare,
        ),
      ],
    );
  }
}
