import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dartz/dartz.dart';

import '../../core/error/exceptions.dart';
import '../../core/error/failures.dart';
import '../../domain/entities/post.dart';
import '../../domain/repositories/posts_repository.dart';
import '../datasources/posts_local_datasource.dart';
import '../datasources/posts_remote_datasource.dart';
import '../models/post_model.dart';

/// Posts Repository Implementation - Combines remote and local data sources
/// Implements offline-first strategy with cache fallback
class PostsRepositoryImpl implements PostsRepository {
  final PostsRemoteDataSource remoteDataSource;
  final PostsLocalDataSource localDataSource;
  final Connectivity connectivity;

  PostsRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.connectivity,
  });

  @override
  Future<Either<Failure, List<Post>>> getPosts({
    required int page,
    required int limit,
    String? cursor,
    PostFeedType feedType = PostFeedType.forYou,
  }) async {
    // Generate cache key based on parameters
    final cacheKey = '${feedType.name}_page${page}_limit$limit';

    // Check network connectivity
    final isOnline = await _isConnected();

    if (isOnline) {
      try {
        // Fetch from remote
        final posts = await remoteDataSource.getPosts(
          page: page,
          limit: limit,
          cursor: cursor,
          feedType: feedType,
        );

        // Cache the results
        await localDataSource.cachePosts(cacheKey, posts);

        return Right(posts);
      } on ServerException catch (e) {
        return Left(ServerFailure(message: e.message, code: e.code));
      } on NetworkException catch (e) {
        return Left(NetworkFailure(message: e.message));
      } on AuthException catch (e) {
        return Left(AuthFailure(message: e.message, code: e.code));
      } catch (e) {
        return Left(UnexpectedFailure(message: e.toString()));
      }
    } else {
      // Offline - try to get from cache
      try {
        final cachedPosts = await localDataSource.getCachedPosts(cacheKey);
        if (cachedPosts.isEmpty) {
          return const Left(NetworkFailure(message: 'No internet connection'));
        }
        return Right(cachedPosts);
      } on CacheException catch (e) {
        return Left(CacheFailure(message: e.message));
      }
    }
  }

  @override
  Future<Either<Failure, Post>> getPostById(String postId) async {
    final isOnline = await _isConnected();

    if (isOnline) {
      try {
        final post = await remoteDataSource.getPostById(postId);
        await localDataSource.cachePost(post);
        return Right(post);
      } on ServerException catch (e) {
        return Left(ServerFailure(message: e.message, code: e.code));
      } on NetworkException catch (e) {
        return Left(NetworkFailure(message: e.message));
      } on AuthException catch (e) {
        return Left(AuthFailure(message: e.message, code: e.code));
      } catch (e) {
        return Left(UnexpectedFailure(message: e.toString()));
      }
    } else {
      try {
        final cachedPost = await localDataSource.getCachedPost(postId);
        if (cachedPost == null) {
          return const Left(NetworkFailure(message: 'No internet connection'));
        }
        return Right(cachedPost);
      } on CacheException catch (e) {
        return Left(CacheFailure(message: e.message));
      }
    }
  }

  @override
  Future<Either<Failure, List<Post>>> getUserPosts({
    required String userId,
    required int page,
    required int limit,
    PostContentType? contentType,
  }) async {
    try {
      final posts = await remoteDataSource.getUserPosts(
        userId: userId,
        page: page,
        limit: limit,
        contentType: contentType,
      );

      // Cache user posts
      final cacheKey = 'user_${userId}_${contentType?.name ?? 'all'}_page$page';
      await localDataSource.cachePosts(cacheKey, posts);

      return Right(posts);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Post>>> getSavedPosts({
    required int page,
    required int limit,
  }) async {
    try {
      final posts = await remoteDataSource.getSavedPosts(
        page: page,
        limit: limit,
      );

      final cacheKey = 'saved_page$page';
      await localDataSource.cachePosts(cacheKey, posts);

      return Right(posts);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Post>>> getTrendingPosts({
    required int page,
    required int limit,
  }) async {
    return getPosts(
      page: page,
      limit: limit,
      feedType: PostFeedType.trending,
    );
  }

  @override
  Future<Either<Failure, List<Post>>> searchPosts({
    required String query,
    required int page,
    required int limit,
  }) async {
    try {
      // This would need a search endpoint in the remote datasource
      // For now, use regular feed and filter locally
      final result = await getPosts(page: page, limit: limit);
      
      return result.fold(
        (failure) => Left(failure),
        (posts) {
          final filtered = posts.where((post) {
            return post.caption.toLowerCase().contains(query.toLowerCase()) ||
                   post.hashtags.any((tag) => 
                       tag.toLowerCase().contains(query.toLowerCase()));
          }).toList();
          return Right(filtered);
        },
      );
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Post>> createPost({
    required List<String> mediaFiles,
    required String caption,
    List<String>? hashtags,
    String? location,
    String? soundId,
    List<ProductTag>? productTags,
  }) async {
    try {
      final post = await remoteDataSource.createPost(
        mediaFiles: mediaFiles,
        caption: caption,
        hashtags: hashtags,
        location: location,
        soundId: soundId,
        productTags: productTags,
      );

      await localDataSource.cachePost(post);

      return Right(post);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } on MediaException catch (e) {
      return Left(MediaFailure(message: e.message));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Post>> updatePost({
    required String postId,
    String? caption,
    List<String>? hashtags,
    String? location,
  }) async {
    // This would need an update endpoint - not implemented in remote datasource yet
    return const Left(UnexpectedFailure(message: 'Update not implemented'));
  }

  @override
  Future<Either<Failure, void>> deletePost(String postId) async {
    try {
      await remoteDataSource.deletePost(postId);
      await localDataSource.removeCachedPost(postId);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> likePost(String postId) async {
    try {
      await remoteDataSource.likePost(postId);
      
      // Update cached post if exists
      final cachedPost = await localDataSource.getCachedPost(postId);
      if (cachedPost != null) {
        final updatedPost = cachedPost.copyWith(
          isLiked: true,
          stats: cachedPost.stats.copyWith(
            likes: cachedPost.stats.likes + 1,
          ),
        );
        await localDataSource.cachePost(PostModel.fromEntity(updatedPost));
      }
      
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> unlikePost(String postId) async {
    try {
      await remoteDataSource.unlikePost(postId);
      
      // Update cached post if exists
      final cachedPost = await localDataSource.getCachedPost(postId);
      if (cachedPost != null) {
        final updatedPost = cachedPost.copyWith(
          isLiked: false,
          stats: cachedPost.stats.copyWith(
            likes: cachedPost.stats.likes - 1,
          ),
        );
        await localDataSource.cachePost(PostModel.fromEntity(updatedPost));
      }
      
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> savePost(String postId) async {
    try {
      await remoteDataSource.savePost(postId);
      
      final cachedPost = await localDataSource.getCachedPost(postId);
      if (cachedPost != null) {
        final updatedPost = cachedPost.copyWith(
          isSaved: true,
          stats: cachedPost.stats.copyWith(
            saves: cachedPost.stats.saves + 1,
          ),
        );
        await localDataSource.cachePost(PostModel.fromEntity(updatedPost));
      }
      
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> unsavePost(String postId) async {
    try {
      await remoteDataSource.unsavePost(postId);
      
      final cachedPost = await localDataSource.getCachedPost(postId);
      if (cachedPost != null) {
        final updatedPost = cachedPost.copyWith(
          isSaved: false,
          stats: cachedPost.stats.copyWith(
            saves: cachedPost.stats.saves - 1,
          ),
        );
        await localDataSource.cachePost(PostModel.fromEntity(updatedPost));
      }
      
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> sharePost({
    required String postId,
    required SharePlatform platform,
  }) async {
    // Share would be handled by platform-specific code
    // For now, just increment the share count
    try {
      final cachedPost = await localDataSource.getCachedPost(postId);
      if (cachedPost != null) {
        final updatedPost = cachedPost.copyWith(
          stats: cachedPost.stats.copyWith(
            shares: cachedPost.stats.shares + 1,
          ),
        );
        await localDataSource.cachePost(PostModel.fromEntity(updatedPost));
      }
      
      return const Right(null);
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> reportPost({
    required String postId,
    required String reason,
  }) async {
    // Would need report endpoint in remote datasource
    return const Left(UnexpectedFailure(message: 'Report not implemented'));
  }

  /// Check network connectivity
  Future<bool> _isConnected() async {
    final result = await connectivity.checkConnectivity();
    return result == ConnectivityResult.mobile ||
           result == ConnectivityResult.wifi ||
           result == ConnectivityResult.ethernet;
  }
}
