import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/error/exceptions.dart';
import '../models/comment_model.dart';

/// Remote data source for comments
/// Handles all API calls related to comments
abstract class CommentsRemoteDataSource {
  /// Get comments for a content item with pagination
  Future<List<CommentModel>> getComments({
    required String contentId,
    required int page,
    required int limit,
  });

  /// Get a single comment by ID
  Future<CommentModel> getCommentById(String commentId);

  /// Create a new comment
  Future<CommentModel> createComment({
    required String contentId,
    required String text,
    String? parentId,
  });

  /// Update an existing comment
  Future<CommentModel> updateComment({
    required String commentId,
    required String text,
  });

  /// Delete a comment
  Future<void> deleteComment(String commentId);

  /// Like a comment
  Future<void> likeComment(String commentId);

  /// Unlike a comment
  Future<void> unlikeComment(String commentId);

  /// Report a comment
  Future<void> reportComment({
    required String commentId,
    required String reason,
  });
}

/// Implementation of CommentsRemoteDataSource
class CommentsRemoteDataSourceImpl implements CommentsRemoteDataSource {
  final DioClient _dioClient;

  CommentsRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<CommentModel>> getComments({
    required String contentId,
    required int page,
    required int limit,
  }) async {
    try {
      final response = await _dioClient.get(
        ApiConstants.getContentComments(contentId),
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      if (response.data == null) {
        throw ServerException(message: 'No data received from server');
      }

      // Handle both array and paginated response formats
      final List<dynamic> commentsJson;
      if (response.data is List) {
        commentsJson = response.data as List<dynamic>;
      } else if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        commentsJson = data['data'] as List<dynamic>? ??
            data['comments'] as List<dynamic>? ??
            [];
      } else {
        throw ServerException(message: '');
      }

      return commentsJson
          .map((json) => CommentModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<CommentModel> getCommentById(String commentId) async {
    try {
      final response = await _dioClient.get(
        ApiConstants.getComment(commentId),
      );

      if (response.data == null) {
        throw ServerException(message: '');
      }

      // Handle both direct and wrapped response
      final Map<String, dynamic> commentJson;
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        commentJson = data['data'] as Map<String, dynamic>? ?? data;
      } else {
        throw ServerException(message: '');
      }

      return CommentModel.fromJson(commentJson);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<CommentModel> createComment({
    required String contentId,
    required String text,
    String? parentId,
  }) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.createComment(contentId),
        data: {
          'text': text,
          if (parentId != null) 'parentId': parentId,
        },
      );

      if (response.data == null) {
        throw ServerException(message: '');
      }

      // Handle both direct and wrapped response
      final Map<String, dynamic> commentJson;
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        commentJson = data['data'] as Map<String, dynamic>? ??
            data['comment'] as Map<String, dynamic>? ??
            data;
      } else {
        throw ServerException(message: '');
      }

      return CommentModel.fromJson(commentJson);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<CommentModel> updateComment({
    required String commentId,
    required String text,
  }) async {
    try {
      final response = await _dioClient.put(
        ApiConstants.updateComment(commentId),
        data: {
          'text': text,
        },
      );

      if (response.data == null) {
        throw ServerException(message: '');
      }

      // Handle both direct and wrapped response
      final Map<String, dynamic> commentJson;
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        commentJson = data['data'] as Map<String, dynamic>? ??
            data['comment'] as Map<String, dynamic>? ??
            data;
      } else {
        throw ServerException(message: '');
      }

      return CommentModel.fromJson(commentJson);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<void> deleteComment(String commentId) async {
    try {
      await _dioClient.delete(
        ApiConstants.deleteComment(commentId),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<void> likeComment(String commentId) async {
    try {
      await _dioClient.post(
        ApiConstants.likeComment(commentId),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<void> unlikeComment(String commentId) async {
    try {
      await _dioClient.delete(
        ApiConstants.unlikeComment(commentId),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  @override
  Future<void> reportComment({
    required String commentId,
    required String reason,
  }) async {
    try {
      await _dioClient.post(
        ApiConstants.reportComment(commentId),
        data: {
          'reason': reason,
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: '');
    }
  }

  /// Handle Dio errors and convert to custom exceptions
  ServerException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ServerException(message: 'Connection timeout. Please try again.');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] as String? ??
            error.response?.data?['error'] as String? ??
            'Server error occurred';

        if (statusCode == 401) {
          return ServerException(message: 'Unauthorized. Please login again.');
        } else if (statusCode == 403) {
          return ServerException(message: 'Forbidden. You don\'t have permission.');
        } else if (statusCode == 404) {
          return ServerException(message: 'Comment not found.');
        } else if (statusCode == 429) {
          return ServerException(message: 'Too many requests. Please slow down.');
        }
        return ServerException(message: message);
      case DioExceptionType.cancel:
        return ServerException(message: 'Request cancelled');
      case DioExceptionType.connectionError:
        return ServerException(
            message: 'No internet connection. Please check your network.');
      case DioExceptionType.badCertificate:
        return ServerException(message: 'Security certificate error');
      case DioExceptionType.unknown:
        return ServerException(
            message: error.message ?? 'An unexpected error occurred');
    }
  }
}
