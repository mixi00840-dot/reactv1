import '../services/api_service.dart';
import '../models/models.dart';

/// Scheduling Service - Content scheduling
/// Integrates with backend /api/scheduling endpoints
class SchedulingService {
  final ApiService _apiService = ApiService();

  /// Get all scheduled content
  Future<List<ScheduledContentModel>> getScheduledContent({
    String? status,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/scheduling/scheduled',
        queryParameters: {
          if (status != null) 'status': status,
          if (type != null) 'type': type,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['scheduled'] as List)
          .map((json) => ScheduledContentModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get scheduled item by ID
  Future<ScheduledContentModel> getScheduledItem(String scheduleId) async {
    try {
      final response =
          await _apiService.get('/scheduling/scheduled/$scheduleId');
      return ScheduledContentModel.fromJson(response['data']['scheduled']);
    } catch (e) {
      rethrow;
    }
  }

  /// Schedule content for later
  Future<ScheduledContentModel> scheduleContent({
    required String contentId,
    required String type,
    required DateTime publishAt,
    bool? notifyFollowers,
  }) async {
    try {
      final response = await _apiService.post('/scheduling/schedule', data: {
        'contentId': contentId,
        'type': type,
        'publishAt': publishAt.toIso8601String(),
        if (notifyFollowers != null) 'notifyFollowers': notifyFollowers,
      });
      return ScheduledContentModel.fromJson(response['data']['scheduled']);
    } catch (e) {
      rethrow;
    }
  }

  /// Update scheduled content
  Future<ScheduledContentModel> updateSchedule({
    required String scheduleId,
    DateTime? publishAt,
    bool? notifyFollowers,
  }) async {
    try {
      final response =
          await _apiService.put('/scheduling/scheduled/$scheduleId', data: {
        if (publishAt != null) 'publishAt': publishAt.toIso8601String(),
        if (notifyFollowers != null) 'notifyFollowers': notifyFollowers,
      });
      return ScheduledContentModel.fromJson(response['data']['scheduled']);
    } catch (e) {
      rethrow;
    }
  }

  /// Cancel scheduled content
  Future<void> cancelSchedule(String scheduleId) async {
    try {
      await _apiService.delete('/scheduling/scheduled/$scheduleId');
    } catch (e) {
      rethrow;
    }
  }

  /// Get pending scheduled content (due soon)
  Future<List<ScheduledContentModel>> getPendingContent() async {
    try {
      final response = await _apiService.get('/scheduling/pending');
      return (response['data']['scheduled'] as List)
          .map((json) => ScheduledContentModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get published scheduled content
  Future<List<ScheduledContentModel>> getPublishedContent({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/scheduling/published',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['scheduled'] as List)
          .map((json) => ScheduledContentModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get failed scheduled content
  Future<List<ScheduledContentModel>> getFailedContent({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/scheduling/failed',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['scheduled'] as List)
          .map((json) => ScheduledContentModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Retry failed scheduled content
  Future<ScheduledContentModel> retrySchedule(String scheduleId) async {
    try {
      final response =
          await _apiService.post('/scheduling/scheduled/$scheduleId/retry');
      return ScheduledContentModel.fromJson(response['data']['scheduled']);
    } catch (e) {
      rethrow;
    }
  }
}
