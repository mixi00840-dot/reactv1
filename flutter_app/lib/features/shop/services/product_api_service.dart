import '../models/product_model.dart';
import 'api_service.dart';

/// Service for product-related API calls
class ProductApiService {
  final ApiService _apiService;

  ProductApiService(this._apiService);

  /// Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    try {
      final response = await _apiService.dio.get(
        '/products/featured',
        queryParameters: {'limit': limit},
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
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
      final response = await _apiService.dio.get(
        '/products/category/$category',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Product.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get product by ID
  Future<Product> getProductById(String id) async {
    try {
      final response = await _apiService.dio.get('/products/$id');
      return Product.fromJson(response.data['data']);
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
      final response = await _apiService.dio.get(
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

      final List<dynamic> data = response.data['data'] ?? [];
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
      final response = await _apiService.dio.get(
        '/products/$productId/related',
        queryParameters: {'limit': limit},
      );

      final List<dynamic> data = response.data['data'] ?? [];
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
      final response = await _apiService.dio.get(
        '/products/$productId/reviews',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Review.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get categories
  Future<List<Map<String, dynamic>>> getCategories() async {
    try {
      final response = await _apiService.dio.get('/products/categories');
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }
}
