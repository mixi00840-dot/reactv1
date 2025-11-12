import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Core service providers

/// Provider for ApiService (singleton)
final apiServiceProvider = Provider<ApiService>((ref) {
  final apiService = ApiService();
  apiService.initialize();
  return apiService;
});

/// Provider for AuthService (singleton)
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

