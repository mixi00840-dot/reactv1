import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/store_model.dart';

class StoreProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  StoreModel? _currentStore;
  List<StoreModel> _stores = [];
  bool _isLoading = false;
  String? _error;
  
  StoreModel? get currentStore => _currentStore;
  List<StoreModel> get stores => _stores;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasStore => _currentStore != null;
  
  /// Load stores
  Future<void> loadStores({
    String? category,
    bool? isVerified,
    bool? isFeatured,
    String? search,
    int limit = 20,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final storesData = await _apiService.getStores(
        category: category,
        isVerified: isVerified,
        isFeatured: isFeatured,
        search: search,
        limit: limit,
      );
      
      _stores = storesData
          .map((json) => StoreModel.fromJson(json))
          .toList();
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading stores: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load store by ID
  Future<void> loadStore(String storeId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final storeData = await _apiService.getStore(storeId);
      _currentStore = StoreModel.fromJson(storeData);
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading store: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Create store
  Future<bool> createStore({
    required String name,
    String? description,
    String? logo,
    String? banner,
    Map<String, dynamic>? businessInfo,
    Map<String, dynamic>? shipping,
    Map<String, dynamic>? policies,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final storeData = await _apiService.createStore(
        name: name,
        description: description,
        logo: logo,
        banner: banner,
        businessInfo: businessInfo,
        shipping: shipping,
        policies: policies,
      );
      
      _currentStore = StoreModel.fromJson(storeData);
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error creating store: $e');
      return false;
    }
  }
  
  /// Clear current store
  void clearStore() {
    _currentStore = null;
    notifyListeners();
  }
}

