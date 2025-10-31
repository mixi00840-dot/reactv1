import 'dart:math';
import 'package:flutter/foundation.dart';

/// Feed Algorithm Service
/// Implements personalized content ranking based on user interactions and content quality
class FeedAlgorithmService {
  static final FeedAlgorithmService _instance = FeedAlgorithmService._internal();
  factory FeedAlgorithmService() => _instance;
  FeedAlgorithmService._internal();

  // User interaction weights
  static const double likeWeight = 1.0;
  static const double commentWeight = 2.0;
  static const double shareWeight = 3.0;
  static const double viewWeight = 0.1;
  static const double followWeight = 5.0;

  // Scoring weights
  static const double recencyWeight = 0.25;
  static const double engagementWeight = 0.35;
  static const double affinityWeight = 0.30;
  static const double qualityWeight = 0.10;

  // Time decay parameters
  static const double decayHalfLife = 24.0; // hours

  // Diversity parameters
  static const int minDiversityWindow = 3;
  static const double diversityThreshold = 0.3;

  /// Calculate content score for ranking
  double calculateContentScore({
    required ContentItem content,
    required UserProfile user,
    required Map<String, double> userAffinities,
  }) {
    final recencyScore = _calculateRecencyScore(content.createdAt);
    final engagementScore = _calculateEngagementScore(content);
    final affinityScore = _calculateAffinityScore(content, user, userAffinities);
    final qualityScore = _calculateQualityScore(content);

    final totalScore = (recencyScore * recencyWeight) +
        (engagementScore * engagementWeight) +
        (affinityScore * affinityWeight) +
        (qualityScore * qualityWeight);

    debugPrint(
      'Content ${content.id} - Total: ${totalScore.toStringAsFixed(3)} '
      '(R: ${recencyScore.toStringAsFixed(2)}, '
      'E: ${engagementScore.toStringAsFixed(2)}, '
      'A: ${affinityScore.toStringAsFixed(2)}, '
      'Q: ${qualityScore.toStringAsFixed(2)})',
    );

    return totalScore;
  }

  /// Calculate recency score with exponential decay
  double _calculateRecencyScore(DateTime createdAt) {
    final now = DateTime.now();
    final ageInHours = now.difference(createdAt).inHours.toDouble();

    // Exponential decay: score = 0.5^(age / halfLife)
    final score = pow(0.5, ageInHours / decayHalfLife).toDouble();

    return score.clamp(0.0, 1.0);
  }

  /// Calculate engagement score based on interactions
  double _calculateEngagementScore(ContentItem content) {
    final totalEngagement = (content.likesCount * likeWeight) +
        (content.commentsCount * commentWeight) +
        (content.sharesCount * shareWeight) +
        (content.viewsCount * viewWeight);

    // Normalize using logarithmic scale
    final score = log(1 + totalEngagement) / log(10000);

    return score.clamp(0.0, 1.0);
  }

  /// Calculate user affinity score
  double _calculateAffinityScore(
    ContentItem content,
    UserProfile user,
    Map<String, double> userAffinities,
  ) {
    double score = 0.0;

    // Creator affinity (if user follows or has interacted with creator)
    final creatorAffinity = userAffinities[content.creatorId] ?? 0.0;
    score += creatorAffinity * 0.5;

    // Content type affinity
    final contentTypeAffinity = user.preferredContentTypes[content.type] ?? 0.5;
    score += contentTypeAffinity * 0.3;

    // Hashtag affinity
    double hashtagScore = 0.0;
    for (final hashtag in content.hashtags) {
      final hashtagAffinity = user.preferredHashtags[hashtag] ?? 0.0;
      hashtagScore += hashtagAffinity;
    }
    if (content.hashtags.isNotEmpty) {
      hashtagScore /= content.hashtags.length;
    }
    score += hashtagScore * 0.2;

    return score.clamp(0.0, 1.0);
  }

  /// Calculate content quality score
  double _calculateQualityScore(ContentItem content) {
    double score = 0.5; // Base score

    // Verified creator bonus
    if (content.isVerifiedCreator) {
      score += 0.2;
    }

    // High engagement rate bonus
    if (content.viewsCount > 0) {
      final engagementRate = (content.likesCount + content.commentsCount) /
          content.viewsCount;
      score += (engagementRate * 0.3).clamp(0.0, 0.3);
    }

    // Low report rate bonus
    if (content.reportsCount < 5) {
      score += 0.1;
    }

    return score.clamp(0.0, 1.0);
  }

  /// Rank content items for personalized feed
  List<ContentItem> rankContent({
    required List<ContentItem> content,
    required UserProfile user,
    required Map<String, double> userAffinities,
  }) {
    // Calculate scores
    final scoredContent = content.map((item) {
      final score = calculateContentScore(
        content: item,
        user: user,
        userAffinities: userAffinities,
      );
      return ScoredContent(item, score);
    }).toList();

    // Sort by score descending
    scoredContent.sort((a, b) => b.score.compareTo(a.score));

    // Apply diversity injection
    final diverseContent = _injectDiversity(scoredContent);

    return diverseContent.map((sc) => sc.content).toList();
  }

  /// Inject diversity into feed to avoid monotony
  List<ScoredContent> _injectDiversity(List<ScoredContent> scoredContent) {
    if (scoredContent.length <= minDiversityWindow) {
      return scoredContent;
    }

    final diverseList = <ScoredContent>[];
    final seenCreators = <String>{};
    final seenTypes = <String>[];

    for (int i = 0; i < scoredContent.length; i++) {
      final item = scoredContent[i];

      // Check if we need to inject diversity
      if (i >= minDiversityWindow) {
        final recentCreators = seenCreators
            .toList()
            .sublist(max(0, seenCreators.length - minDiversityWindow));
        final recentTypes = seenTypes
            .sublist(max(0, seenTypes.length - minDiversityWindow));

        // Too many posts from same creator
        if (recentCreators.where((c) => c == item.content.creatorId).length >=
            2) {
          // Skip and try to find diverse content
          final diverseCandidate = _findDiverseCandidate(
            scoredContent,
            i,
            recentCreators.toSet(),
            recentTypes,
          );
          if (diverseCandidate != null) {
            diverseList.add(diverseCandidate);
            seenCreators.add(diverseCandidate.content.creatorId);
            seenTypes.add(diverseCandidate.content.type);
            continue;
          }
        }

        // Too many posts of same type
        if (recentTypes.where((t) => t == item.content.type).length >= 3) {
          final diverseCandidate = _findDiverseCandidate(
            scoredContent,
            i,
            recentCreators.toSet(),
            recentTypes,
          );
          if (diverseCandidate != null) {
            diverseList.add(diverseCandidate);
            seenCreators.add(diverseCandidate.content.creatorId);
            seenTypes.add(diverseCandidate.content.type);
            continue;
          }
        }
      }

      diverseList.add(item);
      seenCreators.add(item.content.creatorId);
      seenTypes.add(item.content.type);
    }

    return diverseList;
  }

  /// Find diverse content candidate
  ScoredContent? _findDiverseCandidate(
    List<ScoredContent> scoredContent,
    int currentIndex,
    Set<String> recentCreators,
    List<String> recentTypes,
  ) {
    // Look ahead for diverse content
    for (int j = currentIndex + 1; j < min(currentIndex + 10, scoredContent.length); j++) {
      final candidate = scoredContent[j];

      final creatorCount = recentCreators
          .where((c) => c == candidate.content.creatorId)
          .length;
      final typeCount = recentTypes
          .where((t) => t == candidate.content.type)
          .length;

      if (creatorCount < 2 && typeCount < 3) {
        // Found diverse candidate, swap it
        scoredContent.removeAt(j);
        return candidate;
      }
    }

    return null;
  }

  /// Update user affinities based on interaction
  Map<String, double> updateUserAffinity({
    required Map<String, double> currentAffinities,
    required String targetId,
    required InteractionType interactionType,
  }) {
    final updatedAffinities = Map<String, double>.from(currentAffinities);
    final currentAffinity = updatedAffinities[targetId] ?? 0.0;

    double increment = 0.0;
    switch (interactionType) {
      case InteractionType.view:
        increment = 0.01;
        break;
      case InteractionType.like:
        increment = 0.05;
        break;
      case InteractionType.comment:
        increment = 0.10;
        break;
      case InteractionType.share:
        increment = 0.15;
        break;
      case InteractionType.follow:
        increment = 0.30;
        break;
      case InteractionType.unfollow:
        increment = -0.50;
        break;
      case InteractionType.report:
        increment = -1.0;
        break;
    }

    updatedAffinities[targetId] = (currentAffinity + increment).clamp(0.0, 1.0);

    return updatedAffinities;
  }

  /// Track content interaction
  void trackInteraction({
    required String contentId,
    required String userId,
    required InteractionType interactionType,
    int? duration,
  }) {
    // TODO: Send to analytics backend
    debugPrint(
      'Tracked interaction: User $userId ${interactionType.name} content $contentId'
      '${duration != null ? " for ${duration}s" : ""}',
    );
  }

  /// Calculate engagement rate
  double calculateEngagementRate(ContentItem content) {
    if (content.viewsCount == 0) return 0.0;

    final engagements = content.likesCount +
        content.commentsCount +
        content.sharesCount;

    return (engagements / content.viewsCount).clamp(0.0, 1.0);
  }

  /// Get trending content
  List<ContentItem> getTrendingContent(List<ContentItem> content) {
    final now = DateTime.now();
    final last24Hours = now.subtract(const Duration(hours: 24));

    // Filter recent content
    final recentContent = content.where((item) {
      return item.createdAt.isAfter(last24Hours);
    }).toList();

    // Sort by engagement rate
    recentContent.sort((a, b) {
      final rateA = calculateEngagementRate(a);
      final rateB = calculateEngagementRate(b);
      return rateB.compareTo(rateA);
    });

    return recentContent;
  }
}

/// Content Item Model
class ContentItem {
  final String id;
  final String creatorId;
  final String type; // 'video', 'post', 'story'
  final DateTime createdAt;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int viewsCount;
  final int reportsCount;
  final bool isVerifiedCreator;
  final List<String> hashtags;

  ContentItem({
    required this.id,
    required this.creatorId,
    required this.type,
    required this.createdAt,
    required this.likesCount,
    required this.commentsCount,
    required this.sharesCount,
    required this.viewsCount,
    this.reportsCount = 0,
    this.isVerifiedCreator = false,
    this.hashtags = const [],
  });
}

/// User Profile Model
class UserProfile {
  final String id;
  final Map<String, double> preferredContentTypes; // 'video': 0.8, 'post': 0.6
  final Map<String, double> preferredHashtags; // 'fashion': 0.9

  UserProfile({
    required this.id,
    this.preferredContentTypes = const {},
    this.preferredHashtags = const {},
  });
}

/// Scored Content (internal)
class ScoredContent {
  final ContentItem content;
  final double score;

  ScoredContent(this.content, this.score);
}

/// Interaction Type Enum
enum InteractionType {
  view,
  like,
  comment,
  share,
  follow,
  unfollow,
  report,
}
