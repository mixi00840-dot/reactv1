import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';

/// TikTok-style live stream browsing with vertical scroll
class LiveBrowseOverlay extends StatefulWidget {
  const LiveBrowseOverlay({super.key});

  @override
  State<LiveBrowseOverlay> createState() => _LiveBrowseOverlayState();
}

class _LiveBrowseOverlayState extends State<LiveBrowseOverlay> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  // Mock live streams data
  final List<LiveStreamModel> _liveStreams = [
    LiveStreamModel(
      id: '1',
      hostName: 'Sarah Johnson',
      hostAvatar: 'https://i.pravatar.cc/150?img=1',
      title: 'Late Night Vibes 🎵',
      thumbnailUrl: 'https://picsum.photos/seed/live1/400/800',
      viewerCount: 12543,
      isFollowing: false,
    ),
    LiveStreamModel(
      id: '2',
      hostName: 'Mike Chen',
      hostAvatar: 'https://i.pravatar.cc/150?img=2',
      title: 'Cooking Asian Fusion 🍜',
      thumbnailUrl: 'https://picsum.photos/seed/live2/400/800',
      viewerCount: 8234,
      isFollowing: true,
    ),
    LiveStreamModel(
      id: '3',
      hostName: 'Emma Davis',
      hostAvatar: 'https://i.pravatar.cc/150?img=3',
      title: 'Q&A Session - Ask Me Anything!',
      thumbnailUrl: 'https://picsum.photos/seed/live3/400/800',
      viewerCount: 15678,
      isFollowing: false,
    ),
    LiveStreamModel(
      id: '4',
      hostName: 'Alex Rivera',
      hostAvatar: 'https://i.pravatar.cc/150?img=4',
      title: 'Gaming Marathon 🎮',
      thumbnailUrl: 'https://picsum.photos/seed/live4/400/800',
      viewerCount: 23456,
      isFollowing: true,
    ),
    LiveStreamModel(
      id: '5',
      hostName: 'Lisa Park',
      hostAvatar: 'https://i.pravatar.cc/150?img=5',
      title: 'Makeup Tutorial ✨',
      thumbnailUrl: 'https://picsum.photos/seed/live5/400/800',
      viewerCount: 9876,
      isFollowing: false,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _formatViewerCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _liveStreams.length,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        itemBuilder: (context, index) {
          return _buildLiveStreamPage(_liveStreams[index]);
        },
      ),
    );
  }

  Widget _buildLiveStreamPage(LiveStreamModel stream) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Background: Live stream video (placeholder with thumbnail)
        Image.network(
          stream.thumbnailUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              color: Colors.grey[900],
              child: const Center(
                child: Icon(Iconsax.video, size: 80, color: Colors.white38),
              ),
            );
          },
        ),

        // Top gradient overlay
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 180,
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

        // Top bar: Close, Host info, Viewer count
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Close button
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Host info with LIVE badge
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Avatar
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              image: DecorationImage(
                                image: NetworkImage(stream.hostAvatar),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Host name
                          Flexible(
                            child: Text(
                              stream.hostName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),

                          // LIVE badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Text(
                                  'LIVE',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Viewer count
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Iconsax.eye, color: Colors.white, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          _formatViewerCount(stream.viewerCount),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Right side action buttons
        Positioned(
          right: 12,
          bottom: 140,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildActionButton(
                icon: stream.isFollowing ? Iconsax.heart5 : Iconsax.heart,
                label: 'Follow',
                color: stream.isFollowing ? Colors.red : Colors.white,
                onTap: () {
                  setState(() {
                    stream.isFollowing = !stream.isFollowing;
                  });
                },
              ),
              const SizedBox(height: 20),
              _buildActionButton(
                icon: Iconsax.message,
                label: '2.5K',
                color: Colors.white,
                onTap: () {},
              ),
              const SizedBox(height: 20),
              _buildActionButton(
                icon: Iconsax.send_2,
                label: 'Share',
                color: Colors.white,
                onTap: () {},
              ),
              const SizedBox(height: 20),
              _buildActionButton(
                icon: Iconsax.gift,
                label: 'Gift',
                color: Colors.white,
                onTap: () {},
              ),
            ],
          ),
        ),

        // Bottom: Title and interaction area
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.7),
                  Colors.transparent,
                ],
              ),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Stream title
                  Text(
                    stream.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      shadows: [
                        Shadow(
                          color: Colors.black,
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Comment input
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: const Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Say something...',
                            style: TextStyle(
                              color: Colors.white60,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Icon(
                          Iconsax.emoji_happy,
                          color: Colors.white60,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Swipe indicator (optional)
        if (_currentIndex < _liveStreams.length - 1)
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.arrow_upward, color: Colors.white60, size: 16),
                    SizedBox(width: 4),
                    Text(
                      'Swipe for next',
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
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
        children: [
          Icon(
            icon,
            color: color,
            size: 34,
            shadows: const [
              Shadow(color: Colors.black, blurRadius: 12, offset: Offset(0, 2)),
              Shadow(
                  color: Colors.black54, blurRadius: 20, offset: Offset(0, 3)),
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
                  Shadow(
                      color: Colors.black, blurRadius: 8, offset: Offset(0, 1)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Live stream data model
class LiveStreamModel {
  final String id;
  final String hostName;
  final String hostAvatar;
  final String title;
  final String thumbnailUrl;
  final int viewerCount;
  bool isFollowing;

  LiveStreamModel({
    required this.id,
    required this.hostName,
    required this.hostAvatar,
    required this.title,
    required this.thumbnailUrl,
    required this.viewerCount,
    required this.isFollowing,
  });
}
