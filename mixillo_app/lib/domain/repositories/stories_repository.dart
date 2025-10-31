import 'package:dartz/dartz.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/error/failures.dart';
import '../entities/story.dart';

/// Repository interface for stories operations
/// Follows Clean Architecture principles
abstract class StoriesRepository {
  /// Get stories feed (all active stories from followed users)
  /// Returns list of StoryGroups grouped by user
  Future<Either<Failure, List<StoryGroup>>> getStoriesFeed();

  /// Get a specific story by ID
  Future<Either<Failure, Story>> getStoryById(String storyId);

  /// Get all active stories from a specific user
  Future<Either<Failure, List<Story>>> getUserStories(String userId);

  /// Get current user's stories
  Future<Either<Failure, List<Story>>> getMyStories();

  /// Create a new story
  /// [mediaFile] - Photo or video file to upload
  /// [caption] - Optional text caption
  /// [backgroundColor] - For text-only stories
  /// [duration] - Video duration in seconds (max 15s)
  Future<Either<Failure, Story>> createStory({
    required XFile mediaFile,
    String? caption,
    String? backgroundColor,
    int? duration,
  });

  /// Delete a story (only owner can delete)
  Future<Either<Failure, void>> deleteStory(String storyId);

  /// Mark a story as viewed by current user
  /// Backend tracks who viewed and when
  Future<Either<Failure, void>> viewStory(String storyId);

  /// Get list of viewers for a specific story
  /// Only story owner can see viewers
  Future<Either<Failure, List<StoryViewer>>> getStoryViewers(String storyId);

  /// Get archived stories (expired stories saved by user)
  /// Premium feature
  Future<Either<Failure, List<Story>>> getArchivedStories({
    int page = 1,
    int limit = 20,
  });

  /// Report a story for violating community guidelines
  Future<Either<Failure, void>> reportStory({
    required String storyId,
    required String reason,
    String? details,
  });
}
