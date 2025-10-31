/// Base Exception class for data layer
class AppException implements Exception {
  final String message;
  final String? code;

  AppException({
    required this.message,
    this.code,
  });

  @override
  String toString() => 'AppException: $message (code: $code)';
}

/// Server exceptions (API errors)
class ServerException extends AppException {
  ServerException({
    required super.message,
    super.code,
  });
}

/// Network exceptions
class NetworkException extends AppException {
  NetworkException({
    super.message = 'No internet connection',
    super.code,
  });
}

/// Cache exceptions
class CacheException extends AppException {
  CacheException({
    required super.message,
    super.code,
  });
}

/// Authentication exceptions
class AuthException extends AppException {
  AuthException({
    required super.message,
    super.code,
  });
}

/// Validation exceptions
class ValidationException extends AppException {
  ValidationException({
    required super.message,
    super.code,
  });
}

/// Media exceptions
class MediaException extends AppException {
  MediaException({
    required super.message,
    super.code,
  });
}

/// Permission exceptions
class PermissionException extends AppException {
  PermissionException({
    required super.message,
    super.code,
  });
}
