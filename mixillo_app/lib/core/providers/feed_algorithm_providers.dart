import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/feed_algorithm_service.dart';
import '../services/interaction_tracker_service.dart';

/// Feed Algorithm Service Provider
final feedAlgorithmServiceProvider = Provider<FeedAlgorithmService>((ref) {
  return FeedAlgorithmService();
});

/// Interaction Tracker Service Provider
final interactionTrackerServiceProvider =
    Provider<InteractionTrackerService>((ref) {
  final service = InteractionTrackerService();
  
  // Initialize on first access
  service.initialize();
  
  // Cleanup when provider is disposed
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});

/// User Affinities Provider
final userAffinitiesProvider = FutureProvider<Map<String, double>>((ref) async {
  final tracker = ref.watch(interactionTrackerServiceProvider);
  return await tracker.getUserAffinities();
});

/// Content Type Preferences Provider
final contentTypePreferencesProvider =
    FutureProvider<Map<String, double>>((ref) async {
  final tracker = ref.watch(interactionTrackerServiceProvider);
  return await tracker.getContentTypePreferences();
});

/// Hashtag Preferences Provider
final hashtagPreferencesProvider =
    FutureProvider<Map<String, double>>((ref) async {
  final tracker = ref.watch(interactionTrackerServiceProvider);
  return await tracker.getHashtagPreferences();
});

/// View History Provider
final viewHistoryProvider = FutureProvider<List<String>>((ref) async {
  final tracker = ref.watch(interactionTrackerServiceProvider);
  return await tracker.getViewHistory();
});

/// Analytics Summary Provider
final analyticsSummaryProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final tracker = ref.watch(interactionTrackerServiceProvider);
  return await tracker.getAnalyticsSummary();
});
