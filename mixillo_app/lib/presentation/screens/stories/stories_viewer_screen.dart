import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../domain/entities/story.dart';
import '../../../core/widgets/custom_video_player.dart';
import '../../providers/stories_providers.dart';

/// Full-screen story viewer with Instagram-style UI
/// Supports tap-to-skip, swipe gestures, progress bars
class StoriesViewerScreen extends ConsumerStatefulWidget {
  final List<StoryGroup> storyGroups;
  final int initialGroupIndex;
  final int initialStoryIndex;

  const StoriesViewerScreen({
    super.key,
    required this.storyGroups,
    this.initialGroupIndex = 0,
    this.initialStoryIndex = 0,
  });

  @override
  ConsumerState<StoriesViewerScreen> createState() => _StoriesViewerScreenState();
}

class _StoriesViewerScreenState extends ConsumerState<StoriesViewerScreen>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late int _currentGroupIndex;
  late int _currentStoryIndex;
  Timer? _storyTimer;
  AnimationController? _progressController;

  // Story duration: 5s for images, video duration for videos
  static const Duration _imageDuration = Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _currentGroupIndex = widget.initialGroupIndex;
    _currentStoryIndex = widget.initialStoryIndex;
    
    _pageController = PageController(initialPage: _currentGroupIndex);
    _progressController = AnimationController(vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startStoryTimer();
      _markStoryViewed();
    });
  }

  @override
  void dispose() {
    _storyTimer?.cancel();
    _progressController?.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _startStoryTimer() {
    _storyTimer?.cancel();
    _progressController?.reset();

    final currentStory = _getCurrentStory();
    if (currentStory == null) return;

    // Determine story duration
    final duration = currentStory.media.type == StoryMediaType.video &&
            currentStory.media.duration != null
        ? Duration(seconds: currentStory.media.duration!)
        : _imageDuration;

    _progressController?.duration = duration;
    _progressController?.forward();

    _storyTimer = Timer(duration, _nextStory);
  }

  void _pauseStoryTimer() {
    _storyTimer?.cancel();
    _progressController?.stop();
  }

  void _resumeStoryTimer() {
    if (_progressController?.isAnimating == false) {
      final remaining = _progressController?.duration != null
          ? _progressController!.duration! * (1 - _progressController!.value)
          : _imageDuration;
      
      _storyTimer?.cancel();
      _storyTimer = Timer(remaining, _nextStory);
      _progressController?.forward();
    }
  }

  Story? _getCurrentStory() {
    if (_currentGroupIndex >= widget.storyGroups.length) return null;
    final group = widget.storyGroups[_currentGroupIndex];
    if (_currentStoryIndex >= group.stories.length) return null;
    return group.stories[_currentStoryIndex];
  }

  StoryGroup _getCurrentGroup() {
    return widget.storyGroups[_currentGroupIndex];
  }

  void _nextStory() {
    final currentGroup = _getCurrentGroup();
    
    if (_currentStoryIndex < currentGroup.stories.length - 1) {
      // Next story in current group
      setState(() {
        _currentStoryIndex++;
      });
      _startStoryTimer();
      _markStoryViewed();
    } else {
      // Next group
      _nextGroup();
    }
  }

  void _previousStory() {
    if (_currentStoryIndex > 0) {
      // Previous story in current group
      setState(() {
        _currentStoryIndex--;
      });
      _startStoryTimer();
    } else if (_currentGroupIndex > 0) {
      // Previous group
      _previousGroup();
    }
  }

  void _nextGroup() {
    if (_currentGroupIndex < widget.storyGroups.length - 1) {
      setState(() {
        _currentGroupIndex++;
        _currentStoryIndex = 0;
      });
      _pageController.animateToPage(
        _currentGroupIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStoryTimer();
      _markStoryViewed();
    } else {
      // End of stories
      Navigator.of(context).pop();
    }
  }

  void _previousGroup() {
    if (_currentGroupIndex > 0) {
      setState(() {
        _currentGroupIndex--;
        _currentStoryIndex = 0;
      });
      _pageController.animateToPage(
        _currentGroupIndex,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStoryTimer();
    }
  }

  void _markStoryViewed() {
    final currentStory = _getCurrentStory();
    if (currentStory != null && !currentStory.isViewed) {
      ref.read(storiesNotifierProvider.notifier).markStoryViewed(currentStory.id);
    }
  }

  void _showOptions() {
    _pauseStoryTimer();
    
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.report_outlined),
              title: const Text('Report'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement report functionality
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Copy Link'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement copy link
              },
            ),
          ],
        ),
      ),
    ).then((_) => _resumeStoryTimer());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (details) {
          _pauseStoryTimer();
        },
        onTapUp: (details) {
          final screenWidth = MediaQuery.of(context).size.width;
          final tapX = details.globalPosition.dx;
          
          if (tapX < screenWidth / 3) {
            // Tapped left third - previous story
            _previousStory();
          } else if (tapX > screenWidth * 2 / 3) {
            // Tapped right third - next story
            _nextStory();
          } else {
            // Tapped middle - resume
            _resumeStoryTimer();
          }
        },
        onLongPressStart: (_) => _pauseStoryTimer(),
        onLongPressEnd: (_) => _resumeStoryTimer(),
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity! < 0) {
            // Swipe left - next group
            _nextGroup();
          } else if (details.primaryVelocity! > 0) {
            // Swipe right - previous group
            _previousGroup();
          }
        },
        child: PageView.builder(
          controller: _pageController,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: widget.storyGroups.length,
          itemBuilder: (context, index) => _buildStoryView(),
        ),
      ),
    );
  }

  Widget _buildStoryView() {
    final currentStory = _getCurrentStory();
    final currentGroup = _getCurrentGroup();

    if (currentStory == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Story media
        _buildStoryMedia(currentStory),

        // Gradient overlay at top
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 150,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.6),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // Progress bars
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 8,
          right: 8,
          child: _buildProgressBars(currentGroup),
        ),

        // User info header
        Positioned(
          top: MediaQuery.of(context).padding.top + 30,
          left: 8,
          right: 8,
          child: _buildUserHeader(currentGroup, currentStory),
        ),

        // Caption (if exists)
        if (currentStory.caption != null)
          Positioned(
            bottom: 80,
            left: 16,
            right: 16,
            child: Text(
              currentStory.caption!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                shadows: [
                  Shadow(
                    blurRadius: 8,
                    color: Colors.black,
                  ),
                ],
              ),
            ),
          ),

        // Reply input (bottom)
        Positioned(
          bottom: 16,
          left: 16,
          right: 16,
          child: _buildReplyInput(),
        ),
      ],
    );
  }

  Widget _buildStoryMedia(Story story) {
    if (story.media.type == StoryMediaType.photo) {
      return CachedNetworkImage(
        imageUrl: story.media.url,
        fit: BoxFit.contain,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(),
        ),
        errorWidget: (context, url, error) => const Center(
          child: Icon(Icons.error, color: Colors.white),
        ),
      );
    } else {
      // Video story with auto-play
      return CustomVideoPlayer(
        videoUrl: story.media.url,
        autoPlay: true,
        looping: false, // Stories don't loop
        showControls: false, // No controls for stories
      );
    }
  }

  Widget _buildProgressBars(StoryGroup group) {
    return Row(
      children: List.generate(group.stories.length, (index) {
        return Expanded(
          child: Container(
            height: 3,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            child: LinearProgressIndicator(
              value: index < _currentStoryIndex
                  ? 1.0
                  : index == _currentStoryIndex
                      ? _progressController?.value ?? 0
                      : 0,
              backgroundColor: Colors.white.withValues(alpha: 0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildUserHeader(StoryGroup group, Story story) {
    return Row(
      children: [
        // Avatar
        CircleAvatar(
          radius: 20,
          backgroundImage: group.user.avatar != null
              ? CachedNetworkImageProvider(group.user.avatar!)
              : null,
          child: group.user.avatar == null
              ? Text(group.user.username[0].toUpperCase())
              : null,
        ),
        const SizedBox(width: 12),

        // Username and time
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    group.user.username,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (group.user.isVerified) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.verified, color: Colors.blue, size: 16),
                  ],
                ],
              ),
              Text(
                timeago.format(story.createdAt),
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),

        // Options menu
        IconButton(
          icon: const Icon(Icons.more_vert, color: Colors.white),
          onPressed: _showOptions,
        ),

        // Close button
        IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    );
  }

  Widget _buildReplyInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
        ),
      ),
      child: const Row(
        children: [
          Expanded(
            child: Text(
              'Send message',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ),
          Icon(Icons.favorite_border, color: Colors.white, size: 24),
          SizedBox(width: 16),
          Icon(Icons.send, color: Colors.white, size: 24),
        ],
      ),
    );
  }
}
