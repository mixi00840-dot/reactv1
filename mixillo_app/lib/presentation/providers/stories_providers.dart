import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/app_providers.dart';
import '../../data/datasources/stories_local_datasource.dart';
import '../../data/datasources/stories_remote_datasource.dart';
import '../../data/repositories/stories_repository_impl.dart';
import '../../domain/repositories/stories_repository.dart';
import '../../domain/usecases/stories/create_story.dart';
import '../../domain/usecases/stories/delete_story.dart';
import '../../domain/usecases/stories/get_my_stories.dart';
import '../../domain/usecases/stories/get_stories_feed.dart';
import '../../domain/usecases/stories/get_story_by_id.dart';
import '../../domain/usecases/stories/get_story_viewers.dart';
import '../../domain/usecases/stories/get_user_stories.dart';
import '../../domain/usecases/stories/view_story.dart';
import '../state/stories_notifier.dart';
import '../state/stories_state.dart';

/// Provider for StoriesRemoteDataSource
final storiesRemoteDataSourceProvider = Provider<StoriesRemoteDataSource>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return StoriesRemoteDataSourceImpl(dioClient);
});

/// Provider for StoriesLocalDataSource
final storiesLocalDataSourceProvider = Provider<StoriesLocalDataSource>((ref) {
  final cacheBox = ref.watch(cacheProvider);
  return StoriesLocalDataSourceImpl(cacheBox);
});

/// Provider for StoriesRepository
final storiesRepositoryProvider = Provider<StoriesRepository>((ref) {
  final remoteDataSource = ref.watch(storiesRemoteDataSourceProvider);
  final localDataSource = ref.watch(storiesLocalDataSourceProvider);
  final connectivity = ref.watch(connectivityProvider);

  return StoriesRepositoryImpl(
    remoteDataSource: remoteDataSource,
    localDataSource: localDataSource,
    connectivity: connectivity,
  );
});

/// Use Case Providers
final getStoriesFeedUseCaseProvider = Provider<GetStoriesFeed>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return GetStoriesFeed(repository);
});

final getStoryByIdUseCaseProvider = Provider<GetStoryById>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return GetStoryById(repository);
});

final getUserStoriesUseCaseProvider = Provider<GetUserStories>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return GetUserStories(repository);
});

final getMyStoriesUseCaseProvider = Provider<GetMyStories>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return GetMyStories(repository);
});

final createStoryUseCaseProvider = Provider<CreateStory>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return CreateStory(repository);
});

final deleteStoryUseCaseProvider = Provider<DeleteStory>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return DeleteStory(repository);
});

final viewStoryUseCaseProvider = Provider<ViewStory>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return ViewStory(repository);
});

final getStoryViewersUseCaseProvider = Provider<GetStoryViewers>((ref) {
  final repository = ref.watch(storiesRepositoryProvider);
  return GetStoryViewers(repository);
});

/// State Notifier Provider
final storiesNotifierProvider = StateNotifierProvider<StoriesNotifier, StoriesState>((ref) {
  return StoriesNotifier(
    getStoriesFeed: ref.watch(getStoriesFeedUseCaseProvider),
    getStoryById: ref.watch(getStoryByIdUseCaseProvider),
    getUserStories: ref.watch(getUserStoriesUseCaseProvider),
    getMyStories: ref.watch(getMyStoriesUseCaseProvider),
    createStory: ref.watch(createStoryUseCaseProvider),
    deleteStory: ref.watch(deleteStoryUseCaseProvider),
    viewStory: ref.watch(viewStoryUseCaseProvider),
    getStoryViewers: ref.watch(getStoryViewersUseCaseProvider),
  );
});
