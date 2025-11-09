import 'dart:io';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';
import 'api_interceptors.dart';

part 'api_client.g.dart';

/// Main API Client for all backend communication
/// Uses Dio for HTTP requests with automatic token injection and refresh
class ApiClient {
  late final Dio _dio;
  final SecureStorageService _secureStorage;
  
  ApiClient(this._secureStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        sendTimeout: ApiConstants.sendTimeout,
        headers: ApiConstants.defaultHeaders,
        validateStatus: (status) {
          // Accept all status codes to handle them manually
          return status != null && status < 500;
        },
      ),
    );
    
    // Add interceptors in order
    _dio.interceptors.addAll([
      AuthInterceptor(_secureStorage),
      RefreshTokenInterceptor(_dio, _secureStorage),
      LoggingInterceptor(),
      ErrorInterceptor(),
    ]);
  }
  
  // ==================== HTTP METHODS ====================
  
  /// GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  // ==================== FILE UPLOAD ====================
  
  /// Upload a single file
  Future<Response<T>> uploadFile<T>(
    String path,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
        if (data != null) ...data,
      });
      
      return await post<T>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        cancelToken: cancelToken,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  /// Upload multiple files
  Future<Response<T>> uploadFiles<T>(
    String path,
    List<File> files, {
    String fieldName = 'files',
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final formData = FormData.fromMap({
        fieldName: await Future.wait(
          files.map((file) => MultipartFile.fromFile(
            file.path,
            filename: file.path.split('/').last,
          )),
        ),
        if (data != null) ...data,
      });
      
      return await post<T>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        cancelToken: cancelToken,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
  
  // ==================== CHUNKED UPLOAD ====================
  
  /// Upload large file in chunks with retry capability
  Future<String> uploadInChunks(
    String initiateEndpoint,
    String chunkEndpoint,
    String completeEndpoint,
    File file, {
    int chunkSize = 5 * 1024 * 1024, // 5MB default
    Map<String, dynamic>? metadata,
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    // 1. Initiate upload
    final initiateResponse = await post(
      initiateEndpoint,
      data: {
        'fileName': file.path.split('/').last,
        'fileSize': await file.length(),
        'mimeType': _getMimeType(file.path),
        ...?metadata,
      },
    );
    
    final uploadId = initiateResponse.data['uploadId'];
    final fileSize = await file.length();
    final totalChunks = (fileSize / chunkSize).ceil();
    
    // 2. Upload chunks
    for (int i = 0; i < totalChunks; i++) {
      final start = i * chunkSize;
      final end = (start + chunkSize > fileSize) ? fileSize : start + chunkSize;
      
      final chunk = await file.openRead(start, end).toList();
      final chunkBytes = chunk.expand((x) => x).toList();
      
      // Retry logic for each chunk
      await _uploadChunkWithRetry(
        chunkEndpoint,
        uploadId,
        i,
        chunkBytes,
        totalChunks,
        cancelToken: cancelToken,
      );
      
      // Report progress
      if (onProgress != null) {
        onProgress((i + 1) * chunkSize, fileSize);
      }
    }
    
    // 3. Complete upload
    final completeResponse = await post(
      completeEndpoint,
      data: {
        'uploadId': uploadId,
        ...?metadata,
      },
    );
    
    return completeResponse.data['contentId'] ?? uploadId;
  }
  
  Future<void> _uploadChunkWithRetry(
    String endpoint,
    String uploadId,
    int chunkIndex,
    List<int> chunkData,
    int totalChunks, {
    int maxRetries = 3,
    CancelToken? cancelToken,
  }) async {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await post(
          '$endpoint/$uploadId',
          data: {
            'chunkIndex': chunkIndex,
            'totalChunks': totalChunks,
            'data': chunkData,
          },
          cancelToken: cancelToken,
        );
        return; // Success
      } catch (e) {
        if (attempt == maxRetries - 1) rethrow;
        // Exponential backoff
        await Future.delayed(Duration(seconds: (1 << attempt)));
      }
    }
  }
  
  // ==================== ERROR HANDLING ====================
  
  ApiException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: 'Request timeout. Please check your connection.',
          statusCode: 408,
          type: ApiExceptionType.timeout,
        );
      
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? 500;
        final message = error.response?.data?['message'] ?? 
                       error.response?.statusMessage ?? 
                       'An error occurred';
        
        return ApiException(
          message: message,
          statusCode: statusCode,
          type: _getExceptionType(statusCode),
          data: error.response?.data,
        );
      
      case DioExceptionType.cancel:
        return ApiException(
          message: 'Request cancelled',
          type: ApiExceptionType.cancel,
        );
      
      case DioExceptionType.connectionError:
        return ApiException(
          message: 'No internet connection',
          type: ApiExceptionType.noInternet,
        );
      
      default:
        return ApiException(
          message: error.message ?? 'An unexpected error occurred',
          type: ApiExceptionType.unknown,
        );
    }
  }
  
  ApiExceptionType _getExceptionType(int statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode == 401) return ApiExceptionType.unauthorized;
      if (statusCode == 403) return ApiExceptionType.forbidden;
      if (statusCode == 404) return ApiExceptionType.notFound;
      return ApiExceptionType.badRequest;
    }
    if (statusCode >= 500) return ApiExceptionType.serverError;
    return ApiExceptionType.unknown;
  }
  
  String _getMimeType(String path) {
    final extension = path.split('.').last.toLowerCase();
    switch (extension) {
      case 'mp4':
      case 'mov':
        return 'video/mp4';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }
  
  // ==================== UTILITIES ====================
  
  /// Get the underlying Dio instance for advanced usage
  Dio get dio => _dio;
}

// ==================== EXCEPTIONS ====================

enum ApiExceptionType {
  timeout,
  noInternet,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
  cancel,
  unknown,
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final ApiExceptionType type;
  final dynamic data;
  
  ApiException({
    required this.message,
    this.statusCode,
    required this.type,
    this.data,
  });
  
  @override
  String toString() => 'ApiException: $message (${statusCode ?? "no code"})';
  
  bool get isUnauthorized => type == ApiExceptionType.unauthorized;
  bool get isTimeout => type == ApiExceptionType.timeout;
  bool get isNoInternet => type == ApiExceptionType.noInternet;
}

// ==================== RIVERPOD PROVIDER ====================

@riverpod
ApiClient apiClient(ApiClientRef ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return ApiClient(secureStorage);
}
