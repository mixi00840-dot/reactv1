import 'package:hive_flutter/hive_flutter.dart';

import '../models/story_model.dart';

/// Local data source for stories caching
/// Uses Hive for offline-first approach
/// Stories are cached for 24 hours (until expiration)
abstract class StoriesLocalDataSource {
  Future<List<StoryGroupModel>> getCachedStoriesFeed();
  Future<void> cacheStoriesFeed(List<StoryGroupModel> storyGroups);
  Future<StoryModel?> getCachedStory(String storyId);
  Future<void> cacheStory(StoryModel story);
  Future<List<StoryModel>> getCachedUserStories(String userId);
  Future<void> cacheUserStories(String userId, List<StoryModel> stories);
  Future<void> clearCache();
  Future<void> removeCachedStory(String storyId);
  Future<void> removeExpiredStories();
}

class StoriesLocalDataSourceImpl implements StoriesLocalDataSource {
  final Box cacheBox;

  StoriesLocalDataSourceImpl(this.cacheBox);

  static const String _storiesFeedKey = 'stories_feed';
  static const String _storyPrefix = 'story_';
  static const String _userStoriesPrefix = 'user_stories_';
  static const String _timestampSuffix = '_timestamp';

  // Cache TTL: 24 hours (stories expire after 24h anyway)
  static const Duration _cacheDuration = Duration(hours: 24);

  @override
  Future<List<StoryGroupModel>> getCachedStoriesFeed() async {
    try {
      final timestamp = cacheBox.get('$_storiesFeedKey$_timestampSuffix') as int?;
      
      if (timestamp == null) {
        return [];
      }

      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();

      // Check if cache is expired
      if (now.difference(cacheTime) > _cacheDuration) {
        await cacheBox.delete(_storiesFeedKey);
        await cacheBox.delete('$_storiesFeedKey$_timestampSuffix');
        return [];
      }

      final List<dynamic>? cachedData = cacheBox.get(_storiesFeedKey);
      if (cachedData == null) {
        return [];
      }

      return cachedData
          .map((json) => StoryGroupModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (e) {
      return [];
    }
  }

  @override
  Future<void> cacheStoriesFeed(List<StoryGroupModel> storyGroups) async {
    try {
      final data = storyGroups.map((group) => group.toJson()).toList();
      await cacheBox.put(_storiesFeedKey, data);
      await cacheBox.put(
        '$_storiesFeedKey$_timestampSuffix',
        DateTime.now().millisecondsSinceEpoch,
      );
    } catch (e) {
      // Fail silently - caching errors shouldn't break the app
    }
  }

  @override
  Future<StoryModel?> getCachedStory(String storyId) async {
    try {
      final timestamp = cacheBox.get('$_storyPrefix$storyId$_timestampSuffix') as int?;
      
      if (timestamp == null) {
        return null;
      }

      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();

      if (now.difference(cacheTime) > _cacheDuration) {
        await removeCachedStory(storyId);
        return null;
      }

      final cachedData = cacheBox.get('$_storyPrefix$storyId');
      if (cachedData == null) {
        return null;
      }

      return StoryModel.fromJson(Map<String, dynamic>.from(cachedData));
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> cacheStory(StoryModel story) async {
    try {
      await cacheBox.put('$_storyPrefix${story.id}', story.toJson());
      await cacheBox.put(
        '$_storyPrefix${story.id}$_timestampSuffix',
        DateTime.now().millisecondsSinceEpoch,
      );
    } catch (e) {
      // Fail silently
    }
  }

  @override
  Future<List<StoryModel>> getCachedUserStories(String userId) async {
    try {
      final timestamp = cacheBox.get('$_userStoriesPrefix$userId$_timestampSuffix') as int?;
      
      if (timestamp == null) {
        return [];
      }

      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();

      if (now.difference(cacheTime) > _cacheDuration) {
        await cacheBox.delete('$_userStoriesPrefix$userId');
        await cacheBox.delete('$_userStoriesPrefix$userId$_timestampSuffix');
        return [];
      }

      final List<dynamic>? cachedData = cacheBox.get('$_userStoriesPrefix$userId');
      if (cachedData == null) {
        return [];
      }

      return cachedData
          .map((json) => StoryModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (e) {
      return [];
    }
  }

  @override
  Future<void> cacheUserStories(String userId, List<StoryModel> stories) async {
    try {
      final data = stories.map((story) => story.toJson()).toList();
      await cacheBox.put('$_userStoriesPrefix$userId', data);
      await cacheBox.put(
        '$_userStoriesPrefix$userId$_timestampSuffix',
        DateTime.now().millisecondsSinceEpoch,
      );
    } catch (e) {
      // Fail silently
    }
  }

  @override
  Future<void> clearCache() async {
    try {
      final keys = cacheBox.keys.where((key) =>
          key.toString().startsWith(_storiesFeedKey) ||
          key.toString().startsWith(_storyPrefix) ||
          key.toString().startsWith(_userStoriesPrefix));

      for (final key in keys) {
        await cacheBox.delete(key);
      }
    } catch (e) {
      // Fail silently
    }
  }

  @override
  Future<void> removeCachedStory(String storyId) async {
    try {
      await cacheBox.delete('$_storyPrefix$storyId');
      await cacheBox.delete('$_storyPrefix$storyId$_timestampSuffix');
    } catch (e) {
      // Fail silently
    }
  }

  @override
  Future<void> removeExpiredStories() async {
    try {
      final now = DateTime.now();
      final keys = cacheBox.keys.where((key) =>
          key.toString().startsWith(_storyPrefix) &&
          key.toString().endsWith(_timestampSuffix));

      for (final key in keys) {
        final timestamp = cacheBox.get(key) as int?;
        if (timestamp != null) {
          final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (now.difference(cacheTime) > _cacheDuration) {
            final storyId = key
                .toString()
                .replaceFirst(_storyPrefix, '')
                .replaceFirst(_timestampSuffix, '');
            await removeCachedStory(storyId);
          }
        }
      }
    } catch (e) {
      // Fail silently
    }
  }
}
