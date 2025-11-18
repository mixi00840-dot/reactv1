import '../../../../core/services/api_service.dart';
import '../models/content.dart';
import '../models/comment.dart';

class ContentService {
  final ApiService _apiService = ApiService();

  /// Get content feed (For You page)
  Future<List<Content>> getFeed({int page = 1, int limit = 10}) async {
    try {
      final response = await _apiService.get(
        '/content/feed',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response['success'] == true && response['contents'] != null) {
        return (response['contents'] as List)
            .map((json) => Content.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching feed: $e');
      return [];
    }
  }

  /// Get content by ID
  Future<Content?> getContent(String contentId) async {
    try {
      final response = await _apiService.get('/content/$contentId');

      if (response['success'] == true && response['content'] != null) {
        return Content.fromJson(response['content']);
      }

      return null;
    } catch (e) {
      print('Error fetching content: $e');
      return null;
    }
  }

  /// Like/unlike content
  Future<bool> toggleLike(String contentId) async {
    try {
      final response = await _apiService.post('/content/$contentId/like');

      return response['success'] == true;
    } catch (e) {
      print('Error toggling like: $e');
      return false;
    }
  }

  /// Get comments for content
  Future<List<Comment>> getComments(String contentId,
      {int page = 1, int limit = 20}) async {
    try {
      final response = await _apiService.get(
        '/content/$contentId/comments',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response['success'] == true && response['comments'] != null) {
        return (response['comments'] as List)
            .map((json) => Comment.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching comments: $e');
      return [];
    }
  }

  /// Post a comment
  Future<Comment?> postComment(String contentId, String text,
      {String? parentCommentId}) async {
    try {
      final response = await _apiService.post(
        '/content/$contentId/comment',
        data: {
          'text': text,
          if (parentCommentId != null) 'parentCommentId': parentCommentId,
        },
      );

      if (response['success'] == true && response['comment'] != null) {
        return Comment.fromJson(response['comment']);
      }

      return null;
    } catch (e) {
      print('Error posting comment: $e');
      return null;
    }
  }

  /// Share content
  Future<bool> shareContent(String contentId) async {
    try {
      final response = await _apiService.post('/content/$contentId/share');

      return response['success'] == true;
    } catch (e) {
      print('Error sharing content: $e');
      return false;
    }
  }

  /// Record view
  Future<bool> recordView(String contentId) async {
    try {
      final response = await _apiService.post('/content/$contentId/view');

      return response['success'] == true;
    } catch (e) {
      print('Error recording view: $e');
      return false;
    }
  }
}
