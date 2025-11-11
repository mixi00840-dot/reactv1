import 'api_service.dart';

class InteractionService {
  final ApiService _apiService = ApiService();

  // Toggle like on a video
  Future<Map<String, dynamic>> toggleLike(String videoId) async {
    try {
      final response = await _apiService.post('/content/$videoId/like');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'isLiked': response.data['data']['isLiked'],
          'likesCount': response.data['data']['likesCount'],
        };
      }
      return {'success': false};
    } catch (e) {
      print('Error toggling like: $e');
      return {'success': false};
    }
  }

  // Share a video
  Future<Map<String, dynamic>> shareVideo(String videoId) async {
    try {
      final response = await _apiService.post('/content/$videoId/share');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'sharesCount': response.data['data']['sharesCount'],
        };
      }
      return {'success': false};
    } catch (e) {
      print('Error sharing video: $e');
      return {'success': false};
    }
  }

  // Get comments for a video
  Future<List<Map<String, dynamic>>> getComments(
    String videoId, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final response = await _apiService.get(
        '/content/$videoId/comments',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> comments = response.data['data']['comments'] ?? [];
        return comments.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      print('Error fetching comments: $e');
      return [];
    }
  }

  // Post a comment
  Future<Map<String, dynamic>> postComment(String videoId, String text) async {
    try {
      final response = await _apiService.post(
        '/content/$videoId/comments',
        data: {'text': text},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'comment': response.data['data']['comment'],
          'commentsCount': response.data['data']['commentsCount'],
        };
      }
      return {'success': false};
    } catch (e) {
      print('Error posting comment: $e');
      return {'success': false};
    }
  }

  // Report a video
  Future<bool> reportVideo(String videoId, String reason, String description) async {
    try {
      final response = await _apiService.post(
        '/content/$videoId/report',
        data: {
          'reason': reason,
          'description': description,
        },
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      print('Error reporting video: $e');
      return false;
    }
  }
}
