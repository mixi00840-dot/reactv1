import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Live Shopping Service - Live commerce
/// Integrates with backend /api/live-shopping endpoints
class LiveShoppingService {
  final ApiService _apiService = ApiService();

  /// Get active live shopping sessions
  Future<List<LiveShoppingSessionModel>> getActiveSessions({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/live-shopping/active',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['sessions'] as List)
          .map((json) => LiveShoppingSessionModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get session by ID
  Future<LiveShoppingSessionModel> getSession(String sessionId) async {
    try {
      final response =
          await _apiService.get('/live-shopping/sessions/$sessionId');
      return LiveShoppingSessionModel.fromJson(response['data']['session']);
    } catch (e) {
      rethrow;
    }
  }

  /// Start live shopping session
  Future<LiveShoppingSessionModel> startSession({
    required String liveStreamId,
    required List<String> productIds,
  }) async {
    try {
      final response = await _apiService.post('/live-shopping/start', data: {
        'liveStreamId': liveStreamId,
        'productIds': productIds,
      });
      return LiveShoppingSessionModel.fromJson(response['data']['session']);
    } catch (e) {
      rethrow;
    }
  }

  /// End live shopping session
  Future<LiveShoppingSessionModel> endSession(String sessionId) async {
    try {
      final response =
          await _apiService.post('/live-shopping/sessions/$sessionId/end');
      return LiveShoppingSessionModel.fromJson(response['data']['session']);
    } catch (e) {
      rethrow;
    }
  }

  /// Feature product in session
  Future<void> featureProduct({
    required String sessionId,
    required String productId,
    int? discountPercent,
    int? stockLimit,
  }) async {
    try {
      await _apiService
          .post('/live-shopping/sessions/$sessionId/feature', data: {
        'productId': productId,
        if (discountPercent != null) 'discountPercent': discountPercent,
        if (stockLimit != null) 'stockLimit': stockLimit,
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Place order during live stream
  Future<Map<String, dynamic>> placeOrder({
    required String sessionId,
    required String productId,
    required int quantity,
  }) async {
    try {
      final response = await _apiService
          .post('/live-shopping/sessions/$sessionId/order', data: {
        'productId': productId,
        'quantity': quantity,
      });
      return response['data'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Get session statistics
  Future<Map<String, dynamic>> getStatistics(String sessionId) async {
    try {
      final response =
          await _apiService.get('/live-shopping/sessions/$sessionId/stats');
      return response['data']['stats'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Get featured products in session
  Future<List<Map<String, dynamic>>> getFeaturedProducts(
      String sessionId) async {
    try {
      final response =
          await _apiService.get('/live-shopping/sessions/$sessionId/products');
      return List<Map<String, dynamic>>.from(
          response['data']['products'] ?? []);
    } catch (e) {
      rethrow;
    }
  }
}
