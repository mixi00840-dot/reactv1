import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../../../core/providers/core_providers.dart';
import '../data/models/feed_post_model.dart';
import '../services/posts_api_service.dart';

/// Provider for PostsApiService
final postsApiServiceProvider = Provider<PostsApiService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PostsApiService(apiService);
});

/// Feed state
class FeedState {
  final List<FeedPost> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? nextCursor;
  final bool hasMore;

  const FeedState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.nextCursor,
    this.hasMore = true,
  });

  FeedState copyWith({
    List<FeedPost>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? nextCursor,
    bool? hasMore,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

/// Feed provider with pagination
class FeedNotifier extends StateNotifier<FeedState> {
  final PostsApiService _postsApiService;

  FeedNotifier(this._postsApiService) : super(const FeedState());

  /// Load initial feed
  Future<void> loadFeed({bool refresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
    );

    try {
      final response = await _postsApiService.getFeed(limit: 20);

      state = state.copyWith(
        posts: response.posts,
        isLoading: false,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load more posts (pagination)
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final response = await _postsApiService.getFeed(
        cursor: state.nextCursor,
        limit: 20,
      );

      state = state.copyWith(
        posts: [...state.posts, ...response.posts],
        isLoadingMore: false,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  /// Toggle like on a post (optimistic update)
  Future<void> toggleLike(String postId) async {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final post = state.posts[postIndex];
    final wasLiked = post.isLiked;

    // Optimistic update
    final updatedPost = post.copyWith(
      isLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
    );

    final updatedPosts = [...state.posts];
    updatedPosts[postIndex] = updatedPost;
    state = state.copyWith(posts: updatedPosts);

    try {
      if (wasLiked) {
        await _postsApiService.unlikePost(postId);
      } else {
        await _postsApiService.likePost(postId);
      }
    } catch (e) {
      // Revert on error
      updatedPosts[postIndex] = post;
      state = state.copyWith(posts: updatedPosts);
    }
  }

  /// Toggle bookmark on a post (optimistic update)
  Future<void> toggleBookmark(String postId) async {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final post = state.posts[postIndex];
    final wasBookmarked = post.isBookmarked;

    // Optimistic update
    final updatedPost = post.copyWith(isBookmarked: !wasBookmarked);
    final updatedPosts = [...state.posts];
    updatedPosts[postIndex] = updatedPost;
    state = state.copyWith(posts: updatedPosts);

    try {
      if (wasBookmarked) {
        await _postsApiService.unsavePost(postId);
      } else {
        await _postsApiService.savePost(postId);
      }
    } catch (e) {
      // Revert on error
      updatedPosts[postIndex] = post;
      state = state.copyWith(posts: updatedPosts);
    }
  }

  /// Share a post
  Future<void> sharePost(String postId) async {
    try {
      await _postsApiService.sharePost(postId);

      // Update shares count
      final postIndex = state.posts.indexWhere((p) => p.id == postId);
      if (postIndex != -1) {
        final post = state.posts[postIndex];
        final updatedPost = post.copyWith(
          sharesCount: post.sharesCount + 1,
        );
        final updatedPosts = [...state.posts];
        updatedPosts[postIndex] = updatedPost;
        state = state.copyWith(posts: updatedPosts);
      }
    } catch (e) {
      // Handle error silently
    }
  }

  /// Send a gift
  Future<void> sendGift(String postId, String giftId) async {
    try {
      await _postsApiService.sendGift(postId, giftId);

      // Update gifts count
      final postIndex = state.posts.indexWhere((p) => p.id == postId);
      if (postIndex != -1) {
        final post = state.posts[postIndex];
        final updatedPost = post.copyWith(
          giftsCount: post.giftsCount + 1,
        );
        final updatedPosts = [...state.posts];
        updatedPosts[postIndex] = updatedPost;
        state = state.copyWith(posts: updatedPosts);
      }
    } catch (e) {
      // Handle error
      rethrow;
    }
  }

  /// Update a single post (e.g., from Socket.io event)
  void updatePost(FeedPost updatedPost) {
    final postIndex = state.posts.indexWhere((p) => p.id == updatedPost.id);
    if (postIndex != -1) {
      final updatedPosts = [...state.posts];
      updatedPosts[postIndex] = updatedPost;
      state = state.copyWith(posts: updatedPosts);
    }
  }

  /// Add new post to feed (e.g., after creation)
  void addPost(FeedPost newPost) {
    state = state.copyWith(
      posts: [newPost, ...state.posts],
    );
  }
}

/// Provider for feed
final feedProvider = StateNotifierProvider<FeedNotifier, FeedState>((ref) {
  final postsApiService = ref.watch(postsApiServiceProvider);
  return FeedNotifier(postsApiService);
});
