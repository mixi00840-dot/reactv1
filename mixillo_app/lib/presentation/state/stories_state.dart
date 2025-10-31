import 'package:equatable/equatable.dart';

import '../../domain/entities/story.dart';

/// State for stories feature
class StoriesState extends Equatable {
  final List<StoryGroup> storyGroups;
  final List<Story> currentUserStories;
  final bool isLoading;
  final bool isCreating;
  final String? errorMessage;
  final Story? currentStory;
  final int currentStoryIndex;
  final int currentGroupIndex;

  const StoriesState({
    this.storyGroups = const [],
    this.currentUserStories = const [],
    this.isLoading = false,
    this.isCreating = false,
    this.errorMessage,
    this.currentStory,
    this.currentStoryIndex = 0,
    this.currentGroupIndex = 0,
  });

  StoriesState copyWith({
    List<StoryGroup>? storyGroups,
    List<Story>? currentUserStories,
    bool? isLoading,
    bool? isCreating,
    String? errorMessage,
    Story? currentStory,
    int? currentStoryIndex,
    int? currentGroupIndex,
  }) {
    return StoriesState(
      storyGroups: storyGroups ?? this.storyGroups,
      currentUserStories: currentUserStories ?? this.currentUserStories,
      isLoading: isLoading ?? this.isLoading,
      isCreating: isCreating ?? this.isCreating,
      errorMessage: errorMessage,
      currentStory: currentStory,
      currentStoryIndex: currentStoryIndex ?? this.currentStoryIndex,
      currentGroupIndex: currentGroupIndex ?? this.currentGroupIndex,
    );
  }

  @override
  List<Object?> get props => [
        storyGroups,
        currentUserStories,
        isLoading,
        isCreating,
        errorMessage,
        currentStory,
        currentStoryIndex,
        currentGroupIndex,
      ];
}
