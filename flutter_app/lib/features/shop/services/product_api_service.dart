import '../models/product_model_simple.dart';
import '../../../core/services/api_service.dart';

/// Service for product-related API calls
class ProductApiService {
  final ApiService _apiService = ApiService();

  ProductApiService();

  /// Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    try {
      print('🔍 Fetching featured products with limit: $limit');
      final response = await _apiService.get(
        '/products/featured',
        queryParameters: {'limit': limit},
      );

      print('✅ Featured products response: ${response.runtimeType}');
      print('   Response keys: ${response.keys}');
      final List<dynamic> data = response['products'] ?? response['data'] ?? [];
      print('   Products count: ${data.length}');
      
      final products = data.map((json) => Product.fromJson(json)).toList();
      print('✅ Successfully parsed ${products.length} featured products');
      return products;
    } catch (e) {
      print('❌ Error fetching featured products: $e');
      throw _apiService.handleError(e);
    }
  }

  /// Get products by category
  Future<List<Product>> getProductsByCategory(
    String category, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/products',
        queryParameters: {
          'category': category,
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response['products'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get product by ID
  Future<Product> getProductById(String id) async {
    try {
      final response = await _apiService.get('/products/$id');
      final productData = response['product'] ?? response['data'];
      return Product.fromJson(productData);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Search products
  Future<List<Product>> searchProducts(
    String query, {
    int page = 1,
    int limit = 20,
    String? category,
    double? minPrice,
    double? maxPrice,
    double? minRating,
    String? sortBy,
  }) async {
    try {
      final response = await _apiService.get(
        '/products/search',
        queryParameters: {
          'q': query,
          'page': page,
          'limit': limit,
          if (category != null) 'category': category,
          if (minPrice != null) 'minPrice': minPrice,
          if (maxPrice != null) 'maxPrice': maxPrice,
          if (minRating != null) 'minRating': minRating,
          if (sortBy != null) 'sortBy': sortBy,
        },
      );

      final List<dynamic> data = response['products'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get related products
  Future<List<Product>> getRelatedProducts(
    String productId, {
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/products/$productId/related',
        queryParameters: {'limit': limit},
      );

      final List<dynamic> data = response['products'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get product reviews
  Future<List<Review>> getProductReviews(
    String productId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/products/$productId/reviews',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response['reviews'] ?? [];
      return data.map((json) => Review.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get categories
  Future<List<Map<String, dynamic>>> getCategories() async {
    try {
      final response = await _apiService.get('/products/categories');
      return List<Map<String, dynamic>>.from(response['categories'] ?? []);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get user wishlist
  Future<List<Product>> getWishlist() async {
    try {
      final response = await _apiService.get('/users/wishlist');
      final List<dynamic> data = response['products'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Add product to wishlist
  Future<bool> addToWishlist(String productId) async {
    try {
      await _apiService.post('/users/wishlist', data: {'productId': productId});
      return true;
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Remove product from wishlist
  Future<bool> removeFromWishlist(String productId) async {
    try {
      await _apiService.delete('/users/wishlist/$productId');
      return true;
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }
}
