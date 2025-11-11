// Clean single-source implementation of the vertical video feed.
// All previous duplicate/import corruption blocks removed.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iconsax/iconsax.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/video_model.dart';
import '../../../live/presentation/pages/live_browse_overlay.dart';
import '../../../search/presentation/pages/search_discover_page.dart';
import '../../providers/video_feed_provider.dart';
import '../../providers/video_interaction_provider.dart';
import '../../providers/socket_provider.dart';
import '../widgets/comment_bottom_sheet.dart';

class VideoFeedPage extends ConsumerStatefulWidget {
  const VideoFeedPage({super.key});
  @override
  ConsumerState<VideoFeedPage> createState() => _VideoFeedPageState();
}

class _VideoFeedPageState extends ConsumerState<VideoFeedPage>
    with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    
    // Initialize socket connection and load feed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(socketProvider.notifier).connect();
      ref.read(videoFeedProvider.notifier).loadFeed(isFollowing: false);
    });
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      final isFollowing = _tabController.index == 1;
      ref.read(videoFeedProvider.notifier).switchTab(isFollowing);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    ref.read(socketProvider.notifier).disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(videoFeedProvider);
    
    // Show loading on initial load
    if (feedState.isLoading && feedState.videos.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    // Show error if no videos loaded
    if (feedState.videos.isEmpty && !feedState.isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.video_library_outlined, size: 64, color: Colors.white54),
              const SizedBox(height: 16),
              Text(
                'No videos available',
                style: AppTypography.titleMedium.copyWith(color: Colors.white54),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.read(videoFeedProvider.notifier).refresh(),
                child: const Text('Refresh'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: feedState.videos.length,
            onPageChanged: (index) {
              ref.read(videoFeedProvider.notifier).updateIndex(index);
            },
            itemBuilder: (context, index) => VideoFeedItem(
              video: feedState.videos[index],
              isActive: index == feedState.currentIndex,
            ),
          ),
          _TopHeader(tabController: _tabController),
        ],
      ),
    );
  }
}

// Top Header Widget
class _TopHeader extends StatelessWidget {
  final TabController tabController;
  
  const _TopHeader({required this.tabController});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
          height: 64,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.35),
                Colors.transparent,
              ],
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const LiveBrowseOverlay(),
                  ),
                ),
                child: const _LiveIcon(),
              ),
              Expanded(
                child: Center(
                  child: SizedBox(
                    height: 40,
                    width: 210,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.30),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: TabBar(
                        controller: tabController,
                        indicator: BoxDecoration(
                          color: Colors.white.withOpacity(0.22),
                          borderRadius: BorderRadius.circular(22),
                        ),
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        labelColor: Colors.white,
                        unselectedLabelColor: Colors.white60,
                        labelStyle: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                        unselectedLabelStyle: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.normal,
                          fontSize: 15,
                        ),
                        tabs: const [
                          Tab(text: 'For You'),
                          Tab(text: 'Following'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(
                width: 50,
                child: GestureDetector(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const SearchDiscoverPage(),
                    ),
                  ),
                  child: const Icon(
                    Iconsax.search_normal,
                    color: Colors.white,
                    size: 26,
                    shadows: [
                      Shadow(
                        color: Colors.black54,
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
            ],
          ),
        ),
    );
  }
}

class _LiveIcon extends StatelessWidget {
  const _LiveIcon();
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const LiveBrowseOverlay(),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: Colors.white,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.white.withOpacity(0.6),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 5),
            const Text(
              'LIVE',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VideoFeedItem extends ConsumerStatefulWidget {
  final VideoModel video;
  final bool isActive;
  const VideoFeedItem({super.key, required this.video, required this.isActive});
  @override
  ConsumerState<VideoFeedItem> createState() => _VideoFeedItemState();
}

class _VideoFeedItemState extends ConsumerState<VideoFeedItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _isInitialized = false;
  bool _showPauseIcon = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    if (widget.isActive) {
      _initializeVideo();
    }
  }

  @override
  void didUpdateWidget(VideoFeedItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isActive && !oldWidget.isActive) {
      _initializeVideo();
    } else if (!widget.isActive && oldWidget.isActive) {
      _disposeVideo();
    }
  }

  Future<void> _initializeVideo() async {
    if (_isInitialized) return;
    
    try {
      _videoController = VideoPlayerController.network(widget.video.videoUrl);
      await _videoController!.initialize();
      
      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        autoPlay: true,
        looping: true,
        showControls: false,
        aspectRatio: _videoController!.value.aspectRatio,
        placeholder: Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: NetworkImage(widget.video.thumbnailUrl),
              fit: BoxFit.cover,
            ),
          ),
        ),
        errorBuilder: (context, errorMessage) {
          return Container(
            decoration: BoxDecoration(
              image: DecorationImage(
                image: NetworkImage(widget.video.thumbnailUrl),
                fit: BoxFit.cover,
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 48),
                  const SizedBox(height: 8),
                  Text(
                    'Failed to load video',
                    style: AppTypography.bodySmall.copyWith(color: Colors.white),
                  ),
                ],
              ),
            ),
          );
        },
      );
      
      if (mounted) {
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      print('Error initializing video: $e');
    }
  }

  void _disposeVideo() {
    _chewieController?.pause();
    _chewieController?.dispose();
    _videoController?.dispose();
    _chewieController = null;
    _videoController = null;
    _isInitialized = false;
  }

  @override
  void dispose() {
    _animationController.dispose();
    _disposeVideo();
    super.dispose();
  }

  void _toggleLike() {
    ref.read(videoInteractionProvider.notifier).toggleLike(widget.video.id);
    _animationController.forward().then((_) => _animationController.reverse());
  }

  void _togglePlayPause() {
    if (_chewieController != null) {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
      } else {
        _videoController!.play();
      }
      
      setState(() => _showPauseIcon = true);
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) setState(() => _showPauseIcon = false);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    const double navHeight = 64; // sync with custom bottom nav

    return GestureDetector(
      onTap: _togglePlayPause,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video player or thumbnail
          if (_isInitialized && _chewieController != null)
            Chewie(controller: _chewieController!)
          else
            Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(widget.video.thumbnailUrl),
                  fit: BoxFit.cover,
                ),
              ),
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.overlayFull),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              ),
            ),
          
          // Play/Pause indicator
          if (_showPauseIcon)
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _videoController?.value.isPlaying ?? false ? Icons.pause : Icons.play_arrow,
                  size: 48,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          SafeArea(
            bottom: false,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Bottom-left: User info
                Positioned(
                  left: 12,
                  right: 88,
                  bottom: navHeight + bottomInset + 12,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '@${widget.video.username}',
                        style: AppTypography.titleMedium.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                          color: Colors.white,
                          shadows: const [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 12,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        widget.video.caption,
                        style: AppTypography.bodySmall.copyWith(
                          fontSize: 14.5,
                          height: 1.3,
                          color: Colors.white,
                          shadows: const [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 10,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Iconsax.music,
                            size: 15,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              widget.video.soundName ?? 'Original Sound - ${widget.video.username}',
                              style: AppTypography.labelSmall.copyWith(
                                fontSize: 13,
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                                shadows: const [
                                  Shadow(
                                    color: Colors.black,
                                    blurRadius: 8,
                                    offset: Offset(0, 1),
                                  ),
                                ],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Bottom-right: Action buttons
                Positioned(
                  right: 12,
                  bottom: navHeight + bottomInset + 12,
                  child: _buildActionButtons(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    const double spacing = 20;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2.5),
                image: DecorationImage(
                  image: NetworkImage(widget.video.userAvatar),
                  fit: BoxFit.cover,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
            if (!widget.video.isLiked)
              Positioned(
                bottom: -2,
                right: -2,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: AppColors.liveRed,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.add, color: Colors.white, size: 16),
                ),
              ),
          ],
        ),
        const SizedBox(height: spacing),
        _buildActionButton(
          icon: widget.video.isLiked ? Icons.favorite : Icons.favorite_border,
          label: _formatCount(widget.video.likes),
          color: widget.video.isLiked ? AppColors.liveRed : Colors.white,
          onTap: _toggleLike,
        ),
        const SizedBox(height: spacing),
        _buildActionButton(
          icon: Iconsax.message,
          label: _formatCount(widget.video.comments),
          color: Colors.white,
          onTap: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => CommentBottomSheet(
                videoId: widget.video.id,
              ),
            );
          },
        ),
        const SizedBox(height: spacing),
        _buildActionButton(
          icon: Iconsax.send_2,
          label: _formatCount(widget.video.shares),
          color: Colors.white,
          onTap: () async {
            await ref.read(videoInteractionProvider.notifier).shareVideo(widget.video.id);
            // Show share dialog
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Video shared!')),
              );
            }
          },
        ),
        const SizedBox(height: spacing),
        _buildActionButton(
          icon: Iconsax.gift,
          label: 'Gift',
          color: Colors.white,
          onTap: () {},
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
        children: [
          Icon(
            icon,
            color: color,
            size: 34,
            shadows: const [
              Shadow(color: Colors.black, blurRadius: 12, offset: Offset(0, 2)),
              Shadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 3)),
            ],
          ),
          const SizedBox(height: 4),
          if (label.isNotEmpty)
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
                shadows: [
                  Shadow(color: Colors.black, blurRadius: 8, offset: Offset(0, 1)),
                  Shadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 2)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }
}
