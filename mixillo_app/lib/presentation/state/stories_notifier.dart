import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/usecase/usecase.dart';
import '../../domain/entities/story.dart';
import '../../domain/usecases/stories/create_story.dart';
import '../../domain/usecases/stories/delete_story.dart';
import '../../domain/usecases/stories/get_my_stories.dart';
import '../../domain/usecases/stories/get_stories_feed.dart';
import '../../domain/usecases/stories/get_story_by_id.dart';
import '../../domain/usecases/stories/get_story_viewers.dart';
import '../../domain/usecases/stories/get_user_stories.dart';
import '../../domain/usecases/stories/view_story.dart';
import 'stories_state.dart';

/// StateNotifier for managing stories state
class StoriesNotifier extends StateNotifier<StoriesState> {
  final GetStoriesFeed getStoriesFeed;
  final GetStoryById getStoryById;
  final GetUserStories getUserStories;
  final GetMyStories getMyStories;
  final CreateStory createStory;
  final DeleteStory deleteStory;
  final ViewStory viewStory;
  final GetStoryViewers getStoryViewers;

  StoriesNotifier({
    required this.getStoriesFeed,
    required this.getStoryById,
    required this.getUserStories,
    required this.getMyStories,
    required this.createStory,
    required this.deleteStory,
    required this.viewStory,
    required this.getStoryViewers,
  }) : super(const StoriesState());

  /// Load stories feed
  Future<void> loadStories({bool refresh = false}) async {
    if (refresh) {
      state = state.copyWith(storyGroups: [], isLoading: true, errorMessage: null);
    } else {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }

    final result = await getStoriesFeed(NoParams());

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (storyGroups) {
        state = state.copyWith(
          storyGroups: storyGroups,
          isLoading: false,
          errorMessage: null,
        );
      },
    );
  }

  /// Load current user's stories
  Future<void> loadMyStories() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await getMyStories(NoParams());

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (stories) {
        state = state.copyWith(
          currentUserStories: stories,
          isLoading: false,
          errorMessage: null,
        );
      },
    );
  }

  /// Load stories for a specific user
  Future<List<Story>> loadUserStories(String userId) async {
    final result = await getUserStories(GetUserStoriesParams(userId: userId));

    return result.fold(
      (failure) => [],
      (stories) => stories,
    );
  }

  /// Create a new story
  Future<bool> createNewStory({
    required XFile mediaFile,
    String? caption,
    String? backgroundColor,
    int? duration,
  }) async {
    state = state.copyWith(isCreating: true, errorMessage: null);

    final result = await createStory(CreateStoryParams(
      mediaFile: mediaFile,
      caption: caption,
      backgroundColor: backgroundColor,
      duration: duration,
    ));

    return result.fold(
      (failure) {
        state = state.copyWith(
          isCreating: false,
          errorMessage: failure.message,
        );
        return false;
      },
      (story) {
        // Add to current user stories
        final updatedStories = [story, ...state.currentUserStories];
        state = state.copyWith(
          currentUserStories: updatedStories,
          isCreating: false,
          errorMessage: null,
        );
        
        // Refresh feed to show new story
        loadStories(refresh: true);
        return true;
      },
    );
  }

  /// Delete a story
  Future<bool> removeStory(String storyId) async {
    final result = await deleteStory(IdParams(storyId));

    return result.fold(
      (failure) {
        state = state.copyWith(errorMessage: failure.message);
        return false;
      },
      (_) {
        // Remove from current user stories
        final updatedStories = state.currentUserStories
            .where((story) => story.id != storyId)
            .toList();
        state = state.copyWith(currentUserStories: updatedStories);
        
        // Refresh feed
        loadStories(refresh: true);
        return true;
      },
    );
  }

  /// Mark a story as viewed
  Future<void> markStoryViewed(String storyId) async {
    await viewStory(IdParams(storyId));

    // Update local state to mark as viewed
    final updatedGroups = state.storyGroups.map((group) {
      final updatedStories = group.stories.map((story) {
        if (story.id == storyId) {
          return story.copyWith(isViewed: true);
        }
        return story;
      }).toList();

      final hasUnviewed = updatedStories.any((story) => !story.isViewed);

      return group.copyWith(
        stories: updatedStories,
        hasUnviewed: hasUnviewed,
      );
    }).toList();

    state = state.copyWith(storyGroups: updatedGroups);
  }

  /// Get viewers for a story
  Future<List<StoryViewer>> getViewers(String storyId) async {
    final result = await getStoryViewers(IdParams(storyId));

    return result.fold(
      (failure) => [],
      (viewers) => viewers,
    );
  }

  /// Navigate to next story in current group
  void nextStory() {
    final currentGroup = state.storyGroups[state.currentGroupIndex];
    final nextIndex = state.currentStoryIndex + 1;

    if (nextIndex < currentGroup.stories.length) {
      // Move to next story in current group
      state = state.copyWith(
        currentStoryIndex: nextIndex,
        currentStory: currentGroup.stories[nextIndex],
      );
    } else {
      // Move to next group
      nextGroup();
    }
  }

  /// Navigate to previous story in current group
  void previousStory() {
    if (state.currentStoryIndex > 0) {
      // Move to previous story in current group
      final currentGroup = state.storyGroups[state.currentGroupIndex];
      final prevIndex = state.currentStoryIndex - 1;
      
      state = state.copyWith(
        currentStoryIndex: prevIndex,
        currentStory: currentGroup.stories[prevIndex],
      );
    } else {
      // Move to previous group
      previousGroup();
    }
  }

  /// Navigate to next group
  void nextGroup() {
    final nextGroupIndex = state.currentGroupIndex + 1;

    if (nextGroupIndex < state.storyGroups.length) {
      final nextGroup = state.storyGroups[nextGroupIndex];
      state = state.copyWith(
        currentGroupIndex: nextGroupIndex,
        currentStoryIndex: 0,
        currentStory: nextGroup.firstStory,
      );
    }
  }

  /// Navigate to previous group
  void previousGroup() {
    if (state.currentGroupIndex > 0) {
      final prevGroupIndex = state.currentGroupIndex - 1;
      final prevGroup = state.storyGroups[prevGroupIndex];
      
      state = state.copyWith(
        currentGroupIndex: prevGroupIndex,
        currentStoryIndex: 0,
        currentStory: prevGroup.firstStory,
      );
    }
  }

  /// Set current story for viewing
  void setCurrentStory(int groupIndex, int storyIndex) {
    if (groupIndex < state.storyGroups.length) {
      final group = state.storyGroups[groupIndex];
      if (storyIndex < group.stories.length) {
        state = state.copyWith(
          currentGroupIndex: groupIndex,
          currentStoryIndex: storyIndex,
          currentStory: group.stories[storyIndex],
        );
      }
    }
  }
}
