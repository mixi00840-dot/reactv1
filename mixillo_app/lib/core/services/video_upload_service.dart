import 'dart:io';
import 'dart:async';
import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;
import '../network/api_endpoints.dart';
import '../constants/api_constants.dart';
import './mongodb_auth_service.dart';

/// Video upload service for chunked uploads to backend
/// Handles large file uploads with progress tracking and retry logic
/// Automatically includes authentication headers
class VideoUploadService {
  final Dio _dio;
  final MongoDBAuthService _authService = MongoDBAuthService();
  
  VideoUploadService({Dio? dio}) : _dio = dio ?? Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(minutes: 5),
      receiveTimeout: const Duration(minutes: 5),
      sendTimeout: const Duration(minutes: 5),
    ),
  ) {
    // Add interceptor to attach auth token to all requests
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Get access token from auth service
          final accessToken = _authService.accessToken;
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
            developer.log('🔐 Added auth token to request: ${options.path}');
          } else {
            developer.log('⚠️ No auth token available for: ${options.path}');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Auto-retry on 401 with token refresh
          if (error.response?.statusCode == 401) {
            developer.log('🔄 Token expired, attempting refresh...');
            
            final refreshed = await _authService.refreshAccessToken();
            if (refreshed) {
              // Retry original request with new token
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

  /// Chunk size for uploads (5MB)
  static const int chunkSize = 5 * 1024 * 1024;

  /// Upload video with chunked upload
  /// 
  /// Steps:
  /// 1. Initiate upload session → get uploadId
  /// 2. Split file into chunks
  /// 3. Upload each chunk with progress
  /// 4. Complete upload session
  /// 5. Create content post with metadata
  Future<UploadResult> uploadVideo({
    required String videoPath,
    required String thumbnailPath,
    required VideoMetadata metadata,
    Function(double progress)? onProgress,
    CancelToken? cancelToken,
  }) async {
    developer.log('🚀 Starting video upload: $videoPath');
    
    try {
      final videoFile = File(videoPath);
      final thumbnailFile = File(thumbnailPath);
      
      if (!await videoFile.exists()) {
        throw Exception('Video file not found: $videoPath');
      }
      
      if (!await thumbnailFile.exists()) {
        throw Exception('Thumbnail file not found: $thumbnailPath');
      }

      final fileSize = await videoFile.length();
      final totalChunks = (fileSize / chunkSize).ceil();
      
      developer.log('📦 File size: ${fileSize ~/ (1024 * 1024)}MB, Chunks: $totalChunks');

      // Step 1: Initiate upload
      final uploadId = await _initiateUpload(
        filename: path.basename(videoPath),
        fileSize: fileSize,
        totalChunks: totalChunks,
        cancelToken: cancelToken,
      );
      
      developer.log('✅ Upload session created: $uploadId');
      onProgress?.call(0.05);

      // Step 2: Upload chunks
      int uploadedBytes = 0;
      for (int chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        final start = chunkIndex * chunkSize;
        final end = (start + chunkSize < fileSize) ? start + chunkSize : fileSize;
        
        await _uploadChunk(
          uploadId: uploadId,
          videoFile: videoFile,
          chunkIndex: chunkIndex,
          start: start,
          end: end,
          cancelToken: cancelToken,
        );
        
        uploadedBytes = end;
        final progress = 0.05 + (uploadedBytes / fileSize) * 0.8; // 5%-85%
        onProgress?.call(progress);
        
        developer.log('📤 Uploaded chunk ${chunkIndex + 1}/$totalChunks');
      }

      // Step 3: Complete upload session
      final videoUrl = await _completeUpload(
        uploadId: uploadId,
        cancelToken: cancelToken,
      );
      
      developer.log('✅ Video upload complete: $videoUrl');
      onProgress?.call(0.9);

      // Step 4: Upload thumbnail
      final thumbnailUrl = await _uploadThumbnail(
        thumbnailFile: thumbnailFile,
        cancelToken: cancelToken,
      );
      
      developer.log('✅ Thumbnail uploaded: $thumbnailUrl');
      onProgress?.call(0.95);

      // Step 5: Create content post
      final contentId = await _createContent(
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        metadata: metadata,
        cancelToken: cancelToken,
      );
      
      developer.log('🎉 Content created: $contentId');
      onProgress?.call(1.0);

      return UploadResult(
        contentId: contentId,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
      );
      
    } catch (e, stackTrace) {
      developer.log('❌ Upload failed: $e', stackTrace: stackTrace);
      rethrow;
    }
  }

  /// Initiate upload session
  Future<String> _initiateUpload({
    required String filename,
    required int fileSize,
    required int totalChunks,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.initiateUpload,
        data: {
          'filename': filename,
          'fileSize': fileSize,
          'totalChunks': totalChunks,
          'contentType': 'video/mp4',
        },
        cancelToken: cancelToken,
      );

      return response.data['uploadId'] as String;
    } on DioException catch (e) {
      throw _handleError(e, 'Failed to initiate upload');
    }
  }

  /// Upload single chunk
  Future<void> _uploadChunk({
    required String uploadId,
    required File videoFile,
    required int chunkIndex,
    required int start,
    required int end,
    CancelToken? cancelToken,
  }) async {
    try {
      // Read chunk from file
      final randomAccessFile = await videoFile.open();
      await randomAccessFile.setPosition(start);
      final chunkBytes = await randomAccessFile.read(end - start);
      await randomAccessFile.close();

      // Upload chunk
      final formData = FormData.fromMap({
        'chunkIndex': chunkIndex,
        'chunk': MultipartFile.fromBytes(
          chunkBytes,
          filename: 'chunk_$chunkIndex',
        ),
      });

      await _dio.post(
        '${ApiEndpoints.uploadChunk}/$uploadId',
        data: formData,
        cancelToken: cancelToken,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
    } on DioException catch (e) {
      throw _handleError(e, 'Failed to upload chunk $chunkIndex');
    }
  }

  /// Complete upload session
  Future<String> _completeUpload({
    required String uploadId,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post(
        '${ApiEndpoints.completeUpload}/$uploadId',
        cancelToken: cancelToken,
      );

      return response.data['videoUrl'] as String;
    } on DioException catch (e) {
      throw _handleError(e, 'Failed to complete upload');
    }
  }

  /// Upload thumbnail
  Future<String> _uploadThumbnail({
    required File thumbnailFile,
    CancelToken? cancelToken,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          thumbnailFile.path,
          filename: path.basename(thumbnailFile.path),
        ),
      });

      final response = await _dio.post(
        ApiEndpoints.contentUpload,
        data: formData,
        cancelToken: cancelToken,
      );

      return response.data['fileUrl'] as String;
    } on DioException catch (e) {
      throw _handleError(e, 'Failed to upload thumbnail');
    }
  }

  /// Create content post with metadata
  Future<String> _createContent({
    required String videoUrl,
    required String thumbnailUrl,
    required VideoMetadata metadata,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.contentBase,
        data: {
          'title': metadata.caption,
          'description': metadata.caption,
          'videoUrl': videoUrl,
          'thumbnailUrl': thumbnailUrl,
          'type': 'video',
          'visibility': metadata.privacy.toLowerCase(),
          'allowComments': metadata.allowComments,
          'allowDuet': metadata.allowDuet,
          'allowStitch': metadata.allowStitch,
          'location': metadata.location,
          'tags': metadata.hashtags,
          'mentions': metadata.mentions,
          'duration': metadata.duration.inSeconds,
          'width': metadata.width,
          'height': metadata.height,
        },
        cancelToken: cancelToken,
      );

      return response.data['_id'] as String;
    } on DioException catch (e) {
      throw _handleError(e, 'Failed to create content');
    }
  }

  /// Handle Dio errors
  Exception _handleError(DioException error, String message) {
    if (error.type == DioExceptionType.cancel) {
      return Exception('Upload cancelled');
    }

    final statusCode = error.response?.statusCode;
    final errorMessage = error.response?.data?['message'] ?? error.message;

    return Exception('$message: $errorMessage (Status: $statusCode)');
  }

  /// Cancel ongoing upload
  static CancelToken createCancelToken() {
    return CancelToken();
  }
}

/// Video metadata for upload
class VideoMetadata {
  final String caption;
  final List<String> hashtags;
  final List<String> mentions;
  final String privacy;
  final String? location;
  final bool allowComments;
  final bool allowDuet;
  final bool allowStitch;
  final Duration duration;
  final int width;
  final int height;

  VideoMetadata({
    required this.caption,
    this.hashtags = const [],
    this.mentions = const [],
    this.privacy = 'Public',
    this.location,
    this.allowComments = true,
    this.allowDuet = true,
    this.allowStitch = true,
    required this.duration,
    required this.width,
    required this.height,
  });

  factory VideoMetadata.fromMap(Map<String, dynamic> map) {
    return VideoMetadata(
      caption: map['caption'] as String? ?? '',
      hashtags: List<String>.from(map['hashtags'] ?? []),
      mentions: List<String>.from(map['mentions'] ?? []),
      privacy: map['privacy'] as String? ?? 'Public',
      location: map['location'] as String?,
      allowComments: map['allowComments'] as bool? ?? true,
      allowDuet: map['allowDuet'] as bool? ?? true,
      allowStitch: map['allowStitch'] as bool? ?? true,
      duration: Duration(seconds: map['duration'] as int? ?? 0),
      width: map['width'] as int? ?? 1080,
      height: map['height'] as int? ?? 1920,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'caption': caption,
      'hashtags': hashtags,
      'mentions': mentions,
      'privacy': privacy,
      'location': location,
      'allowComments': allowComments,
      'allowDuet': allowDuet,
      'allowStitch': allowStitch,
      'duration': duration.inSeconds,
      'width': width,
      'height': height,
    };
  }
}

/// Upload result
class UploadResult {
  final String contentId;
  final String videoUrl;
  final String thumbnailUrl;

  UploadResult({
    required this.contentId,
    required this.videoUrl,
    required this.thumbnailUrl,
  });
}
