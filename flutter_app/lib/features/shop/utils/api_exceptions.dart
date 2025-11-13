/// Custom exception types for API errors
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;
}

/// Network connectivity exception
class NetworkException extends ApiException {
  NetworkException(String message) : super(message);
}

/// Server error exception (5xx)
class ServerException extends ApiException {
  ServerException(String message, {int? statusCode})
      : super(message, statusCode: statusCode);
}

/// Client error exception (4xx)
class ClientException extends ApiException {
  ClientException(String message, {int? statusCode})
      : super(message, statusCode: statusCode);
}

/// Authentication error exception (401, 403)
class AuthException extends ApiException {
  AuthException(String message, {int? statusCode})
      : super(message, statusCode: statusCode);
}

/// Timeout exception
class TimeoutException extends ApiException {
  TimeoutException(String message) : super(message);
}

/// Data parsing exception
class ParseException extends ApiException {
  ParseException(String message) : super(message);
}

/// Cache exception
class CacheException implements Exception {
  final String message;

  CacheException(this.message);

  @override
  String toString() => message;
}
