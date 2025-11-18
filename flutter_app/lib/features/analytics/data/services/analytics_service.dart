import '../../../../core/services/api_service.dart';
import '../models/analytics.dart';

class AnalyticsService {
  final ApiService _apiService = ApiService();

  /// Get user analytics for a specific period
  Future<Analytics?> getUserAnalytics({
    String period = 'last7days',
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'period': period,
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      };

      final response = await _apiService.get(
        '/analytics/user',
        queryParameters: queryParams,
      );

      if (response['success'] == true && response['analytics'] != null) {
        return Analytics.fromJson(response['analytics']);
      }

      return null;
    } catch (e) {
      print('Error fetching analytics: $e');
      return null;
    }
  }

  /// Get content analytics for a specific video/post
  Future<Analytics?> getContentAnalytics(String contentId) async {
    try {
      final response = await _apiService.get('/analytics/content/$contentId');

      if (response['success'] == true && response['analytics'] != null) {
        return Analytics.fromJson(response['analytics']);
      }

      return null;
    } catch (e) {
      print('Error fetching content analytics: $e');
      return null;
    }
  }

  /// Get audience demographics
  Future<Map<String, dynamic>?> getAudienceDemographics() async {
    try {
      final response = await _apiService.get('/analytics/audience');

      if (response['success'] == true && response['demographics'] != null) {
        return response['demographics'];
      }

      return null;
    } catch (e) {
      print('Error fetching demographics: $e');
      return null;
    }
  }
}
