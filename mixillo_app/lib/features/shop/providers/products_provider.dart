import 'package:flutter/material.dart';
import '../../../core/services/api_helper.dart';
import '../models/product_model.dart';

class ProductsProvider extends ChangeNotifier {
  final ApiHelper _api = ApiHelper();
  
  List<ProductModel> _products = [];
  ProductModel? _currentProduct;
  List<ProductModel> _featuredProducts = [];
  List<ProductModel> _trendingProducts = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedCategory;
  
  List<ProductModel> get products => _products;
  ProductModel? get currentProduct => _currentProduct;
  List<ProductModel> get featuredProducts => _featuredProducts;
  List<ProductModel> get trendingProducts => _trendingProducts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedCategory => _selectedCategory;
  
  /// Load products
  Future<void> loadProducts({
    String? storeId,
    String? category,
    String? status,
    int limit = 20,
    String? orderBy,
    String? order,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/products', queryParameters: {
        if (storeId != null) 'storeId': storeId,
        if (category != null) 'category': category,
        if (status != null) 'status': status,
        'limit': limit,
        if (orderBy != null) 'orderBy': orderBy,
        if (order != null) 'order': order,
      });
      final productsData = response.data['data'] ?? [];
      
      _products = productsData
          .map((json) => ProductModel.fromJson(json))
          .toList();
      
      // Update featured and trending
      _featuredProducts = _products.where((p) => p.isFeatured).toList();
      _trendingProducts = _products.where((p) => p.isTrending).toList();
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading products: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load product by ID
  Future<void> loadProduct(String productId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/products/$productId');
      final productData = response.data['data'];
      _currentProduct = ProductModel.fromJson(productData);
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading product: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Search products
  Future<void> searchProducts(String query) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/products/search', queryParameters: {'query': query});
      final productsData = response.data['data'] ?? [];
      _products = productsData
          .map((json) => ProductModel.fromJson(json))
          .toList();
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error searching products: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Filter by category
  void filterByCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }
  
  /// Get filtered products
  List<ProductModel> getFilteredProducts() {
    if (_selectedCategory == null) return _products;
    return _products.where((p) => p.category == _selectedCategory).toList();
  }
  
  /// Refresh products
  Future<void> refresh() async {
    await loadProducts();
  }
}

