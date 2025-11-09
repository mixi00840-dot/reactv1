import '../../../core/services/api_service.dart';
import '../../../core/config/api_config.dart';

class ProductService {
  final ApiService _api = ApiService();

  // Get all products with pagination and filters
  Future<Map<String, dynamic>> getProducts({
    int page = 1,
    int limit = 20,
    String? category,
    double? minPrice,
    double? maxPrice,
    double? minRating,
    bool? inStock,
    String? sortBy,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (category != null) queryParams['category'] = category;
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    if (minRating != null) queryParams['minRating'] = minRating.toString();
    if (inStock != null) queryParams['inStock'] = inStock.toString();
    if (sortBy != null) queryParams['sortBy'] = sortBy;
    if (search != null) queryParams['search'] = search;

    return await _api.get(ApiConfig.productsEndpoint, queryParameters: queryParams);
  }

  // Get product by ID
  Future<Map<String, dynamic>> getProductById(String productId) async {
    return await _api.get('${ApiConfig.productsEndpoint}/$productId');
  }

  // Get featured products
  Future<List<dynamic>> getFeaturedProducts() async {
    final response = await _api.get('${ApiConfig.productsEndpoint}/featured');
    return response['products'] ?? [];
  }

  // Get categories
  Future<List<dynamic>> getCategories() async {
    final response = await _api.get('${ApiConfig.productsEndpoint}/categories');
    return response['categories'] ?? [];
  }

  // Search products
  Future<Map<String, dynamic>> searchProducts(String query, {int page = 1}) async {
    return await _api.get(
      '${ApiConfig.productsEndpoint}/search',
      queryParameters: {
        'q': query,
        'page': page.toString(),
      },
    );
  }

  // Get similar products
  Future<List<dynamic>> getSimilarProducts(String productId) async {
    final response = await _api.get('${ApiConfig.productsEndpoint}/$productId/similar');
    return response['products'] ?? [];
  }
}
