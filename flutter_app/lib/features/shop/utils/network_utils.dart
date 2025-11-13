import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:io';
import 'dart:async';

/// Network utility class for checking connectivity
class NetworkUtils {
  static final Connectivity _connectivity = Connectivity();

  /// Check if device has internet connectivity
  static Future<bool> hasInternetConnection() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      
      // If no connectivity, return false
      if (connectivityResult.contains(ConnectivityResult.none)) {
        return false;
      }

      // Try to ping a reliable server to confirm actual internet access
      try {
        final result = await InternetAddress.lookup('google.com')
            .timeout(const Duration(seconds: 5));
        
        return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
      } on SocketException catch (_) {
        return false;
      }
    } catch (e) {
      // If connectivity check fails, assume no connection
      return false;
    }
  }

  /// Get connectivity stream for real-time updates
  static Stream<List<ConnectivityResult>> get onConnectivityChanged =>
      _connectivity.onConnectivityChanged;

  /// Check if currently connected to WiFi
  static Future<bool> isConnectedToWiFi() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return connectivityResult.contains(ConnectivityResult.wifi);
  }

  /// Check if currently connected to mobile data
  static Future<bool> isConnectedToMobile() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return connectivityResult.contains(ConnectivityResult.mobile);
  }
}
