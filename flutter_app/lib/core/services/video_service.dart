import 'package:flutter/foundation.dart';
import '../models/video_model.dart';
import 'api_service.dart';

class VideoService {
  final ApiService _apiService = ApiService();

  // Mock data for offline/development mode
  static final List<VideoModel> _mockVideos = [
    VideoModel(
      id: 'mock-1',
      title: 'Welcome to Mixillo!',
      description: 'Discover amazing content from creators',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
      userId: 'user-1',
      username: 'mixillo_team',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      likesCount: 1234,
      commentsCount: 89,
      sharesCount: 45,
      viewsCount: 12345,
      isLiked: false,
      isBookmarked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    VideoModel(
      id: 'mock-2',
      title: 'Trending Now',
      description: 'Check out what\'s hot right now',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
      userId: 'user-2',
      username: 'creator_pro',
      userAvatar: 'https://i.pravatar.cc/150?img=2',
      likesCount: 5678,
      commentsCount: 234,
      sharesCount: 123,
      viewsCount: 45678,
      isLiked: false,
      isBookmarked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
    VideoModel(
      id: 'mock-3',
      title: 'Live Shopping',
      description: 'Shop while you watch!',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
      userId: 'user-3',
      username: 'shop_master',
      userAvatar: 'https://i.pravatar.cc/150?img=3',
      likesCount: 9012,
      commentsCount: 456,
      sharesCount: 234,
      viewsCount: 78901,
      isLiked: false,
      isBookmarked: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 8)),
    ),
  ];

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
      
      // Fallback to mock data if API returns empty
      debugPrint('Feed API returned empty, using mock data');
      return _mockVideos;
    } catch (e) {
      debugPrint('Error fetching feed: $e - Using mock data');
      // Return mock data for development/offline mode
      return _mockVideos;
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
      
      // Fallback to mock data
      debugPrint('Following feed API returned empty, using mock data');
      return _mockVideos;
    } catch (e) {
      debugPrint('Error fetching following feed: $e - Using mock data');
      return _mockVideos;
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
