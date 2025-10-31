import 'package:hive/hive.dart';
import '../../core/error/exceptions.dart';
import '../models/comment_model.dart';

/// Local data source for comments
/// Handles caching of comments using Hive
abstract class CommentsLocalDataSource {
  /// Get cached comments for a content item
  Future<List<CommentModel>> getCachedComments(String contentId);

  /// Cache comments for a content item
  Future<void> cacheComments(String contentId, List<CommentModel> comments);

  /// Get a cached comment by ID
  Future<CommentModel?> getCachedComment(String commentId);

  /// Cache a single comment
  Future<void> cacheComment(CommentModel comment);

  /// Remove a comment from cache
  Future<void> removeCachedComment(String commentId);

  /// Clear all cached comments
  Future<void> clearCache();

  /// Remove expired cached comments (older than 10 minutes)
  Future<void> removeExpiredComments();
}

/// Implementation of CommentsLocalDataSource using Hive
class CommentsLocalDataSourceImpl implements CommentsLocalDataSource {
  static const String _commentsBoxName = 'comments_cache';
  static const String _contentCommentsBoxName = 'content_comments_cache';
  static const String _timestampBoxName = 'comments_timestamp';
  static const Duration _cacheDuration = Duration(minutes: 10);

  late Box<Map<dynamic, dynamic>> _commentsBox;
  late Box<List<dynamic>> _contentCommentsBox;
  late Box<int> _timestampBox;

  CommentsLocalDataSourceImpl() {
    _initBoxes();
  }

  Future<void> _initBoxes() async {
    _commentsBox = await Hive.openBox<Map<dynamic, dynamic>>(_commentsBoxName);
    _contentCommentsBox =
        await Hive.openBox<List<dynamic>>(_contentCommentsBoxName);
    _timestampBox = await Hive.openBox<int>(_timestampBoxName);
  }

  @override
  Future<List<CommentModel>> getCachedComments(String contentId) async {
    try {
      await _initBoxes();

      // Check if cache is expired
      final timestamp = _timestampBox.get('content_$contentId');
      if (timestamp != null) {
        final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
        if (DateTime.now().difference(cacheTime) > _cacheDuration) {
          await _contentCommentsBox.delete(contentId);
          await _timestampBox.delete('content_$contentId');
          throw CacheException('Cache expired');
        }
      }

      final cachedData = _contentCommentsBox.get(contentId);
      if (cachedData == null || cachedData.isEmpty) {
        throw CacheException('No cached comments found');
      }

      return cachedData
          .map((json) => CommentModel.fromJson(
              Map<String, dynamic>.from(json as Map<dynamic, dynamic>)))
          .toList();
    } catch (e) {
      if (e is CacheException) rethrow;
      throw CacheException('Failed to get cached comments: ${e.toString()}');
    }
  }

  @override
  Future<void> cacheComments(
      String contentId, List<CommentModel> comments) async {
    try {
      await _initBoxes();

      final commentsJson = comments.map((comment) => comment.toJson()).toList();
      await _contentCommentsBox.put(contentId, commentsJson);
      await _timestampBox.put(
          'content_$contentId', DateTime.now().millisecondsSinceEpoch);

      // Also cache individual comments for quick lookup
      for (final comment in comments) {
        await cacheComment(comment);
      }
    } catch (e) {
      throw CacheException('Failed to cache comments: ${e.toString()}');
    }
  }

  @override
  Future<CommentModel?> getCachedComment(String commentId) async {
    try {
      await _initBoxes();

      // Check if cache is expired
      final timestamp = _timestampBox.get('comment_$commentId');
      if (timestamp != null) {
        final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
        if (DateTime.now().difference(cacheTime) > _cacheDuration) {
          await _commentsBox.delete(commentId);
          await _timestampBox.delete('comment_$commentId');
          return null;
        }
      }

      final cachedData = _commentsBox.get(commentId);
      if (cachedData == null) {
        return null;
      }

      return CommentModel.fromJson(
          Map<String, dynamic>.from(cachedData as Map<dynamic, dynamic>));
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> cacheComment(CommentModel comment) async {
    try {
      await _initBoxes();

      await _commentsBox.put(comment.id, comment.toJson());
      await _timestampBox.put(
          'comment_${comment.id}', DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      throw CacheException('Failed to cache comment: ${e.toString()}');
    }
  }

  @override
  Future<void> removeCachedComment(String commentId) async {
    try {
      await _initBoxes();

      await _commentsBox.delete(commentId);
      await _timestampBox.delete('comment_$commentId');
    } catch (e) {
      throw CacheException('Failed to remove cached comment: ${e.toString()}');
    }
  }

  @override
  Future<void> clearCache() async {
    try {
      await _initBoxes();

      await _commentsBox.clear();
      await _contentCommentsBox.clear();
      await _timestampBox.clear();
    } catch (e) {
      throw CacheException('Failed to clear cache: ${e.toString()}');
    }
  }

  @override
  Future<void> removeExpiredComments() async {
    try {
      await _initBoxes();

      final now = DateTime.now();
      final timestampKeys = _timestampBox.keys.toList();

      for (final key in timestampKeys) {
        final timestamp = _timestampBox.get(key);
        if (timestamp != null) {
          final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (now.difference(cacheTime) > _cacheDuration) {
            final keyStr = key.toString();
            if (keyStr.startsWith('comment_')) {
              final commentId = keyStr.substring(8);
              await _commentsBox.delete(commentId);
            } else if (keyStr.startsWith('content_')) {
              final contentId = keyStr.substring(8);
              await _contentCommentsBox.delete(contentId);
            }
            await _timestampBox.delete(key);
          }
        }
      }
    } catch (e) {
      throw CacheException(
          'Failed to remove expired comments: ${e.toString()}');
    }
  }
}
