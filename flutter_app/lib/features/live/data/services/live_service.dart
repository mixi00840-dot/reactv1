import '../../../../core/services/api_service.dart';
import '../models/live_stream.dart';

class LiveService {
  final ApiService _apiService = ApiService();

  /// Get live streams
  Future<List<LiveStream>> getLiveStreams({
    int page = 1,
    int limit = 20,
    String status = 'live',
  }) async {
    try {
      final response = await _apiService.get(
        '/live',
        queryParameters: {'page': page, 'limit': limit, 'status': status},
      );

      if (response['success'] == true && response['streams'] != null) {
        return (response['streams'] as List)
            .map((json) => LiveStream.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching live streams: $e');
      return [];
    }
  }

  /// Get live stream by ID
  Future<LiveStream?> getLiveStream(String streamId) async {
    try {
      final response = await _apiService.get('/live/$streamId');

      if (response['success'] == true && response['stream'] != null) {
        return LiveStream.fromJson(response['stream']);
      }

      return null;
    } catch (e) {
      print('Error fetching live stream: $e');
      return null;
    }
  }

  /// Start live stream
  Future<Map<String, dynamic>?> startStream({
    required String title,
    String? description,
  }) async {
    try {
      final response = await _apiService.post(
        '/live/start',
        data: {
          'title': title,
          if (description != null) 'description': description,
        },
      );

      if (response['success'] == true) {
        return response;
      }

      return null;
    } catch (e) {
      print('Error starting stream: $e');
      return null;
    }
  }

  /// Join live stream
  Future<Map<String, dynamic>?> joinStream(String streamId) async {
    try {
      final response = await _apiService.post('/live/$streamId/join');

      if (response['success'] == true) {
        return response;
      }

      return null;
    } catch (e) {
      print('Error joining stream: $e');
      return null;
    }
  }

  /// End live stream
  Future<bool> endStream(String streamId) async {
    try {
      final response = await _apiService.post('/live/$streamId/end');

      return response['success'] == true;
    } catch (e) {
      print('Error ending stream: $e');
      return false;
    }
  }

  /// Send gift during stream
  Future<bool> sendGift({
    required String streamId,
    required String giftId,
    int quantity = 1,
  }) async {
    try {
      final response = await _apiService.post(
        '/live/$streamId/gift',
        data: {
          'giftId': giftId,
          'quantity': quantity,
        },
      );

      return response['success'] == true;
    } catch (e) {
      print('Error sending gift: $e');
      return false;
    }
  }
}
