import 'package:dartz/dartz.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../core/error/exceptions.dart';
import '../../core/error/failures.dart';
import '../../domain/entities/comment.dart';
import '../../domain/repositories/comments_repository.dart';
import '../datasources/comments_remote_datasource.dart';
import '../datasources/comments_local_datasource.dart';
import '../models/comment_model.dart';

/// Implementation of CommentsRepository
/// Handles comments data with offline-first strategy
class CommentsRepositoryImpl implements CommentsRepository {
  final CommentsRemoteDataSource remoteDataSource;
  final CommentsLocalDataSource localDataSource;
  final Connectivity connectivity;

  CommentsRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.connectivity,
  });

  @override
  Future<Either<Failure, List<Comment>>> getComments({
    required String contentId,
    int page = 1,
    int limit = 20,
    String? parentId,
  }) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (isConnected) {
        // Try to fetch from remote
        try {
          final comments = await remoteDataSource.getComments(
            contentId: contentId,
            page: page,
            limit: limit,
          );

          // Cache the results (only for first page)
          if (page == 1) {
            await localDataSource.cacheComments(contentId, comments);
          }

          return Right(comments.map((model) => model.toEntity()).toList());
        } on ServerException catch (e) {
          // If server error and first page, try cache
          if (page == 1) {
            try {
              final cachedComments =
                  await localDataSource.getCachedComments(contentId);
              return Right(
                  cachedComments.map((model) => model.toEntity()).toList());
            } on CacheException {
              return Left(ServerFailure(message: e.message));
            }
          }
          return Left(ServerFailure(message: e.message));
        }
      } else {
        // No connection - try cache (only for first page)
        if (page == 1) {
          try {
            final cachedComments =
                await localDataSource.getCachedComments(contentId);
            return Right(
                cachedComments.map((model) => model.toEntity()).toList());
          } on CacheException catch (e) {
            return Left(CacheFailure(message: e.message));
          }
        } else {
          return Left(NetworkFailure(message: 'No internet connection'));
        }
      }
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to get comments: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, Comment>> getCommentById(String commentId) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (isConnected) {
        try {
          final comment = await remoteDataSource.getCommentById(commentId);
          await localDataSource.cacheComment(comment);
          return Right(comment.toEntity());
        } on ServerException catch (e) {
          // Try cache on server error
          final cachedComment =
              await localDataSource.getCachedComment(commentId);
          if (cachedComment != null) {
            return Right(cachedComment.toEntity());
          }
          return Left(ServerFailure(message: e.message));
        }
      } else {
        // No connection - try cache
        final cachedComment =
            await localDataSource.getCachedComment(commentId);
        if (cachedComment != null) {
          return Right(cachedComment.toEntity());
        }
        return Left(NetworkFailure(message: 'No internet connection'));
      }
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to get comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, Comment>> createComment({
    required String contentId,
    required String text,
    String? parentId,
  }) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      final comment = await remoteDataSource.createComment(
        contentId: contentId,
        text: text,
        parentId: parentId,
      );

      // Cache the new comment
      await localDataSource.cacheComment(comment);

      // Invalidate content comments cache to force refresh
      try {
        final cachedComments =
            await localDataSource.getCachedComments(contentId);
        await localDataSource.cacheComments(
          contentId,
          [comment, ...cachedComments],
        );
      } catch (_) {
        // Cache doesn't exist yet, that's fine
      }

      return Right(comment.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to create comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, Comment>> updateComment({
    required String commentId,
    required String text,
  }) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      final comment = await remoteDataSource.updateComment(
        commentId: commentId,
        text: text,
      );

      // Update cache
      await localDataSource.cacheComment(comment);

      return Right(comment.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to update comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteComment(String commentId) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      await remoteDataSource.deleteComment(commentId);

      // Remove from cache
      await localDataSource.removeCachedComment(commentId);

      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to delete comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> likeComment(String commentId) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      // Optimistic update: Update cache immediately
      final cachedComment = await localDataSource.getCachedComment(commentId);
      if (cachedComment != null) {
        final updatedComment = cachedComment.copyWith(
          isLiked: true,
          likesCount: cachedComment.likesCount + 1,
        );
        await localDataSource.cacheComment(updatedComment);
      }

      try {
        await remoteDataSource.likeComment(commentId);
        return const Right(null);
      } catch (e) {
        // Revert optimistic update on failure
        if (cachedComment != null) {
          await localDataSource.cacheComment(cachedComment);
        }
        rethrow;
      }
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to like comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> unlikeComment(String commentId) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      // Optimistic update: Update cache immediately
      final cachedComment = await localDataSource.getCachedComment(commentId);
      if (cachedComment != null) {
        final updatedComment = cachedComment.copyWith(
          isLiked: false,
          likesCount: cachedComment.likesCount - 1,
        );
        await localDataSource.cacheComment(updatedComment);
      }

      try {
        await remoteDataSource.unlikeComment(commentId);
        return const Right(null);
      } catch (e) {
        // Revert optimistic update on failure
        if (cachedComment != null) {
          await localDataSource.cacheComment(cachedComment);
        }
        rethrow;
      }
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to unlike comment: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> reportComment({
    required String commentId,
    required String reason,
    String? details,
  }) async {
    try {
      // Check connectivity
      final connectivityResult = await connectivity.checkConnectivity();
      final isConnected = connectivityResult != ConnectivityResult.none;

      if (!isConnected) {
        return Left(NetworkFailure(message: 'No internet connection'));
      }

      await remoteDataSource.reportComment(
        commentId: commentId,
        reason: reason,
      );

      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: 'Failed to report comment: ${e.toString()}'));
    }
  }
}
