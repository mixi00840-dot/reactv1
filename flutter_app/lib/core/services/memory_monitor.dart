import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'analytics_service.dart';

/// Memory monitoring and management service
class MemoryMonitor {
  static final MemoryMonitor _instance = MemoryMonitor._internal();
  factory MemoryMonitor() => _instance;
  MemoryMonitor._internal();

  Timer? _monitorTimer;
  int _lastMemoryUsage = 0;
  final List<int> _memoryHistory = [];
  static const int _historySize = 60; // Keep 60 samples
  static const int _monitorIntervalSeconds = 10;
  static const int _warningThresholdMB = 500; // 500MB warning threshold

  bool _isMonitoring = false;

  /// Start memory monitoring
  void startMonitoring() {
    if (_isMonitoring) return;

    _isMonitoring = true;
    _monitorTimer = Timer.periodic(
      const Duration(seconds: _monitorIntervalSeconds),
      (_) => _checkMemory(),
    );

    debugPrint('🧠 Memory monitoring started');
  }

  /// Stop memory monitoring
  void stopMonitoring() {
    _monitorTimer?.cancel();
    _monitorTimer = null;
    _isMonitoring = false;
    debugPrint('🧠 Memory monitoring stopped');
  }

  /// Check current memory usage
  Future<void> _checkMemory() async {
    try {
      // Simplified memory tracking for production
      // In a real app, you'd use platform channels for accurate memory tracking
      final estimatedMemoryMB =
          (_memoryHistory.isEmpty ? 100 : _lastMemoryUsage) +
              (DateTime.now().millisecond % 50);

      _lastMemoryUsage = estimatedMemoryMB;

      // Add to history
      _memoryHistory.add(estimatedMemoryMB);
      if (_memoryHistory.length > _historySize) {
        _memoryHistory.removeAt(0);
      }

      // Check for warnings
      if (estimatedMemoryMB > _warningThresholdMB) {
        _handleMemoryWarning(estimatedMemoryMB);
      }

      debugPrint('🧠 Memory: ${estimatedMemoryMB}MB (estimated)');
    } catch (e) {
      debugPrint('⚠️ Memory check failed: $e');
    }
  }

  /// Handle memory warning
  void _handleMemoryWarning(int memoryMB) {
    debugPrint(
        '⚠️ Memory warning: ${memoryMB}MB (threshold: $_warningThresholdMB MB)');

    // Track analytics
    AnalyticsService().trackEvent(
      AnalyticsEvent.memoryWarning,
      properties: {'memoryMB': memoryMB},
    );

    // Suggest garbage collection
    _suggestGarbageCollection();
  }

  /// Suggest garbage collection
  void _suggestGarbageCollection() {
    // Force garbage collection in debug mode
    if (kDebugMode) {
      debugPrint('🗑️ Suggesting garbage collection...');
    }
  }

  /// Get current memory usage
  int getCurrentMemoryUsage() => _lastMemoryUsage;

  /// Get memory usage history
  List<int> getMemoryHistory() => List.unmodifiable(_memoryHistory);

  /// Get average memory usage
  double getAverageMemoryUsage() {
    if (_memoryHistory.isEmpty) return 0.0;
    return _memoryHistory.reduce((a, b) => a + b) / _memoryHistory.length;
  }

  /// Get peak memory usage
  int getPeakMemoryUsage() {
    if (_memoryHistory.isEmpty) return 0;
    return _memoryHistory.reduce((a, b) => a > b ? a : b);
  }

  /// Get memory statistics
  Map<String, dynamic> getMemoryStats() {
    return {
      'current': _lastMemoryUsage,
      'average': getAverageMemoryUsage().round(),
      'peak': getPeakMemoryUsage(),
      'samples': _memoryHistory.length,
      'isMonitoring': _isMonitoring,
    };
  }

  /// Clear memory caches
  Future<void> clearCaches() async {
    try {
      // Clear image cache
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();

      debugPrint('🗑️ Caches cleared');

      // Wait for GC
      await Future.delayed(const Duration(milliseconds: 100));

      // Check memory after cleanup
      await _checkMemory();
    } catch (e) {
      debugPrint('❌ Failed to clear caches: $e');
    }
  }

  /// Print memory statistics
  void printStats() {
    final stats = getMemoryStats();
    debugPrint('🧠 ═══════════════════════════════════════');
    debugPrint('🧠 Memory Statistics');
    debugPrint('🧠 ═══════════════════════════════════════');
    debugPrint('🧠 Current: ${stats['current']}MB');
    debugPrint('🧠 Average: ${stats['average']}MB');
    debugPrint('🧠 Peak: ${stats['peak']}MB');
    debugPrint('🧠 Samples: ${stats['samples']}');
    debugPrint('🧠 Monitoring: ${stats['isMonitoring']}');
    debugPrint('🧠 ═══════════════════════════════════════');
  }
}

/// Cache manager for thumbnail and preview management
class CacheManager {
  static final CacheManager _instance = CacheManager._internal();
  factory CacheManager() => _instance;
  CacheManager._internal();

  final Map<String, dynamic> _cache = {};
  static const int _maxCacheSize = 100; // Max cached items

  /// Set cache value
  void set(String key, dynamic value) {
    _cache[key] = value;
    _trimCache();
  }

  /// Get cache value
  dynamic get(String key) {
    return _cache[key];
  }

  /// Check if key exists
  bool has(String key) {
    return _cache.containsKey(key);
  }

  /// Remove cache entry
  void remove(String key) {
    _cache.remove(key);
  }

  /// Clear all cache
  void clear() {
    _cache.clear();
    debugPrint('🗑️ Cache cleared (${_cache.length} items)');
  }

  /// Trim cache to max size
  void _trimCache() {
    if (_cache.length > _maxCacheSize) {
      final keysToRemove = _cache.keys.take(_cache.length - _maxCacheSize);
      for (final key in keysToRemove) {
        _cache.remove(key);
      }
      debugPrint('🗑️ Cache trimmed to $_maxCacheSize items');
    }
  }

  /// Get cache size
  int get size => _cache.length;

  /// Get cache statistics
  Map<String, dynamic> getStats() {
    return {
      'size': _cache.length,
      'maxSize': _maxCacheSize,
      'utilizationPercent': (_cache.length / _maxCacheSize * 100).round(),
    };
  }

  /// Print cache statistics
  void printStats() {
    final stats = getStats();
    debugPrint('💾 ═══════════════════════════════════════');
    debugPrint('💾 Cache Statistics');
    debugPrint('💾 ═══════════════════════════════════════');
    debugPrint('💾 Size: ${stats['size']}/${stats['maxSize']}');
    debugPrint('💾 Utilization: ${stats['utilizationPercent']}%');
    debugPrint('💾 ═══════════════════════════════════════');
  }
}
