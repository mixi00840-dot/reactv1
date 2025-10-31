import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../../../core/providers/feed_algorithm_providers.dart';

/// View Tracker Widget
/// Automatically tracks when content is viewed using VisibilityDetector
class ViewTrackerWidget extends ConsumerStatefulWidget {
  final String contentId;
  final String contentType;
  final String creatorId;
  final List<String> hashtags;
  final Widget child;
  final double visibilityThreshold;
  final int minViewDurationSeconds;

  const ViewTrackerWidget({
    Key? key,
    required this.contentId,
    required this.contentType,
    required this.creatorId,
    this.hashtags = const [],
    required this.child,
    this.visibilityThreshold = 0.5,
    this.minViewDurationSeconds = 2,
  }) : super(key: key);

  @override
  ConsumerState<ViewTrackerWidget> createState() => _ViewTrackerWidgetState();
}

class _ViewTrackerWidgetState extends ConsumerState<ViewTrackerWidget> {
  DateTime? _viewStartTime;
  bool _hasTrackedView = false;

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: Key('view_tracker_${widget.contentId}'),
      onVisibilityChanged: _onVisibilityChanged,
      child: widget.child,
    );
  }

  void _onVisibilityChanged(VisibilityInfo info) {
    final isVisible = info.visibleFraction >= widget.visibilityThreshold;

    if (isVisible && _viewStartTime == null) {
      // Content became visible
      _viewStartTime = DateTime.now();
    } else if (!isVisible && _viewStartTime != null) {
      // Content became invisible
      _trackView();
      _viewStartTime = null;
    }
  }

  void _trackView() {
    if (_viewStartTime == null || _hasTrackedView) return;

    final viewDuration = DateTime.now().difference(_viewStartTime!).inSeconds;

    if (viewDuration >= widget.minViewDurationSeconds) {
      final tracker = ref.read(interactionTrackerServiceProvider);
      
      tracker.trackView(
        contentId: widget.contentId,
        contentType: widget.contentType,
        creatorId: widget.creatorId,
        durationSeconds: viewDuration,
        hashtags: widget.hashtags,
      );

      _hasTrackedView = true;
    }
  }

  @override
  void dispose() {
    // Track view on dispose if still visible
    _trackView();
    super.dispose();
  }
}

/// Interaction Button Wrapper
/// Tracks interactions when user taps buttons
class InteractionButton extends ConsumerWidget {
  final VoidCallback? onTap;
  final String contentId;
  final String contentType;
  final String creatorId;
  final String interactionType; // 'like', 'comment', 'share'
  final List<String> hashtags;
  final Widget child;

  const InteractionButton({
    Key? key,
    this.onTap,
    required this.contentId,
    required this.contentType,
    required this.creatorId,
    required this.interactionType,
    this.hashtags = const [],
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        _trackInteraction(ref);
        onTap?.call();
      },
      child: child,
    );
  }

  void _trackInteraction(WidgetRef ref) {
    final tracker = ref.read(interactionTrackerServiceProvider);

    switch (interactionType.toLowerCase()) {
      case 'like':
        tracker.trackLike(
          contentId: contentId,
          contentType: contentType,
          creatorId: creatorId,
          hashtags: hashtags,
        );
        break;
      case 'comment':
        tracker.trackComment(
          contentId: contentId,
          contentType: contentType,
          creatorId: creatorId,
          hashtags: hashtags,
        );
        break;
      case 'share':
        tracker.trackShare(
          contentId: contentId,
          contentType: contentType,
          creatorId: creatorId,
          hashtags: hashtags,
        );
        break;
    }
  }
}

/// Analytics Dashboard Widget
/// Shows user's interaction analytics
class AnalyticsDashboard extends ConsumerWidget {
  const AnalyticsDashboard({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsSummaryProvider);

    return analyticsAsync.when(
      data: (analytics) => _buildDashboard(analytics),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Text('Error loading analytics: $error'),
      ),
    );
  }

  Widget _buildDashboard(Map<String, dynamic> analytics) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Analytics',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          
          // Summary Cards
          _buildSummaryCard(
            'Total Tracked',
            analytics['totalViewsTracked']?.toString() ?? '0',
            Icons.visibility,
          ),
          const SizedBox(height: 12),
          
          _buildSummaryCard(
            'Followed Creators',
            analytics['totalAffinities']?.toString() ?? '0',
            Icons.people,
          ),
          const SizedBox(height: 12),
          
          _buildSummaryCard(
            'Session Interactions',
            analytics['sessionInteractions']?.toString() ?? '0',
            Icons.touch_app,
          ),
          
          const SizedBox(height: 24),
          
          // Content Type Preferences
          const Text(
            'Content Preferences',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          
          if (analytics['contentTypePreferences'] != null)
            ..._buildContentTypePreferences(
              analytics['contentTypePreferences'] as Map<String, dynamic>,
            ),
          
          const SizedBox(height: 24),
          
          // Top Hashtags
          const Text(
            'Top Hashtags',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          
          if (analytics['topHashtags'] != null)
            ..._buildTopHashtags(
              List<MapEntry<String, double>>.from(
                (analytics['topHashtags'] as List)
                    .map((e) => MapEntry(e.key as String, e.value as double)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildContentTypePreferences(Map<String, dynamic> prefs) {
    return prefs.entries.map((entry) {
      final percentage = (entry.value * 100).toStringAsFixed(0);
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Text(
                entry.key.toUpperCase(),
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            Expanded(
              flex: 7,
              child: Stack(
                children: [
                  Container(
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: entry.value,
                    child: Container(
                      height: 24,
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          '$percentage%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  List<Widget> _buildTopHashtags(List<MapEntry<String, double>> hashtags) {
    if (hashtags.isEmpty) {
      return [
        const Text(
          'No hashtag preferences yet',
          style: TextStyle(color: Colors.grey),
        ),
      ];
    }

    return hashtags.map((entry) {
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.tag, size: 16, color: Colors.blue),
            const SizedBox(width: 4),
            Text(
              entry.key,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(width: 8),
            Text(
              '${(entry.value * 100).toStringAsFixed(0)}%',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }).toList();
  }
}
