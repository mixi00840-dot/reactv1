import '../../../core/services/api_service.dart';
import '../../../core/config/api_config.dart';

class CartService {
  final ApiService _api = ApiService();

  // Get user's cart
  Future<Map<String, dynamic>> getCart() async {
    return await _api.get(ApiConfig.cartEndpoint);
  }

  // Add item to cart
  Future<Map<String, dynamic>> addToCart({
    required String productId,
    required int quantity,
    String? variantId,
  }) async {
    return await _api.post(
      '${ApiConfig.cartEndpoint}/add',
      {
        'productId': productId,
        'quantity': quantity,
        if (variantId != null) 'variantId': variantId,
      },
    );
  }

  // Update cart item quantity
  Future<Map<String, dynamic>> updateQuantity({
    required String cartItemId,
    required int quantity,
  }) async {
    return await _api.put(
      '${ApiConfig.cartEndpoint}/$cartItemId',
      {'quantity': quantity},
    );
  }

  // Remove item from cart
  Future<Map<String, dynamic>> removeFromCart(String cartItemId) async {
    return await _api.delete('${ApiConfig.cartEndpoint}/$cartItemId');
  }

  // Clear cart
  Future<void> clearCart() async {
    await _api.delete('${ApiConfig.cartEndpoint}/clear');
  }

  // Apply coupon
  Future<Map<String, dynamic>> applyCoupon(String couponCode) async {
    return await _api.post(
      '${ApiConfig.cartEndpoint}/coupon',
      {'code': couponCode},
    );
  }

  // Remove coupon
  Future<void> removeCoupon() async {
    await _api.delete('${ApiConfig.cartEndpoint}/coupon');
  }

  // Get cart summary (subtotal, tax, shipping, total)
  Future<Map<String, dynamic>> getCartSummary() async {
    return await _api.get('${ApiConfig.cartEndpoint}/summary');
  }
}
