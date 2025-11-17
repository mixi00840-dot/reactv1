import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Coupon Service - Discount system
/// Integrates with backend /api/coupons endpoints
class CouponService {
  final ApiService _apiService = ApiService();

  /// Get all available coupons
  Future<List<CouponModel>> getCoupons({
    bool? active,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/coupons',
        queryParameters: {
          if (active != null) 'active': active,
          if (type != null) 'type': type,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['coupons'] as List)
          .map((json) => CouponModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get coupon by code
  Future<CouponModel> getCouponByCode(String code) async {
    try {
      final response = await _apiService.get('/coupons/code/$code');
      return CouponModel.fromJson(response['data']['coupon']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get coupon by ID
  Future<CouponModel> getCoupon(String couponId) async {
    try {
      final response = await _apiService.get('/coupons/$couponId');
      return CouponModel.fromJson(response['data']['coupon']);
    } catch (e) {
      rethrow;
    }
  }

  /// Validate coupon
  Future<Map<String, dynamic>> validateCoupon({
    required String code,
    required double cartTotal,
    List<String>? productIds,
  }) async {
    try {
      final response = await _apiService.post('/coupons/validate', data: {
        'code': code,
        'cartTotal': cartTotal,
        if (productIds != null) 'productIds': productIds,
      });
      return {
        'valid': response['data']['valid'] ?? false,
        'discount': response['data']['discount'] ?? 0,
        'message': response['data']['message'],
        'coupon': response['data']['coupon'] != null
            ? CouponModel.fromJson(response['data']['coupon'])
            : null,
      };
    } catch (e) {
      rethrow;
    }
  }

  /// Apply coupon to cart/order
  Future<Map<String, dynamic>> applyCoupon({
    required String code,
    String? orderId,
    required double amount,
  }) async {
    try {
      final response = await _apiService.post('/coupons/apply', data: {
        'code': code,
        if (orderId != null) 'orderId': orderId,
        'amount': amount,
      });
      return {
        'success': response['data']['success'] ?? false,
        'discount': response['data']['discount'] ?? 0,
        'finalAmount': response['data']['finalAmount'] ?? amount,
        'message': response['data']['message'],
      };
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's available coupons
  Future<List<CouponModel>> getMyCoupons() async {
    try {
      final response = await _apiService.get('/coupons/my-coupons');
      return (response['data']['coupons'] as List)
          .map((json) => CouponModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's coupon usage history
  Future<List<Map<String, dynamic>>> getCouponUsageHistory({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/coupons/usage-history',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(response['data']['history'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Claim coupon (e.g., from promotion)
  Future<CouponModel> claimCoupon(String couponCode) async {
    try {
      final response = await _apiService.post('/coupons/claim', data: {
        'code': couponCode,
      });
      return CouponModel.fromJson(response['data']['coupon']);
    } catch (e) {
      rethrow;
    }
  }

  /// Check if coupon is applicable to products
  Future<bool> isCouponApplicable({
    required String code,
    required List<String> productIds,
  }) async {
    try {
      final response =
          await _apiService.post('/coupons/check-applicability', data: {
        'code': code,
        'productIds': productIds,
      });
      return response['data']['applicable'] ?? false;
    } catch (e) {
      rethrow;
    }
  }

  /// Get featured/promoted coupons
  Future<List<CouponModel>> getFeaturedCoupons() async {
    try {
      final response = await _apiService.get('/coupons/featured');
      return (response['data']['coupons'] as List)
          .map((json) => CouponModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Search coupons
  Future<List<CouponModel>> searchCoupons({
    required String query,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/coupons/search',
        queryParameters: {
          'query': query,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['coupons'] as List)
          .map((json) => CouponModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }
}
