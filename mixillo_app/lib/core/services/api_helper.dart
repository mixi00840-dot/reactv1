import 'package:dio/dio.dart';
import 'mongodb_auth_service.dart';

/// API Helper Service - Wrapper around MongoDB Auth Service
/// Provides easy access to Dio client with JWT authentication
/// Use this instead of the old Firebase-based ApiService
class ApiHelper {
  static final ApiHelper _instance = ApiHelper._internal();
  factory ApiHelper() => _instance;
  ApiHelper._internal();

  /// Get Dio client with JWT authentication
  Dio get dio => MongoDBAuthService().dio;

  /// Check if user is authenticated
  bool get isAuthenticated => MongoDBAuthService().isAuthenticated;

  /// Get current user ID
  String? get userId => MongoDBAuthService().userId;

  /// Get current user data
  Map<String, dynamic>? get currentUser => MongoDBAuthService().currentUser;

  /// Get access token
  String? get accessToken => MongoDBAuthService().accessToken;
}
