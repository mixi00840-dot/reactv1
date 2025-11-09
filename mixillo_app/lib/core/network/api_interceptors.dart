import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../constants/api_constants.dart';
import 'api_endpoints.dart';

/// Interceptor that adds authentication token to requests
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storage;

  AuthInterceptor(this._storage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for login/register/refresh endpoints
    final skipAuthPaths = [
      ApiEndpoints.login,
      ApiEndpoints.register,
      ApiEndpoints.refreshToken,
    ];

    if (skipAuthPaths.any((path) => options.path.contains(path))) {
      return handler.next(options);
    }

    // Add access token to headers
    final accessToken = await _storage.getAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    handler.next(options);
  }
}

/// Interceptor that handles token refresh on 401 responses
class RefreshTokenInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  bool _isRefreshing = false;
  List<void Function()> _pendingRequests = [];

  RefreshTokenInterceptor(this._dio, this._storage);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Check if error is 401 Unauthorized
    if (err.response?.statusCode == 401) {
      // Skip refresh for auth endpoints
      final skipRefreshPaths = [
        ApiEndpoints.login,
        ApiEndpoints.register,
        ApiEndpoints.refreshToken,
      ];

      if (skipRefreshPaths.any((path) => err.requestOptions.path.contains(path))) {
        return handler.next(err);
      }

      // Attempt to refresh token
      final newAccessToken = await _refreshToken();

      if (newAccessToken != null) {
        // Retry the original request with new token
        err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        try {
          final response = await _dio.fetch(err.requestOptions);
          return handler.resolve(response);
        } catch (e) {
          return handler.next(err);
        }
      } else {
        // Refresh failed, clear tokens and redirect to login
        await _storage.clearTokens();
        // Note: Navigation to login should be handled by the app
        return handler.next(err);
      }
    }

    handler.next(err);
  }

  Future<String?> _refreshToken() async {
    if (_isRefreshing) {
      // Wait for ongoing refresh
      await Future.delayed(const Duration(milliseconds: 100));
      return _storage.getAccessToken();
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      // Call refresh token endpoint
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiEndpoints.refreshToken}',
        data: {'refreshToken': refreshToken},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['accessToken'] as String?;
        final newRefreshToken = response.data['refreshToken'] as String?;

        if (newAccessToken != null) {
          await _storage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );

          // Process pending requests
          for (var request in _pendingRequests) {
            request();
          }
          _pendingRequests.clear();

          return newAccessToken;
        }
      }

      return null;
    } catch (e) {
      developer.log(
        'Token refresh failed',
        name: 'RefreshTokenInterceptor',
        error: e,
      );
      return null;
    } finally {
      _isRefreshing = false;
    }
  }
}

/// Interceptor that logs HTTP requests and responses
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '${options.method} ${options.uri}',
      name: 'API Request',
    );
    developer.log(
      'Headers: ${options.headers}',
      name: 'API Request',
    );
    if (options.data != null) {
      developer.log(
        'Data: ${options.data}',
        name: 'API Request',
      );
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '${response.statusCode} ${response.requestOptions.uri}',
      name: 'API Response',
    );
    developer.log(
      'Data: ${response.data}',
      name: 'API Response',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      'Error: ${err.message}',
      name: 'API Error',
      error: err,
      stackTrace: err.stackTrace,
    );
    if (err.response != null) {
      developer.log(
        'Response: ${err.response?.data}',
        name: 'API Error',
      );
    }
    handler.next(err);
  }
}

/// Interceptor that standardizes error responses
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    String message = 'An unexpected error occurred';

    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout. Please check your internet connection.';
    } else if (err.type == DioExceptionType.connectionError) {
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (err.response != null) {
      final statusCode = err.response?.statusCode;
      final responseData = err.response?.data;

      // Extract error message from response
      if (responseData is Map<String, dynamic>) {
        message = responseData['message'] ?? 
                  responseData['error'] ?? 
                  message;
      }

      // Override with status-specific messages
      switch (statusCode) {
        case 400:
          message = responseData is Map 
              ? (responseData['message'] ?? 'Invalid request')
              : 'Invalid request';
          break;
        case 401:
          message = 'Unauthorized. Please login again.';
          break;
        case 403:
          message = 'Access forbidden';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 500:
        case 502:
        case 503:
          message = 'Server error. Please try again later.';
          break;
      }
    }

    // Update error message
    err = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: message,
      message: message,
    );

    handler.next(err);
  }
}
