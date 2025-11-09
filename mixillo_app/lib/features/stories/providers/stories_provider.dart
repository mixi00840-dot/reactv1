import 'package:flutter/material.dart';
import '../../../core/services/api_helper.dart';
import '../models/story_model.dart';

class StoriesProvider extends ChangeNotifier {
  final ApiHelper _api = ApiHelper();
  
  List<StoryGroup> _storyGroups = [];
  List<StoryModel> _myStories = [];
  bool _isLoading = false;
  String? _error;
  
  List<StoryGroup> get storyGroups => _storyGroups;
  List<StoryModel> get myStories => _myStories;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasStories => _storyGroups.isNotEmpty || _myStories.isNotEmpty;
  
  /// Load stories feed (following users)
  Future<void> loadStoriesFeed() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/stories/feed');
      
      if (response.data['success'] == true) {
        final storiesData = response.data['data']?['stories'] ?? [];
        final stories = storiesData
            .map((json) => StoryModel.fromJson(json))
            .where((story) => story.isActive)
            .toList();
        
        // Group stories by user
        _storyGroups = _groupStoriesByUser(stories);
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load stories');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading stories feed: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load my stories
  Future<void> loadMyStories(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/stories/user/$userId');
      
      if (response.data['success'] == true) {
        final storiesData = response.data['data']?['stories'] ?? [];
        _myStories = storiesData
            .map((json) => StoryModel.fromJson(json))
            .where((story) => story.isActive)
            .toList();
        _error = null;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to load stories');
      }
    } catch (e) {
      _error = e.toString();
      print('Error loading my stories: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Create story
  Future<StoryModel?> createStory({
    required String mediaUrl,
    required String mediaType,
    String? thumbnail,
    String? caption,
    int duration = 5,
    String? backgroundColor,
    Map<String, dynamic>? music,
    Map<String, dynamic>? location,
    List<Map<String, dynamic>>? mentions,
    List<String>? hashtags,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.post(
        '/stories',
        data: {
          'mediaUrl': mediaUrl,
          'mediaType': mediaType,
          if (thumbnail != null) 'thumbnail': thumbnail,
          if (caption != null) 'caption': caption,
          'duration': duration,
          if (backgroundColor != null) 'backgroundColor': backgroundColor,
          if (music != null) 'music': music,
          if (location != null) 'location': location,
          if (mentions != null) 'mentions': mentions,
          if (hashtags != null) 'hashtags': hashtags,
        },
      );
      
      if (response.data['success'] == true) {
        final storyData = response.data['data'] ?? response.data['story'];
        final story = StoryModel.fromJson(storyData);
        _error = null;
        notifyListeners();
        return story;
      }
      
      throw Exception(response.data['message'] ?? 'Failed to create story');
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error creating story: $e');
      return null;
    }
  }
  
  /// View story (track viewer)
  Future<void> viewStory(String storyId) async {
    try {
      await _api.dio.post('/stories/$storyId/view');
      
      // Update local state
      for (var group in _storyGroups) {
        for (var story in group.stories) {
          if (story.id == storyId || story.storyId == storyId) {
            // Mark as viewed locally
            notifyListeners();
            break;
          }
        }
      }
    } catch (e) {
      print('Error viewing story: $e');
    }
  }
  
  /// Add reaction to story
  Future<bool> addReaction(String storyId, String type) async {
    try {
      final response = await _api.dio.post(
        '/stories/$storyId/reactions',
        data: {'type': type},
      );
      
      return response.data['success'] == true;
    } catch (e) {
      print('Error adding reaction: $e');
      return false;
    }
  }
  
  /// Reply to story
  Future<bool> replyToStory(String storyId, String message) async {
    try {
      final response = await _api.dio.post(
        '/stories/$storyId/replies',
        data: {'message': message},
      );
      
      return response.data['success'] == true;
    } catch (e) {
      print('Error replying to story: $e');
      return false;
    }
  }
  
  /// Get story viewers
  Future<List<String>> getStoryViewers(String storyId) async {
    try {
      final response = await _api.dio.get('/stories/$storyId/viewers');
      
      if (response.data['success'] == true) {
        return List<String>.from(response.data['data']?['viewers'] ?? []);
      }
      
      return [];
    } catch (e) {
      print('Error getting story viewers: $e');
      return [];
    }
  }
  
  /// Delete story
  Future<bool> deleteStory(String storyId) async {
    try {
      final response = await _api.dio.delete('/stories/$storyId');
      
      if (response.data['success'] == true) {
        // Remove from local state
        _myStories.removeWhere((s) => s.id == storyId || s.storyId == storyId);
        notifyListeners();
        return true;
      }
      
      return false;
    } catch (e) {
      print('Error deleting story: $e');
      return false;
    }
  }
  
  /// Group stories by user
  List<StoryGroup> _groupStoriesByUser(List<StoryModel> stories) {
    final Map<String, List<StoryModel>> grouped = {};
    final Map<String, Map<String, dynamic>> userInfo = {};
    
    for (var story in stories) {
      if (!grouped.containsKey(story.userId)) {
        grouped[story.userId] = [];
        userInfo[story.userId] = {
          'username': story.username,
          'userAvatar': story.userAvatar,
          'isVerified': story.isVerified,
        };
      }
      grouped[story.userId]!.add(story);
    }
    
    return grouped.entries.map((entry) {
      final userId = entry.key;
      final userStories = entry.value;
      final info = userInfo[userId] ?? {};
      
      return StoryGroup(
        userId: userId,
        username: info['username'],
        userAvatar: info['userAvatar'],
        isVerified: info['isVerified'],
        stories: userStories,
        hasUnviewed: userStories.any((s) => s.viewCount == 0),
      );
    }).toList();
  }
  
  /// Refresh stories
  Future<void> refresh() async {
    await loadStoriesFeed();
  }
}

