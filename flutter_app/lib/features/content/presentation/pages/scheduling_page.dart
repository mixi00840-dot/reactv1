import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../../../core/services/scheduling_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/scheduled_content_item.dart';
import 'package:timeago/timeago.dart' as timeago;

/// Scheduled content management page
class SchedulingPage extends ConsumerStatefulWidget {
  const SchedulingPage({super.key});

  @override
  ConsumerState<SchedulingPage> createState() => _SchedulingPageState();
}

class _SchedulingPageState extends ConsumerState<SchedulingPage>
    with SingleTickerProviderStateMixin {
  final SchedulingService _schedulingService = SchedulingService();
  List<ScheduledContentModel> _scheduledContent = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;

  late TabController _tabController;
  final List<String> _tabs = ['Upcoming', 'Posted', 'Failed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadScheduledContent();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    setState(() {
      _scheduledContent.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    _loadScheduledContent();
  }

  Future<void> _loadScheduledContent() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      String? status;
      switch (_tabController.index) {
        case 0:
          status = 'pending';
          break;
        case 1:
          status = 'posted';
          break;
        case 2:
          status = 'failed';
          break;
      }

      final content = await _schedulingService.getScheduledContent(
        page: _currentPage,
        limit: 20,
        status: status,
      );

      setState(() {
        if (content.isEmpty) {
          _hasMore = false;
        } else {
          _scheduledContent.addAll(content);
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

  Future<void> _refreshContent() async {
    setState(() {
      _scheduledContent.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadScheduledContent();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Scheduled Content'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: () {
              // TODO: Show calendar view
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Calendar view coming soon')),
              );
            },
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, '/content/schedule').then((_) {
            _refreshContent();
          });
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.schedule),
        label: const Text('Schedule Post'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _scheduledContent.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _scheduledContent.isEmpty) {
      return Center(
        child: AppErrorWidget(
          message: _error!,
          onRetry: _loadScheduledContent,
        ),
      );
    }

    if (_scheduledContent.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshContent,
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (scrollInfo.metrics.pixels >=
              scrollInfo.metrics.maxScrollExtent * 0.8) {
            _loadScheduledContent();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _scheduledContent.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _scheduledContent.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: LoadingIndicator(),
                ),
              );
            }

            final content = _scheduledContent[index];
            return ScheduledContentItem(
              content: content,
              onEdit: () => _editSchedule(content),
              onCancel: () => _cancelSchedule(content),
              onRetry: _tabController.index == 2
                  ? () => _retrySchedule(content)
                  : null,
              onTap: () => _viewDetails(content),
            );
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    String description;
    IconData icon;

    switch (_tabController.index) {
      case 0:
        icon = Icons.schedule;
        message = 'No upcoming posts';
        description = 'Schedule a post to see it here';
        break;
      case 1:
        icon = Icons.check_circle_outline;
        message = 'No posted content';
        description = 'Successfully posted content will appear here';
        break;
      case 2:
        icon = Icons.error_outline;
        message = 'No failed posts';
        description = 'Failed scheduled posts will appear here';
        break;
      default:
        icon = Icons.schedule;
        message = 'No scheduled content';
        description = '';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamed(context, '/content/schedule').then((_) {
                _refreshContent();
              });
            },
            icon: const Icon(Icons.add),
            label: const Text('Schedule Post'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _editSchedule(ScheduledContentModel content) {
    Navigator.pushNamed(
      context,
      '/content/schedule/edit',
      arguments: content,
    ).then((_) => _refreshContent());
  }

  Future<void> _cancelSchedule(ScheduledContentModel content) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Schedule'),
        content:
            const Text('Are you sure you want to cancel this scheduled post?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _schedulingService.cancelSchedule(content.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Schedule cancelled'),
              backgroundColor: Colors.green,
            ),
          );
          _refreshContent();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

  Future<void> _retrySchedule(ScheduledContentModel content) async {
    try {
      await _schedulingService.retrySchedule(content.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Post rescheduled'),
            backgroundColor: Colors.green,
          ),
        );
        _refreshContent();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  void _viewDetails(ScheduledContentModel content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Scheduled Post Details',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (content.thumbnailUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        content.thumbnailUrl!,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  _buildDetailRow('Type', content.type.toUpperCase()),
                  _buildDetailRow('Status', content.status.toUpperCase()),
                  _buildDetailRow(
                    'Scheduled For',
                    '${content.scheduledTime.day}/${content.scheduledTime.month}/${content.scheduledTime.year} ${content.scheduledTime.hour}:${content.scheduledTime.minute.toString().padLeft(2, '0')}',
                  ),
                  _buildDetailRow('Timezone', content.timezone ?? 'Local'),
                  if (content.caption != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Caption',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      content.caption!,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  if (content.errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              content.errorMessage!,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
