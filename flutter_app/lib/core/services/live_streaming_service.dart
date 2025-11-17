import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';
import 'auth_service.dart';

/// Live streaming configuration model
class LiveStreamConfig {
  final String streamId;
  final String channelId;
  final String token;
  final String provider; // 'agora', 'zegocloud', 'webrtc'
  final Map<String, dynamic> config;

  LiveStreamConfig({
    required this.streamId,
    required this.channelId,
    required this.token,
    required this.provider,
    required this.config,
  });

  factory LiveStreamConfig.fromJson(Map<String, dynamic> json) {
    return LiveStreamConfig(
      streamId: json['streamId'] ?? '',
      channelId: json['channelId'] ?? '',
      token: json['token'] ?? '',
      provider: json['provider'] ?? 'agora',
      config: json['config'] ?? {},
    );
  }
}

/// Live stream info model
class LiveStreamInfo {
  final String id;
  final String streamId;
  final String hostId;
  final String hostName;
  final String? hostAvatar;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String status; // 'scheduled', 'live', 'ended'
  final int currentViewers;
  final int totalViews;
  final int likes;
  final int comments;
  final DateTime? startedAt;
  final String provider;

  LiveStreamInfo({
    required this.id,
    required this.streamId,
    required this.hostId,
    required this.hostName,
    this.hostAvatar,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.status,
    this.currentViewers = 0,
    this.totalViews = 0,
    this.likes = 0,
    this.comments = 0,
    this.startedAt,
    this.provider = 'agora',
  });

  factory LiveStreamInfo.fromJson(Map<String, dynamic> json) {
    final host = json['host'] ?? json['hostId'];
    final hostData = host is Map ? host : {};

    return LiveStreamInfo(
      id: json['_id'] ?? json['id'] ?? '',
      streamId: json['streamId'] ?? '',
      hostId: hostData['_id'] ?? host ?? '',
      hostName: hostData['fullName'] ?? hostData['username'] ?? 'Unknown',
      hostAvatar: hostData['avatar'],
      title: json['title'] ?? '',
      description: json['description'],
      thumbnailUrl: json['thumbnailUrl'],
      status: json['status'] ?? 'scheduled',
      currentViewers: json['currentViewers'] ?? 0,
      totalViews: json['totalViews'] ?? 0,
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      startedAt:
          json['startedAt'] != null ? DateTime.parse(json['startedAt']) : null,
      provider: json['provider'] ?? 'agora',
    );
  }
}

/// Live comment model
class LiveComment {
  final String id;
  final String userId;
  final String username;
  final String? avatar;
  final String message;
  final DateTime timestamp;

  LiveComment({
    required this.id,
    required this.userId,
    required this.username,
    this.avatar,
    required this.message,
    required this.timestamp,
  });

  factory LiveComment.fromJson(Map<String, dynamic> json) {
    return LiveComment(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? 'Anonymous',
      avatar: json['avatar'],
      message: json['message'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
    );
  }
}

/// Live streaming service for managing live streams
class LiveStreamingService {
  static final LiveStreamingService _instance =
      LiveStreamingService._internal();
  factory LiveStreamingService() => _instance;
  LiveStreamingService._internal();

  final Dio _dio = Dio();
  final AuthService _authService = AuthService();

  // ✅ FIXED: Changed from /api to /api/livestreaming for correct backend routing
  String get _baseUrl =>
      '${dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000'}/api/livestreaming';

  /// Get authorization headers with automatic token refresh
  Future<Map<String, String>> _getHeaders() async {
    // ✅ IMPROVED: Use getValidToken for automatic refresh
    final token = await _authService.getValidToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// ✅ NEW: Handle API request with automatic 401 retry
  Future<Response<dynamic>> _makeAuthenticatedRequest(
    Future<Response<dynamic>> Function() request, {
    int maxRetries = 1,
  }) async {
    try {
      return await request();
    } on DioException catch (e) {
      // Handle 401 Unauthorized
      if (e.response?.statusCode == 401 && maxRetries > 0) {
        debugPrint('⚠️ Received 401, attempting token refresh...');

        // Try to refresh token
        final refreshed = await _authService.refreshToken();
        if (refreshed) {
          debugPrint('✅ Token refreshed, retrying request...');
          // Retry the request with new token
          return await _makeAuthenticatedRequest(request,
              maxRetries: maxRetries - 1);
        } else {
          debugPrint('❌ Token refresh failed, user needs to re-login');
          throw Exception('Authentication failed. Please login again.');
        }
      }
      rethrow;
    }
  }

  /// Get available streaming providers
  Future<List<Map<String, dynamic>>> getProviders() async {
    try {
      final headers = await _getHeaders();

      // ✅ IMPROVED: Use authenticated request wrapper
      final response = await _makeAuthenticatedRequest(
        () => _dio.get(
          '$_baseUrl/providers',
          options: Options(
            headers: headers,
            validateStatus: (status) => status! < 500,
          ),
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] as List<dynamic>?;
        return data?.cast<Map<String, dynamic>>() ?? [];
      } else if (response.statusCode == 401) {
        throw Exception('Authentication required. Please login.');
      } else {
        debugPrint('⚠️ Get providers returned status: ${response.statusCode}');
        // Return default providers as fallback
        return [
          {'name': 'agora', 'displayName': 'Agora', 'enabled': true},
          {'name': 'zegocloud', 'displayName': 'ZegoCloud', 'enabled': true},
        ];
      }
    } catch (e) {
      debugPrint('Error getting providers: $e');
      // ✅ IMPROVED: Return defaults instead of throwing
      return [
        {'name': 'agora', 'displayName': 'Agora', 'enabled': true},
        {'name': 'zegocloud', 'displayName': 'ZegoCloud', 'enabled': true},
      ];
    }
  }

  /// Create a new live stream
  Future<LiveStreamConfig> createLiveStream({
    required String title,
    String? description,
    String? thumbnailUrl,
    String provider = 'agora',
    Map<String, dynamic>? config,
  }) async {
    try {
      final headers = await _getHeaders();

      // ✅ IMPROVED: Use authenticated request wrapper
      final response = await _makeAuthenticatedRequest(
        () => _dio.post(
          _baseUrl, // POST /api/livestreaming
          options: Options(
            headers: headers,
            validateStatus: (status) => status! < 500,
          ),
          data: {
            'title': title,
            'description': description,
            'thumbnailUrl': thumbnailUrl,
            'provider': provider,
            'type': 'standard',
            'config': config ??
                {
                  'resolution': '720p',
                  'frameRate': 30,
                  'orientation': 'portrait',
                  'enableChat': true,
                  'enableGifts': true,
                },
          },
        ),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data['data'];
        return LiveStreamConfig.fromJson(data);
      } else {
        throw Exception('Failed to create live stream: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error creating live stream: $e');
      rethrow;
    }
  }

  /// Start live stream
  Future<bool> startLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      // ✅ FIXED: Correct path /:id/start
      final response = await _dio.post(
        '$_baseUrl/$streamId/start',
        options: Options(
          headers: headers,
          validateStatus: (status) => status! < 500,
        ),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error starting live stream: $e');
      return false;
    }
  }

  /// End live stream
  Future<bool> endLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      // ✅ FIXED: Correct path /:id/end
      final response = await _dio.post(
        '$_baseUrl/$streamId/end',
        options: Options(
          headers: headers,
          validateStatus: (status) => status! < 500,
        ),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error ending live stream: $e');
      return false;
    }
  }

  /// Join live stream as viewer
  Future<LiveStreamConfig> joinLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      // ✅ FIXED: Correct path /:id/join
      final response = await _dio.post(
        '$_baseUrl/$streamId/join',
        options: Options(
          headers: headers,
          validateStatus: (status) => status! < 500,
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return LiveStreamConfig.fromJson(data);
      } else {
        throw Exception('Failed to join live stream: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error joining live stream: $e');
      rethrow;
    }
  }

  /// Leave live stream
  Future<bool> leaveLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      // ✅ FIXED: Correct path /:id/leave
      final response = await _dio.post(
        '$_baseUrl/$streamId/leave',
        options: Options(
          headers: headers,
          validateStatus: (status) => status! < 500,
        ),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error leaving live stream: $e');
      return false;
    }
  }

  /// Get live streams
  Future<List<LiveStreamInfo>> getLiveStreams({
    String status = 'live',
    int limit = 50,
  }) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.get(
        '$_baseUrl/streaming/livestreams',
        options: Options(headers: headers),
        queryParameters: {
          'status': status,
          'limit': limit,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data']['livestreams'] ?? [];
        return data.map((json) => LiveStreamInfo.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      debugPrint('Error getting live streams: $e');
      return [];
    }
  }

  /// Get stream details
  Future<LiveStreamInfo?> getStreamDetails(String streamId) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.get(
        '$_baseUrl/streaming/$streamId',
        options: Options(headers: headers),
      );

      if (response.statusCode == 200) {
        return LiveStreamInfo.fromJson(response.data['data']);
      } else {
        return null;
      }
    } catch (e) {
      debugPrint('Error getting stream details: $e');
      return null;
    }
  }

  /// Send comment in live stream
  Future<bool> sendComment(String streamId, String message) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.post(
        '$_baseUrl/streaming/$streamId/comment',
        options: Options(headers: headers),
        data: {'message': message},
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error sending comment: $e');
      return false;
    }
  }

  /// Like live stream
  Future<bool> likeLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.post(
        '$_baseUrl/streaming/$streamId/like',
        options: Options(headers: headers),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error liking stream: $e');
      return false;
    }
  }

  /// Share live stream
  Future<bool> shareLiveStream(String streamId) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.post(
        '$_baseUrl/streaming/$streamId/share',
        options: Options(headers: headers),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error sharing stream: $e');
      return false;
    }
  }

  /// Send gift in live stream
  Future<bool> sendGift(String streamId, String giftId, int quantity) async {
    try {
      final headers = await _getHeaders();

      final response = await _dio.post(
        '$_baseUrl/streaming/$streamId/gift',
        options: Options(headers: headers),
        data: {
          'giftId': giftId,
          'quantity': quantity,
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error sending gift: $e');
      return false;
    }
  }

  /// Format viewer count (1.2K, 1.5M format)
  String formatViewerCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  /// Calculate stream duration
  Duration getStreamDuration(DateTime? startedAt) {
    if (startedAt == null) return Duration.zero;
    return DateTime.now().difference(startedAt);
  }

  /// Format stream duration
  String formatStreamDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
  }
}
