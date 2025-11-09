import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';

/// TikTok-style vertical video feed screen
class FeedScreen extends StatefulWidget {
  const FeedScreen({Key? key}) : super(key: key);

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> with TickerProviderStateMixin {
  late PageController _pageController;
  int _currentPage = 0;
  late List<FeedVideoController> _videoControllers;

  // Mock data - will be replaced with MongoDB data
  final List<Map<String, dynamic>> _feedItems = [
    {
      'id': '1',
      'videoUrl': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'username': '@sarah_creative',
      'displayName': 'Sarah Johnson',
      'userAvatar': null,
      'caption': 'Creating amazing content every day! 🎨✨ #creative #art #design',
      'likes': 125000,
      'comments': 3420,
      'shares': 892,
      'bookmarks': 1203,
      'isVerified': true,
      'isLiked': false,
      'isBookmarked': false,
    },
    {
      'id': '2',
      'videoUrl': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'username': '@mike_fitness',
      'displayName': 'Mike Chen',
      'userAvatar': null,
      'caption': 'Daily workout routine 💪 Follow for more fitness tips!',
      'likes': 89200,
      'comments': 2100,
      'shares': 543,
      'bookmarks': 890,
      'isVerified': false,
      'isLiked': false,
      'isBookmarked': false,
    },
    {
      'id': '3',
      'videoUrl': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'username': '@lisa_travel',
      'displayName': 'Lisa Wong',
      'userAvatar': null,
      'caption': 'Exploring the world 🌍 #travel #adventure #wanderlust',
      'likes': 156300,
      'comments': 4890,
      'shares': 1230,
      'bookmarks': 2340,
      'isVerified': true,
      'isLiked': false,
      'isBookmarked': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    
    _pageController = PageController(initialPage: _currentPage);
    _initializeVideoControllers();
    
    // Play first video
    if (_videoControllers.isNotEmpty) {
      _videoControllers[0].play();
    }
  }

  void _initializeVideoControllers() {
    _videoControllers = _feedItems.map((item) {
      return FeedVideoController(
        videoUrl: item['videoUrl'],
        onInitialized: () {
          if (mounted) setState(() {});
        },
      );
    }).toList();
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (var controller in _videoControllers) {
      controller.dispose();
    }
    SystemChrome.setEnabledSystemUIMode(
      SystemUiMode.manual,
      overlays: SystemUiOverlay.values,
    );
    super.dispose();
  }

  void _onPageChanged(int page) {
    // Pause previous video
    if (_currentPage < _videoControllers.length) {
      _videoControllers[_currentPage].pause();
    }
    
    // Play new video
    if (page < _videoControllers.length) {
      _videoControllers[page].play();
    }
    
    setState(() {
      _currentPage = page;
    });
  }

  Future<void> _handleLike(int index) async {
    setState(() {
      _feedItems[index]['isLiked'] = !_feedItems[index]['isLiked'];
      if (_feedItems[index]['isLiked']) {
        _feedItems[index]['likes']++;
      } else {
        _feedItems[index]['likes']--;
      }
    });
    
    // TODO: API call to MongoDB backend
    // await FeedService.toggleLike(videoId);
  }

  Future<void> _handleBookmark(int index) async {
    setState(() {
      _feedItems[index]['isBookmarked'] = !_feedItems[index]['isBookmarked'];
      if (_feedItems[index]['isBookmarked']) {
        _feedItems[index]['bookmarks']++;
      } else {
        _feedItems[index]['bookmarks']--;
      }
    });
    
    // TODO: API call to MongoDB backend
    // await FeedService.toggleBookmark(videoId);
  }

  void _handleComment(int index) {
    // TODO: Open comment bottom sheet
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => const CommentsSheet(),
    );
  }

  void _handleShare(int index) {
    // TODO: Implement share functionality
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(DesignTokens.appBarHeight),
        child: _buildTopBar(),
      ),
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            onPageChanged: _onPageChanged,
            itemCount: _feedItems.length,
            itemBuilder: (context, index) {
              return _buildVideoItem(index);
            },
          ),
          
          // Bottom Navigation Overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildBottomNav(isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(bool isDark) {
    return Container(
      height: DesignTokens.bottomNavHeight,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            (isDark ? Colors.black : Colors.white).withOpacity(0.0),
          ],
        ),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavIcon(Icons.home, 'Home', true),
            _buildNavIcon(Icons.search_outlined, 'Search', false),
            _buildUploadIcon(),
            _buildNavIcon(Icons.shopping_bag_outlined, 'Shop', false),
            _buildNavIcon(Icons.person_outline, 'Profile', false),
          ],
        ),
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, String label, bool isActive) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          color: isActive ? DesignTokens.darkTextPrimary : DesignTokens.darkTextPrimary.withOpacity(0.6),
          size: DesignTokens.iconLg,
        ),
        const SizedBox(height: 2),
        if (isActive)
          Container(
            width: 4,
            height: 4,
            decoration: const BoxDecoration(
              color: DesignTokens.brandPrimary,
              shape: BoxShape.circle,
            ),
          ),
      ],
    );
  }

  Widget _buildUploadIcon() {
    return Container(
      width: 44,
      height: 32,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: DesignTokens.brandGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(DesignTokens.radiusLg),
      ),
      child: const Icon(
        Icons.add,
        color: DesignTokens.darkTextPrimary,
        size: 24,
      ),
    );
  }

  Widget _buildTopBar() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            (isDark ? Colors.black : Colors.white).withOpacity(0.6),
            (isDark ? Colors.black : Colors.white).withOpacity(0.0),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Following',
                style: AppTypography.titleMedium(context).copyWith(
                  color: DesignTokens.darkTextPrimary.withOpacity(0.7),
                ),
              ),
              Container(
                height: 2,
                width: 32,
                decoration: BoxDecoration(
                  color: DesignTokens.brandPrimary,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                ),
              ),
              Text(
                'For You',
                style: AppTypography.titleLarge(context).copyWith(
                  color: DesignTokens.darkTextPrimary,
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
              const SizedBox(width: DesignTokens.space8),
              Icon(
                Icons.search,
                color: DesignTokens.darkTextPrimary,
                size: DesignTokens.iconLg,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVideoItem(int index) {
    final item = _feedItems[index];
    final controller = _videoControllers[index];

    return Stack(
      fit: StackFit.expand,
      children: [
        // Video Player
        GestureDetector(
          onTap: () {
            if (controller.isPlaying) {
              controller.pause();
            } else {
              controller.play();
            }
          },
          child: controller.isInitialized
              ? FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: controller.value.size.width,
                    height: controller.value.size.height,
                    child: VideoPlayer(controller.controller),
                  ),
                )
              : Container(
                  color: Colors.black,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: DesignTokens.brandPrimary,
                    ),
                  ),
                ),
        ),

        // Gradient overlays for better text visibility
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withOpacity(0.8),
                ],
              ),
            ),
          ),
        ),

        // Right side action buttons
        Positioned(
          right: DesignTokens.space3,
          bottom: DesignTokens.space16,
          child: _buildActionButtons(index),
        ),

        // Bottom user info and caption
        Positioned(
          left: DesignTokens.space4,
          right: 80,
          bottom: DesignTokens.space16,
          child: _buildUserInfo(item),
        ),
      ],
    );
  }

  Widget _buildActionButtons(int index) {
    final item = _feedItems[index];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // User Avatar
        UserAvatar(
          imageUrl: item['userAvatar'],
          size: DesignTokens.avatarMd,
          isVerified: item['isVerified'],
          placeholderText: item['displayName'],
          showBorder: true,
        ),
        const SizedBox(height: DesignTokens.space6),

        // Like Button
        _buildEngagementButton(
          icon: item['isLiked'] ? Icons.favorite : Icons.favorite_border,
          label: _formatCount(item['likes']),
          color: item['isLiked'] ? DesignTokens.likeRed : DesignTokens.darkTextPrimary,
          onTap: () => _handleLike(index),
        ),
        const SizedBox(height: DesignTokens.space4),

        // Comment Button
        _buildEngagementButton(
          icon: Icons.chat_bubble_outline,
          label: _formatCount(item['comments']),
          color: DesignTokens.darkTextPrimary,
          onTap: () => _handleComment(index),
        ),
        const SizedBox(height: DesignTokens.space4),

        // Bookmark Button
        _buildEngagementButton(
          icon: item['isBookmarked'] ? Icons.bookmark : Icons.bookmark_border,
          label: _formatCount(item['bookmarks']),
          color: item['isBookmarked'] ? DesignTokens.bookmarkYellow : DesignTokens.darkTextPrimary,
          onTap: () => _handleBookmark(index),
        ),
        const SizedBox(height: DesignTokens.space4),

        // Share Button
        _buildEngagementButton(
          icon: Icons.share_outlined,
          label: _formatCount(item['shares']),
          color: DesignTokens.darkTextPrimary,
          onTap: () => _handleShare(index),
        ),
      ],
    );
  }

  Widget _buildEngagementButton({
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
          Icon(icon, color: color, size: 32),
          const SizedBox(height: DesignTokens.space1),
          Text(
            label,
            style: AppTypography.labelSmall(context).copyWith(
              color: DesignTokens.darkTextPrimary,
              fontWeight: DesignTokens.fontWeightSemiBold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserInfo(Map<String, dynamic> item) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Text(
              item['username'],
              style: AppTypography.username(context).copyWith(
                color: DesignTokens.darkTextPrimary,
                shadows: [
                  Shadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
            const SizedBox(width: DesignTokens.space3),
            PrimaryButton(
              text: 'Follow',
              height: 32,
              onPressed: () {
                // TODO: Implement follow
              },
            ),
          ],
        ),
        const SizedBox(height: DesignTokens.space2),
        Text(
          item['caption'],
          style: AppTypography.caption(context).copyWith(
            color: DesignTokens.darkTextPrimary,
            shadows: [
              Shadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 8,
              ),
            ],
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
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

/// Video Controller Wrapper
class FeedVideoController {
  final String videoUrl;
  final VoidCallback? onInitialized;
  late VideoPlayerController controller;
  bool _isInitialized = false;

  FeedVideoController({
    required this.videoUrl,
    this.onInitialized,
  }) {
    controller = VideoPlayerController.network(videoUrl);
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await controller.initialize();
      controller.setLooping(true);
      _isInitialized = true;
      onInitialized?.call();
    } catch (e) {
      print('Video initialization error: $e');
    }
  }

  bool get isInitialized => _isInitialized;
  bool get isPlaying => controller.value.isPlaying;
  VideoPlayerValue get value => controller.value;

  Future<void> play() async {
    if (_isInitialized && !controller.value.isPlaying) {
      await controller.play();
    }
  }

  Future<void> pause() async {
    if (_isInitialized && controller.value.isPlaying) {
      await controller.pause();
    }
  }

  void dispose() {
    controller.dispose();
  }
}

/// Comments Bottom Sheet (placeholder)
class CommentsSheet extends StatelessWidget {
  const CommentsSheet({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(DesignTokens.radiusModal),
        ),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: DesignTokens.space3),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
              borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(DesignTokens.space4),
            child: Text(
              'Comments',
              style: AppTypography.h3(context),
            ),
          ),
          Expanded(
            child: Center(
              child: Text(
                'Comments feature coming soon!',
                style: AppTypography.bodyMedium(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
