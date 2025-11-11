import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

/// Activity tab showing circular LIVE avatars + notifications
class ActivityTabWidget extends StatefulWidget {
  const ActivityTabWidget({super.key});

  @override
  State<ActivityTabWidget> createState() => _ActivityTabWidgetState();
}

class _ActivityTabWidgetState extends State<ActivityTabWidget>
    with SingleTickerProviderStateMixin {
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
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Circular LIVE avatars section
          if (_mockLiveUsers.isNotEmpty)
            SliverToBoxAdapter(
              child: _buildLiveAvatarsSection(),
            ),

          // Notifications list
          SliverPadding(
            padding: const EdgeInsets.all(16),
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
      ),
    );
  }

  /// Horizontal scrollable circular LIVE avatars
  Widget _buildLiveAvatarsSection() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withOpacity(0.1),
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Live Now',
              style: AppTheme.bodyStyle.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _mockLiveUsers.length,
              itemBuilder: (context, index) {
                return _buildLiveAvatar(_mockLiveUsers[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Single circular LIVE avatar with pulsing badge
  Widget _buildLiveAvatar(Map<String, dynamic> user) {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Opening ${user['username']}\'s live stream...'),
            duration: const Duration(seconds: 1),
            backgroundColor: AppColors.primary,
          ),
        );
      },
      child: Container(
        width: 76,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
                        child: const Icon(
                          Iconsax.user,
                          color: Colors.white54,
                          size: 32,
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.darkGrey,
                        child: const Icon(
                          Iconsax.user,
                          color: Colors.white54,
                          size: 32,
                        ),
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.liveRed,
                          borderRadius: BorderRadius.circular(3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.liveRed.withOpacity(
                                _pulseController.value * 0.5 + 0.3,
                              ),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.circle,
                              size: 4,
                              color: Colors.white,
                            ),
                            SizedBox(width: 2),
                            Text(
                              'LIVE',
                              style: TextStyle(
                                fontSize: 7,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                height: 1,
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
              textAlign: TextAlign.center,
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

  /// Notification item
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
          // Avatar with colored border based on type
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
                  child: const Icon(
                    Iconsax.user,
                    color: Colors.white54,
                    size: 20,
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.darkGrey,
                  child: const Icon(
                    Iconsax.user,
                    color: Colors.white54,
                    size: 20,
                  ),
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
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white,
                      height: 1.3,
                    ),
                    children: [
                      TextSpan(
                        text: notification['username'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextSpan(
                        text: ' ${notification['action']}',
                        style: const TextStyle(
                          color: Colors.white70,
                        ),
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
                  child: const Icon(
                    Icons.error_outline,
                    color: Colors.white54,
                    size: 20,
                  ),
                ),
              ),
            ),
          ] else if (notification['type'] == 'follow') ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {},
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Follow',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
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
      case 'reply':
        return AppColors.primary;
      case 'follow':
        return AppColors.softSkyBlue;
      case 'mention':
        return AppColors.warningYellow;
      case 'system':
      case 'views':
        return AppColors.successGreen;
      case 'message':
        return AppColors.electricBlue;
      default:
        return Colors.white.withOpacity(0.3);
    }
  }
}

// Mock data for LIVE users
final List<Map<String, dynamic>> _mockLiveUsers = [
  {
    'username': 'sarah_j',
    'avatar': 'https://i.pravatar.cc/150?img=1',
  },
  {
    'username': 'mike_c',
    'avatar': 'https://i.pravatar.cc/150?img=12',
  },
  {
    'username': 'emma_w',
    'avatar': 'https://i.pravatar.cc/150?img=5',
  },
  {
    'username': 'alex_k',
    'avatar': 'https://i.pravatar.cc/150?img=13',
  },
  {
    'username': 'lisa_t',
    'avatar': 'https://i.pravatar.cc/150?img=9',
  },
  {
    'username': 'john_d',
    'avatar': 'https://i.pravatar.cc/150?img=3',
  },
];

// Mock data for notifications
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
    'type': 'reply',
    'username': 'music_lover',
    'avatar': 'https://i.pravatar.cc/150?img=15',
    'action': 'replied to your comment',
    'time': '2h ago',
    'thumbnail': 'https://picsum.photos/200/300?random=3',
  },
  {
    'type': 'mention',
    'username': 'tech_guru',
    'avatar': 'https://i.pravatar.cc/150?img=7',
    'action': 'mentioned you in a comment',
    'time': '3h ago',
    'thumbnail': null,
  },
  {
    'type': 'system',
    'username': 'Mixillo',
    'avatar': 'https://i.pravatar.cc/150?img=0',
    'action': 'Your video reached 10K views!',
    'time': '5h ago',
    'thumbnail': 'https://picsum.photos/200/300?random=4',
  },
  {
    'type': 'views',
    'username': 'dance_queen',
    'avatar': 'https://i.pravatar.cc/150?img=10',
    'action': 'viewed your profile',
    'time': '1d ago',
    'thumbnail': null,
  },
  {
    'type': 'message',
    'username': 'fitness_coach',
    'avatar': 'https://i.pravatar.cc/150?img=11',
    'action': 'sent you a message',
    'time': '2d ago',
    'thumbnail': null,
  },
];
