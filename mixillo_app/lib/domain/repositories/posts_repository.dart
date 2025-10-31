import 'package:dartz/dartz.dart';
import '../../core/error/failures.dart';
import '../../core/usecase/usecase.dart';
import '../entities/post.dart';

/// Posts Repository Interface - Defines contract for data layer
/// Follows Repository Pattern from Clean Architecture
abstract class PostsRepository {
  /// Get posts feed (For You / Following)
  Future<Either<Failure, List<Post>>> getPosts({
    required int page,
    required int limit,
    String? cursor,
    PostFeedType feedType = PostFeedType.forYou,
  });

  /// Get single post by ID
  Future<Either<Failure, Post>> getPostById(String postId);

  /// Get user's posts (for profile screen)
  Future<Either<Failure, List<Post>>> getUserPosts({
    required String userId,
    required int page,
    required int limit,
    PostContentType? contentType,
  });

  /// Get saved posts
  Future<Either<Failure, List<Post>>> getSavedPosts({
    required int page,
    required int limit,
  });

  /// Get trending posts
  Future<Either<Failure, List<Post>>> getTrendingPosts({
    required int page,
    required int limit,
  });

  /// Search posts
  Future<Either<Failure, List<Post>>> searchPosts({
    required String query,
    required int page,
    required int limit,
  });

  /// Create/Upload new post
  Future<Either<Failure, Post>> createPost({
    required List<String> mediaFiles,
    required String caption,
    List<String>? hashtags,
    String? location,
    String? soundId,
    List<ProductTag>? productTags,
  });

  /// Update post
  Future<Either<Failure, Post>> updatePost({
    required String postId,
    String? caption,
    List<String>? hashtags,
    String? location,
  });

  /// Delete post
  Future<Either<Failure, void>> deletePost(String postId);

  /// Like post
  Future<Either<Failure, void>> likePost(String postId);

  /// Unlike post
  Future<Either<Failure, void>> unlikePost(String postId);

  /// Save post
  Future<Either<Failure, void>> savePost(String postId);

  /// Unsave post
  Future<Either<Failure, void>> unsavePost(String postId);

  /// Share post
  Future<Either<Failure, void>> sharePost({
    required String postId,
    required SharePlatform platform,
  });

  /// Report post
  Future<Either<Failure, void>> reportPost({
    required String postId,
    required String reason,
  });
}

/// Feed type enumeration
enum PostFeedType {
  forYou,
  following,
  trending,
}

/// Content type for filtering user posts
enum PostContentType {
  posts, // Regular posts (photos/videos)
  reels, // Short videos (TikTok-style)
  tagged, // Posts user is tagged in
  saved, // Saved posts
}

/// Share platform options
enum SharePlatform {
  facebook,
  twitter,
  instagram,
  whatsapp,
  telegram,
  copyLink,
  more,
}
