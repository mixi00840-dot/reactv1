import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import '../network/api_endpoints.dart';
import '../constants/api_constants.dart';
import './mongodb_auth_service.dart';

/// Service for video interactions (like, share, follow)
/// Handles API calls with authentication
class VideoInteractionService {
  final Dio _dio;
  final MongoDBAuthService _authService = MongoDBAuthService();
  
  VideoInteractionService({Dio? dio}) : _dio = dio ?? Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ),
  ) {
    // Add auth interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final accessToken = _authService.accessToken;
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshed = await _authService.refreshAccessToken();
            if (refreshed) {
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer ${_authService.accessToken}';
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  /// Like a video
  Future<bool> likeVideo(String contentId) async {
    try {
      developer.log('❤️ Liking video: $contentId');
      
      final response = await _dio.post(
        ApiEndpoints.likeContent(contentId),
      );

      final success = response.statusCode == 200 || response.statusCode == 201;
      
      if (success) {
        developer.log('✅ Video liked successfully');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error liking video: ${e.message}');
      return false;
    }
  }

  /// Unlike a video
  Future<bool> unlikeVideo(String contentId) async {
    try {
      developer.log('💔 Unliking video: $contentId');
      
      final response = await _dio.delete(
        ApiEndpoints.unlikeContent(contentId),
      );

      final success = response.statusCode == 200 || response.statusCode == 204;
      
      if (success) {
        developer.log('✅ Video unliked successfully');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error unliking video: ${e.message}');
      return false;
    }
  }

  /// Follow a user
  Future<bool> followUser(String userId) async {
    try {
      developer.log('👤 Following user: $userId');
      
      final response = await _dio.post(
        ApiEndpoints.followUser(userId),
      );

      final success = response.statusCode == 200 || response.statusCode == 201;
      
      if (success) {
        developer.log('✅ User followed successfully');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error following user: ${e.message}');
      return false;
    }
  }

  /// Unfollow a user
  Future<bool> unfollowUser(String userId) async {
    try {
      developer.log('👤 Unfollowing user: $userId');
      
      final response = await _dio.delete(
        ApiEndpoints.unfollowUser(userId),
      );

      final success = response.statusCode == 200 || response.statusCode == 204;
      
      if (success) {
        developer.log('✅ User unfollowed successfully');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error unfollowing user: ${e.message}');
      return false;
    }
  }

  /// Increment video views
  Future<bool> incrementViews(String contentId) async {
    try {
      developer.log('👁️ Incrementing views: $contentId');
      
      final response = await _dio.post(
        '${ApiEndpoints.contentBase}/$contentId/view',
      );

      final success = response.statusCode == 200 || response.statusCode == 201;
      
      if (success) {
        developer.log('✅ View counted');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error incrementing views: ${e.message}');
      return false;
    }
  }

  /// Share a video (increment share count)
  Future<bool> shareVideo(String contentId) async {
    try {
      developer.log('📤 Sharing video: $contentId');
      
      final response = await _dio.post(
        '${ApiEndpoints.contentBase}/$contentId/share',
      );

      final success = response.statusCode == 200 || response.statusCode == 201;
      
      if (success) {
        developer.log('✅ Share counted');
      }
      
      return success;
    } on DioException catch (e) {
      developer.log('❌ Error sharing video: ${e.message}');
      return false;
    }
  }
}
