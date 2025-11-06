import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/ar_filter_model.dart';

/// Camera Provider - Manages camera state, filters, and effects
class CameraProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  // Filter state
  List<ARFilterModel> _filters = [];
  List<ARFilterModel> _trendingFilters = [];
  List<ARFilterModel> _featuredFilters = [];
  ARFilterModel? _selectedFilter;
  FilterCategory? _selectedCategory;
  bool _isLoadingFilters = false;
  
  // Beauty effects state
  Map<BeautyType, double> _beautyEffects = {};
  bool _beautyModeEnabled = false;
  
  // Video speed state
  double _videoSpeed = 1.0;
  
  // Recording state
  List<Duration> _recordedSegments = [];
  bool _isMultiSegmentMode = false;
  
  // Getters
  List<ARFilterModel> get filters => _filters;
  List<ARFilterModel> get trendingFilters => _trendingFilters;
  List<ARFilterModel> get featuredFilters => _featuredFilters;
  ARFilterModel? get selectedFilter => _selectedFilter;
  FilterCategory? get selectedCategory => _selectedCategory;
  bool get isLoadingFilters => _isLoadingFilters;
  Map<BeautyType, double> get beautyEffects => _beautyEffects;
  bool get beautyModeEnabled => _beautyModeEnabled;
  double get videoSpeed => _videoSpeed;
  List<Duration> get recordedSegments => _recordedSegments;
  bool get isMultiSegmentMode => _isMultiSegmentMode;
  
  /// Load filters from backend
  Future<void> loadFilters({FilterCategory? category, FilterType? type}) async {
    _isLoadingFilters = true;
    notifyListeners();
    
    try {
      final filtersData = await _apiService.getFilters(
        category: category?.name,
        type: type?.name,
        limit: 100,
      );
      
      _filters = filtersData
          .map((json) => ARFilterModel.fromJson(json))
          .toList();
      
      _isLoadingFilters = false;
      notifyListeners();
    } catch (e) {
      _isLoadingFilters = false;
      notifyListeners();
      debugPrint('Error loading filters: $e');
    }
  }
  
  /// Load trending filters
  Future<void> loadTrendingFilters() async {
    try {
      final filtersData = await _apiService.getTrendingFilters(limit: 20);
      
      _trendingFilters = filtersData
          .map((json) => ARFilterModel.fromJson(json))
          .toList();
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading trending filters: $e');
    }
  }
  
  /// Load featured filters
  Future<void> loadFeaturedFilters() async {
    try {
      final filtersData = await _apiService.getFeaturedFilters(limit: 20);
      
      _featuredFilters = filtersData
          .map((json) => ARFilterModel.fromJson(json))
          .toList();
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading featured filters: $e');
    }
  }
  
  /// Select filter
  void selectFilter(ARFilterModel? filter) {
    _selectedFilter = filter;
    notifyListeners();
  }
  
  /// Select category
  void selectCategory(FilterCategory? category) {
    _selectedCategory = category;
    notifyListeners();
  }
  
  /// Set beauty effect intensity
  void setBeautyEffect(BeautyType type, double intensity) {
    _beautyEffects[type] = intensity.clamp(0.0, 1.0);
    notifyListeners();
  }
  
  /// Toggle beauty mode
  void toggleBeautyMode() {
    _beautyModeEnabled = !_beautyModeEnabled;
    if (!_beautyModeEnabled) {
      _beautyEffects.clear();
    }
    notifyListeners();
  }
  
  /// Set video speed
  void setVideoSpeed(double speed) {
    _videoSpeed = speed;
    notifyListeners();
  }
  
  /// Add recorded segment
  void addRecordedSegment(Duration duration) {
    _recordedSegments.add(duration);
    notifyListeners();
  }
  
  /// Clear recorded segments
  void clearRecordedSegments() {
    _recordedSegments.clear();
    notifyListeners();
  }
  
  /// Toggle multi-segment mode
  void toggleMultiSegmentMode() {
    _isMultiSegmentMode = !_isMultiSegmentMode;
    if (!_isMultiSegmentMode) {
      _recordedSegments.clear();
    }
    notifyListeners();
  }
  
  /// Apply filter to video/image
  Future<Map<String, dynamic>> applyFilterToMedia({
    required String mediaUrl,
    required bool isVideo,
  }) async {
    if (_selectedFilter == null) {
      return {'url': mediaUrl};
    }
    
    try {
      if (isVideo) {
        return await _apiService.processVideo(
          videoUrl: mediaUrl,
          filterId: _selectedFilter!.id,
          effects: {
            'beauty': _beautyModeEnabled ? _beautyEffects : null,
            'speed': _videoSpeed != 1.0 ? _videoSpeed : null,
          },
        );
      } else {
        // For images, apply filter via backend
        return await _apiService.applyFilter(
          _selectedFilter!.id,
          parameters: {
            'imageUrl': mediaUrl,
            'beauty': _beautyModeEnabled ? _beautyEffects : null,
          },
        );
      }
    } catch (e) {
      debugPrint('Error applying filter: $e');
      return {'url': mediaUrl}; // Return original on error
    }
  }
  
  /// Favorite filter
  Future<bool> favoriteFilter(String filterId) async {
    try {
      return await _apiService.favoriteFilter(filterId);
    } catch (e) {
      debugPrint('Error favoriting filter: $e');
      return false;
    }
  }
  
  /// Unlock premium filter
  Future<bool> unlockPremiumFilter(String filterId) async {
    try {
      return await _apiService.unlockFilter(filterId);
    } catch (e) {
      debugPrint('Error unlocking filter: $e');
      return false;
    }
  }
}

