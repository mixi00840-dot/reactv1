import '../services/api_service.dart';
import '../models/models.dart';

/// Badge Service - Achievement system
/// Integrates with backend /api/badges endpoints
class BadgeService {
  final ApiService _apiService = ApiService();

  /// Get all available badges
  Future<List<SupporterBadgeModel>> getBadges({
    String? rarity,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.get(
        '/badges',
        queryParameters: {
          if (rarity != null) 'rarity': rarity,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['badges'] as List)
          .map((json) => SupporterBadgeModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get badge by ID
  Future<SupporterBadgeModel> getBadge(String badgeId) async {
    try {
      final response = await _apiService.get('/badges/$badgeId');
      return SupporterBadgeModel.fromJson(response['data']['badge']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's badges
  Future<List<SupporterBadgeModel>> getMyBadges() async {
    try {
      final response = await _apiService.get('/badges/my-badges');
      return (response['data']['badges'] as List)
          .map((json) => SupporterBadgeModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's badge progress
  Future<List<Map<String, dynamic>>> getProgress() async {
    try {
      final response = await _apiService.get('/badges/progress');
      return List<Map<String, dynamic>>.from(
          response['data']['progress'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Check if user earned a badge
  Future<bool> checkBadgeEarned(String badgeId) async {
    try {
      final response = await _apiService.get('/badges/$badgeId/check');
      return response['data']['earned'] ?? false;
    } catch (e) {
      rethrow;
    }
  }

  /// Get badges by creator
  Future<List<SupporterBadgeModel>> getCreatorBadges(String creatorId) async {
    try {
      final response = await _apiService.get('/badges/creator/$creatorId');
      return (response['data']['badges'] as List)
          .map((json) => SupporterBadgeModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get top supporters (leaderboard)
  Future<List<Map<String, dynamic>>> getTopSupporters({
    String? creatorId,
    String? timeframe,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/badges/leaderboard',
        queryParameters: {
          if (creatorId != null) 'creatorId': creatorId,
          if (timeframe != null) 'timeframe': timeframe,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(
          response['data']['supporters'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Get badge statistics
  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final response = await _apiService.get('/badges/stats');
      return response['data']['stats'] ?? {};
    } catch (e) {
      rethrow;
    }
  }
}
