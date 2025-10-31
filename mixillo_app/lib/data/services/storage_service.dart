import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static late SharedPreferences _prefs;
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  
  // Keys
  static const String _keyToken = 'auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUserData = 'user_data';
  static const String _keyThemeMode = 'theme_mode';
  static const String _keyLanguage = 'language';
  static const String _keyFirstLaunch = 'first_launch';
  
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // Token Management
  static Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _keyToken, value: token);
  }
  
  static Future<String?> getToken() async {
    return await _secureStorage.read(key: _keyToken);
  }
  
  static Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: _keyRefreshToken, value: token);
  }
  
  static Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _keyRefreshToken);
  }
  
  static Future<void> clearTokens() async {
    await _secureStorage.delete(key: _keyToken);
    await _secureStorage.delete(key: _keyRefreshToken);
  }
  
  // User Data
  static Future<void> saveUserId(String userId) async {
    await _prefs.setString(_keyUserId, userId);
  }
  
  static String? getUserId() {
    return _prefs.getString(_keyUserId);
  }
  
  static Future<void> saveUserData(String userData) async {
    await _prefs.setString(_keyUserData, userData);
  }
  
  static String? getUserData() {
    return _prefs.getString(_keyUserData);
  }
  
  static Future<void> clearUserData() async {
    await _prefs.remove(_keyUserId);
    await _prefs.remove(_keyUserData);
  }
  
  // App Settings
  static Future<void> setThemeMode(String mode) async {
    await _prefs.setString(_keyThemeMode, mode);
  }
  
  static String getThemeMode() {
    return _prefs.getString(_keyThemeMode) ?? 'system';
  }
  
  static Future<void> setLanguage(String languageCode) async {
    await _prefs.setString(_keyLanguage, languageCode);
  }
  
  static String getLanguage() {
    return _prefs.getString(_keyLanguage) ?? 'en';
  }
  
  static Future<void> setFirstLaunch(bool isFirst) async {
    await _prefs.setBool(_keyFirstLaunch, isFirst);
  }
  
  static bool isFirstLaunch() {
    return _prefs.getBool(_keyFirstLaunch) ?? true;
  }
  
  // Clear All Data
  static Future<void> clearAll() async {
    await clearTokens();
    await clearUserData();
    await _prefs.clear();
  }
}
