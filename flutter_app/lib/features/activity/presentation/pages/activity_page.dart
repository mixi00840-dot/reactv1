import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';

class ActivityPage extends StatefulWidget {
  const ActivityPage({super.key});

  @override
  State<ActivityPage> createState() => _ActivityPageState();
}

class _ActivityPageState extends State<ActivityPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Activity',
                          style: AppTheme.headingStyle.copyWith(fontSize: 24),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Iconsax.setting_2, color: Colors.white),
                      ),
                    ],
                  ),
                ),
                // Tabs
                Container(
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.white.withValues(alpha: 0.1),
                        width: 1,
                      ),
                    ),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: AppColors.lightBlue,
                    indicatorWeight: 3,
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
                      Tab(text: 'All'),
                      Tab(text: 'Live'),
                      Tab(text: 'Messages'),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildAllActivities(),
                      _buildLiveActivities(),
                      _buildMessages(),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildAllActivities() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=1',
          username: 'Sarah Johnson',
          action: 'liked your video',
          time: '2m ago',
          thumbnail: 'https://picsum.photos/100/150?random=1',
          type: ActivityType.like,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=2',
          username: 'Mike Chen',
          action: 'started following you',
          time: '5m ago',
          type: ActivityType.follow,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=3',
          username: 'Emma Davis',
          action: 'commented: "Amazing content! 🔥"',
          time: '12m ago',
          thumbnail: 'https://picsum.photos/100/150?random=2',
          type: ActivityType.comment,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=4',
          username: 'Alex Rodriguez',
          action: 'mentioned you in a comment',
          time: '1h ago',
          thumbnail: 'https://picsum.photos/100/150?random=3',
          type: ActivityType.mention,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=5',
          username: 'Jessica Lee',
          action: 'shared your video',
          time: '2h ago',
          thumbnail: 'https://picsum.photos/100/150?random=4',
          type: ActivityType.share,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=6',
          username: 'Tom Wilson',
          action: 'liked your comment',
          time: '3h ago',
          type: ActivityType.like,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=7',
          username: 'Olivia Brown',
          action: 'started following you',
          time: '5h ago',
          type: ActivityType.follow,
        ),
      ],
    );
  }

  Widget _buildLiveActivities() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'People you follow who are LIVE',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 200,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildLiveCard(
                'https://i.pravatar.cc/150?img=8',
                'Luna Martinez',
                'Singing Karaoke 🎤',
                '2.8K',
              ),
              _buildLiveCard(
                'https://i.pravatar.cc/150?img=9',
                'DJ Mike',
                'EDM Party 🎧',
                '6.5K',
              ),
              _buildLiveCard(
                'https://i.pravatar.cc/150?img=10',
                'Chef Maria',
                'Cooking Show 🍝',
                '923',
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Recent',
          style: AppTheme.bodyStyle.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=11',
          username: 'StarGazer',
          action: 'sent you a gift in live 💎',
          time: '1h ago',
          type: ActivityType.gift,
        ),
        _buildActivityItem(
          avatar: 'https://i.pravatar.cc/150?img=12',
          username: 'CoolCat',
          action: 'joined your live stream',
          time: '3h ago',
          type: ActivityType.live,
        ),
      ],
    );
  }

  Widget _buildMessages() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        _buildMessageItem(
          avatar: 'https://i.pravatar.cc/150?img=13',
          username: 'Sarah Johnson',
          message: 'Hey! Love your recent video 😊',
          time: '5m ago',
          unread: true,
        ),
        _buildMessageItem(
          avatar: 'https://i.pravatar.cc/150?img=14',
          username: 'Mike Chen',
          message: 'Thanks for following back!',
          time: '1h ago',
          unread: true,
        ),
        _buildMessageItem(
          avatar: 'https://i.pravatar.cc/150?img=15',
          username: 'Emma Davis',
          message: 'Can we collab on a video?',
          time: '2h ago',
          unread: false,
        ),
        _buildMessageItem(
          avatar: 'https://i.pravatar.cc/150?img=16',
          username: 'Alex Rodriguez',
          message: 'Check out my latest post!',
          time: '1d ago',
          unread: false,
        ),
      ],
    );
  }

  Widget _buildActivityItem({
    required String avatar,
    required String username,
    required String action,
    required String time,
    String? thumbnail,
    required ActivityType type,
  }) {
    IconData icon;
    Color iconColor;

    switch (type) {
      case ActivityType.like:
        icon = Iconsax.heart5;
        iconColor = AppColors.like;
        break;
      case ActivityType.comment:
        icon = Iconsax.message;
        iconColor = AppColors.comment;
        break;
      case ActivityType.follow:
        icon = Iconsax.user_add;
        iconColor = AppColors.lightBlue;
        break;
      case ActivityType.mention:
        icon = Iconsax.message_text;
        iconColor = AppColors.lightBlue;
        break;
      case ActivityType.share:
        icon = Iconsax.send_2;
        iconColor = AppColors.share;
        break;
      case ActivityType.gift:
        icon = Iconsax.gift;
        iconColor = AppColors.lightBlue;
        break;
      case ActivityType.live:
        icon = Iconsax.video;
        iconColor = AppColors.live;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundImage: CachedNetworkImageProvider(avatar),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    size: 12,
                    color: iconColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: username,
                        style: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextSpan(
                        text: ' $action',
                        style: AppTheme.bodyStyle.copyWith(
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 12,
                    color: Colors.white38,
                  ),
                ),
              ],
            ),
          ),
          if (thumbnail != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: thumbnail,
                width: 48,
                height: 64,
                fit: BoxFit.cover,
              ),
            )
          else if (type == ActivityType.follow)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.lightBlue,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'Follow',
                style: AppTheme.bodyStyle.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLiveCard(
    String avatar,
    String name,
    String title,
    String viewers,
  ) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                height: 140,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    colors: [
                      AppColors.lightBlue.withValues(alpha: 0.3),
                      AppColors.electricBlue.withValues(alpha: 0.1),
                    ],
                  ),
                  border: Border.all(
                    color: AppColors.live,
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: avatar,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.live,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
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
                      Text(
                        'LIVE',
                        style: AppTheme.bodyStyle.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 8,
                child: Row(
                  children: [
                    const Icon(Iconsax.eye, size: 12, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      viewers,
                      style: AppTheme.bodyStyle.copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            name,
            style: AppTheme.bodyStyle.copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            title,
            style: AppTheme.bodyStyle.copyWith(
              fontSize: 11,
              color: Colors.white70,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildMessageItem({
    required String avatar,
    required String username,
    required String message,
    required String time,
    required bool unread,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  color: unread ? Colors.white.withValues(alpha: 0.02) : null,
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundImage: CachedNetworkImageProvider(avatar),
              ),
              if (unread)
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.lightBlue,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.background,
                        width: 2,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  username,
                  style: AppTheme.bodyStyle.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: AppTheme.bodyStyle.copyWith(
                    fontSize: 13,
                    color: unread ? Colors.white : Colors.white60,
                    fontWeight: unread ? FontWeight.w500 : FontWeight.normal,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            time,
            style: AppTheme.bodyStyle.copyWith(
              fontSize: 12,
              color: Colors.white38,
            ),
          ),
        ],
      ),
    );
  }
}

enum ActivityType {
  like,
  comment,
  follow,
  mention,
  share,
  gift,
  live,
}
