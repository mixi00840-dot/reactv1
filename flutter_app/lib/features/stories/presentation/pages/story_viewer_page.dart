import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:iconsax/iconsax.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/story_model.dart';

/// Instagram-style story viewer with progress bars
class StoryViewerPage extends StatefulWidget {
  final List<Story> stories;
  final int initialStoryIndex;
  final int initialItemIndex;

  const StoryViewerPage({
    super.key,
    required this.stories,
    this.initialStoryIndex = 0,
    this.initialItemIndex = 0,
  });

  @override
  State<StoryViewerPage> createState() => _StoryViewerPageState();
}

class _StoryViewerPageState extends State<StoryViewerPage>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late int _currentStoryIndex;
  late int _currentItemIndex;
  
  Timer? _progressTimer;
  late AnimationController _progressController;
  VideoPlayerController? _videoController;
  
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    _currentStoryIndex = widget.initialStoryIndex;
    _currentItemIndex = widget.initialItemIndex;
    _pageController = PageController(initialPage: _currentStoryIndex);
    
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..addStatusListener(_onProgressComplete);
    
    _loadStory();
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    _progressController.dispose();
    _videoController?.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _loadStory() {
    final story = widget.stories[_currentStoryIndex];
    final item = story.items[_currentItemIndex];
    
    if (item.type == StoryType.video) {
      _loadVideo(item.url);
    } else {
      _startProgress(item.duration);
    }
  }

  void _loadVideo(String url) {
    _videoController?.dispose();
    _videoController = VideoPlayerController.networkUrl(Uri.parse(url))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {});
          _videoController!.play();
          _startProgress(_videoController!.value.duration);
        }
      });
  }

  void _startProgress(Duration duration) {
    _progressController.duration = duration;
    _progressController.forward(from: 0);
  }

  void _onProgressComplete(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      _nextItem();
    }
  }

  void _nextItem() {
    final story = widget.stories[_currentStoryIndex];
    
    if (_currentItemIndex < story.items.length - 1) {
      // Next item in current story
      setState(() {
        _currentItemIndex++;
      });
      _loadStory();
    } else {
      // Next story
      _nextStory();
    }
  }

  void _previousItem() {
    if (_currentItemIndex > 0) {
      // Previous item in current story
      setState(() {
        _currentItemIndex--;
      });
      _loadStory();
    } else {
      // Previous story
      _previousStory();
    }
  }

  void _nextStory() {
    if (_currentStoryIndex < widget.stories.length - 1) {
      setState(() {
        _currentStoryIndex++;
        _currentItemIndex = 0;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _loadStory();
    } else {
      // End of stories
      Navigator.pop(context);
    }
  }

  void _previousStory() {
    if (_currentStoryIndex > 0) {
      setState(() {
        _currentStoryIndex--;
        _currentItemIndex = widget.stories[_currentStoryIndex].items.length - 1;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _loadStory();
    } else {
      Navigator.pop(context);
    }
  }

  void _togglePause() {
    setState(() {
      _isPaused = !_isPaused;
    });
    
    if (_isPaused) {
      _progressController.stop();
      _videoController?.pause();
    } else {
      _progressController.forward();
      _videoController?.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (details) {
          final screenWidth = MediaQuery.of(context).size.width;
          if (details.globalPosition.dx < screenWidth / 3) {
            _previousItem();
          } else if (details.globalPosition.dx > screenWidth * 2 / 3) {
            _nextItem();
          } else {
            _togglePause();
          }
        },
        onVerticalDragEnd: (details) {
          if (details.primaryVelocity! > 0) {
            Navigator.pop(context);
          }
        },
        child: Stack(
          children: [
            // Story content
            PageView.builder(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.stories.length,
              onPageChanged: (index) {
                setState(() {
                  _currentStoryIndex = index;
                  _currentItemIndex = 0;
                });
                _loadStory();
              },
              itemBuilder: (context, index) {
                final story = widget.stories[index];
                final item = story.items[_currentItemIndex];
                
                return _buildStoryItem(item);
              },
            ),
            
            // Top gradient overlay
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  gradient: AppGradients.overlayTop,
                ),
              ),
            ),
            
            // Progress bars
            _buildProgressBars(),
            
            // Story header
            _buildHeader(),
            
            // Bottom actions
            _buildBottomActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildStoryItem(StoryItem item) {
    if (item.type == StoryType.video && _videoController != null) {
      return Center(
        child: _videoController!.value.isInitialized
            ? AspectRatio(
                aspectRatio: _videoController!.value.aspectRatio,
                child: VideoPlayer(_videoController!),
              )
            : const CircularProgressIndicator(
                color: AppColors.primary,
              ),
      );
    }
    
    return CachedNetworkImage(
      imageUrl: item.url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (context, url) => const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
        ),
      ),
      errorWidget: (context, url, error) => const Center(
        child: Icon(
          Icons.error,
          color: AppColors.error,
          size: 48,
        ),
      ),
    );
  }

  Widget _buildProgressBars() {
    final story = widget.stories[_currentStoryIndex];
    
    return Positioned(
      top: 50,
      left: AppSpacing.md,
      right: AppSpacing.md,
      child: Row(
        children: List.generate(
          story.items.length,
          (index) => Expanded(
            child: Container(
              height: 3,
              margin: EdgeInsets.only(
                right: index < story.items.length - 1 ? 4 : 0,
              ),
              decoration: BoxDecoration(
                color: AppColors.glassLight,
                borderRadius: BorderRadius.circular(2),
              ),
              child: AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  double progress = 0.0;
                  
                  if (index < _currentItemIndex) {
                    progress = 1.0;
                  } else if (index == _currentItemIndex) {
                    progress = _progressController.value;
                  }
                  
                  return FractionallySizedBox(
                    widthFactor: progress,
                    alignment: Alignment.centerLeft,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final story = widget.stories[_currentStoryIndex];
    
    return Positioned(
      top: 70,
      left: AppSpacing.md,
      right: AppSpacing.md,
      child: Row(
        children: [
          // User avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: 2,
              ),
            ),
            child: ClipOval(
              child: CachedNetworkImage(
                imageUrl: story.userAvatar,
                fit: BoxFit.cover,
                errorWidget: (context, url, error) => const Icon(
                  Icons.person,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          // Username and time
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  story.username,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  _getTimeAgo(story.createdAt),
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          // More options
          IconButton(
            icon: const Icon(
              Icons.more_vert,
              color: Colors.white,
            ),
            onPressed: () {
              // TODO: Show options
            },
          ),
          
          // Close button
          IconButton(
            icon: const Icon(
              Icons.close,
              color: Colors.white,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions() {
    return Positioned(
      bottom: 40,
      left: AppSpacing.md,
      right: AppSpacing.md,
      child: Row(
        children: [
          // Reply input
          Expanded(
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: TextField(
                      style: TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Send message',
                        hintStyle: TextStyle(
                          color: Colors.white60,
                          fontSize: 14,
                        ),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  Icon(
                    Iconsax.emoji_happy,
                    color: Colors.white.withOpacity(0.7),
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          // Like button
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: const Icon(
              Iconsax.heart,
              color: Colors.white,
              size: 22,
            ),
          ),
          
          const SizedBox(width: AppSpacing.sm),
          
          // Share button
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: const Icon(
              Iconsax.send_2,
              color: Colors.white,
              size: 22,
            ),
          ),
        ],
      ),
    );
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
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
