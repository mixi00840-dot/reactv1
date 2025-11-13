import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/story_model.dart';
import '../services/stories_api_service.dart';

/// Stories state
class StoriesState {
  final List<Story> stories;
  final bool isLoading;
  final String? error;
  final DateTime? lastRefresh;

  const StoriesState({
    this.stories = const [],
    this.isLoading = false,
    this.error,
    this.lastRefresh,
  });

  StoriesState copyWith({
    List<Story>? stories,
    bool? isLoading,
    String? error,
    DateTime? lastRefresh,
  }) {
    return StoriesState(
      stories: stories ?? this.stories,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastRefresh: lastRefresh ?? this.lastRefresh,
    );
  }
}

/// Stories notifier
class StoriesNotifier extends StateNotifier<StoriesState> {
  final StoriesApiService _storiesApiService;

  StoriesNotifier(this._storiesApiService) : super(const StoriesState());

  /// Load active stories (24h)
  /// [refresh] - If true, forces a refresh even if recently loaded
  Future<void> loadStories({bool refresh = false}) async {
    // Don't reload if already loading
    if (state.isLoading) return;

    // Skip refresh if loaded recently (within 5 minutes) and not forced
    if (!refresh && state.lastRefresh != null) {
      final timeSinceRefresh = DateTime.now().difference(state.lastRefresh!);
      if (timeSinceRefresh.inMinutes < 5) {
        return;
      }
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final stories = await _storiesApiService.getStories();
      
      // Filter out expired stories (24h check on client side as backup)
      final now = DateTime.now();
      final activeStories = stories.where((story) {
        final age = now.difference(story.createdAt);
        return age.inHours < 24;
      }).toList();

      state = StoriesState(
        stories: activeStories,
        isLoading: false,
        error: null,
        lastRefresh: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Create a new story
  /// [mediaUrl] - URL of uploaded media
  /// [type] - 'image' or 'video'
  /// [caption] - Optional caption
  /// [privacy] - Privacy setting
  /// [duration] - Video duration in seconds
  /// [thumbnailUrl] - Video thumbnail URL
  Future<Story?> createStory({
    required String mediaUrl,
    required String type,
    String? caption,
    String privacy = 'public',
    int? duration,
    String? thumbnailUrl,
  }) async {
    try {
      final story = await _storiesApiService.createStory(
        mediaUrl: mediaUrl,
        type: type,
        caption: caption,
        privacy: privacy,
        duration: duration,
        thumbnailUrl: thumbnailUrl,
      );

      // Add story to the beginning of the list (most recent first)
      state = state.copyWith(
        stories: [story, ...state.stories],
        lastRefresh: DateTime.now(),
      );

      return story;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Delete a story
  /// [storyId] - ID of the story to delete
  Future<bool> deleteStory(String storyId) async {
    // Optimistic update - remove immediately
    final originalStories = state.stories;
    state = state.copyWith(
      stories: state.stories.where((s) => s.id != storyId).toList(),
    );

    try {
      await _storiesApiService.deleteStory(storyId);
      return true;
    } catch (e) {
      // Revert on error
      state = state.copyWith(
        stories: originalStories,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Mark a story as viewed
  /// [storyId] - ID of the story to mark as viewed
  Future<void> markViewed(String storyId) async {
    // Update local state immediately
    final updatedStories = state.stories.map((story) {
      if (story.id == storyId && !story.isViewed) {
        return story.copyWith(
          isViewed: true,
          viewsCount: story.viewsCount + 1,
        );
      }
      return story;
    }).toList();

    state = state.copyWith(stories: updatedStories);

    // Call API (can fail silently)
    try {
      await _storiesApiService.viewStory(storyId);
    } catch (e) {
      // Don't revert or show error - viewing can fail silently
      print('Failed to mark story as viewed: $e');
    }
  }

  /// Add a new story (for Socket.io events)
  /// [story] - Story object to add
  void addStory(Story story) {
    // Check if story already exists
    if (state.stories.any((s) => s.id == story.id)) {
      return;
    }

    state = state.copyWith(
      stories: [story, ...state.stories],
    );
  }

  /// Remove a story (for Socket.io events)
  /// [storyId] - ID of the story to remove
  void removeStory(String storyId) {
    state = state.copyWith(
      stories: state.stories.where((s) => s.id != storyId).toList(),
    );
  }

  /// Update a story (for Socket.io events)
  /// [updatedStory] - Updated story object
  void updateStory(Story updatedStory) {
    final updatedStories = state.stories.map((story) {
      if (story.id == updatedStory.id) {
        return updatedStory;
      }
      return story;
    }).toList();

    state = state.copyWith(stories: updatedStories);
  }

  /// Upload media for story creation
  /// [filePath] - Local file path
  /// [mediaType] - 'image' or 'video'
  /// [onProgress] - Upload progress callback
  /// 
  /// Returns uploaded media URL
  Future<String?> uploadMedia({
    required String filePath,
    required String mediaType,
    void Function(double progress)? onProgress,
  }) async {
    try {
      return await _storiesApiService.uploadMedia(
        filePath: filePath,
        mediaType: mediaType,
        onProgress: onProgress,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Generate thumbnail for video
  /// [videoPath] - Local video file path
  /// 
  /// Returns thumbnail URL
  Future<String?> generateThumbnail(String videoPath) async {
    try {
      return await _storiesApiService.generateThumbnail(videoPath);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Get viewers for a story
  /// [storyId] - ID of the story
  Future<List<StoryViewer>> getViewers(String storyId) async {
    try {
      return await _storiesApiService.getViewers(storyId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return [];
    }
  }

  /// Clear error message
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Stories provider
final storiesProvider = StateNotifierProvider<StoriesNotifier, StoriesState>(
  (ref) => StoriesNotifier(StoriesApiService()),
);
