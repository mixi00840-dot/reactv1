import 'api_service.dart';
import '../config/api_config.dart';

class AuthService {
  final ApiService _api = ApiService();

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '${ApiConfig.authEndpoint}/login',
      {
        'email': email,
        'password': password,
      },
      includeAuth: false,
    );

    // Save token
    if (response['token'] != null) {
      await _api.saveToken(response['token']);
    }

    return response;
  }

  // Register
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String username,
    required String displayName,
  }) async {
    final response = await _api.post(
      '${ApiConfig.authEndpoint}/register',
      {
        'email': email,
        'password': password,
        'username': username,
        'displayName': displayName,
      },
      includeAuth: false,
    );

    // Save token
    if (response['token'] != null) {
      await _api.saveToken(response['token']);
    }

    return response;
  }

  // Logout
  Future<void> logout() async {
    await _api.post('${ApiConfig.authEndpoint}/logout', {});
    await _api.clearToken();
  }

  // Get current user
  Future<Map<String, dynamic>> getCurrentUser() async {
    return await _api.get('${ApiConfig.authEndpoint}/me');
  }

  // Refresh token
  Future<Map<String, dynamic>> refreshToken() async {
    final response = await _api.post('${ApiConfig.authEndpoint}/refresh', {});
    
    if (response['token'] != null) {
      await _api.saveToken(response['token']);
    }
    
    return response;
  }

  // Forgot password
  Future<void> forgotPassword(String email) async {
    await _api.post(
      '${ApiConfig.authEndpoint}/forgot-password',
      {'email': email},
      includeAuth: false,
    );
  }

  // Reset password
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _api.post(
      '${ApiConfig.authEndpoint}/reset-password',
      {
        'token': token,
        'password': newPassword,
      },
      includeAuth: false,
    );
  }

  // Change password
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _api.put(
      '${ApiConfig.authEndpoint}/change-password',
      {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      },
    );
  }
}
