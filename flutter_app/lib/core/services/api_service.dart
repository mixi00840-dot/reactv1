import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  final AuthService _authService = AuthService();
  bool _isInitialized = false;

  void initialize() {
    if (_isInitialized) return; // Prevent re-initialization

    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api';
    
    // Initialize auth service first
    _authService.initialize();

    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          final refreshed = await _authService.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            final token = await _authService.getToken();
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(error.requestOptions);
            return handler.resolve(response);
          } else {
            // Refresh failed, redirect to login
            await _authService.clearAuthData();
          }
        }
        return handler.next(error);
      },
    ));

    // Add logging interceptor (only in debug mode)
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));

    _isInitialized = true; // Mark as initialized
  }

  Dio get dio => _dio;

  // Generic GET request
  Future<Map<String, dynamic>> get(String path,
      {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // Generic POST request
  Future<Map<String, dynamic>> post(String path,
      {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final response =
          await _dio.post(path, data: data, queryParameters: queryParameters);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // Generic PUT request
  Future<Map<String, dynamic>> put(String path, {dynamic data}) async {
    try {
      final response = await _dio.put(path, data: data);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // Generic DELETE request
  Future<Map<String, dynamic>> delete(String path) async {
    try {
      final response = await _dio.delete(path);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  /// Get raw Dio instance for advanced usage
  Dio get dioInstance => _dio;

  /// Handle API errors and convert to user-friendly messages
  Exception handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return Exception('Connection timeout. Please check your internet connection.');
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message = error.response?.data?['message'] ?? 'Unknown error occurred';
          switch (statusCode) {
            case 400:
              return Exception('Bad request: $message');
            case 401:
              return Exception('Unauthorized. Please login again.');
            case 403:
              return Exception('Access forbidden: $message');
            case 404:
              return Exception('Resource not found: $message');
            case 500:
              return Exception('Server error. Please try again later.');
            default:
              return Exception('Error $statusCode: $message');
          }
        case DioExceptionType.cancel:
          return Exception('Request cancelled');
        case DioExceptionType.unknown:
        default:
          return Exception('Network error. Please check your connection.');
      }
    }
    return Exception('Unexpected error: ${error.toString()}');
  }

  /// Upload file (multipart)
  Future<Map<String, dynamic>> uploadFile(
    String path,
    String filePath, {
    String fieldName = 'file',
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final fileName = filePath.split('/').last;
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(filePath, filename: fileName),
        if (additionalData != null) ...additionalData,
      });

      final response = await _dio.post(path, data: formData);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw handleError(e);
    }
  }

  /// Check if API is reachable
  Future<bool> checkConnectivity() async {
    try {
      final response = await _dio.get('/health', 
        options: Options(receiveTimeout: const Duration(seconds: 5))
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
