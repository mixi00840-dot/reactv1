import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import '../network/api_endpoints.dart';
import '../constants/api_constants.dart';
import './mongodb_auth_service.dart';

/// Comment model
class CommentModel {
  final String id;
  final String contentId;
  final String userId;
  final String username;
  final String? userAvatar;
  final String text;
  final int likes;
  final bool isLiked;
  final DateTime createdAt;
  final List<CommentModel> replies;

  CommentModel({
    required this.id,
    required this.contentId,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.text,
    required this.likes,
    required this.isLiked,
    required this.createdAt,
    this.replies = const [],
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    
    return CommentModel(
      id: json['_id'] ?? json['id'] ?? '',
      contentId: json['contentId'] ?? '',
      userId: user['_id'] ?? user['id'] ?? json['userId'] ?? '',
      username: user['username'] ?? 'Unknown',
      userAvatar: user['avatar'] ?? user['avatarUrl'],
      text: json['text'] ?? json['content'] ?? '',
      likes: json['likes'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      replies: (json['replies'] as List<dynamic>?)
              ?.map((r) => CommentModel.fromJson(r))
              .toList() ??
          [],
    );
  }

  CommentModel copyWith({
    String? id,
    String? contentId,
    String? userId,
    String? username,
    String? userAvatar,
    String? text,
    int? likes,
    bool? isLiked,
    DateTime? createdAt,
    List<CommentModel>? replies,
  }) {
    return CommentModel(
      id: id ?? this.id,
      contentId: contentId ?? this.contentId,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      text: text ?? this.text,
      likes: likes ?? this.likes,
      isLiked: isLiked ?? this.isLiked,
      createdAt: createdAt ?? this.createdAt,
      replies: replies ?? this.replies,
    );
  }
}

/// Service for managing comments
class CommentsService {
  final Dio _dio;
  final MongoDBAuthService _authService = MongoDBAuthService();

  CommentsService({Dio? dio})
      : _dio = dio ??
            Dio(
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

  /// Get comments for a video
  Future<List<CommentModel>> getComments(String contentId) async {
    try {
      developer.log('💬 Fetching comments for: $contentId');

      final response = await _dio.get(
        ApiEndpoints.getContentComments(contentId),
      );

      final List<dynamic> commentsData =
          response.data['data'] ?? response.data['comments'] ?? [];

      final comments =
          commentsData.map((json) => CommentModel.fromJson(json)).toList();

      developer.log('✅ Loaded ${comments.length} comments');
      return comments;
    } on DioException catch (e) {
      developer.log('❌ Error fetching comments: ${e.message}');
      return [];
    }
  }

  /// Post a new comment
  Future<CommentModel?> postComment(String contentId, String text) async {
    try {
      developer.log('💬 Posting comment on: $contentId');

      final response = await _dio.post(
        ApiEndpoints.createComment,
        data: {
          'contentId': contentId,
          'text': text,
        },
      );

      final commentData = response.data['data'] ?? response.data['comment'];

      if (commentData != null) {
        developer.log('✅ Comment posted successfully');
        return CommentModel.fromJson(commentData);
      }

      return null;
    } on DioException catch (e) {
      developer.log('❌ Error posting comment: ${e.message}');
      return null;
    }
  }

  /// Like a comment
  Future<bool> likeComment(String commentId) async {
    try {
      developer.log('❤️ Liking comment: $commentId');

      final response = await _dio.post(
        ApiEndpoints.likeComment(commentId),
      );

      final success = response.statusCode == 200 || response.statusCode == 201;

      if (success) {
        developer.log('✅ Comment liked successfully');
      }

      return success;
    } on DioException catch (e) {
      developer.log('❌ Error liking comment: ${e.message}');
      return false;
    }
  }

  /// Unlike a comment
  Future<bool> unlikeComment(String commentId) async {
    try {
      developer.log('💔 Unliking comment: $commentId');

      final response = await _dio.delete(
        '${ApiEndpoints.commentsBase}/$commentId/unlike',
      );

      final success = response.statusCode == 200 || response.statusCode == 204;

      if (success) {
        developer.log('✅ Comment unliked successfully');
      }

      return success;
    } on DioException catch (e) {
      developer.log('❌ Error unliking comment: ${e.message}');
      return false;
    }
  }

  /// Delete a comment
  Future<bool> deleteComment(String commentId) async {
    try {
      developer.log('🗑️ Deleting comment: $commentId');

      final response = await _dio.delete(
        ApiEndpoints.deleteComment(commentId),
      );

      final success = response.statusCode == 200 || response.statusCode == 204;

      if (success) {
        developer.log('✅ Comment deleted successfully');
      }

      return success;
    } on DioException catch (e) {
      developer.log('❌ Error deleting comment: ${e.message}');
      return false;
    }
  }
}
