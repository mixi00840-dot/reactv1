import 'package:equatable/equatable.dart';

import '../../domain/entities/post.dart';

/// Posts State for feed management
class PostsState extends Equatable {
  final List<Post> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasReachedMax;
  final String? errorMessage;
  final int currentPage;

  const PostsState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasReachedMax = false,
    this.errorMessage,
    this.currentPage = 1,
  });

  PostsState copyWith({
    List<Post>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasReachedMax,
    String? errorMessage,
    int? currentPage,
  }) {
    return PostsState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
      errorMessage: errorMessage ?? this.errorMessage,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
        posts,
        isLoading,
        isLoadingMore,
        hasReachedMax,
        errorMessage,
        currentPage,
      ];
}
