import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/constants/api_constants.dart';
import '../../core/error/exceptions.dart';
import '../../core/network/dio_client.dart';
import '../models/story_model.dart';

/// Remote data source for stories
/// Handles all API calls related to stories
abstract class StoriesRemoteDataSource {
  Future<List<StoryGroupModel>> getStoriesFeed();
  Future<StoryModel> getStoryById(String storyId);
  Future<List<StoryModel>> getUserStories(String userId);
  Future<List<StoryModel>> getMyStories();
  Future<StoryModel> createStory({
    required XFile mediaFile,
    String? caption,
    String? backgroundColor,
    int? duration,
  });
  Future<void> deleteStory(String storyId);
  Future<void> viewStory(String storyId);
  Future<List<StoryViewerModel>> getStoryViewers(String storyId);
  Future<List<StoryModel>> getArchivedStories(int page, int limit);
  Future<void> reportStory({
    required String storyId,
    required String reason,
    String? details,
  });
}

class StoriesRemoteDataSourceImpl implements StoriesRemoteDataSource {
  final DioClient dioClient;

  StoriesRemoteDataSourceImpl(this.dioClient);

  @override
  Future<List<StoryGroupModel>> getStoriesFeed() async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.storiesFeed}',
      );

      final List<dynamic> data = response['data'] ?? [];
      return data.map((json) => StoryGroupModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<StoryModel> getStoryById(String storyId) async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.storyById(storyId)}',
      );

      return StoryModel.fromJson(response['data']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<List<StoryModel>> getUserStories(String userId) async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.userStories(userId)}',
      );

      final List<dynamic> data = response['data'] ?? [];
      return data.map((json) => StoryModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<List<StoryModel>> getMyStories() async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.myStories}',
      );

      final List<dynamic> data = response['data'] ?? [];
      return data.map((json) => StoryModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<StoryModel> createStory({
    required XFile mediaFile,
    String? caption,
    String? backgroundColor,
    int? duration,
  }) async {
    try {
      // Create multipart form data
      final formData = FormData.fromMap({
        'media': await MultipartFile.fromFile(
          mediaFile.path,
          filename: mediaFile.name,
        ),
        if (caption != null) 'caption': caption,
        if (backgroundColor != null) 'backgroundColor': backgroundColor,
        if (duration != null) 'duration': duration,
      });

      final response = await dioClient.post(
        '${ApiConstants.apiVersion}${ApiConstants.stories}',
        data: formData,
      );

      return StoryModel.fromJson(response['data']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<void> deleteStory(String storyId) async {
    try {
      await dioClient.delete(
        '${ApiConstants.apiVersion}${ApiConstants.storyById(storyId)}',
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<void> viewStory(String storyId) async {
    try {
      await dioClient.post(
        '${ApiConstants.apiVersion}${ApiConstants.viewStory(storyId)}',
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<List<StoryViewerModel>> getStoryViewers(String storyId) async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.storyViewers(storyId)}',
      );

      final List<dynamic> data = response['data'] ?? [];
      return data.map((json) => StoryViewerModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<List<StoryModel>> getArchivedStories(int page, int limit) async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.apiVersion}${ApiConstants.archivedStories}',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response['data'] ?? [];
      return data.map((json) => StoryModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  @override
  Future<void> reportStory({
    required String storyId,
    required String reason,
    String? details,
  }) async {
    try {
      await dioClient.post(
        '${ApiConstants.apiVersion}${ApiConstants.storyById(storyId)}/report',
        data: {
          'reason': reason,
          if (details != null) 'details': details,
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Handle DioException and convert to appropriate AppException
  AppException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException(
          message: 'Connection timeout. Please check your internet connection.',
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] ?? 'An error occurred';

        if (statusCode == 401 || statusCode == 403) {
          return AuthException(message: message);
        } else if (statusCode == 404) {
          return ServerException(message: 'Story not found');
        } else {
          return ServerException(
            message: message,
            code: statusCode?.toString(),
          );
        }
      case DioExceptionType.cancel:
        return ServerException(message: 'Request cancelled');
      case DioExceptionType.unknown:
        if (error.error != null && error.error.toString().contains('SocketException')) {
          return NetworkException(
            message: 'No internet connection. Please check your network.',
          );
        }
        return ServerException(
          message: error.message ?? 'An unexpected error occurred',
        );
      default:
        return ServerException(message: 'An unexpected error occurred');
    }
  }
}
