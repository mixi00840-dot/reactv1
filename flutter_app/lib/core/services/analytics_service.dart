import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Event types for analytics tracking
enum AnalyticsEvent {
  // Video Processing
  videoCompressionStart,
  videoCompressionComplete,
  videoCompressionFailed,
  
  // Upload
  videoUploadStart,
  videoUploadProgress,
  videoUploadSuccess,
  videoUploadFailed,
  videoUploadRetry,
  
  // Effects
  videoEffectApplied,
  videoEffectFailed,
  
  // Audio
  audioMixingStart,
  audioMixingComplete,
  audioMixingFailed,
  voiceoverRecorded,
  
  // Captions
  captionGenerationStart,
  captionGenerationComplete,
  captionGenerationFailed,
  
  // Hashtags
  hashtagGenerationStart,
  hashtagGenerationComplete,
  hashtagGenerationFailed,
  
  // Performance
  appLaunched,
  appBackground,
  appForeground,
  memoryWarning,
  
  // User Actions
  videoRecorded,
  videoImported,
  videoExported,
  postCreated,
}

/// Analytics metric data
class AnalyticsMetric {
  final AnalyticsEvent event;
  final DateTime timestamp;
  final Map<String, dynamic> properties;
  final int? duration; // in milliseconds
  final bool success;

  AnalyticsMetric({
    required this.event,
    required this.timestamp,
    this.properties = const {},
    this.duration,
    this.success = true,
  });

  Map<String, dynamic> toJson() {
    return {
      'event': event.name,
      'timestamp': timestamp.toIso8601String(),
      'properties': properties,
      if (duration != null) 'duration': duration,
      'success': success,
    };
  }

  factory AnalyticsMetric.fromJson(Map<String, dynamic> json) {
    return AnalyticsMetric(
      event: AnalyticsEvent.values.firstWhere(
        (e) => e.name == json['event'],
        orElse: () => AnalyticsEvent.appLaunched,
      ),
      timestamp: DateTime.parse(json['timestamp']),
      properties: Map<String, dynamic>.from(json['properties'] ?? {}),
      duration: json['duration'] as int?,
      success: json['success'] as bool? ?? true,
    );
  }
}

/// Performance analytics service
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  static const String _storageKey = 'analytics_metrics';
  static const int _maxStoredMetrics = 1000;
  
  final List<AnalyticsMetric> _metrics = [];
  DateTime? _sessionStart;

  /// Initialize analytics service
  Future<void> initialize() async {
    _sessionStart = DateTime.now();
    await _loadMetrics();
    trackEvent(AnalyticsEvent.appLaunched);
    debugPrint('📊 Analytics service initialized');
  }

  /// Track an event
  void trackEvent(
    AnalyticsEvent event, {
    Map<String, dynamic>? properties,
    int? duration,
    bool success = true,
  }) {
    final metric = AnalyticsMetric(
      event: event,
      timestamp: DateTime.now(),
      properties: properties ?? {},
      duration: duration,
      success: success,
    );

    _metrics.add(metric);
    _saveMetrics();

    debugPrint('📊 Event: ${event.name} ${success ? "✅" : "❌"}');
  }

  /// Start a timed event
  DateTime startTimer(AnalyticsEvent event) {
    debugPrint('⏱️  Started: ${event.name}');
    return DateTime.now();
  }

  /// Complete a timed event
  void completeTimer(
    AnalyticsEvent event,
    DateTime startTime, {
    Map<String, dynamic>? properties,
    bool success = true,
  }) {
    final duration = DateTime.now().difference(startTime).inMilliseconds;
    trackEvent(
      event,
      properties: properties,
      duration: duration,
      success: success,
    );
    
    debugPrint('⏱️  Completed: ${event.name} in ${duration}ms');
  }

  /// Get metrics for a specific event type
  List<AnalyticsMetric> getMetricsForEvent(AnalyticsEvent event) {
    return _metrics.where((m) => m.event == event).toList();
  }

  /// Get metrics within time range
  List<AnalyticsMetric> getMetricsInRange(DateTime start, DateTime end) {
    return _metrics.where((m) {
      return m.timestamp.isAfter(start) && m.timestamp.isBefore(end);
    }).toList();
  }

  /// Calculate success rate for an event
  double getSuccessRate(AnalyticsEvent event) {
    final eventMetrics = getMetricsForEvent(event);
    if (eventMetrics.isEmpty) return 0.0;

    final successCount = eventMetrics.where((m) => m.success).length;
    return successCount / eventMetrics.length;
  }

  /// Calculate average duration for an event
  double getAverageDuration(AnalyticsEvent event) {
    final eventMetrics = getMetricsForEvent(event)
        .where((m) => m.duration != null)
        .toList();
    
    if (eventMetrics.isEmpty) return 0.0;

    final totalDuration = eventMetrics.fold<int>(
      0,
      (sum, m) => sum + (m.duration ?? 0),
    );

    return totalDuration / eventMetrics.length;
  }

  /// Get performance summary
  Map<String, dynamic> getPerformanceSummary() {
    final now = DateTime.now();
    final last24Hours = now.subtract(const Duration(hours: 24));
    final recentMetrics = getMetricsInRange(last24Hours, now);

    // Video upload stats
    final uploadAttempts = recentMetrics
        .where((m) => m.event == AnalyticsEvent.videoUploadStart)
        .length;
    final uploadSuccesses = recentMetrics
        .where((m) => m.event == AnalyticsEvent.videoUploadSuccess)
        .length;
    final uploadRate = uploadAttempts > 0 ? uploadSuccesses / uploadAttempts : 0.0;

    // Compression stats
    final compressionMetrics = recentMetrics
        .where((m) => m.event == AnalyticsEvent.videoCompressionComplete)
        .toList();
    final avgCompressionTime = compressionMetrics.isEmpty
        ? 0.0
        : compressionMetrics.fold<int>(0, (sum, m) => sum + (m.duration ?? 0)) /
            compressionMetrics.length;

    // Effect stats
    final effectMetrics = recentMetrics
        .where((m) => m.event == AnalyticsEvent.videoEffectApplied)
        .toList();
    final avgEffectTime = effectMetrics.isEmpty
        ? 0.0
        : effectMetrics.fold<int>(0, (sum, m) => sum + (m.duration ?? 0)) /
            effectMetrics.length;

    // Audio mixing stats
    final audioMetrics = recentMetrics
        .where((m) => m.event == AnalyticsEvent.audioMixingComplete)
        .toList();
    final avgAudioTime = audioMetrics.isEmpty
        ? 0.0
        : audioMetrics.fold<int>(0, (sum, m) => sum + (m.duration ?? 0)) /
            audioMetrics.length;

    return {
      'period': 'Last 24 hours',
      'sessionStart': _sessionStart?.toIso8601String(),
      'totalEvents': recentMetrics.length,
      'upload': {
        'attempts': uploadAttempts,
        'successes': uploadSuccesses,
        'successRate': uploadRate,
      },
      'compression': {
        'count': compressionMetrics.length,
        'avgTimeMs': avgCompressionTime.round(),
        'avgTimeSec': (avgCompressionTime / 1000).toStringAsFixed(1),
      },
      'effects': {
        'count': effectMetrics.length,
        'avgTimeMs': avgEffectTime.round(),
        'avgTimeSec': (avgEffectTime / 1000).toStringAsFixed(1),
      },
      'audio': {
        'count': audioMetrics.length,
        'avgTimeMs': avgAudioTime.round(),
        'avgTimeSec': (avgAudioTime / 1000).toStringAsFixed(1),
      },
    };
  }

  /// Clear old metrics (keep last 1000)
  void _trimMetrics() {
    if (_metrics.length > _maxStoredMetrics) {
      _metrics.removeRange(0, _metrics.length - _maxStoredMetrics);
      debugPrint('📊 Trimmed metrics to $_maxStoredMetrics');
    }
  }

  /// Save metrics to persistent storage
  Future<void> _saveMetrics() async {
    try {
      _trimMetrics();
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _metrics.map((m) => m.toJson()).toList();
      await prefs.setString(_storageKey, jsonEncode(jsonList));
    } catch (e) {
      debugPrint('❌ Failed to save metrics: $e');
    }
  }

  /// Load metrics from persistent storage
  Future<void> _loadMetrics() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_storageKey);
      
      if (jsonString != null) {
        final jsonList = jsonDecode(jsonString) as List;
        _metrics.clear();
        _metrics.addAll(
          jsonList.map((json) => AnalyticsMetric.fromJson(json)),
        );
        debugPrint('📊 Loaded ${_metrics.length} metrics');
      }
    } catch (e) {
      debugPrint('❌ Failed to load metrics: $e');
    }
  }

  /// Export metrics as JSON
  String exportMetrics() {
    final jsonList = _metrics.map((m) => m.toJson()).toList();
    return jsonEncode(jsonList);
  }

  /// Clear all metrics
  Future<void> clearMetrics() async {
    _metrics.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
    debugPrint('📊 Metrics cleared');
  }

  /// Print performance summary to console
  void printSummary() {
    final summary = getPerformanceSummary();
    debugPrint('📊 ═══════════════════════════════════════');
    debugPrint('📊 Performance Summary (${summary['period']})');
    debugPrint('📊 ═══════════════════════════════════════');
    debugPrint('📊 Total Events: ${summary['totalEvents']}');
    debugPrint('📊 ');
    debugPrint('📊 Upload:');
    debugPrint('📊   Attempts: ${summary['upload']['attempts']}');
    debugPrint('📊   Successes: ${summary['upload']['successes']}');
    debugPrint('📊   Success Rate: ${(summary['upload']['successRate'] * 100).toStringAsFixed(1)}%');
    debugPrint('📊 ');
    debugPrint('📊 Compression:');
    debugPrint('📊   Count: ${summary['compression']['count']}');
    debugPrint('📊   Avg Time: ${summary['compression']['avgTimeSec']}s');
    debugPrint('📊 ');
    debugPrint('📊 Effects:');
    debugPrint('📊   Count: ${summary['effects']['count']}');
    debugPrint('📊   Avg Time: ${summary['effects']['avgTimeSec']}s');
    debugPrint('📊 ');
    debugPrint('📊 Audio:');
    debugPrint('📊   Count: ${summary['audio']['count']}');
    debugPrint('📊   Avg Time: ${summary['audio']['avgTimeSec']}s');
    debugPrint('📊 ═══════════════════════════════════════');
  }
}
