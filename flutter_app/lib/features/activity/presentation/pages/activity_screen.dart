import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import 'dart:ui';

/// TikTok-style Activity/Inbox screen with circular LIVE avatars and notifications
class ActivityScreen extends StatefulWidget {
  const ActivityScreen({super.key});

  @override
  State<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Activity',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Iconsax.setting_2, color: Colors.white),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ),
                ),

                // Circular LIVE avatars row (story-style)
                SliverToBoxAdapter(
                  child: _buildLiveAvatarsRow(),
                ),

                // Notifications list
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final notification = _mockNotifications[index];
                        return _buildNotificationItem(notification);
                      },
                      childCount: _mockNotifications.length,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  /// Horizontal scrollable row of circular LIVE avatars
  Widget _buildLiveAvatarsRow() {
    if (_mockLiveUsers.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 100,
      margin: const EdgeInsets.only(bottom: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _mockLiveUsers.length,
        itemBuilder: (context, index) {
          final user = _mockLiveUsers[index];
          return _buildLiveAvatar(user);
        },
      ),
    );
  }

  /// Single circular LIVE avatar with pulsing red badge
  Widget _buildLiveAvatar(Map<String, dynamic> user) {
    return GestureDetector(
      onTap: () {
        // Navigate to live stream
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Opening ${user['username']}\'s live stream...'),
            duration: const Duration(seconds: 1),
          ),
        );
      },
      child: Container(
        width: 76,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                // Avatar with blue outline
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.primary,
                      width: 3,
                    ),
                  ),
                  child: ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: user['avatar'],
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.darkGrey,
                        child: const Icon(Iconsax.user, color: Colors.white54),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.darkGrey,
                        child: const Icon(Iconsax.user, color: Colors.white54),
                      ),
                    ),
                  ),
                ),

                // Pulsing LIVE badge (top-left inside circle)
                Positioned(
                  top: 4,
                  left: 4,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.liveRed,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.liveRed.withOpacity(_pulseController.value * 0.5 + 0.3),
                              blurRadius: 8,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.circle,
                              size: 6,
                              color: Colors.white,
                            ),
                            SizedBox(width: 2),
                            Text(
                              'LIVE',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              user['username'],
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Notification list item
  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.darkGrey.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: _getNotificationBorderColor(notification['type']),
                width: 2,
              ),
            ),
            child: ClipOval(
              child: CachedNetworkImage(
                imageUrl: notification['avatar'],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.darkGrey,
                  child: const Icon(Iconsax.user, color: Colors.white54, size: 20),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.darkGrey,
                  child: const Icon(Iconsax.user, color: Colors.white54, size: 20),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 14, color: Colors.white),
                    children: [
                      TextSpan(
                        text: notification['username'],
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      TextSpan(
                        text: ' ${notification['action']}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  notification['time'],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),

          // Thumbnail or action button
          if (notification['thumbnail'] != null) ...[
            const SizedBox(width: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: notification['thumbnail'],
                width: 48,
                height: 64,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  width: 48,
                  height: 64,
                  color: AppColors.darkGrey,
                ),
                errorWidget: (context, url, error) => Container(
                  width: 48,
                  height: 64,
                  color: AppColors.darkGrey,
                ),
              ),
            ),
          ] else if (notification['type'] == 'follow') ...[
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Follow',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getNotificationBorderColor(String type) {
    switch (type) {
      case 'like':
        return AppColors.liveRed;
      case 'comment':
        return AppColors.primary;
      case 'follow':
        return AppColors.softSkyBlue;
      case 'mention':
        return AppColors.warningYellow;
      case 'system':
        return AppColors.successGreen;
      default:
        return Colors.white.withOpacity(0.3);
    }
  }
}

// Mock data
final List<Map<String, dynamic>> _mockLiveUsers = [
  {
    'username': 'sarah_jones',
    'avatar': 'https://i.pravatar.cc/150?img=1',
  },
  {
    'username': 'mike_chen',
    'avatar': 'https://i.pravatar.cc/150?img=12',
  },
  {
    'username': 'emma_wilson',
    'avatar': 'https://i.pravatar.cc/150?img=5',
  },
  {
    'username': 'alex_kim',
    'avatar': 'https://i.pravatar.cc/150?img=13',
  },
  {
    'username': 'lisa_taylor',
    'avatar': 'https://i.pravatar.cc/150?img=9',
  },
];

final List<Map<String, dynamic>> _mockNotifications = [
  {
    'type': 'like',
    'username': 'john_doe',
    'avatar': 'https://i.pravatar.cc/150?img=3',
    'action': 'liked your video',
    'time': '2m ago',
    'thumbnail': 'https://picsum.photos/200/300?random=1',
  },
  {
    'type': 'comment',
    'username': 'jane_smith',
    'avatar': 'https://i.pravatar.cc/150?img=4',
    'action': 'commented: "Amazing content! 🔥"',
    'time': '15m ago',
    'thumbnail': 'https://picsum.photos/200/300?random=2',
  },
  {
    'type': 'follow',
    'username': 'creator_pro',
    'avatar': 'https://i.pravatar.cc/150?img=8',
    'action': 'started following you',
    'time': '1h ago',
    'thumbnail': null,
  },
  {
    'type': 'mention',
    'username': 'music_lover',
    'avatar': 'https://i.pravatar.cc/150?img=15',
    'action': 'mentioned you in a comment',
    'time': '3h ago',
    'thumbnail': 'https://picsum.photos/200/300?random=3',
  },
  {
    'type': 'like',
    'username': 'tech_guru',
    'avatar': 'https://i.pravatar.cc/150?img=7',
    'action': 'liked your comment',
    'time': '5h ago',
    'thumbnail': null,
  },
  {
    'type': 'system',
    'username': 'Mixillo',
    'avatar': 'https://i.pravatar.cc/150?img=0',
    'action': 'Your video reached 10K views!',
    'time': '1d ago',
    'thumbnail': 'https://picsum.photos/200/300?random=4',
  },
  {
    'type': 'comment',
    'username': 'dance_queen',
    'avatar': 'https://i.pravatar.cc/150?img=10',
    'action': 'replied to your comment',
    'time': '2d ago',
    'thumbnail': 'https://picsum.photos/200/300?random=5',
  },
  {
    'type': 'follow',
    'username': 'fitness_coach',
    'avatar': 'https://i.pravatar.cc/150?img=11',
    'action': 'started following you',
    'time': '3d ago',
    'thumbnail': null,
  },
];
