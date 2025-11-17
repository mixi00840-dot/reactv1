import '../services/api_service.dart';
import '../models/models.dart';

/// Report Service - Content moderation
/// Integrates with backend /api/reports endpoints
class ReportService {
  final ApiService _apiService = ApiService();

  /// Submit a report
  Future<ReportModel> submitReport({
    required String targetType,
    required String targetId,
    required String type,
    required String reason,
    String? description,
    List<String>? evidence,
  }) async {
    try {
      final response = await _apiService.post('/reports', data: {
        'targetType': targetType,
        'targetId': targetId,
        'type': type,
        'reason': reason,
        if (description != null) 'description': description,
        if (evidence != null) 'evidence': evidence,
      });
      return ReportModel.fromJson(response['data']['report']);
    } catch (e) {
      rethrow;
    }
  }

  /// Report content
  Future<ReportModel> reportContent({
    required String contentId,
    required String type,
    required String reason,
    String? description,
    List<String>? evidence,
  }) async {
    return submitReport(
      targetType: 'content',
      targetId: contentId,
      type: type,
      reason: reason,
      description: description,
      evidence: evidence,
    );
  }

  /// Report user
  Future<ReportModel> reportUser({
    required String userId,
    required String type,
    required String reason,
    String? description,
    List<String>? evidence,
  }) async {
    return submitReport(
      targetType: 'user',
      targetId: userId,
      type: type,
      reason: reason,
      description: description,
      evidence: evidence,
    );
  }

  /// Report comment
  Future<ReportModel> reportComment({
    required String commentId,
    required String type,
    required String reason,
    String? description,
  }) async {
    return submitReport(
      targetType: 'comment',
      targetId: commentId,
      type: type,
      reason: reason,
      description: description,
    );
  }

  /// Report live stream
  Future<ReportModel> reportLiveStream({
    required String liveStreamId,
    required String type,
    required String reason,
    String? description,
  }) async {
    return submitReport(
      targetType: 'liveStream',
      targetId: liveStreamId,
      type: type,
      reason: reason,
      description: description,
    );
  }

  /// Get user's submitted reports
  Future<List<ReportModel>> getMyReports({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/reports/my-reports',
        queryParameters: {
          if (status != null) 'status': status,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['reports'] as List)
          .map((json) => ReportModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get report by ID
  Future<ReportModel> getReport(String reportId) async {
    try {
      final response = await _apiService.get('/reports/$reportId');
      return ReportModel.fromJson(response['data']['report']);
    } catch (e) {
      rethrow;
    }
  }

  /// Cancel report (before review)
  Future<void> cancelReport(String reportId) async {
    try {
      await _apiService.delete('/reports/$reportId');
    } catch (e) {
      rethrow;
    }
  }

  /// Get report status
  Future<String> getReportStatus(String reportId) async {
    try {
      final response = await _apiService.get('/reports/$reportId/status');
      return response['data']['status'] ?? 'pending';
    } catch (e) {
      rethrow;
    }
  }

  /// Get report types/categories
  Future<List<String>> getReportTypes() async {
    try {
      final response = await _apiService.get('/reports/types');
      return List<String>.from(response['data']['types'] ?? []);
    } catch (e) {
      rethrow;
    }
  }
}
