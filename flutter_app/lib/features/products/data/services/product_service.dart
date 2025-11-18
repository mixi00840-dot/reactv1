import '../../../../core/services/api_service.dart';
import '../models/product.dart';

class ProductService {
  final ApiService _apiService = ApiService();

  /// Get products list
  Future<List<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? category,
    String? search,
    String? sortBy,
    double? minPrice,
    double? maxPrice,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        if (category != null) 'category': category,
        if (search != null) 'search': search,
        if (sortBy != null) 'sortBy': sortBy,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
      };

      final response = await _apiService.get(
        '/products',
        queryParameters: queryParams,
      );

      if (response['success'] == true && response['products'] != null) {
        return (response['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching products: $e');
      return [];
    }
  }

  /// Get product by ID
  Future<Product?> getProduct(String productId) async {
    try {
      final response = await _apiService.get('/products/$productId');

      if (response['success'] == true && response['product'] != null) {
        return Product.fromJson(response['product']);
      }

      return null;
    } catch (e) {
      print('Error fetching product: $e');
      return null;
    }
  }

  /// Get featured products
  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    try {
      final response = await _apiService.get(
        '/products/featured',
        queryParameters: {'limit': limit},
      );

      if (response['success'] == true && response['products'] != null) {
        return (response['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching featured products: $e');
      return [];
    }
  }

  /// Search products
  Future<List<Product>> searchProducts(String query, {int page = 1}) async {
    try {
      final response = await _apiService.get(
        '/products/search',
        queryParameters: {'q': query, 'page': page},
      );

      if (response['success'] == true && response['products'] != null) {
        return (response['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error searching products: $e');
      return [];
    }
  }
}
