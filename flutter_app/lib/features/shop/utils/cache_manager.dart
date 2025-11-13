import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/api_exceptions.dart';

/// Simple cache manager for offline support
class CacheManager {
  static const String _cachePrefix = 'cache_';
  static const Duration _defaultExpiration = Duration(hours: 1);

  /// Save data to cache with expiration
  static Future<void> saveToCache({
    required String key,
    required dynamic data,
    Duration? expiration,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _cachePrefix + key;
      
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'expiration': (expiration ?? _defaultExpiration).inMilliseconds,
      };
      
      await prefs.setString(cacheKey, jsonEncode(cacheData));
    } catch (e) {
      throw CacheException('Failed to save cache: $e');
    }
  }

  /// Get data from cache
  static Future<T?> getFromCache<T>({
    required String key,
    bool checkExpiration = true,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _cachePrefix + key;
      
      final cacheString = prefs.getString(cacheKey);
      if (cacheString == null) return null;
      
      final cacheData = jsonDecode(cacheString);
      
      // Check if cache is expired
      if (checkExpiration) {
        final timestamp = cacheData['timestamp'] as int;
        final expiration = cacheData['expiration'] as int;
        final now = DateTime.now().millisecondsSinceEpoch;
        
        if (now - timestamp > expiration) {
          await clearCache(key);
          return null;
        }
      }
      
      return cacheData['data'] as T;
    } catch (e) {
      throw CacheException('Failed to read cache: $e');
    }
  }

  /// Clear specific cache
  static Future<void> clearCache(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _cachePrefix + key;
      await prefs.remove(cacheKey);
    } catch (e) {
      throw CacheException('Failed to clear cache: $e');
    }
  }

  /// Clear all caches
  static Future<void> clearAllCaches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      throw CacheException('Failed to clear all caches: $e');
    }
  }

  /// Check if cache exists and is valid
  static Future<bool> isCacheValid(String key) async {
    try {
      final data = await getFromCache(key: key, checkExpiration: true);
      return data != null;
    } catch (e) {
      return false;
    }
  }
}
