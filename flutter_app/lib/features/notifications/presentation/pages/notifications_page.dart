import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/notification_item.dart';

/// Notifications page - displays all user notifications
class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage>
    with SingleTickerProviderStateMixin {
  final NotificationService _notificationService = NotificationService();
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _selectedFilter;

  late TabController _tabController;
  final List<String> _tabs = [
    'All',
    'Likes',
    'Comments',
    'Followers',
    'System'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadNotifications();
    _markAllAsRead();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    setState(() {
      _selectedFilter = _tabController.index == 0
          ? null
          : _tabs[_tabController.index].toLowerCase();
      _notifications.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifications = await _notificationService.getNotifications(
        page: _currentPage,
        limit: 20,
      );

      setState(() {
        if (notifications.isEmpty) {
          _hasMore = false;
        } else {
          _notifications.addAll(notifications);
          _currentPage++;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _notificationService.markAllAsRead();
    } catch (e) {
      // Silent fail - not critical
    }
  }

  Future<void> _refreshNotifications() async {
    setState(() {
      _notifications.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadNotifications();
  }

  Future<void> _deleteNotification(String notificationId) async {
    try {
      await _notificationService.deleteNotification(notificationId);
      setState(() {
        _notifications.removeWhere((n) => n.id == notificationId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.pushNamed(context, '/notifications/settings');
            },
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _notifications.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _notifications.isEmpty) {
      return Center(
        child: ErrorDisplay(
          message: _error!,
          onRetry: _loadNotifications,
        ),
      );
    }

    if (_notifications.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshNotifications,
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (scrollInfo.metrics.pixels >=
              scrollInfo.metrics.maxScrollExtent * 0.8) {
            _loadNotifications();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: _notifications.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _notifications.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: LoadingIndicator(),
                ),
              );
            }

            final notification = _notifications[index];
            return NotificationItem(
              notification: notification,
              onTap: () => _handleNotificationTap(notification),
              onDelete: () => _deleteNotification(notification.id),
            );
          },
        ),
      ),
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
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'ll see notifications here when people\ninteract with your content',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  void _handleNotificationTap(NotificationModel notification) {
    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.like:
      case NotificationType.comment:
      case NotificationType.share:
        if (notification.contentId != null) {
          Navigator.pushNamed(
            context,
            '/content/${notification.contentId}',
          );
        }
        break;
      case NotificationType.follow:
        if (notification.actorId != null) {
          Navigator.pushNamed(
            context,
            '/profile/${notification.actorId}',
          );
        }
        break;
      case NotificationType.gift:
        Navigator.pushNamed(context, '/wallet');
        break;
      case NotificationType.message:
        if (notification.actorId != null) {
          Navigator.pushNamed(
            context,
            '/messages/${notification.actorId}',
          );
        }
        break;
      case NotificationType.liveStart:
        if (notification.liveStreamId != null) {
          Navigator.pushNamed(
            context,
            '/live/${notification.liveStreamId}',
          );
        }
        break;
      default:
        break;
    }
  }
}
