import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/services/api_service.dart';
import '../models/sound_model.dart';

/// Sound service for fetching sounds from backend API
class SoundService {
  final ApiService _apiService;

  SoundService(this._apiService);

  /// Get sounds with pagination and optional filters
  /// 
  /// Parameters:
  /// - [page]: Page number (default: 1)
  /// - [limit]: Items per page (default: 50)
  /// - [genre]: Filter by genre (optional)
  /// - [search]: Search query (optional)
  Future<SoundsResponse> getSounds({
    int page = 1,
    int limit = 50,
    String? genre,
    String? search,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (genre != null && genre.isNotEmpty) 'genre': genre,
        if (search != null && search.isNotEmpty) 'search': search,
      };

      final response = await _apiService.get(
        '/sounds/mongodb',
        queryParameters: queryParams,
      );

      if (response['success'] == true) {
        final data = response['data'];
        final soundsList = (data['sounds'] as List)
            .map((json) => Sound.fromJson(json))
            .toList();

        return SoundsResponse(
          sounds: soundsList,
          total: data['pagination']['total'] ?? 0,
          page: data['pagination']['page'] ?? 1,
          limit: data['pagination']['limit'] ?? 50,
          pages: data['pagination']['pages'] ?? 1,
        );
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch sounds');
      }
    } catch (e) {
      print('❌ Sound Service - getSounds error: $e');
      rethrow;
    }
  }

  /// Get trending sounds
  Future<List<Sound>> getTrendingSounds({int limit = 20}) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
      };

      final response = await _apiService.get(
        '/sounds/mongodb/trending',
        queryParameters: queryParams,
      );

      if (response['success'] == true) {
        final data = response['data'];
        return (data['sounds'] as List)
            .map((json) => Sound.fromJson(json))
            .toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch trending sounds');
      }
    } catch (e) {
      print('❌ Sound Service - getTrendingSounds error: $e');
      rethrow;
    }
  }

  /// Get sound by ID
  Future<Sound> getSoundById(String id) async {
    try {
      final response = await _apiService.get('/sounds/mongodb/$id');

      if (response['success'] == true) {
        return Sound.fromJson(response['data']['sound']);
      } else {
        throw Exception(response['message'] ?? 'Sound not found');
      }
    } catch (e) {
      print('❌ Sound Service - getSoundById error: $e');
      rethrow;
    }
  }

  /// Record sound usage (when used in content)
  Future<void> recordSoundUsage(String soundId, String contentId) async {
    try {
      await _apiService.post(
        '/sounds/mongodb/$soundId/use',
        data: {'contentId': contentId},
      );
    } catch (e) {
      print('❌ Sound Service - recordSoundUsage error: $e');
      // Don't throw - this is analytics, shouldn't block user flow
    }
  }

  /// Search sounds by query
  Future<List<Sound>> searchSounds(String query, {int limit = 30}) async {
    return (await getSounds(
      search: query,
      limit: limit,
      page: 1,
    ))
        .sounds;
  }

  /// Get sounds by genre/category
  Future<List<Sound>> getSoundsByGenre(String genre, {int limit = 50}) async {
    return (await getSounds(
      genre: genre,
      limit: limit,
      page: 1,
    ))
        .sounds;
  }
}

/// Response model for paginated sounds
class SoundsResponse {
  final List<Sound> sounds;
  final int total;
  final int page;
  final int limit;
  final int pages;

  const SoundsResponse({
    required this.sounds,
    required this.total,
    required this.page,
    required this.limit,
    required this.pages,
  });

  bool get hasMore => page < pages;
  bool get isEmpty => sounds.isEmpty;
  int get count => sounds.length;
}

