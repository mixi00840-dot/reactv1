import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/content/data/services/content_service.dart';
import '../../features/content/data/models/content.dart';

/// Content provider for managing video feed and content state
final contentProvider = StateNotifierProvider<ContentNotifier, ContentState>(
  (ref) => ContentNotifier(),
);

class ContentState {
  final List<Content> feed;
  final bool isLoading;
  final String? error;
  final int currentPage;
  final bool hasMore;

  ContentState({
    this.feed = const [],
    this.isLoading = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  ContentState copyWith({
    List<Content>? feed,
    bool? isLoading,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return ContentState(
      feed: feed ?? this.feed,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ContentNotifier extends StateNotifier<ContentState> {
  final ContentService _contentService = ContentService();

  ContentNotifier() : super(ContentState()) {
    loadFeed();
  }

  /// Load initial feed
  Future<void> loadFeed() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final contents = await _contentService.getFeed(page: 1, limit: 20);

      state = state.copyWith(
        feed: contents,
        isLoading: false,
        currentPage: 1,
        hasMore: contents.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load more content (pagination)
  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    try {
      final nextPage = state.currentPage + 1;
      final contents =
          await _contentService.getFeed(page: nextPage, limit: 20);

      state = state.copyWith(
        feed: [...state.feed, ...contents],
        isLoading: false,
        currentPage: nextPage,
        hasMore: contents.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Refresh feed
  Future<void> refresh() async {
    state = ContentState();
    await loadFeed();
  }

  /// Toggle like on content
  Future<void> toggleLike(String contentId) async {
    try {
      final content = state.feed.firstWhere((c) => c.id == contentId);
      final isLiked = content.isLiked ?? false;

      // Optimistic update
      final updatedFeed = state.feed.map((c) {
        if (c.id == contentId) {
          return Content(
            id: c.id,
            videoUrl: c.videoUrl,
            creatorId: c.creatorId,
            creatorUsername: c.creatorUsername,
            creatorAvatar: c.creatorAvatar,
            caption: c.caption,
            views: c.views,
            likes: isLiked ? c.likes - 1 : c.likes + 1,
            comments: c.comments,
            shares: c.shares,
            isLiked: !isLiked,
            createdAt: c.createdAt,
          );
        }
        return c;
      }).toList();

      state = state.copyWith(feed: updatedFeed);

      // Make API call
      await _contentService.toggleLike(contentId);
    } catch (e) {
      // Revert on error
      await loadFeed();
    }
  }
}
