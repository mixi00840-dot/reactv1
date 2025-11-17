import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Shipping Service - Order tracking
/// Integrates with backend /api/shipping endpoints
class ShippingService {
  final ApiService _apiService = ApiService();

  /// Get shipping for order
  Future<ShippingModel> getShipping(String orderId) async {
    try {
      final response = await _apiService.get('/shipping/order/$orderId');
      return ShippingModel.fromJson(response['data']['shipping']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get shipping by ID
  Future<ShippingModel> getShippingById(String shippingId) async {
    try {
      final response = await _apiService.get('/shipping/$shippingId');
      return ShippingModel.fromJson(response['data']['shipping']);
    } catch (e) {
      rethrow;
    }
  }

  /// Track shipment by tracking number
  Future<ShippingModel> trackShipment(String trackingNumber) async {
    try {
      final response = await _apiService.get('/shipping/track/$trackingNumber');
      return ShippingModel.fromJson(response['data']['shipping']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get all user's shipments
  Future<List<ShippingModel>> getMyShipments({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/shipping/my-shipments',
        queryParameters: {
          if (status != null) 'status': status,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['shipments'] as List)
          .map((json) => ShippingModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get active shipments (in progress)
  Future<List<ShippingModel>> getActiveShipments() async {
    try {
      final response = await _apiService.get('/shipping/active');
      return (response['data']['shipments'] as List)
          .map((json) => ShippingModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get delivered shipments
  Future<List<ShippingModel>> getDeliveredShipments({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/shipping/delivered',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['shipments'] as List)
          .map((json) => ShippingModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Calculate shipping cost
  Future<double> calculateShippingCost({
    required String countryCode,
    required double weight,
    required String shippingMethod,
  }) async {
    try {
      final response = await _apiService.post('/shipping/calculate', data: {
        'countryCode': countryCode,
        'weight': weight,
        'shippingMethod': shippingMethod,
      });
      return (response['data']['cost'] ?? 0).toDouble();
    } catch (e) {
      rethrow;
    }
  }

  /// Get available shipping methods
  Future<List<Map<String, dynamic>>> getShippingMethods({
    required String countryCode,
  }) async {
    try {
      final response = await _apiService.get(
        '/shipping/methods',
        queryParameters: {
          'countryCode': countryCode,
        },
      );
      return List<Map<String, dynamic>>.from(response['data']['methods'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Update shipping address
  Future<ShippingModel> updateAddress({
    required String shippingId,
    required ShippingAddress address,
  }) async {
    try {
      final response = await _apiService.put(
        '/shipping/$shippingId/address',
        data: address.toJson(),
      );
      return ShippingModel.fromJson(response['data']['shipping']);
    } catch (e) {
      rethrow;
    }
  }

  /// Report delivery issue
  Future<void> reportIssue({
    required String shippingId,
    required String issueType,
    required String description,
    List<String>? images,
  }) async {
    try {
      await _apiService.post('/shipping/$shippingId/report-issue', data: {
        'issueType': issueType,
        'description': description,
        if (images != null) 'images': images,
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Confirm delivery
  Future<ShippingModel> confirmDelivery(String shippingId) async {
    try {
      final response =
          await _apiService.post('/shipping/$shippingId/confirm-delivery');
      return ShippingModel.fromJson(response['data']['shipping']);
    } catch (e) {
      rethrow;
    }
  }

  /// Request return/exchange
  Future<Map<String, dynamic>> requestReturn({
    required String shippingId,
    required String reason,
    String? description,
    List<String>? images,
  }) async {
    try {
      final response =
          await _apiService.post('/shipping/$shippingId/return', data: {
        'reason': reason,
        if (description != null) 'description': description,
        if (images != null) 'images': images,
      });
      return response['data'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Get estimated delivery date
  Future<DateTime?> getEstimatedDelivery({
    required String countryCode,
    required String shippingMethod,
  }) async {
    try {
      final response =
          await _apiService.post('/shipping/estimate-delivery', data: {
        'countryCode': countryCode,
        'shippingMethod': shippingMethod,
      });
      final dateStr = response['data']['estimatedDelivery'];
      return dateStr != null ? DateTime.parse(dateStr) : null;
    } catch (e) {
      rethrow;
    }
  }
}
