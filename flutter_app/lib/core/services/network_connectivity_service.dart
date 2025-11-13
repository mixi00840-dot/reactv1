import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Network connectivity service
/// Monitors network status and provides connectivity checks
class NetworkConnectivityService {
  static final NetworkConnectivityService _instance = NetworkConnectivityService._internal();
  factory NetworkConnectivityService() => _instance;
  NetworkConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  
  final _connectivityController = StreamController<bool>.broadcast();
  Stream<bool> get connectivityStream => _connectivityController.stream;

  bool _isConnected = true;
  bool get isConnected => _isConnected;

  /// Initialize connectivity monitoring
  Future<void> initialize() async {
    // Check initial connectivity
    await _updateConnectivity();

    // Listen for connectivity changes
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      _updateConnectivity();
    });

    debugPrint('✅ Network connectivity service initialized');
  }

  /// Update connectivity status
  Future<void> _updateConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      final wasConnected = _isConnected;
      
      _isConnected = !result.contains(ConnectivityResult.none) && result.isNotEmpty;

      if (wasConnected != _isConnected) {
        debugPrint('📡 Network status changed: ${_isConnected ? "Connected" : "Disconnected"}');
        _connectivityController.add(_isConnected);
      }
    } catch (e) {
      debugPrint('❌ Error checking connectivity: $e');
    }
  }

  /// Check connectivity status
  Future<bool> checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return !result.contains(ConnectivityResult.none) && result.isNotEmpty;
    } catch (e) {
      debugPrint('❌ Error checking connectivity: $e');
      return false;
    }
  }

  /// Check if connected via WiFi
  Future<bool> isWiFiConnected() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return result.contains(ConnectivityResult.wifi);
    } catch (e) {
      debugPrint('❌ Error checking WiFi connectivity: $e');
      return false;
    }
  }

  /// Check if connected via mobile data
  Future<bool> isMobileConnected() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return result.contains(ConnectivityResult.mobile);
    } catch (e) {
      debugPrint('❌ Error checking mobile connectivity: $e');
      return false;
    }
  }

  /// Wait for connectivity to be restored
  /// Returns true if connected within timeout, false otherwise
  Future<bool> waitForConnectivity({Duration timeout = const Duration(seconds: 30)}) async {
    if (await checkConnectivity()) {
      return true;
    }

    debugPrint('⏳ Waiting for network connectivity...');

    try {
      await connectivityStream
          .firstWhere((connected) => connected)
          .timeout(timeout);
      return true;
    } on TimeoutException {
      debugPrint('⏰ Network connectivity timeout');
      return false;
    } catch (e) {
      debugPrint('❌ Error waiting for connectivity: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _subscription?.cancel();
    _connectivityController.close();
  }
}
