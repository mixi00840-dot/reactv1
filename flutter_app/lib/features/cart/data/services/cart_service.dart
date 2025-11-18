import '../../../../core/services/api_service.dart';
import '../models/cart.dart';

class CartService {
  final ApiService _apiService = ApiService();

  /// Get user's cart
  Future<Cart?> getCart() async {
    try {
      final response = await _apiService.get('/cart');

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error fetching cart: $e');
      return null;
    }
  }

  /// Add item to cart
  Future<Cart?> addItem({
    required String productId,
    int quantity = 1,
    String? variantId,
  }) async {
    try {
      final response = await _apiService.post(
        '/cart/items',
        data: {
          'productId': productId,
          'quantity': quantity,
          if (variantId != null) 'variantId': variantId,
        },
      );

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error adding to cart: $e');
      return null;
    }
  }

  /// Update cart item quantity
  Future<Cart?> updateItem({
    required String itemId,
    required int quantity,
  }) async {
    try {
      final response = await _apiService.put(
        '/cart/items/$itemId',
        data: {'quantity': quantity},
      );

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error updating cart item: $e');
      return null;
    }
  }

  /// Remove item from cart
  Future<Cart?> removeItem(String itemId) async {
    try {
      final response = await _apiService.delete('/cart/items/$itemId');

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error removing cart item: $e');
      return null;
    }
  }

  /// Update item quantity (alias for updateItem)
  Future<Cart?> updateQuantity({required String itemId, required int quantity}) async {
    return updateItem(itemId, quantity);
  }

  /// Apply coupon code
  Future<Cart?> applyCoupon(String couponCode) async {
    try {
      final response = await _apiService.post(
        '/cart/apply-coupon',
        data: {'code': couponCode},
      );

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error applying coupon: $e');
      return null;
    }
  }

  /// Remove coupon
  Future<Cart?> removeCoupon() async {
    try {
      final response = await _apiService.delete('/cart/remove-coupon');

      if (response['success'] == true && response['cart'] != null) {
        return Cart.fromJson(response['cart']);
      }

      return null;
    } catch (e) {
      print('Error removing coupon: $e');
      return null;
    }
  }

  /// Clear cart
  Future<bool> clearCart() async {
    try {
      final response = await _apiService.delete('/cart');

      return response['success'] == true;
    } catch (e) {
      print('Error clearing cart: $e');
      return false;
    }
  }

  /// Checkout cart
  Future<Map<String, dynamic>?> checkout({
    required String addressId,
    required String paymentMethodId,
    String? couponCode,
  }) async {
    try {
      final response = await _apiService.post(
        '/cart/checkout',
        data: {
          'addressId': addressId,
          'paymentMethodId': paymentMethodId,
          if (couponCode != null) 'couponCode': couponCode,
        },
      );

      if (response['success'] == true) {
        return response;
      }

      return null;
    } catch (e) {
      print('Error checking out: $e');
      return null;
    }
  }
}
