import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Gift Service - Virtual gifts system
/// Integrates with backend /api/gifts endpoints
class GiftService {
  final ApiService _apiService = ApiService();

  /// Get all gifts (catalog)
  Future<List<GiftModel>> getGifts({
    String? category,
    String? rarity,
    bool? featured,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.get(
        '/gifts',
        queryParameters: {
          if (category != null) 'category': category,
          if (rarity != null) 'rarity': rarity,
          if (featured != null) 'featured': featured,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['gifts'] as List)
          .map((json) => GiftModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get gift by ID
  Future<GiftModel> getGift(String giftId) async {
    try {
      final response = await _apiService.get('/gifts/$giftId');
      return GiftModel.fromJson(response['data']['gift']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get gifts by category
  Future<List<GiftModel>> getGiftsByCategory(String category) async {
    return getGifts(category: category);
  }

  /// Get featured gifts
  Future<List<GiftModel>> getFeaturedGifts() async {
    return getGifts(featured: true);
  }

  /// Get seasonal gifts (available for limited time)
  Future<List<GiftModel>> getSeasonalGifts() async {
    try {
      final response = await _apiService.get('/gifts/seasonal');
      return (response['data']['gifts'] as List)
          .map((json) => GiftModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Send gift to user
  Future<GiftTransactionModel> sendGift({
    required String giftId,
    required String recipientId,
    int quantity = 1,
    String? contentId,
    String? liveStreamId,
    String? message,
  }) async {
    try {
      final response = await _apiService.post('/gifts/send', data: {
        'giftId': giftId,
        'recipientId': recipientId,
        'quantity': quantity,
        if (contentId != null) 'contentId': contentId,
        if (liveStreamId != null) 'liveStreamId': liveStreamId,
        if (message != null) 'message': message,
      });
      return GiftTransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get sent gifts history
  Future<List<GiftTransactionModel>> getSentGifts({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/gifts/sent',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['transactions'] as List)
          .map((json) => GiftTransactionModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get received gifts history
  Future<List<GiftTransactionModel>> getReceivedGifts({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/gifts/received',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['transactions'] as List)
          .map((json) => GiftTransactionModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get gift transaction details
  Future<GiftTransactionModel> getTransaction(String transactionId) async {
    try {
      final response =
          await _apiService.get('/gifts/transactions/$transactionId');
      return GiftTransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get gift leaderboard (top gifters)
  Future<List<Map<String, dynamic>>> getLeaderboard({
    String? timeframe, // 'day', 'week', 'month', 'all'
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/gifts/leaderboard',
        queryParameters: {
          if (timeframe != null) 'timeframe': timeframe,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(response['data']['leaderboard']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's gift inventory
  Future<Map<String, dynamic>> getInventory() async {
    try {
      final response = await _apiService.get('/gifts/inventory');
      return response['data']['inventory'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Get gift statistics
  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final response = await _apiService.get('/gifts/stats');
      return response['data']['stats'] ?? {};
    } catch (e) {
      rethrow;
    }
  }

  /// Check gift affordability
  Future<bool> canAffordGift({
    required String giftId,
    int quantity = 1,
  }) async {
    try {
      final response =
          await _apiService.post('/gifts/check-affordability', data: {
        'giftId': giftId,
        'quantity': quantity,
      });
      return response['data']['canAfford'] ?? false;
    } catch (e) {
      rethrow;
    }
  }
}
