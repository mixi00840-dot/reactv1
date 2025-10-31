import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/usecase/usecase.dart';
import '../../domain/entities/post.dart';
import '../../domain/repositories/posts_repository.dart';
import '../../domain/usecases/posts/get_posts.dart';
import '../../domain/usecases/posts/get_saved_posts.dart';
import '../../domain/usecases/posts/get_user_posts.dart';
import '../../domain/usecases/posts/like_post.dart';
import '../../domain/usecases/posts/save_post.dart';
import '../providers/posts_providers.dart';
import 'posts_state.dart';

/// Posts State Notifier - Manages posts feed state
class PostsNotifier extends StateNotifier<PostsState> {
  final GetPosts _getPosts;
  final GetUserPosts _getUserPosts;
  final GetSavedPosts _getSavedPosts;
  final LikePost _likePost;
  final UnlikePost _unlikePost;
  final SavePost _savePost;
  final UnsavePost _unsavePost;

  PostsNotifier({
    required GetPosts getPosts,
    required GetUserPosts getUserPosts,
    required GetSavedPosts getSavedPosts,
    required LikePost likePost,
    required UnlikePost unlikePost,
    required SavePost savePost,
    required UnsavePost unsavePost,
  })  : _getPosts = getPosts,
        _getUserPosts = getUserPosts,
        _getSavedPosts = getSavedPosts,
        _likePost = likePost,
        _unlikePost = unlikePost,
        _savePost = savePost,
        _unsavePost = unsavePost,
        super(const PostsState());

  /// Load posts feed
  Future<void> loadPosts({
    PostFeedType feedType = PostFeedType.forYou,
    bool refresh = false,
  }) async {
    if (state.isLoading || state.isLoadingMore) return;

    if (refresh) {
      state = const PostsState(isLoading: true);
    } else {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }

    final result = await _getPosts(GetPostsParams(
      page: refresh ? 1 : state.currentPage,
      limit: 20,
      feedType: feedType,
    ));

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (posts) {
        state = state.copyWith(
          isLoading: false,
          posts: refresh ? posts : [...state.posts, ...posts],
          currentPage: refresh ? 2 : state.currentPage + 1,
          hasReachedMax: posts.length < 20,
          errorMessage: null,
        );
      },
    );
  }

  /// Load more posts (pagination)
  Future<void> loadMorePosts({
    PostFeedType feedType = PostFeedType.forYou,
  }) async {
    if (state.hasReachedMax || state.isLoadingMore) return;

    state = state.copyWith(isLoadingMore: true);

    final result = await _getPosts(GetPostsParams(
      page: state.currentPage,
      limit: 20,
      feedType: feedType,
    ));

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoadingMore: false,
          errorMessage: failure.message,
        );
      },
      (posts) {
        state = state.copyWith(
          isLoadingMore: false,
          posts: [...state.posts, ...posts],
          currentPage: state.currentPage + 1,
          hasReachedMax: posts.length < 20,
        );
      },
    );
  }

  /// Load user posts
  Future<void> loadUserPosts({
    required String userId,
    PostContentType? contentType,
    bool refresh = false,
  }) async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _getUserPosts(GetUserPostsParams(
      userId: userId,
      page: refresh ? 1 : state.currentPage,
      limit: 20,
      contentType: contentType,
    ));

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (posts) {
        state = state.copyWith(
          isLoading: false,
          posts: refresh ? posts : [...state.posts, ...posts],
          currentPage: refresh ? 2 : state.currentPage + 1,
          hasReachedMax: posts.length < 20,
        );
      },
    );
  }

  /// Load saved posts
  Future<void> loadSavedPosts({bool refresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _getSavedPosts(PaginationParams(
      page: refresh ? 1 : state.currentPage,
      limit: 20,
    ));

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (posts) {
        state = state.copyWith(
          isLoading: false,
          posts: refresh ? posts : [...state.posts, ...posts],
          currentPage: refresh ? 2 : state.currentPage + 1,
          hasReachedMax: posts.length < 20,
        );
      },
    );
  }

  /// Toggle like on a post
  Future<void> toggleLike(String postId) async {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final post = state.posts[postIndex];
    final isLiked = post.isLiked;

    // Optimistic update
    final updatedPost = post.copyWith(
      isLiked: !isLiked,
      stats: post.stats.copyWith(
        likes: isLiked ? post.stats.likes - 1 : post.stats.likes + 1,
      ),
    );

    final updatedPosts = List<Post>.from(state.posts);
    updatedPosts[postIndex] = updatedPost;
    state = state.copyWith(posts: updatedPosts);

    // Call API
    final result = isLiked
        ? await _unlikePost(IdParams(postId))
        : await _likePost(IdParams(postId));

    // Revert on failure
    result.fold(
      (failure) {
        updatedPosts[postIndex] = post;
        state = state.copyWith(posts: updatedPosts);
      },
      (_) {}, // Success - optimistic update stands
    );
  }

  /// Toggle save on a post
  Future<void> toggleSave(String postId) async {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final post = state.posts[postIndex];
    final isSaved = post.isSaved;

    // Optimistic update
    final updatedPost = post.copyWith(
      isSaved: !isSaved,
      stats: post.stats.copyWith(
        saves: isSaved ? post.stats.saves - 1 : post.stats.saves + 1,
      ),
    );

    final updatedPosts = List<Post>.from(state.posts);
    updatedPosts[postIndex] = updatedPost;
    state = state.copyWith(posts: updatedPosts);

    // Call API
    final result = isSaved
        ? await _unsavePost(IdParams(postId))
        : await _savePost(IdParams(postId));

    // Revert on failure
    result.fold(
      (failure) {
        updatedPosts[postIndex] = post;
        state = state.copyWith(posts: updatedPosts);
      },
      (_) {},
    );
  }

  /// Refresh posts
  Future<void> refresh({PostFeedType feedType = PostFeedType.forYou}) async {
    await loadPosts(feedType: feedType, refresh: true);
  }
}

/// Posts State Provider
final postsNotifierProvider =
    StateNotifierProvider<PostsNotifier, PostsState>((ref) {
  return PostsNotifier(
    getPosts: ref.watch(getPostsUseCaseProvider),
    getUserPosts: ref.watch(getUserPostsUseCaseProvider),
    getSavedPosts: ref.watch(getSavedPostsUseCaseProvider),
    likePost: ref.watch(likePostUseCaseProvider),
    unlikePost: ref.watch(unlikePostUseCaseProvider),
    savePost: ref.watch(savePostUseCaseProvider),
    unsavePost: ref.watch(unsavePostUseCaseProvider),
  );
});
