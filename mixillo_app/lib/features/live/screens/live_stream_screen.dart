import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';

/// TikTok-style Live Streaming Screen
class LiveStreamScreen extends StatefulWidget {
  final String streamId;
  final bool isHost;
  
  const LiveStreamScreen({
    Key? key,
    required this.streamId,
    this.isHost = false,
  }) : super(key: key);

  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> with TickerProviderStateMixin {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _commentsScrollController = ScrollController();
  late AnimationController _heartAnimationController;
  int _viewerCount = 1234;
  int _likeCount = 5678;
  bool _isFollowing = false;
  
  // Mock stream data
  final Map<String, dynamic> _streamData = {
    'id': 'stream_1',
    'hostId': 'user_1',
    'hostUsername': 'sarah_designs',
    'hostDisplayName': 'Sarah Mitchell',
    'hostAvatar': null,
    'title': '🎨 Live Painting Session! Join me!',
    'isVerified': true,
    'isPremium': false,
    'duration': 0,
    'gifts': 0,
  };
  
  // Mock comments
  final List<Map<String, dynamic>> _comments = [];
  
  Timer? _durationTimer;
  
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    
    _heartAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    
    // Start duration timer
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _streamData['duration']++;
        });
      }
    });
    
    // Add mock comments periodically
    Timer.periodic(const Duration(seconds: 5), (timer) {
      if (mounted && _comments.length < 100) {
        _addMockComment();
      }
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    _commentsScrollController.dispose();
    _heartAnimationController.dispose();
    _durationTimer?.cancel();
    SystemChrome.setEnabledSystemUIMode(
      SystemUiMode.manual,
      overlays: SystemUiOverlay.values,
    );
    super.dispose();
  }

  void _addMockComment() {
    final mockUsers = ['@alex_art', '@mike_tech', '@lisa_music', '@john_fitness', '@emma_travel'];
    final mockComments = [
      'Amazing stream! 🔥',
      'Love this! 💖',
      'Keep it up! 👏',
      'So talented! ✨',
      'Can you show that again?',
    ];
    
    setState(() {
      _comments.add({
        'username': mockUsers[_comments.length % mockUsers.length],
        'text': mockComments[_comments.length % mockComments.length],
        'timestamp': DateTime.now(),
      });
    });
    
    // Auto-scroll to bottom
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_commentsScrollController.hasClients) {
        _commentsScrollController.animateTo(
          _commentsScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendComment() {
    if (_commentController.text.trim().isEmpty) return;
    
    setState(() {
      _comments.add({
        'username': '@you',
        'text': _commentController.text,
        'timestamp': DateTime.now(),
        'isOwn': true,
      });
    });
    
    _commentController.clear();
    
    // Auto-scroll to bottom
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_commentsScrollController.hasClients) {
        _commentsScrollController.animateTo(
          _commentsScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendHeart() {
    setState(() {
      _likeCount++;
    });
    _heartAnimationController.forward(from: 0);
  }

  void _toggleFollow() {
    setState(() {
      _isFollowing = !_isFollowing;
    });
  }

  void _showGifts() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildGiftsSheet(),
    );
  }

  void _showViewers() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildViewersSheet(),
    );
  }

  void _endStream() {
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Video Stream Placeholder
          _buildVideoPlaceholder(),
          
          // Gradient overlays
          _buildGradientOverlays(),
          
          // Top Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopBar(),
          ),
          
          // Comments Stream
          Positioned(
            left: DesignTokens.space3,
            right: 100,
            bottom: 100,
            height: 300,
            child: _buildCommentsStream(),
          ),
          
          // Right Action Buttons
          Positioned(
            right: DesignTokens.space3,
            bottom: 100,
            child: _buildRightActions(),
          ),
          
          // Bottom Input
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildBottomInput(),
          ),
          
          // Floating Hearts Animation
          if (_heartAnimationController.isAnimating)
            _buildFloatingHeart(),
        ],
      ),
    );
  }

  Widget _buildVideoPlaceholder() {
    return Container(
      color: Colors.grey[900],
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.videocam,
              size: 64,
              color: Colors.white.withOpacity(0.3),
            ),
            const SizedBox(height: DesignTokens.space3),
            Text(
              'Live Stream Active',
              style: AppTypography.h2(context).copyWith(
                color: Colors.white.withOpacity(0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradientOverlays() {
    return Column(
      children: [
        // Top gradient
        Container(
          height: 200,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.6),
                Colors.transparent,
              ],
            ),
          ),
        ),
        const Spacer(),
        // Bottom gradient
        Container(
          height: 200,
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
      ],
    );
  }

  Widget _buildTopBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(DesignTokens.space3),
        child: Row(
          children: [
            // Host Info
            GestureDetector(
              onTap: () {
                // View host profile
              },
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  UserAvatar(
                    imageUrl: _streamData['hostAvatar'],
                    size: 40,
                    isVerified: _streamData['isVerified'],
                    isLive: true,
                    placeholderText: _streamData['hostDisplayName'],
                  ),
                  const SizedBox(width: DesignTokens.space2),
                  Text(
                    _streamData['hostUsername'],
                    style: AppTypography.username(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                      fontWeight: DesignTokens.fontWeightBold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            
            // Follow Button
            if (!widget.isHost)
              PrimaryButton(
                text: _isFollowing ? 'Following' : 'Follow',
                height: 32,
                width: 90,
                onPressed: _toggleFollow,
                backgroundColor: _isFollowing ? Colors.grey[800] : null,
              ),
            
            const Spacer(),
            
            // Viewer Count
            GestureDetector(
              onTap: _showViewers,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space3,
                  vertical: DesignTokens.space1,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.remove_red_eye,
                      color: DesignTokens.darkTextPrimary,
                      size: 16,
                    ),
                    const SizedBox(width: DesignTokens.space1),
                    Text(
                      _formatCount(_viewerCount),
                      style: AppTypography.labelMedium(context).copyWith(
                        color: DesignTokens.darkTextPrimary,
                        fontWeight: DesignTokens.fontWeightBold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            
            // Close/End Button
            IconButton(
              icon: const Icon(Icons.close, color: DesignTokens.darkTextPrimary),
              onPressed: _endStream,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentsStream() {
    return ListView.builder(
      controller: _commentsScrollController,
      itemCount: _comments.length,
      itemBuilder: (context, index) {
        final comment = _comments[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: DesignTokens.space2),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: DesignTokens.space2,
              vertical: DesignTokens.space1,
            ),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
            ),
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '${comment['username']} ',
                    style: AppTypography.labelMedium(context).copyWith(
                      color: comment['isOwn'] == true
                          ? DesignTokens.brandPrimary
                          : DesignTokens.darkTextPrimary,
                      fontWeight: DesignTokens.fontWeightSemiBold,
                    ),
                  ),
                  TextSpan(
                    text: comment['text'],
                    style: AppTypography.bodyMedium(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRightActions() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Heart/Like
        _buildActionButton(
          Icons.favorite,
          _formatCount(_likeCount),
          DesignTokens.likeRed,
          _sendHeart,
        ),
        const SizedBox(height: DesignTokens.space4),
        
        // Gifts
        _buildActionButton(
          Icons.card_giftcard,
          _formatCount(_streamData['gifts']),
          DesignTokens.liveGift,
          _showGifts,
        ),
        const SizedBox(height: DesignTokens.space4),
        
        // Share
        _buildActionButton(
          Icons.share_outlined,
          'Share',
          DesignTokens.darkTextPrimary,
          () {},
        ),
        const SizedBox(height: DesignTokens.space4),
        
        // More Options
        _buildActionButton(
          Icons.more_horiz,
          '',
          DesignTokens.darkTextPrimary,
          () {},
        ),
      ],
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          if (label.isNotEmpty) ...[
            const SizedBox(height: DesignTokens.space1),
            Text(
              label,
              style: AppTypography.labelSmall(context).copyWith(
                color: DesignTokens.darkTextPrimary,
                fontWeight: DesignTokens.fontWeightSemiBold,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBottomInput() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(DesignTokens.space3),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.5),
            ],
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space3),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                ),
                child: TextField(
                  controller: _commentController,
                  style: AppTypography.bodyMedium(context).copyWith(
                    color: DesignTokens.darkTextPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Say something...',
                    hintStyle: AppTypography.bodyMedium(context).copyWith(
                      color: DesignTokens.darkTextSecondary,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onSubmitted: (_) => _sendComment(),
                ),
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            GestureDetector(
              onTap: _sendComment,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: DesignTokens.brandGradient),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.send,
                  color: DesignTokens.darkTextPrimary,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingHeart() {
    return AnimatedBuilder(
      animation: _heartAnimationController,
      builder: (context, child) {
        return Positioned(
          right: 60,
          bottom: 150 + (100 * _heartAnimationController.value),
          child: Opacity(
            opacity: 1 - _heartAnimationController.value,
            child: Transform.scale(
              scale: 1 + (_heartAnimationController.value * 0.5),
              child: Icon(
                Icons.favorite,
                color: DesignTokens.likeRed,
                size: 40,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildGiftsSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
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
              'Send a Gift',
              style: AppTypography.h3(context).copyWith(color: DesignTokens.darkTextPrimary),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(DesignTokens.space4),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: DesignTokens.space3,
                crossAxisSpacing: DesignTokens.space3,
              ),
              itemCount: 12,
              itemBuilder: (context, index) {
                return _buildGiftItem(index);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGiftItem(int index) {
    final gifts = ['🎁', '💎', '🌹', '👑', '🚀', '🎸', '🎨', '⭐', '🔥', '💖', '🎪', '🏆'];
    final prices = [10, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000];
    
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        // Send gift
      },
      child: Container(
        decoration: BoxDecoration(
          color: DesignTokens.darkBackground,
          borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
          border: Border.all(color: DesignTokens.darkBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              gifts[index],
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(height: DesignTokens.space1),
            Text(
              '💎 ${_formatCount(prices[index])}',
              style: AppTypography.labelSmall(context).copyWith(
                color: DesignTokens.darkTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildViewersSheet() {
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
              '$_viewerCount Viewers',
              style: AppTypography.h3(context).copyWith(color: DesignTokens.darkTextPrimary),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: 20,
              itemBuilder: (context, index) {
                return ListTile(
                  leading: UserAvatar(
                    size: 40,
                    placeholderText: 'User $index',
                  ),
                  title: Text(
                    '@user_$index',
                    style: AppTypography.titleMedium(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                    ),
                  ),
                  subtitle: Text(
                    'Watching now',
                    style: AppTypography.bodySmall(context).copyWith(
                      color: DesignTokens.darkTextSecondary,
                    ),
                  ),
                );
              },
            ),
          ),
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
