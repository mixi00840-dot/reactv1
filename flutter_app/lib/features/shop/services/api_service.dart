import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/api_exceptions.dart';
import '../utils/network_utils.dart';

/// Base API service with common functionality
class ApiService {
  late final Dio _dio;
  static const String _tokenKey = 'auth_token';

  ApiService() {
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api';
    
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request interceptor for auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, clear it
            await _clearToken();
          }
          return handler.next(error);
        },
      ),
    );

    // Logging interceptor (only in debug mode)
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (obj) => print('[API] $obj'),
      ),
    );
  }

  Dio get dio => _dio;

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  /// Handle API errors and convert to user-friendly messages
  String handleError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timeout. Please check your internet connection and try again.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message = error.response?.data?['message'];
          
          if (statusCode == 400) {
            return message ?? 'Invalid request. Please check your input.';
          } else if (statusCode == 401) {
            return 'Session expired. Please log in again.';
          } else if (statusCode == 403) {
            return 'Access denied. You don\'t have permission.';
          } else if (statusCode == 404) {
            return 'Resource not found.';
          } else if (statusCode == 429) {
            return 'Too many requests. Please slow down and try again.';
          } else if (statusCode != null && statusCode >= 500) {
            return 'Server error. Please try again later.';
          }
          return message ?? 'Something went wrong. Please try again.';
        case DioExceptionType.cancel:
          return 'Request cancelled.';
        case DioExceptionType.connectionError:
          return 'No internet connection. Please check your network.';
        case DioExceptionType.badCertificate:
          return 'Security certificate error. Please contact support.';
        case DioExceptionType.unknown:
          if (error.message?.contains('SocketException') ?? false) {
            return 'Network error. Please check your internet connection.';
          }
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    // Handle custom exceptions
    if (error is NetworkException) {
      return error.message;
    } else if (error is AuthException) {
      return error.message;
    } else if (error is ServerException) {
      return error.message;
    } else if (error is ClientException) {
      return error.message;
    } else if (error is TimeoutException) {
      return error.message;
    } else if (error is ParseException) {
      return error.message;
    }
    
    return error.toString();
  }

  /// Check network before making request
  Future<void> _checkNetwork() async {
    final hasConnection = await NetworkUtils.hasInternetConnection();
    if (!hasConnection) {
      throw NetworkException('No internet connection. Please check your network.');
    }
  }

  /// Safe API call with network check and error handling
  Future<T> safeApiCall<T>(Future<T> Function() apiCall) async {
    try {
      await _checkNetwork();
      return await apiCall();
    } on DioException catch (e) {
      throw ApiException(handleError(e));
    } catch (e) {
      throw ApiException(handleError(e));
    }
  }
}

/// API response wrapper for consistent handling
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] ?? false,
      data: fromJsonT != null && json['data'] != null
          ? fromJsonT(json['data'])
          : json['data'],
      message: json['message'],
      statusCode: json['statusCode'],
    );
  }
}
