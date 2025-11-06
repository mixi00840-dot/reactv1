import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/gift_model.dart';

class GiftsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<GiftModel> _gifts = [];
  List<String> _categories = [];
  List<GiftModel> _featuredGifts = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedCategory;
  
  List<GiftModel> get gifts => _gifts;
  List<String> get categories => _categories;
  List<GiftModel> get featuredGifts => _featuredGifts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedCategory => _selectedCategory;
  
  /// Load gift catalog
  Future<void> loadGifts({String? category, bool featured = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final giftsData = await _apiService.getGifts(
        category: category,
        featured: featured,
        limit: 100,
      );
      
      _gifts = giftsData
          .map((json) => GiftModel.fromJson(json))
          .where((gift) => gift.isAvailable)
          .toList();
      
      // Sort by order, then by price
      _gifts.sort((a, b) {
        if (a.order != b.order) return a.order.compareTo(b.order);
        return a.price.compareTo(b.price);
      });
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading gifts: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load gift categories
  Future<void> loadCategories() async {
    try {
      _categories = await _apiService.getGiftCategories();
    } catch (e) {
      print('Error loading categories: $e');
    }
  }
  
  /// Load featured gifts
  Future<void> loadFeaturedGifts() async {
    try {
      final giftsData = await _apiService.getGifts(featured: true, limit: 20);
      _featuredGifts = giftsData
          .map((json) => GiftModel.fromJson(json))
          .where((gift) => gift.isAvailable)
          .toList();
    } catch (e) {
      print('Error loading featured gifts: $e');
    }
  }
  
  /// Filter gifts by category
  void filterByCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }
  
  /// Get filtered gifts
  List<GiftModel> getFilteredGifts() {
    if (_selectedCategory == null) return _gifts;
    return _gifts.where((gift) => gift.category.name == _selectedCategory).toList();
  }
  
  /// Initialize - load all gift data
  Future<void> initialize() async {
    await Future.wait([
      loadCategories(),
      loadFeaturedGifts(),
      loadGifts(),
    ]);
  }
  
  /// Refresh gifts
  Future<void> refresh() async {
    await initialize();
  }
}

