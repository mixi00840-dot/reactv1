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
            // Retry the request
            final token = await _authService.getToken();
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(error.requestOptions);
            return handler.resolve(response);
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
}
