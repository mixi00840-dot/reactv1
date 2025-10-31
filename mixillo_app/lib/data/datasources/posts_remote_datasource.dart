import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../../core/error/exceptions.dart';
import '../../core/network/dio_client.dart';
import '../../domain/entities/post.dart';
import '../../domain/repositories/posts_repository.dart'; // For enums
import '../models/post_model.dart';

/// Remote Data Source for Posts - Handles all API calls
abstract class PostsRemoteDataSource {
  Future<List<PostModel>> getPosts({
    required int page,
    required int limit,
    String? cursor,
    required PostFeedType feedType,
  });

  Future<PostModel> getPostById(String postId);

  Future<List<PostModel>> getUserPosts({
    required String userId,
    required int page,
    required int limit,
    PostContentType? contentType,
  });

  Future<List<PostModel>> getSavedPosts({
    required int page,
    required int limit,
  });

  Future<PostModel> createPost({
    required List<String> mediaFiles,
    required String caption,
    List<String>? hashtags,
    String? location,
    String? soundId,
    List<ProductTag>? productTags,
  });

  Future<void> likePost(String postId);
  Future<void> unlikePost(String postId);
  Future<void> savePost(String postId);
  Future<void> unsavePost(String postId);
  Future<void> deletePost(String postId);
}

class PostsRemoteDataSourceImpl implements PostsRemoteDataSource {
  final DioClient dioClient;

  PostsRemoteDataSourceImpl(this.dioClient);

  @override
  Future<List<PostModel>> getPosts({
    required int page,
    required int limit,
    String? cursor,
    required PostFeedType feedType,
  }) async {
    try {
      final endpoint = feedType == PostFeedType.trending
          ? ApiConstants.contentTrending
          : ApiConstants.contentFeed;

      final response = await dioClient.get(
        endpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (cursor != null) 'cursor': cursor,
          if (feedType == PostFeedType.following) 'filter': 'following',
        },
      );

      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => PostModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to fetch posts: $e');
    }
  }

  @override
  Future<PostModel> getPostById(String postId) async {
    try {
      final response = await dioClient.get(
        ApiConstants.contentById(postId),
      );

      return PostModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to fetch post: $e');
    }
  }

  @override
  Future<List<PostModel>> getUserPosts({
    required String userId,
    required int page,
    required int limit,
    PostContentType? contentType,
  }) async {
    try {
      final response = await dioClient.get(
        ApiConstants.userContent(userId),
        queryParameters: {
          'page': page,
          'limit': limit,
          if (contentType != null) 'type': contentType.name,
        },
      );

      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => PostModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to fetch user posts: $e');
    }
  }

  @override
  Future<List<PostModel>> getSavedPosts({
    required int page,
    required int limit,
  }) async {
    try {
      final response = await dioClient.get(
        '${ApiConstants.content}/saved',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => PostModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to fetch saved posts: $e');
    }
  }

  @override
  Future<PostModel> createPost({
    required List<String> mediaFiles,
    required String caption,
    List<String>? hashtags,
    String? location,
    String? soundId,
    List<ProductTag>? productTags,
  }) async {
    try {
      final formData = FormData();

      // Add media files
      for (var i = 0; i < mediaFiles.length; i++) {
        formData.files.add(MapEntry(
          'media',
          await MultipartFile.fromFile(mediaFiles[i]),
        ));
      }

      // Add metadata
      formData.fields.addAll([
        MapEntry('caption', caption),
        if (hashtags != null)
          MapEntry('hashtags', hashtags.join(',')),
        if (location != null) MapEntry('location', location),
        if (soundId != null) MapEntry('soundId', soundId),
        if (productTags != null)
          MapEntry('productTags', productTags
              .map((tag) => '${tag.productId}:${tag.x}:${tag.y}')
              .join(',')),
      ]);

      final response = await dioClient.post(
        ApiConstants.content,
        data: formData,
      );

      return PostModel.fromJson(response.data['data'] ?? response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to create post: $e');
    }
  }

  @override
  Future<void> likePost(String postId) async {
    try {
      await dioClient.post(ApiConstants.contentLike(postId));
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to like post: $e');
    }
  }

  @override
  Future<void> unlikePost(String postId) async {
    try {
      await dioClient.delete(ApiConstants.contentLike(postId));
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to unlike post: $e');
    }
  }

  @override
  Future<void> savePost(String postId) async {
    try {
      await dioClient.post(ApiConstants.contentSave(postId));
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to save post: $e');
    }
  }

  @override
  Future<void> unsavePost(String postId) async {
    try {
      await dioClient.delete(ApiConstants.contentSave(postId));
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to unsave post: $e');
    }
  }

  @override
  Future<void> deletePost(String postId) async {
    try {
      await dioClient.delete(ApiConstants.contentById(postId));
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ServerException(message: 'Failed to delete post: $e');
    }
  }

  /// Handle Dio errors and convert to appropriate exceptions
  AppException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException(message: 'Request timeout');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data['message'] ?? 'Server error';
        
        if (statusCode == 401 || statusCode == 403) {
          return AuthException(message: message, code: statusCode.toString());
        }
        return ServerException(message: message, code: statusCode.toString());
      case DioExceptionType.cancel:
        return ServerException(message: 'Request cancelled');
      default:
        return NetworkException(message: 'No internet connection');
    }
  }
}
