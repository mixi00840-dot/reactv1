import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Hashtag suggestion model
class HashtagSuggestion {
  final String hashtag;
  final String source; // 'ai', 'trending', 'description'
  final double relevance; // 0.0 to 1.0
  final int? count; // Usage count for trending hashtags

  HashtagSuggestion({
    required this.hashtag,
    required this.source,
    this.relevance = 0.5,
    this.count,
  });

  factory HashtagSuggestion.fromJson(Map<String, dynamic> json) {
    return HashtagSuggestion(
      hashtag: json['hashtag'] as String,
      source: json['source'] as String? ?? 'trending',
      relevance: (json['relevance'] as num?)?.toDouble() ?? 0.5,
      count: json['count'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'hashtag': hashtag,
      'source': source,
      'relevance': relevance,
      if (count != null) 'count': count,
    };
  }
}

/// Hashtag category model
class HashtagCategory {
  final String id;
  final String name;
  final String icon;

  HashtagCategory({
    required this.id,
    required this.name,
    required this.icon,
  });

  factory HashtagCategory.fromJson(Map<String, dynamic> json) {
    return HashtagCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String,
    );
  }
}

/// Service for AI-powered hashtag suggestions
class HashtagService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api',
    connectTimeout: const Duration(minutes: 3),
    receiveTimeout: const Duration(minutes: 3),
  ));

  /// Generate hashtag suggestions from video
  static Future<List<HashtagSuggestion>> generateHashtags({
    required String videoPath,
    String? description,
    bool includeAI = true,
    bool includeTrending = true,
    Function(double)? onProgress,
  }) async {
    try {
      debugPrint('🏷️  Generating hashtags for: $videoPath');

      final formData = FormData.fromMap({
        'video': await MultipartFile.fromFile(
          videoPath,
          filename: videoPath.split('/').last,
        ),
        if (description != null) 'description': description,
        'includeAI': includeAI.toString(),
        'includeTrending': includeTrending.toString(),
      });

      onProgress?.call(0.3); // Upload started

      final response = await _dio.post(
        '/ai/hashtags/generate',
        data: formData,
        onSendProgress: (sent, total) {
          if (total != -1) {
            final uploadProgress = (sent / total) * 0.5; // 0-50%
            onProgress?.call(uploadProgress);
          }
        },
      );

      onProgress?.call(0.8); // Processing complete

      if (response.data['success'] == true) {
        final suggestions = (response.data['suggestions'] as List)
            .map((json) => HashtagSuggestion.fromJson(json))
            .toList();

        debugPrint('✅ Generated ${suggestions.length} hashtag suggestions');
        onProgress?.call(1.0);

        return suggestions;
      } else {
        throw Exception(
            response.data['error'] ?? 'Failed to generate hashtags');
      }
    } on DioException catch (e) {
      debugPrint('❌ Hashtag generation error: ${e.message}');
      if (e.response?.data != null) {
        throw Exception(e.response!.data['error'] ?? 'Server error');
      }
      throw Exception('Network error: ${e.message}');
    } catch (e) {
      debugPrint('❌ Hashtag generation error: $e');
      throw Exception(e.toString());
    }
  }

  /// Get trending hashtags
  static Future<List<HashtagSuggestion>> getTrendingHashtags({
    int limit = 20,
    String? category,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (category != null) 'category': category,
      };

      final response = await _dio.get(
        '/ai/hashtags/trending',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final hashtags = (response.data['hashtags'] as List)
            .map((json) => HashtagSuggestion(
                  hashtag: json['hashtag'] as String,
                  source: 'trending',
                  count: json['count'] as int?,
                  relevance: 0.6,
                ))
            .toList();

        return hashtags;
      } else {
        throw Exception('Failed to fetch trending hashtags');
      }
    } on DioException catch (e) {
      debugPrint('❌ Get trending error: ${e.message}');
      return _getDefaultTrendingHashtags();
    } catch (e) {
      debugPrint('❌ Get trending error: $e');
      return _getDefaultTrendingHashtags();
    }
  }

  /// Search hashtags with autocomplete
  static Future<List<HashtagSuggestion>> searchHashtags({
    required String query,
    int limit = 10,
  }) async {
    try {
      if (query.isEmpty || query.length < 2) {
        return [];
      }

      final response = await _dio.post(
        '/ai/hashtags/search',
        data: {
          'query': query,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        final results = (response.data['results'] as List)
            .map((json) => HashtagSuggestion(
                  hashtag: json['hashtag'] as String,
                  source: 'search',
                  count: json['count'] as int?,
                  relevance: 0.7,
                ))
            .toList();

        return results;
      } else {
        return [];
      }
    } on DioException catch (e) {
      debugPrint('❌ Search error: ${e.message}');
      return [];
    } catch (e) {
      debugPrint('❌ Search error: $e');
      return [];
    }
  }

  /// Get hashtag categories
  static Future<List<HashtagCategory>> getCategories() async {
    try {
      final response = await _dio.get('/ai/hashtags/categories');

      if (response.data['success'] == true) {
        final categories = (response.data['categories'] as List)
            .map((json) => HashtagCategory.fromJson(json))
            .toList();

        return categories;
      } else {
        throw Exception('Failed to fetch categories');
      }
    } on DioException catch (e) {
      debugPrint('❌ Get categories error: ${e.message}');
      return _getDefaultCategories();
    } catch (e) {
      debugPrint('❌ Get categories error: $e');
      return _getDefaultCategories();
    }
  }

  /// Get default trending hashtags (fallback)
  static List<HashtagSuggestion> _getDefaultTrendingHashtags() {
    return [
      HashtagSuggestion(
          hashtag: '#fyp', source: 'trending', relevance: 1.0, count: 1000000),
      HashtagSuggestion(
          hashtag: '#foryou',
          source: 'trending',
          relevance: 0.95,
          count: 900000),
      HashtagSuggestion(
          hashtag: '#foryoupage',
          source: 'trending',
          relevance: 0.9,
          count: 800000),
      HashtagSuggestion(
          hashtag: '#viral',
          source: 'trending',
          relevance: 0.85,
          count: 700000),
      HashtagSuggestion(
          hashtag: '#trending',
          source: 'trending',
          relevance: 0.8,
          count: 600000),
      HashtagSuggestion(
          hashtag: '#explore',
          source: 'trending',
          relevance: 0.75,
          count: 500000),
      HashtagSuggestion(
          hashtag: '#video', source: 'trending', relevance: 0.7, count: 400000),
      HashtagSuggestion(
          hashtag: '#dance',
          source: 'trending',
          relevance: 0.65,
          count: 300000),
      HashtagSuggestion(
          hashtag: '#music', source: 'trending', relevance: 0.6, count: 250000),
      HashtagSuggestion(
          hashtag: '#funny',
          source: 'trending',
          relevance: 0.55,
          count: 200000),
    ];
  }

  /// Get default categories (fallback)
  static List<HashtagCategory> _getDefaultCategories() {
    return [
      HashtagCategory(id: 'trending', name: 'Trending', icon: '🔥'),
      HashtagCategory(id: 'dance', name: 'Dance', icon: '💃'),
      HashtagCategory(id: 'comedy', name: 'Comedy', icon: '😂'),
      HashtagCategory(id: 'music', name: 'Music', icon: '🎵'),
      HashtagCategory(id: 'tutorial', name: 'Tutorial', icon: '📚'),
      HashtagCategory(id: 'food', name: 'Food', icon: '🍔'),
      HashtagCategory(id: 'fitness', name: 'Fitness', icon: '💪'),
      HashtagCategory(id: 'beauty', name: 'Beauty', icon: '💄'),
    ];
  }

  /// Format hashtags for display
  static String formatHashtags(List<String> hashtags) {
    return hashtags.map((h) => h.startsWith('#') ? h : '#$h').join(' ');
  }

  /// Extract hashtags from text
  static List<String> extractHashtags(String text) {
    final regex = RegExp(r'#\w+');
    final matches = regex.allMatches(text);
    return matches.map((m) => m.group(0)!).toList();
  }

  /// Validate hashtag format
  static bool isValidHashtag(String hashtag) {
    final cleaned = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
    final regex = RegExp(r'^[a-zA-Z0-9_]+$');
    return cleaned.isNotEmpty &&
        cleaned.length <= 50 &&
        regex.hasMatch(cleaned);
  }

  /// Clean hashtag (add # if missing)
  static String cleanHashtag(String hashtag) {
    final cleaned = hashtag.trim();
    return cleaned.startsWith('#') ? cleaned : '#$cleaned';
  }
}
