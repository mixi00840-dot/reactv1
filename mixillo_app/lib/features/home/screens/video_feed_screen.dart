import 'package:flutter/material.dart';
import '../../../core/widgets/custom_video_player.dart';
import '../widgets/video_actions_sidebar.dart';
import '../widgets/video_info_overlay.dart';

class VideoFeedScreen extends StatefulWidget {
  const VideoFeedScreen({super.key});

  @override
  State<VideoFeedScreen> createState() => _VideoFeedScreenState();
}

class _VideoFeedScreenState extends State<VideoFeedScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  
  // Sample video data - Replace with API data
  final List<VideoModel> _videos = [
    VideoModel(
      id: '1',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://via.placeholder.com/400x600',
      username: '@sarah_designs',
      caption: 'Creating magic with Flutter ✨ #flutterdev #coding #developer',
      soundName: 'Original Sound - Sarah',
      likes: 12500,
      comments: 234,
      shares: 89,
      isFollowing: false,
      userAvatar: 'https://i.pravatar.cc/150?img=1',
    ),
    VideoModel(
      id: '2',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://via.placeholder.com/400x600',
      username: '@tech_master',
      caption: 'New app features 🚀 Coming soon! #app #tech #innovation',
      soundName: 'Trending Sound - Tech Vibes',
      likes: 8900,
      comments: 156,
      shares: 45,
      isFollowing: true,
      userAvatar: 'https://i.pravatar.cc/150?img=2',
    ),
    VideoModel(
      id: '3',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://via.placeholder.com/400x600',
      username: '@creative_soul',
      caption: 'Behind the scenes 🎬 #bts #creative #content',
      soundName: 'Original Sound',
      likes: 15600,
      comments: 289,
      shares: 112,
      isFollowing: false,
      userAvatar: 'https://i.pravatar.cc/150?img=3',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _videos.length,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        itemBuilder: (context, index) {
          return VideoPlayerItem(
            video: _videos[index],
            isActive: index == _currentIndex,
          );
        },
      ),
    );
  }
}

class VideoPlayerItem extends StatefulWidget {
  final VideoModel video;
  final bool isActive;

  const VideoPlayerItem({
    super.key,
    required this.video,
    required this.isActive,
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
    
    // Hide animation after 1 second
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _showLikeAnimation = false;
        });
      }
    });
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
        VideoInfoOverlay(video: widget.video),

        // Actions Sidebar (bottom right)
        VideoActionsSidebar(video: widget.video),
      ],
    );
  }
}

// Video Model
class VideoModel {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String username;
  final String caption;
  final String soundName;
  final int likes;
  final int comments;
  final int shares;
  final bool isFollowing;
  final String userAvatar;

  VideoModel({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.username,
    required this.caption,
    required this.soundName,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.isFollowing,
    required this.userAvatar,
  });
}
