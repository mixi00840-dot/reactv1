import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dartz/dartz.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/error/exceptions.dart';
import '../../core/error/failures.dart';
import '../../domain/entities/story.dart';
import '../../domain/repositories/stories_repository.dart';
import '../datasources/stories_local_datasource.dart';
import '../datasources/stories_remote_datasource.dart';
import '../models/story_model.dart';

/// Implementation of StoriesRepository
/// Implements offline-first strategy with caching
class StoriesRepositoryImpl implements StoriesRepository {
  final StoriesRemoteDataSource remoteDataSource;
  final StoriesLocalDataSource localDataSource;
  final Connectivity connectivity;

  StoriesRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.connectivity,
  });

  @override
  Future<Either<Failure, List<StoryGroup>>> getStoriesFeed() async {
    try {
      // Check network connectivity
      final isConnected = await _isConnected();

      if (isConnected) {
        try {
          // Fetch from remote
          final storyGroups = await remoteDataSource.getStoriesFeed();

          // Cache the result
          await localDataSource.cacheStoriesFeed(storyGroups);

          return Right(storyGroups);
        } on AppException catch (e) {
          // If remote fetch fails, try to return cached data
          final cachedStories = await localDataSource.getCachedStoriesFeed();
          if (cachedStories.isNotEmpty) {
            return Right(cachedStories);
          }
          return Left(_handleException(e));
        }
      } else {
        // Offline: return cached data
        final cachedStories = await localDataSource.getCachedStoriesFeed();
        if (cachedStories.isNotEmpty) {
          return Right(cachedStories);
        }
        return const Left(NetworkFailure(message: 'No internet connection'));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Story>> getStoryById(String storyId) async {
    try {
      final isConnected = await _isConnected();

      if (isConnected) {
        try {
          final story = await remoteDataSource.getStoryById(storyId);
          await localDataSource.cacheStory(story);
          return Right(story);
        } on AppException catch (e) {
          final cachedStory = await localDataSource.getCachedStory(storyId);
          if (cachedStory != null) {
            return Right(cachedStory);
          }
          return Left(_handleException(e));
        }
      } else {
        final cachedStory = await localDataSource.getCachedStory(storyId);
        if (cachedStory != null) {
          return Right(cachedStory);
        }
        return const Left(NetworkFailure(message: 'No internet connection'));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Story>>> getUserStories(String userId) async {
    try {
      final isConnected = await _isConnected();

      if (isConnected) {
        try {
          final stories = await remoteDataSource.getUserStories(userId);
          await localDataSource.cacheUserStories(userId, stories);
          return Right(stories);
        } on AppException catch (e) {
          final cachedStories = await localDataSource.getCachedUserStories(userId);
          if (cachedStories.isNotEmpty) {
            return Right(cachedStories);
          }
          return Left(_handleException(e));
        }
      } else {
        final cachedStories = await localDataSource.getCachedUserStories(userId);
        if (cachedStories.isNotEmpty) {
          return Right(cachedStories);
        }
        return const Left(NetworkFailure(message: 'No internet connection'));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Story>>> getMyStories() async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        final stories = await remoteDataSource.getMyStories();
        return Right(stories);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Story>> createStory({
    required XFile mediaFile,
    String? caption,
    String? backgroundColor,
    int? duration,
  }) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        final story = await remoteDataSource.createStory(
          mediaFile: mediaFile,
          caption: caption,
          backgroundColor: backgroundColor,
          duration: duration,
        );

        // Cache the newly created story
        await localDataSource.cacheStory(story);

        return Right(story);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteStory(String storyId) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        await remoteDataSource.deleteStory(storyId);
        
        // Remove from cache
        await localDataSource.removeCachedStory(storyId);

        return const Right(null);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> viewStory(String storyId) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        // Fail silently for view tracking when offline
        return const Right(null);
      }

      try {
        await remoteDataSource.viewStory(storyId);

        // Update cached story to mark as viewed
        final cachedStory = await localDataSource.getCachedStory(storyId);
        if (cachedStory != null) {
          final updatedStory = StoryModel(
            id: cachedStory.id,
            userId: cachedStory.userId,
            creator: cachedStory.creator,
            media: cachedStory.media,
            viewers: cachedStory.viewers,
            createdAt: cachedStory.createdAt,
            expiresAt: cachedStory.expiresAt,
            isViewed: true,
            viewCount: cachedStory.viewCount + 1,
            caption: cachedStory.caption,
            backgroundColor: cachedStory.backgroundColor,
          );
          await localDataSource.cacheStory(updatedStory);
        }

        return const Right(null);
      } on AppException {
        // Fail silently for view tracking
        return const Right(null);
      }
    } catch (e) {
      return const Right(null);
    }
  }

  @override
  Future<Either<Failure, List<StoryViewer>>> getStoryViewers(String storyId) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        final viewers = await remoteDataSource.getStoryViewers(storyId);
        return Right(viewers);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Story>>> getArchivedStories({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        final stories = await remoteDataSource.getArchivedStories(page, limit);
        return Right(stories);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> reportStory({
    required String storyId,
    required String reason,
    String? details,
  }) async {
    try {
      final isConnected = await _isConnected();

      if (!isConnected) {
        return const Left(NetworkFailure(message: 'No internet connection'));
      }

      try {
        await remoteDataSource.reportStory(
          storyId: storyId,
          reason: reason,
          details: details,
        );
        return const Right(null);
      } on AppException catch (e) {
        return Left(_handleException(e));
      }
    } catch (e) {
      return Left(UnexpectedFailure(message: e.toString()));
    }
  }

  /// Check if device is connected to internet
  Future<bool> _isConnected() async {
    final connectivityResult = await connectivity.checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  /// Convert AppException to Failure
  Failure _handleException(AppException exception) {
    if (exception is NetworkException) {
      return NetworkFailure(message: exception.message, code: exception.code);
    } else if (exception is ServerException) {
      return ServerFailure(message: exception.message, code: exception.code);
    } else if (exception is AuthException) {
      return AuthFailure(message: exception.message, code: exception.code);
    } else if (exception is CacheException) {
      return CacheFailure(message: exception.message, code: exception.code);
    } else if (exception is ValidationException) {
      return ValidationFailure(message: exception.message, code: exception.code);
    } else if (exception is MediaException) {
      return MediaFailure(message: exception.message, code: exception.code);
    } else if (exception is PermissionException) {
      return PermissionFailure(message: exception.message, code: exception.code);
    } else {
      return UnexpectedFailure(message: exception.message, code: exception.code);
    }
  }
}
