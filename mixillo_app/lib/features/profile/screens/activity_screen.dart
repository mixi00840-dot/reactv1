import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity_model.dart';
import '../providers/profile_providers.dart';

class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});

  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _showUnreadOnly = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activityFeedAsync = ref.watch(activityFeedProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(_showUnreadOnly ? Icons.mark_email_read : Icons.filter_list),
            onPressed: () {
              setState(() {
                _showUnreadOnly = !_showUnreadOnly;
              });
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'mark_all_read',
                child: Text('Mark all as read'),
              ),
            ],
            onSelected: (value) {
              if (value == 'mark_all_read') {
                ref.read(activityFeedProvider.notifier).markAllAsRead();
              }
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Interactions'),
            Tab(text: 'Social'),
            Tab(text: 'Purchases'),
            Tab(text: 'System'),
          ],
        ),
      ),
      body: activityFeedAsync.when(
        data: (activities) {
          final filtered = _showUnreadOnly
              ? activities.where((a) => !a.isRead).toList()
              : activities;

          if (filtered.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(activityFeedProvider);
            },
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                return _buildActivityTile(filtered[index]);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(activityFeedProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityTile(ActivityEvent activity) {
    return Dismissible(
      key: Key(activity.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.blue,
        child: const Icon(Icons.check, color: Colors.white),
      ),
      onDismissed: (_) {
        ref.read(activityFeedProvider.notifier).markAsRead(activity.id);
      },
      child: InkWell(
        onTap: () {
          if (!activity.isRead) {
            ref.read(activityFeedProvider.notifier).markAsRead(activity.id);
          }
          // Navigate to related content
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: activity.isRead ? null : Theme.of(context).primaryColor.withOpacity(0.05),
            border: Border(
              bottom: BorderSide(
                color: Colors.grey.withOpacity(0.2),
                width: 1,
              ),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildActivityIcon(activity.type),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity.title,
                      style: TextStyle(
                        fontWeight: activity.isRead ? FontWeight.normal : FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      activity.description,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatTime(activity.createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              if (!activity.isRead)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityIcon(ActivityType type) {
    IconData icon;
    Color color;

    switch (type) {
      case ActivityType.profileView:
        icon = Icons.visibility;
        color = Colors.blue;
        break;
      case ActivityType.newFollower:
        icon = Icons.person_add;
        color = Colors.green;
        break;
      case ActivityType.purchase:
        icon = Icons.shopping_bag;
        color = Colors.orange;
        break;
      case ActivityType.comment:
        icon = Icons.comment;
        color = Colors.purple;
        break;
      case ActivityType.like:
        icon = Icons.favorite;
        color = Colors.red;
        break;
      case ActivityType.mention:
        icon = Icons.alternate_email;
        color = Colors.teal;
        break;
      case ActivityType.share:
        icon = Icons.share;
        color = Colors.indigo;
        break;
      case ActivityType.violation:
      case ActivityType.warning:
        icon = Icons.warning;
        color = Colors.red;
        break;
      case ActivityType.systemNotification:
        icon = Icons.notifications;
        color = Colors.blueGrey;
        break;
      default:
        icon = Icons.info;
        color = Colors.grey;
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 80,
            color: Colors.grey.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            _showUnreadOnly ? 'No unread activity' : 'No activity yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your activity will appear here',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 7) {
      return '${time.day}/${time.month}/${time.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
