import '../models/product_model_simple.dart';
import '../../../core/services/api_service.dart';

/// Service for cart-related API calls
class CartApiService {
  final ApiService _apiService = ApiService();

  CartApiService();

  /// Get user's cart
  Future<List<CartItem>> getCart() async {
    try {
      final response = await _apiService.dio.get('/cart');
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => CartItem.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Add item to cart
  Future<CartItem> addToCart({
    required String productId,
    required int quantity,
    String? size,
    String? color,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/cart/add',
        data: {
          'productId': productId,
          'quantity': quantity,
          if (size != null) 'size': size,
          if (color != null) 'color': color,
        },
      );
      return CartItem.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Update cart item quantity
  Future<CartItem> updateCartItem({
    required String cartItemId,
    required int quantity,
  }) async {
    try {
      final response = await _apiService.dio.put(
        '/cart/$cartItemId',
        data: {'quantity': quantity},
      );
      return CartItem.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Remove item from cart
  Future<void> removeFromCart(String cartItemId) async {
    try {
      await _apiService.dio.delete('/cart/$cartItemId');
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Clear entire cart
  Future<void> clearCart() async {
    try {
      await _apiService.dio.delete('/cart/clear');
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get cart summary (totals)
  Future<Map<String, dynamic>> getCartSummary() async {
    try {
      final response = await _apiService.dio.get('/cart/summary');
      return response.data['data'];
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }
}
