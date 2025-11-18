import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/analytics.dart';
import '../data/services/analytics_service.dart';

// Analytics service provider
final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return AnalyticsService();
});

// Analytics data provider
final analyticsProvider =
    StateNotifierProvider<AnalyticsNotifier, AsyncValue<Analytics>>((ref) {
  final service = ref.watch(analyticsServiceProvider);
  return AnalyticsNotifier(service);
});

class AnalyticsNotifier extends StateNotifier<AsyncValue<Analytics>> {
  final AnalyticsService _service;
  String _currentPeriod = '7days';

  AnalyticsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadAnalytics();
  }

  Future<void> loadAnalytics({String period = '7days'}) async {
    state = const AsyncValue.loading();
    _currentPeriod = period;

    try {
      final analytics = await _service.getAnalytics(period: period);
      if (analytics != null) {
        state = AsyncValue.data(analytics);
      } else {
        state = AsyncValue.error('Analytics data not available', StackTrace.current);
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadAnalytics(period: _currentPeriod);
  }
}

// Video analytics provider
final videoAnalyticsProvider =
    FutureProvider.family<VideoAnalytics?, String>((ref, contentId) async {
  final service = ref.watch(analyticsServiceProvider);
  final result = await service.getVideoAnalytics(contentId);
  // Convert Analytics to VideoAnalytics or return null
  if (result == null) return null;
  return VideoAnalytics(
    views: result.views,
    uniqueViews: result.views, // Use same as views if not available
    likes: result.likes,
    comments: result.comments,
    shares: result.shares,
    averageWatchTime: 0.0,
    completionRate: 0.0,
    viewsByCountry: result.viewsByDate ?? {},
    viewsByAge: const {},
    viewsByGender: const {},
    hourlyViews: const [],
  );
});

class VideoAnalytics {
  final int views;
  final int uniqueViews;
  final int likes;
  final int comments;
  final int shares;
  final double averageWatchTime;
  final double completionRate;
  final Map<String, int> viewsByCountry;
  final Map<String, int> viewsByAge;
  final Map<String, int> viewsByGender;
  final List<Map<String, dynamic>> hourlyViews;

  VideoAnalytics({
    required this.views,
    required this.uniqueViews,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.averageWatchTime,
    required this.completionRate,
    required this.viewsByCountry,
    required this.viewsByAge,
    required this.viewsByGender,
    required this.hourlyViews,
  });
}

// Earnings analytics provider
final earningsAnalyticsProvider = StateNotifierProvider<
    EarningsAnalyticsNotifier, AsyncValue<EarningsAnalytics>>((ref) {
  final service = ref.watch(analyticsServiceProvider);
  return EarningsAnalyticsNotifier(service);
});

class EarningsAnalyticsNotifier
    extends StateNotifier<AsyncValue<EarningsAnalytics>> {
  final AnalyticsService _service;
  String _currentPeriod = '30days';

  EarningsAnalyticsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadEarnings();
  }

  Future<void> loadEarnings({String period = '30days'}) async {
    state = const AsyncValue.loading();
    _currentPeriod = period;

    try {
      final earningsMap = await _service.getEarningsAnalytics();
      if (earningsMap == null) {
        state = AsyncValue.error('Earnings data not available', StackTrace.current);
        return;
      }
      final earnings = EarningsAnalytics(
        totalEarnings: (earningsMap['totalEarnings'] ?? earningsMap['total'] ?? 0).toDouble(),
        videoEarnings: (earningsMap['videoEarnings'] ?? earningsMap['video'] ?? 0).toDouble(),
        liveEarnings: (earningsMap['liveEarnings'] ?? earningsMap['live'] ?? 0).toDouble(),
        giftEarnings: (earningsMap['giftEarnings'] ?? earningsMap['gifts'] ?? 0).toDouble(),
        affiliateEarnings: (earningsMap['affiliateEarnings'] ?? earningsMap['affiliate'] ?? 0).toDouble(),
        dailyEarnings: List<Map<String, dynamic>>.from(earningsMap['dailyEarnings'] ?? earningsMap['daily'] ?? const []),
        earningsBySource: Map<String, double>.from(
          (earningsMap['earningsBySource'] ?? earningsMap['sources'] ?? {})
              .map((key, value) => MapEntry(key.toString(), (value ?? 0).toDouble())),
        ),
      );
      state = AsyncValue.data(earnings);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadEarnings(period: _currentPeriod);
  }
}

class EarningsAnalytics {
  final double totalEarnings;
  final double videoEarnings;
  final double liveEarnings;
  final double giftEarnings;
  final double affiliateEarnings;
  final List<Map<String, dynamic>> dailyEarnings;
  final Map<String, double> earningsBySource;

  EarningsAnalytics({
    required this.totalEarnings,
    required this.videoEarnings,
    required this.liveEarnings,
    required this.giftEarnings,
    required this.affiliateEarnings,
    required this.dailyEarnings,
    required this.earningsBySource,
  });
}

// Follower growth analytics
final followerGrowthProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>(
        (ref, period) async {
  final service = ref.watch(analyticsServiceProvider);
  // Service currently does not take a period parameter; keep provider family for potential future filtering.
  return await service.getFollowerGrowth();
});

// Content performance comparison
final contentPerformanceProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(analyticsServiceProvider);
  return await service.getTopPerformingContent();
});
