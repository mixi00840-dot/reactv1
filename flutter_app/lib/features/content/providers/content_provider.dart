import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/content.dart';
import '../data/models/comment.dart';
import '../data/services/content_service.dart';

// Content service provider
final contentServiceProvider = Provider<ContentService>((ref) {
  return ContentService();
});

// Content feed provider with pagination
final contentFeedProvider =
    StateNotifierProvider<ContentFeedNotifier, AsyncValue<List<Content>>>(
        (ref) {
  final service = ref.watch(contentServiceProvider);
  return ContentFeedNotifier(service);
});

class ContentFeedNotifier extends StateNotifier<AsyncValue<List<Content>>> {
  final ContentService _service;
  int _currentPage = 1;
  bool _hasMore = true;

  ContentFeedNotifier(this._service) : super(const AsyncValue.loading()) {
    loadFeed();
  }

  Future<void> loadFeed() async {
    state = const AsyncValue.loading();
    try {
      final content = await _service.getFeed(page: 1);
      _currentPage = 1;
      _hasMore = content.isNotEmpty;
      state = AsyncValue.data(content);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> loadMore() async {
    if (!_hasMore) return;

    state.whenData((currentContent) async {
      try {
        final newContent = await _service.getFeed(page: _currentPage + 1);
        if (newContent.isEmpty) {
          _hasMore = false;
        } else {
          _currentPage++;
          state = AsyncValue.data([...currentContent, ...newContent]);
        }
      } catch (e, stack) {
        state = AsyncValue.error(e, stack);
      }
    });
  }

  Future<void> refresh() async {
    await loadFeed();
  }
}

// Single content provider
final singleContentProvider =
    FutureProvider.family<Content, String>((ref, contentId) async {
  final service = ref.watch(contentServiceProvider);
  return await service.getContent(contentId);
});

// Content interactions provider
final contentInteractionsProvider = StateNotifierProvider.family<
    ContentInteractionsNotifier,
    AsyncValue<ContentInteractions>,
    String>((ref, contentId) {
  final service = ref.watch(contentServiceProvider);
  return ContentInteractionsNotifier(service, contentId);
});

class ContentInteractionsNotifier
    extends StateNotifier<AsyncValue<ContentInteractions>> {
  final ContentService _service;
  final String _contentId;

  ContentInteractionsNotifier(this._service, this._contentId)
      : super(const AsyncValue.loading()) {
    loadInteractions();
  }

  Future<void> loadInteractions() async {
    state = const AsyncValue.loading();
    try {
      final interactions = await _service.getInteractions(_contentId);
      state = AsyncValue.data(interactions);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> toggleLike() async {
    state.whenData((current) async {
      try {
        final newState = await _service.toggleLike(_contentId);
        state = AsyncValue.data(current.copyWith(
          isLiked: newState['isLiked'],
          likesCount: newState['likesCount'],
        ));
      } catch (e, stack) {
        state = AsyncValue.error(e, stack);
      }
    });
  }

  Future<void> recordView() async {
    try {
      await _service.recordView(_contentId);
      state.whenData((current) {
        state = AsyncValue.data(current.copyWith(
          viewsCount: current.viewsCount + 1,
        ));
      });
    } catch (e) {
      // Silently fail for views
    }
  }
}

class ContentInteractions {
  final bool isLiked;
  final bool isSaved;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int viewsCount;

  ContentInteractions({
    required this.isLiked,
    required this.isSaved,
    required this.likesCount,
    required this.commentsCount,
    required this.sharesCount,
    required this.viewsCount,
  });

  ContentInteractions copyWith({
    bool? isLiked,
    bool? isSaved,
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    int? viewsCount,
  }) {
    return ContentInteractions(
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      viewsCount: viewsCount ?? this.viewsCount,
    );
  }
}

// Content comments provider
final contentCommentsProvider = StateNotifierProvider.family<
    ContentCommentsNotifier,
    AsyncValue<List<Comment>>,
    String>((ref, contentId) {
  final service = ref.watch(contentServiceProvider);
  return ContentCommentsNotifier(service, contentId);
});

class ContentCommentsNotifier extends StateNotifier<AsyncValue<List<Comment>>> {
  final ContentService _service;
  final String _contentId;

  ContentCommentsNotifier(this._service, this._contentId)
      : super(const AsyncValue.loading()) {
    loadComments();
  }

  Future<void> loadComments() async {
    state = const AsyncValue.loading();
    try {
      final comments = await _service.getComments(_contentId);
      state = AsyncValue.data(comments);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addComment(String text) async {
    try {
      final comment = await _service.addComment(_contentId, text);
      state.whenData((comments) {
        state = AsyncValue.data([comment, ...comments]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteComment(String commentId) async {
    try {
      await _service.deleteComment(commentId);
      state.whenData((comments) {
        final updatedList = comments.where((c) => c.id != commentId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadComments();
  }
}

// Scheduled posts provider
final scheduledPostsProvider =
    StateNotifierProvider<ScheduledPostsNotifier, AsyncValue<List<Content>>>(
        (ref) {
  final service = ref.watch(contentServiceProvider);
  return ScheduledPostsNotifier(service);
});

class ScheduledPostsNotifier extends StateNotifier<AsyncValue<List<Content>>> {
  final ContentService _service;

  ScheduledPostsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadScheduledPosts();
  }

  Future<void> loadScheduledPosts() async {
    state = const AsyncValue.loading();
    try {
      final posts = await _service.getScheduledPosts();
      state = AsyncValue.data(posts);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> schedulePost(Content content, DateTime scheduledTime) async {
    try {
      final scheduledPost = await _service.schedulePost(content, scheduledTime);
      state.whenData((posts) {
        state = AsyncValue.data([...posts, scheduledPost]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> deleteScheduledPost(String postId) async {
    try {
      await _service.deleteScheduledPost(postId);
      state.whenData((posts) {
        final updatedList = posts.where((p) => p.id != postId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadScheduledPosts();
  }
}
