import '../models/product_model_simple.dart';
import '../../../core/services/api_service.dart';

/// Service for order-related API calls
class OrderApiService {
  final ApiService _apiService = ApiService();

  OrderApiService();

  /// Create new order
  Future<Order> createOrder({
    required String addressId,
    required String paymentMethodId,
    String? notes,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/orders',
        data: {
          'addressId': addressId,
          'paymentMethodId': paymentMethodId,
          if (notes != null) 'notes': notes,
        },
      );
      return Order.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get user's orders
  Future<List<Order>> getOrders({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final response = await _apiService.dio.get(
        '/orders',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null) 'status': status,
        },
      );
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get order by ID
  Future<Order> getOrderById(String orderId) async {
    try {
      final response = await _apiService.dio.get('/orders/$orderId');
      return Order.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Cancel order
  Future<Order> cancelOrder(String orderId) async {
    try {
      final response = await _apiService.dio.post('/orders/$orderId/cancel');
      return Order.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get saved addresses
  Future<List<Address>> getAddresses() async {
    try {
      final response = await _apiService.dio.get('/user/addresses');
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => Address.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Add new address
  Future<Address> addAddress(Address address) async {
    try {
      final response = await _apiService.dio.post(
        '/user/addresses',
        data: address.toJson(),
      );
      return Address.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Update address
  Future<Address> updateAddress(String addressId, Address address) async {
    try {
      final response = await _apiService.dio.put(
        '/user/addresses/$addressId',
        data: address.toJson(),
      );
      return Address.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Delete address
  Future<void> deleteAddress(String addressId) async {
    try {
      await _apiService.dio.delete('/user/addresses/$addressId');
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Get saved payment methods
  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await _apiService.dio.get('/user/payment-methods');
      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => PaymentMethod.fromJson(json)).toList();
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }

  /// Add payment method
  Future<PaymentMethod> addPaymentMethod(PaymentMethod method) async {
    try {
      final response = await _apiService.dio.post(
        '/user/payment-methods',
        data: method.toJson(),
      );
      return PaymentMethod.fromJson(response.data['data']);
    } catch (e) {
      throw _apiService.handleError(e);
    }
  }
}
