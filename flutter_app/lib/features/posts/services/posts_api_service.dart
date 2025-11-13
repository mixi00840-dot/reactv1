import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../data/models/feed_post_model.dart';
import '../models/privacy_setting.dart';

/// Service for posts/feed API interactions
class PostsApiService {
  final ApiService _apiService;
  
  PostsApiService(this._apiService);

  /// Get personalized feed with pagination
  Future<FeedResponse> getFeed({
    String? cursor,
    int limit = 20,
    bool useAI = true,
  }) async {
    try {
      final response = await _apiService.dio.get(
        '/feed',
        queryParameters: {
          if (cursor != null) 'cursor': cursor,
          'limit': limit,
          'useAI': useAI.toString(),
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final posts = (data['videos'] as List? ?? data['posts'] as List? ?? [])
            .map((json) => FeedPost.fromJson(json))
            .toList();

        return FeedResponse(
          posts: posts,
          nextCursor: data['pagination']?['nextCursor'],
          hasMore: data['pagination']?['hasMore'] ?? false,
        );
      }

      throw Exception('Failed to load feed');
    } catch (e) {
      throw Exception('Error loading feed: $e');
    }
  }

  /// Create a new post
  Future<FeedPost> createPost({
    required List<String> mediaUrls,
    required String mediaType,
    String? thumbnailUrl,
    int? duration,
    String caption = '',
    List<String> hashtags = const [],
    List<String> mentions = const [],
    String? location,
    PrivacySetting privacy = PrivacySetting.public,
    bool allowComments = true,
    bool allowShare = true,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/posts',
        data: {
          'mediaUrls': mediaUrls,
          'mediaType': mediaType,
          if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
          if (duration != null) 'duration': duration,
          'caption': caption,
          'hashtags': hashtags,
          'mentions': mentions,
          if (location != null) 'location': location,
          'privacy': privacy.apiValue,
          'allowComments': allowComments,
          'allowShare': allowShare,
        },
      );

      if (response.data['success'] == true) {
        return FeedPost.fromJson(response.data['data']['post']);
      }

      throw Exception('Failed to create post');
    } catch (e) {
      throw Exception('Error creating post: $e');
    }
  }

  /// Like a post (optimistic update)
  Future<void> likePost(String postId) async {
    try {
      await _apiService.dio.post('/posts/$postId/like');
    } catch (e) {
      throw Exception('Error liking post: $e');
    }
  }

  /// Unlike a post
  Future<void> unlikePost(String postId) async {
    try {
      await _apiService.dio.delete('/posts/$postId/like');
    } catch (e) {
      throw Exception('Error unliking post: $e');
    }
  }

  /// Save/bookmark a post
  Future<void> savePost(String postId) async {
    try {
      await _apiService.dio.post('/posts/$postId/save');
    } catch (e) {
      throw Exception('Error saving post: $e');
    }
  }

  /// Unsave/unbookmark a post
  Future<void> unsavePost(String postId) async {
    try {
      await _apiService.dio.delete('/posts/$postId/save');
    } catch (e) {
      throw Exception('Error unsaving post: $e');
    }
  }

  /// Share a post
  Future<void> sharePost(String postId) async {
    try {
      await _apiService.dio.post('/posts/$postId/share');
    } catch (e) {
      throw Exception('Error sharing post: $e');
    }
  }

  /// Send a gift on a post
  Future<void> sendGift(String postId, String giftId) async {
    try {
      await _apiService.dio.post(
        '/posts/$postId/gift',
        data: {'giftId': giftId},
      );
    } catch (e) {
      throw Exception('Error sending gift: $e');
    }
  }

  /// Get comments for a post
  Future<List<FeedComment>> getComments(String postId, {int limit = 50}) async {
    try {
      final response = await _apiService.dio.get(
        '/posts/$postId/comments',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        final comments = (response.data['data']['comments'] as List)
            .map((json) => FeedComment.fromJson(json))
            .toList();
        return comments;
      }

      return [];
    } catch (e) {
      throw Exception('Error loading comments: $e');
    }
  }

  /// Post a comment
  Future<FeedComment> postComment(String postId, String text) async {
    try {
      final response = await _apiService.dio.post(
        '/posts/$postId/comments',
        data: {'text': text},
      );

      if (response.data['success'] == true) {
        return FeedComment.fromJson(response.data['data']['comment']);
      }

      throw Exception('Failed to post comment');
    } catch (e) {
      throw Exception('Error posting comment: $e');
    }
  }

  /// Like a comment
  Future<void> likeComment(String commentId) async {
    try {
      await _apiService.dio.post('/comments/$commentId/like');
    } catch (e) {
      throw Exception('Error liking comment: $e');
    }
  }

  /// Delete a comment
  Future<void> deleteComment(String commentId) async {
    try {
      await _apiService.dio.delete('/comments/$commentId');
    } catch (e) {
      throw Exception('Error deleting comment: $e');
    }
  }

  /// Upload media file with progress tracking
  Future<String> uploadMedia({
    required String filePath,
    required String mediaType,
    Function(double)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        'type': mediaType,
      });

      final response = await _apiService.dio.post(
        '/upload',
        data: formData,
        onSendProgress: (sent, total) {
          if (onProgress != null) {
            onProgress(sent / total);
          }
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['url'];
      }

      throw Exception('Upload failed');
    } catch (e) {
      throw Exception('Error uploading media: $e');
    }
  }
}

/// Feed response model
class FeedResponse {
  final List<FeedPost> posts;
  final String? nextCursor;
  final bool hasMore;

  FeedResponse({
    required this.posts,
    this.nextCursor,
    this.hasMore = false,
  });
}
