import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_storage.g.dart';

/// Secure Storage Service
/// Wrapper around flutter_secure_storage for encrypted key-value storage
class SecureStorageService {
  final FlutterSecureStorage _storage;
  
  SecureStorageService([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
              ),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );
  
  // ==================== WRITE ====================
  
  /// Write a value to secure storage
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      throw SecureStorageException('Failed to write $key: $e');
    }
  }
  
  /// Write multiple values at once
  Future<void> writeAll(Map<String, String> data) async {
    try {
      for (final entry in data.entries) {
        await write(entry.key, entry.value);
      }
    } catch (e) {
      throw SecureStorageException('Failed to write multiple values: $e');
    }
  }
  
  // ==================== READ ====================
  
  /// Read a value from secure storage
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      throw SecureStorageException('Failed to read $key: $e');
    }
  }
  
  /// Read all values from secure storage
  Future<Map<String, String>> readAll() async {
    try {
      return await _storage.readAll();
    } catch (e) {
      throw SecureStorageException('Failed to read all values: $e');
    }
  }
  
  // ==================== DELETE ====================
  
  /// Delete a value from secure storage
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      throw SecureStorageException('Failed to delete $key: $e');
    }
  }
  
  /// Delete all values from secure storage
  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      throw SecureStorageException('Failed to delete all values: $e');
    }
  }
  
  // ==================== CHECK ====================
  
  /// Check if a key exists in secure storage
  Future<bool> containsKey(String key) async {
    try {
      return await _storage.containsKey(key: key);
    } catch (e) {
      throw SecureStorageException('Failed to check key $key: $e');
    }
  }
  
  // ==================== TOKEN HELPERS ====================
  
  /// Save authentication tokens
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await writeAll({
      'access_token': accessToken,
      'refresh_token': refreshToken,
    });
  }
  
  /// Save access token
  Future<void> saveAccessToken(String token) async {
    await write('access_token', token);
  }
  
  /// Save refresh token
  Future<void> saveRefreshToken(String token) async {
    await write('refresh_token', token);
  }
  
  /// Get access token
  Future<String?> getAccessToken() async {
    return await read('access_token');
  }
  
  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return await read('refresh_token');
  }
  
  /// Save user data (as JSON string)
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    final jsonString = userData.toString(); // Simple string representation
    await write('user_data', jsonString);
  }
  
  /// Get user data
  Future<Map<String, dynamic>?> getUserData() async {
    final data = await read('user_data');
    if (data == null) return null;
    // For now, return null - in production, parse JSON properly
    return null;
  }
  
  /// Delete tokens (logout)
  Future<void> clearTokens() async {
    await delete('access_token');
    await delete('refresh_token');
    await delete('user_id');
    await delete('user_data');
  }
  
  /// Clear all data
  Future<void> clearAll() async {
    await deleteAll();
  }
  
  /// Save user ID
  Future<void> saveUserId(String userId) async {
    await write('user_id', userId);
  }
  
  /// Get user ID
  Future<String?> getUserId() async {
    return await read('user_id');
  }
}

/// Custom exception for secure storage errors
class SecureStorageException implements Exception {
  final String message;
  
  SecureStorageException(this.message);
  
  @override
  String toString() => 'SecureStorageException: $message';
}

/// Riverpod provider for secure storage service
@riverpod
SecureStorageService secureStorage(SecureStorageRef ref) {
  return SecureStorageService();
}
