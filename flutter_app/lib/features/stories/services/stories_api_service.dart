import 'package:dio/dio.dart';
import '../../../core/services/api_service.dart';
import '../data/models/story_model.dart';

/// Stories API Service
/// Handles all API calls related to stories (24-hour temporary content)
class StoriesApiService {
  final ApiService _apiService;

  StoriesApiService({ApiService? apiService}) 
      : _apiService = apiService ?? ApiService();

  /// Get active stories from followed users and own stories
  /// Stories are automatically filtered by 24h expiry on backend
  Future<List<Story>> getStories() async {
    try {
      final response = await _apiService.get('/api/stories');
      
      if (response['success'] == true) {
        // For now return empty list - Story model needs fromJson implementation
        return [];
      }
      
      throw Exception(response['message'] ?? 'Failed to load stories');
    } catch (e) {
      throw Exception('Failed to load stories: $e');
    }
  }

  /// Create a new story
  /// [mediaUrl] - URL of uploaded media (image or video)
  /// [type] - 'image' or 'video'
  /// [caption] - Optional caption text
  /// [privacy] - Privacy setting: 'public', 'friends', or 'private'
  /// [duration] - Video duration in seconds (for videos only)
  /// [thumbnailUrl] - Thumbnail URL (for videos)
  /// 
  /// Returns the created Story object
  Future<Story> createStory({
    required String mediaUrl,
    required String type,
    String? caption,
    String privacy = 'public',
    int? duration,
    String? thumbnailUrl,
  }) async {
    try {
      final data = {
        'mediaUrl': mediaUrl,
        'type': type,
        'caption': caption,
        'privacy': privacy,
        if (duration != null) 'duration': duration,
        if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      };

      final response = await _apiService.post('/api/stories', data: data);
      
      if (response['success'] == true) {
        // For now return a placeholder - Story model needs fromJson implementation
        throw Exception('Story creation not fully implemented yet');
      }
      
      throw Exception(response['message'] ?? 'Failed to create story');
    } catch (e) {
      throw Exception('Failed to create story: $e');
    }
  }

  /// Delete a story by ID
  /// Only the story owner can delete their stories
  Future<void> deleteStory(String storyId) async {
    try {
      final response = await _apiService.delete('/api/stories/$storyId');
      
      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to delete story');
      }
    } catch (e) {
      throw Exception('Failed to delete story: $e');
    }
  }

  /// Mark a story as viewed
  /// Increments view count and adds current user to viewers list
  Future<void> viewStory(String storyId) async {
    try {
      final response = await _apiService.post(
        '/api/stories/$storyId/view',
        data: {},
      );
      
      if (response['success'] != true) {
        throw Exception(response['message'] ?? 'Failed to view story');
      }
    } catch (e) {
      // Viewing can fail silently - don't disrupt user experience
      // Just log the error
      print('Failed to mark story as viewed: $e');
    }
  }

  /// Get list of viewers for a story
  /// Only the story owner can see who viewed their stories
  /// 
  /// Returns list of viewer objects with user info and viewed timestamp
  Future<List<StoryViewer>> getViewers(String storyId) async {
    try {
      final response = await _apiService.get('/api/stories/$storyId/viewers');
      
      if (response['success'] == true) {
        final List<dynamic> viewersData = response['data'] ?? [];
        return viewersData.map((json) => StoryViewer.fromJson(json)).toList();
      }
      
      throw Exception(response['message'] ?? 'Failed to load viewers');
    } catch (e) {
      throw Exception('Failed to load viewers: $e');
    }
  }

  /// Upload media file for story
  /// [filePath] - Local file path
  /// [mediaType] - 'image' or 'video'
  /// [onProgress] - Optional callback for upload progress (0.0 to 1.0)
  /// 
  /// Returns the uploaded media URL
  Future<String> uploadMedia({
    required String filePath,
    required String mediaType,
    void Function(double progress)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        'type': mediaType,
      });

      // Use Dio directly for multipart with progress
      final dio = _apiService.dioInstance;
      final response = await dio.post(
        '/api/upload/story',
        data: formData,
        onSendProgress: (sent, total) {
          if (onProgress != null && total > 0) {
            onProgress(sent / total);
          }
        },
      );

      final responseData = response.data as Map<String, dynamic>;
      if (responseData['success'] == true) {
        return responseData['data']['url'] as String;
      }

      throw Exception(responseData['message'] ?? 'Failed to upload media');
    } catch (e) {
      throw Exception('Failed to upload media: $e');
    }
  }

  /// Generate thumbnail for video
  /// [videoPath] - Local video file path
  /// 
  /// Returns the thumbnail URL
  Future<String> generateThumbnail(String videoPath) async {
    try {
      final formData = FormData.fromMap({
        'video': await MultipartFile.fromFile(videoPath),
      });

      final response = await _apiService.post(
        '/api/upload/thumbnail',
        data: formData,
      );

      if (response['success'] == true) {
        return response['data']['url'] as String;
      }

      throw Exception(response['message'] ?? 'Failed to generate thumbnail');
    } catch (e) {
      throw Exception('Failed to generate thumbnail: $e');
    }
  }
}

/// Story viewer model
class StoryViewer {
  final String userId;
  final String username;
  final String? avatar;
  final bool isVerified;
  final DateTime viewedAt;

  StoryViewer({
    required this.userId,
    required this.username,
    this.avatar,
    this.isVerified = false,
    required this.viewedAt,
  });

  factory StoryViewer.fromJson(Map<String, dynamic> json) {
    return StoryViewer(
      userId: json['userId'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      avatar: json['avatar'],
      isVerified: json['isVerified'] ?? false,
      viewedAt: DateTime.parse(json['viewedAt'] ?? json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
