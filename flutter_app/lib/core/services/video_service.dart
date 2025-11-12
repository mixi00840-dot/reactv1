import 'package:flutter/foundation.dart';
import '../models/video_model.dart';
import 'api_service.dart';

class VideoService {
  final ApiService _apiService = ApiService();

  // Get personalized video feed
  Future<List<VideoModel>> getPersonalizedFeed({
    int page = 1,
    int limit = 10,
    String? lastVideoId,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (lastVideoId != null) 'lastVideoId': lastVideoId,
      };

      final response = await _apiService.get('/feed', queryParameters: queryParams);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> videosData = response.data['data']['videos'] ?? [];
        return videosData.map((json) => VideoModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      // Use debugPrint to avoid spamming logs in release builds
      // and satisfy avoid_print lint
      debugPrint('Error fetching feed: $e');
      return [];
    }
  }

  // Get following feed
  Future<List<VideoModel>> getFollowingFeed({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        'following': 'true',
      };

      final response = await _apiService.get('/feed', queryParameters: queryParams);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> videosData = response.data['data']['videos'] ?? [];
        return videosData.map((json) => VideoModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching following feed: $e');
      return [];
    }
  }

  // Record video view
  Future<void> recordView(String videoId) async {
    try {
      await _apiService.post('/content/$videoId/view');
    } catch (e) {
      debugPrint('Error recording view: $e');
    }
  }

  // Get video details
  Future<VideoModel?> getVideoDetails(String videoId) async {
    try {
      final response = await _apiService.get('/content/$videoId');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return VideoModel.fromJson(response.data['data']);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching video details: $e');
      return null;
    }
  }
}
