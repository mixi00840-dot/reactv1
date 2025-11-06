import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/video_model.dart';

class FeedProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<VideoModel> _videos = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;
  String? _error;
  int? _currentVideoIndex;
  
  List<VideoModel> get videos => _videos;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  String? get error => _error;
  int? get currentVideoIndex => _currentVideoIndex;
  
  /// Load feed videos
  Future<void> loadFeed({bool refresh = false}) async {
    if (_isLoading && !refresh) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      if (refresh) {
        _currentPage = 1;
        _videos = [];
        _hasMore = true;
      }
      
      final data = await _apiService.getFeed(
        limit: 20,
        page: _currentPage,
        type: 'for-you',
      );
      
      final List<dynamic> videosJson = data['videos'] ?? [];
      final List<VideoModel> newVideos = videosJson
          .map((json) => VideoModel.fromJson(json))
          .toList();
      
      if (refresh) {
        _videos = newVideos;
      } else {
        _videos.addAll(newVideos);
      }
      
      final pagination = data['pagination'] ?? {};
      _hasMore = pagination['hasMore'] ?? false;
      _currentPage++;
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading feed: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load more videos (pagination)
  Future<void> loadMore() async {
    if (!_hasMore || _isLoading) return;
    await loadFeed();
  }
  
  /// Like/Unlike a video
  Future<void> toggleLike(String videoId) async {
    try {
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index == -1) return;
      
      final video = _videos[index];
      final wasLiked = video.isLiked;
      
      // Optimistic update
      _videos[index] = video.copyWith(
        isLiked: !wasLiked,
        stats: video.stats.copyWith(
          likes: wasLiked ? video.stats.likes - 1 : video.stats.likes + 1,
        ),
      );
      notifyListeners();
      
      // Call API
      final result = await _apiService.toggleLike(videoId);
      
      // Update with server response
      _videos[index] = video.copyWith(
        isLiked: result['liked'] ?? !wasLiked,
        stats: video.stats.copyWith(
          likes: result['likeCount'] ?? video.stats.likes,
        ),
      );
      notifyListeners();
    } catch (e) {
      // Revert on error
      final index = _videos.indexWhere((v) => v.id == videoId);
      if (index != -1) {
        final video = _videos[index];
        _videos[index] = video.copyWith(
          isLiked: !video.isLiked,
          stats: video.stats.copyWith(
            likes: video.isLiked ? video.stats.likes - 1 : video.stats.likes + 1,
          ),
        );
        notifyListeners();
      }
      print('Error toggling like: $e');
    }
  }
  
  /// Follow/Unfollow creator
  Future<void> toggleFollow(String userId) async {
    try {
      final result = await _apiService.toggleFollow(userId);
      
      // Update all videos from this creator
      _videos = _videos.map((video) {
        if (video.creator.id == userId) {
          return video.copyWith(
            isFollowing: result['isFollowing'] ?? !video.isFollowing,
          );
        }
        return video;
      }).toList();
      
      notifyListeners();
    } catch (e) {
      print('Error toggling follow: $e');
    }
  }
  
  /// Set current video index (for tracking)
  void setCurrentVideoIndex(int? index) {
    _currentVideoIndex = index;
    notifyListeners();
  }
  
  /// Refresh feed
  Future<void> refresh() async {
    await loadFeed(refresh: true);
  }
}

