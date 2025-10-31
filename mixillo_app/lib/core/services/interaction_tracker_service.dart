import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Interaction Tracker Service
/// Tracks user interactions for feed personalization
class InteractionTrackerService {
  static final InteractionTrackerService _instance =
      InteractionTrackerService._internal();
  factory InteractionTrackerService() => _instance;
  InteractionTrackerService._internal();

  static const String _userAffinitiesKey = 'user_affinities';
  static const String _contentTypePrefsKey = 'content_type_preferences';
  static const String _hashtagPrefsKey = 'hashtag_preferences';
  static const String _viewHistoryKey = 'view_history';

  final Map<String, List<InteractionEvent>> _sessionInteractions = {};
  Timer? _syncTimer;

  /// Initialize tracker
  Future<void> initialize() async {
    // Start periodic sync to backend
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      _syncToBackend();
    });

    debugPrint('Interaction tracker initialized');
  }

  /// Track view event
  Future<void> trackView({
    required String contentId,
    required String contentType,
    required String creatorId,
    required int durationSeconds,
    List<String>? hashtags,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.view,
      contentId: contentId,
      contentType: contentType,
      creatorId: creatorId,
      timestamp: DateTime.now(),
      durationSeconds: durationSeconds,
      hashtags: hashtags ?? [],
    );

    await _recordInteraction(event);

    // Update preferences based on view duration
    if (durationSeconds >= 3) {
      // Considered a meaningful view
      await _updateContentTypePreference(contentType, 0.01);

      if (hashtags != null) {
        for (final hashtag in hashtags) {
          await _updateHashtagPreference(hashtag, 0.01);
        }
      }
    }
  }

  /// Track like event
  Future<void> trackLike({
    required String contentId,
    required String contentType,
    required String creatorId,
    List<String>? hashtags,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.like,
      contentId: contentId,
      contentType: contentType,
      creatorId: creatorId,
      timestamp: DateTime.now(),
      hashtags: hashtags ?? [],
    );

    await _recordInteraction(event);
    await _updateUserAffinity(creatorId, 0.05);
    await _updateContentTypePreference(contentType, 0.05);

    if (hashtags != null) {
      for (final hashtag in hashtags) {
        await _updateHashtagPreference(hashtag, 0.05);
      }
    }
  }

  /// Track comment event
  Future<void> trackComment({
    required String contentId,
    required String contentType,
    required String creatorId,
    List<String>? hashtags,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.comment,
      contentId: contentId,
      contentType: contentType,
      creatorId: creatorId,
      timestamp: DateTime.now(),
      hashtags: hashtags ?? [],
    );

    await _recordInteraction(event);
    await _updateUserAffinity(creatorId, 0.10);
    await _updateContentTypePreference(contentType, 0.08);

    if (hashtags != null) {
      for (final hashtag in hashtags) {
        await _updateHashtagPreference(hashtag, 0.08);
      }
    }
  }

  /// Track share event
  Future<void> trackShare({
    required String contentId,
    required String contentType,
    required String creatorId,
    List<String>? hashtags,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.share,
      contentId: contentId,
      contentType: contentType,
      creatorId: creatorId,
      timestamp: DateTime.now(),
      hashtags: hashtags ?? [],
    );

    await _recordInteraction(event);
    await _updateUserAffinity(creatorId, 0.15);
    await _updateContentTypePreference(contentType, 0.12);

    if (hashtags != null) {
      for (final hashtag in hashtags) {
        await _updateHashtagPreference(hashtag, 0.12);
      }
    }
  }

  /// Track follow event
  Future<void> trackFollow({
    required String userId,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.follow,
      contentId: userId,
      contentType: 'user',
      creatorId: userId,
      timestamp: DateTime.now(),
    );

    await _recordInteraction(event);
    await _updateUserAffinity(userId, 0.30);
  }

  /// Track unfollow event
  Future<void> trackUnfollow({
    required String userId,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.unfollow,
      contentId: userId,
      contentType: 'user',
      creatorId: userId,
      timestamp: DateTime.now(),
    );

    await _recordInteraction(event);
    await _updateUserAffinity(userId, -0.50);
  }

  /// Track report event
  Future<void> trackReport({
    required String contentId,
    required String contentType,
    required String creatorId,
  }) async {
    final event = InteractionEvent(
      type: InteractionEventType.report,
      contentId: contentId,
      contentType: contentType,
      creatorId: creatorId,
      timestamp: DateTime.now(),
    );

    await _recordInteraction(event);
    await _updateUserAffinity(creatorId, -1.0);
  }

  /// Record interaction event
  Future<void> _recordInteraction(InteractionEvent event) async {
    final key = event.contentId;
    
    if (!_sessionInteractions.containsKey(key)) {
      _sessionInteractions[key] = [];
    }
    
    _sessionInteractions[key]!.add(event);

    // Also store in view history
    await _addToViewHistory(event);

    debugPrint(
      'Tracked ${event.type.name}: ${event.contentId} by ${event.creatorId}',
    );
  }

  /// Update user affinity for creator
  Future<void> _updateUserAffinity(String creatorId, double delta) async {
    final prefs = await SharedPreferences.getInstance();
    final affinitiesJson = prefs.getString(_userAffinitiesKey);

    Map<String, double> affinities = {};
    if (affinitiesJson != null) {
      final decoded = jsonDecode(affinitiesJson) as Map<String, dynamic>;
      affinities = decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
    }

    final currentAffinity = affinities[creatorId] ?? 0.0;
    affinities[creatorId] = (currentAffinity + delta).clamp(0.0, 1.0);

    await prefs.setString(_userAffinitiesKey, jsonEncode(affinities));
  }

  /// Update content type preference
  Future<void> _updateContentTypePreference(
      String contentType, double delta) async {
    final prefs = await SharedPreferences.getInstance();
    final prefsJson = prefs.getString(_contentTypePrefsKey);

    Map<String, double> preferences = {};
    if (prefsJson != null) {
      final decoded = jsonDecode(prefsJson) as Map<String, dynamic>;
      preferences = decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
    }

    final currentPref = preferences[contentType] ?? 0.5;
    preferences[contentType] = (currentPref + delta).clamp(0.0, 1.0);

    await prefs.setString(_contentTypePrefsKey, jsonEncode(preferences));
  }

  /// Update hashtag preference
  Future<void> _updateHashtagPreference(String hashtag, double delta) async {
    final prefs = await SharedPreferences.getInstance();
    final prefsJson = prefs.getString(_hashtagPrefsKey);

    Map<String, double> preferences = {};
    if (prefsJson != null) {
      final decoded = jsonDecode(prefsJson) as Map<String, dynamic>;
      preferences = decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
    }

    final currentPref = preferences[hashtag] ?? 0.5;
    preferences[hashtag] = (currentPref + delta).clamp(0.0, 1.0);

    await prefs.setString(_hashtagPrefsKey, jsonEncode(preferences));
  }

  /// Add to view history
  Future<void> _addToViewHistory(InteractionEvent event) async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getString(_viewHistoryKey);

    List<String> history = [];
    if (historyJson != null) {
      history = List<String>.from(jsonDecode(historyJson));
    }

    // Add to beginning, keep last 100
    history.insert(0, event.contentId);
    if (history.length > 100) {
      history = history.sublist(0, 100);
    }

    await prefs.setString(_viewHistoryKey, jsonEncode(history));
  }

  /// Get user affinities
  Future<Map<String, double>> getUserAffinities() async {
    final prefs = await SharedPreferences.getInstance();
    final affinitiesJson = prefs.getString(_userAffinitiesKey);

    if (affinitiesJson == null) return {};

    final decoded = jsonDecode(affinitiesJson) as Map<String, dynamic>;
    return decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
  }

  /// Get content type preferences
  Future<Map<String, double>> getContentTypePreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final prefsJson = prefs.getString(_contentTypePrefsKey);

    if (prefsJson == null) {
      return {'video': 0.5, 'post': 0.5, 'story': 0.5};
    }

    final decoded = jsonDecode(prefsJson) as Map<String, dynamic>;
    return decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
  }

  /// Get hashtag preferences
  Future<Map<String, double>> getHashtagPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final prefsJson = prefs.getString(_hashtagPrefsKey);

    if (prefsJson == null) return {};

    final decoded = jsonDecode(prefsJson) as Map<String, dynamic>;
    return decoded.map((k, v) => MapEntry(k, (v as num).toDouble()));
  }

  /// Get view history
  Future<List<String>> getViewHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getString(_viewHistoryKey);

    if (historyJson == null) return [];

    return List<String>.from(jsonDecode(historyJson));
  }

  /// Clear all preferences
  Future<void> clearPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userAffinitiesKey);
    await prefs.remove(_contentTypePrefsKey);
    await prefs.remove(_hashtagPrefsKey);
    await prefs.remove(_viewHistoryKey);
    
    debugPrint('Cleared all user preferences');
  }

  /// Sync interactions to backend
  Future<void> _syncToBackend() async {
    if (_sessionInteractions.isEmpty) return;

    debugPrint(
        'Syncing ${_sessionInteractions.length} interactions to backend');

    // TODO: Implement actual API call to sync interactions
    // For now, just log and clear
    
    _sessionInteractions.clear();
  }

  /// Get analytics summary
  Future<Map<String, dynamic>> getAnalyticsSummary() async {
    final affinities = await getUserAffinities();
    final contentPrefs = await getContentTypePreferences();
    final hashtagPrefs = await getHashtagPreferences();
    final viewHistory = await getViewHistory();

    return {
      'totalAffinities': affinities.length,
      'topCreators': _getTopItems(affinities, 5),
      'contentTypePreferences': contentPrefs,
      'topHashtags': _getTopItems(hashtagPrefs, 10),
      'totalViewsTracked': viewHistory.length,
      'sessionInteractions': _sessionInteractions.length,
    };
  }

  /// Get top items from map
  List<MapEntry<String, double>> _getTopItems(
      Map<String, double> items, int count) {
    final sorted = items.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return sorted.take(count).toList();
  }

  /// Dispose tracker
  void dispose() {
    _syncTimer?.cancel();
    _syncToBackend();
    debugPrint('Interaction tracker disposed');
  }
}

/// Interaction Event Model
class InteractionEvent {
  final InteractionEventType type;
  final String contentId;
  final String contentType;
  final String creatorId;
  final DateTime timestamp;
  final int? durationSeconds;
  final List<String> hashtags;

  InteractionEvent({
    required this.type,
    required this.contentId,
    required this.contentType,
    required this.creatorId,
    required this.timestamp,
    this.durationSeconds,
    this.hashtags = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'contentId': contentId,
      'contentType': contentType,
      'creatorId': creatorId,
      'timestamp': timestamp.toIso8601String(),
      'durationSeconds': durationSeconds,
      'hashtags': hashtags,
    };
  }
}

/// Interaction Event Type
enum InteractionEventType {
  view,
  like,
  comment,
  share,
  follow,
  unfollow,
  report,
}
