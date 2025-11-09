import 'package:flutter/material.dart';
import '../../../core/services/api_helper.dart';
import '../models/trending_model.dart';

class SearchProvider extends ChangeNotifier {
  final ApiHelper _api = ApiHelper();
  
  SearchResultModel? _searchResults;
  List<TrendingHashtagModel> _trendingHashtags = [];
  List<TrendingVideoModel> _trendingVideos = [];
  List<TrendingUserModel> _trendingUsers = [];
  List<String> _searchHistory = [];
  bool _isLoading = false;
  String? _error;
  String? _currentQuery;
  
  SearchResultModel? get searchResults => _searchResults;
  List<TrendingHashtagModel> get trendingHashtags => _trendingHashtags;
  List<TrendingVideoModel> get trendingVideos => _trendingVideos;
  List<TrendingUserModel> get trendingUsers => _trendingUsers;
  List<String> get searchHistory => _searchHistory;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get currentQuery => _currentQuery;
  
  /// Search (all types)
  Future<void> search(String query, {String type = 'all'}) async {
    if (query.trim().isEmpty) {
      _searchResults = null;
      _currentQuery = null;
      notifyListeners();
      return;
    }
    
    _isLoading = true;
    _error = null;
    _currentQuery = query;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/search', queryParameters: {
        'query': query,
        'type': type,
      });
      
      if (response.data['success'] == true) {
        _searchResults = SearchResultModel.fromJson(response.data['data'] ?? response.data);
        
        // Add to search history
        if (!_searchHistory.contains(query)) {
          _searchHistory.insert(0, query);
          if (_searchHistory.length > 10) {
            _searchHistory = _searchHistory.take(10).toList();
          }
        }
        
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Search failed');
      }
    } catch (e) {
      _error = e.toString();
      print('Error searching: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load trending hashtags
  Future<void> loadTrendingHashtags({int limit = 20}) async {
    try {
      final response = await _api.dio.get(
        '/trending/hashtags',
        queryParameters: {'limit': limit},
      );
      
      if (response.data['success'] == true) {
        final hashtagsData = response.data['data'] ?? response.data['hashtags'] ?? [];
        _trendingHashtags = hashtagsData
            .map((json) => TrendingHashtagModel.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error loading trending hashtags: $e');
    }
  }
  
  /// Load trending videos
  Future<void> loadTrendingVideos({int limit = 50}) async {
    try {
      final response = await _api.dio.get(
        '/trending/global',
        queryParameters: {'limit': limit},
      );
      
      if (response.data['success'] == true) {
        final videosData = response.data['data'] ?? response.data['videos'] ?? [];
        _trendingVideos = videosData
            .map((json) => TrendingVideoModel.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error loading trending videos: $e');
    }
  }
  
  /// Load trending users
  Future<void> loadTrendingUsers({int limit = 20}) async {
    try {
      // Use search with empty query to get trending users
      // Or use a dedicated endpoint if available
      final response = await _api.dio.get(
        '/users',
        queryParameters: {
          'limit': limit,
          'sort': 'followers',
        },
      );
      
      if (response.data['success'] == true) {
        final usersData = response.data['data']?['users'] ?? response.data['users'] ?? [];
        _trendingUsers = usersData
            .map((json) => TrendingUserModel.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error loading trending users: $e');
    }
  }
  
  /// Load explore feed
  Future<List<TrendingVideoModel>> loadExploreFeed({
    int limit = 50,
    String? country,
    List<String>? categories,
  }) async {
    try {
      final response = await _api.dio.get(
        '/trending/explore',
        queryParameters: {
          'limit': limit,
          if (country != null) 'country': country,
          if (categories != null) 'categories': categories.join(','),
        },
      );
      
      if (response.data['success'] == true) {
        final videosData = response.data['data'] ?? [];
        return videosData
            .map((json) => TrendingVideoModel.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error loading explore feed: $e');
      return [];
    }
  }
  
  /// Clear search
  void clearSearch() {
    _searchResults = null;
    _currentQuery = null;
    notifyListeners();
  }
  
  /// Clear search history
  void clearSearchHistory() {
    _searchHistory.clear();
    notifyListeners();
  }
  
  /// Initialize - load trending content
  Future<void> initialize() async {
    await Future.wait([
      loadTrendingHashtags(),
      loadTrendingVideos(),
      loadTrendingUsers(),
    ]);
  }
  
  /// Refresh trending content
  Future<void> refresh() async {
    await initialize();
  }
}

