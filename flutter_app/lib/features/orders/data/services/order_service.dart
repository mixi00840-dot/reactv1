import '../../../../core/services/api_service.dart';
import '../models/order.dart';

class OrderService {
  final ApiService _apiService = ApiService();

  /// Get user orders
  Future<List<Order>> getOrders({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      };

      final response = await _apiService.get(
        '/orders',
        queryParameters: queryParams,
      );

      if (response['success'] == true && response['orders'] != null) {
        return (response['orders'] as List)
            .map((json) => Order.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  /// Get order by ID
  Future<Order?> getOrder(String orderId) async {
    try {
      final response = await _apiService.get('/orders/$orderId');

      if (response['success'] == true && response['order'] != null) {
        return Order.fromJson(response['order']);
      }

      return null;
    } catch (e) {
      print('Error fetching order: $e');
      return null;
    }
  }

  /// Cancel order
  Future<bool> cancelOrder(String orderId) async {
    try {
      final response = await _apiService.put(
        '/orders/$orderId/cancel',
      );

      return response['success'] == true;
    } catch (e) {
      print('Error cancelling order: $e');
      return false;
    }
  }

  /// Track order
  Future<Map<String, dynamic>?> trackOrder(String orderId) async {
    try {
      final response = await _apiService.get('/orders/$orderId/track');

      if (response['success'] == true && response['tracking'] != null) {
        return response['tracking'];
      }

      return null;
    } catch (e) {
      print('Error tracking order: $e');
      return null;
    }
  }
}
