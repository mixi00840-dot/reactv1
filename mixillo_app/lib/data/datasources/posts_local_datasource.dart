import 'package:hive/hive.dart';

import '../../core/error/exceptions.dart';
import '../models/post_model.dart';

/// Local Data Source for Posts - Handles Hive cache
abstract class PostsLocalDataSource {
  Future<List<PostModel>> getCachedPosts(String cacheKey);
  Future<void> cachePosts(String cacheKey, List<PostModel> posts);
  Future<PostModel?> getCachedPost(String postId);
  Future<void> cachePost(PostModel post);
  Future<void> clearCache();
  Future<void> removeCachedPost(String postId);
}

class PostsLocalDataSourceImpl implements PostsLocalDataSource {
  final Box<dynamic> cacheBox;

  // Cache keys
  static const String _postsPrefix = 'posts_';
  static const String _postPrefix = 'post_';
  static const String _timestampSuffix = '_timestamp';
  
  // Cache TTL: 15 minutes for feeds, 1 hour for individual posts
  static const Duration _feedCacheDuration = Duration(minutes: 15);
  static const Duration _postCacheDuration = Duration(hours: 1);

  PostsLocalDataSourceImpl(this.cacheBox);

  @override
  Future<List<PostModel>> getCachedPosts(String cacheKey) async {
    try {
      final key = '$_postsPrefix$cacheKey';
      final timestampKey = '$key$_timestampSuffix';

      // Check if cache exists and is not expired
      final timestamp = cacheBox.get(timestampKey) as int?;
      if (timestamp == null) return [];

      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();
      
      if (now.difference(cacheTime) > _feedCacheDuration) {
        // Cache expired
        await cacheBox.delete(key);
        await cacheBox.delete(timestampKey);
        return [];
      }

      final cached = cacheBox.get(key);
      if (cached == null) return [];

      // Deserialize posts
      final List<dynamic> jsonList = cached as List<dynamic>;
      return jsonList
          .map((json) => PostModel.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    } catch (e) {
      throw CacheException(message: 'Failed to get cached posts: $e');
    }
  }

  @override
  Future<void> cachePosts(String cacheKey, List<PostModel> posts) async {
    try {
      final key = '$_postsPrefix$cacheKey';
      final timestampKey = '$key$_timestampSuffix';

      // Serialize posts to JSON
      final jsonList = posts.map((post) => post.toJson()).toList();

      // Save to cache with timestamp
      await cacheBox.put(key, jsonList);
      await cacheBox.put(timestampKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      throw CacheException(message: 'Failed to cache posts: $e');
    }
  }

  @override
  Future<PostModel?> getCachedPost(String postId) async {
    try {
      final key = '$_postPrefix$postId';
      final timestampKey = '$key$_timestampSuffix';

      // Check if cache exists and is not expired
      final timestamp = cacheBox.get(timestampKey) as int?;
      if (timestamp == null) return null;

      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();
      
      if (now.difference(cacheTime) > _postCacheDuration) {
        // Cache expired
        await cacheBox.delete(key);
        await cacheBox.delete(timestampKey);
        return null;
      }

      final cached = cacheBox.get(key);
      if (cached == null) return null;

      return PostModel.fromJson(Map<String, dynamic>.from(cached));
    } catch (e) {
      throw CacheException(message: 'Failed to get cached post: $e');
    }
  }

  @override
  Future<void> cachePost(PostModel post) async {
    try {
      final key = '$_postPrefix${post.id}';
      final timestampKey = '$key$_timestampSuffix';

      // Save to cache with timestamp
      await cacheBox.put(key, post.toJson());
      await cacheBox.put(timestampKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      throw CacheException(message: 'Failed to cache post: $e');
    }
  }

  @override
  Future<void> clearCache() async {
    try {
      // Delete all posts-related cache entries
      final keysToDelete = cacheBox.keys.where((key) {
        final keyStr = key.toString();
        return keyStr.startsWith(_postsPrefix) || 
               keyStr.startsWith(_postPrefix);
      }).toList();

      for (final key in keysToDelete) {
        await cacheBox.delete(key);
      }
    } catch (e) {
      throw CacheException(message: 'Failed to clear cache: $e');
    }
  }

  @override
  Future<void> removeCachedPost(String postId) async {
    try {
      final key = '$_postPrefix$postId';
      final timestampKey = '$key$_timestampSuffix';

      await cacheBox.delete(key);
      await cacheBox.delete(timestampKey);
    } catch (e) {
      throw CacheException(message: 'Failed to remove cached post: $e');
    }
  }
}
