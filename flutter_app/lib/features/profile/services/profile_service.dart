import 'dart:convert';
import 'package:http/http.dart' as http;
import '../data/models/user_profile_model.dart';

class ProfileService {
  final String baseUrl;
  String? authToken;

  ProfileService({
    required this.baseUrl,
    this.authToken,
  });

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': authToken!,
  };

  /// Get current user profile
  Future<UserProfile> getCurrentUserProfile() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users/profile'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return UserProfile.fromJson(data['data']['user']);
    } else {
      throw Exception('Failed to load profile: ${response.body}');
    }
  }

  /// Get any user profile by ID
  Future<UserProfile> getUserProfile(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users/$userId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return UserProfile.fromJson(data['data']['user']);
    } else {
      throw Exception('Failed to load profile: ${response.body}');
    }
  }

  /// Update current user profile
  Future<UserProfile> updateProfile({
    String? fullName,
    String? bio,
    String? website,
    String? phone,
    String? gender,
    DateTime? dateOfBirth,
    Map<String, String>? socialLinks,
  }) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['fullName'] = fullName;
    if (bio != null) body['bio'] = bio;
    if (website != null) body['website'] = website;
    if (phone != null) body['phone'] = phone;
    if (gender != null) body['gender'] = gender;
    if (dateOfBirth != null) body['dateOfBirth'] = dateOfBirth.toIso8601String();
    if (socialLinks != null) body['socialLinks'] = socialLinks;

    final response = await http.put(
      Uri.parse('$baseUrl/api/users/profile'),
      headers: _headers,
      body: json.encode(body),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return UserProfile.fromJson(data['data']['user']);
    } else {
      throw Exception('Failed to update profile: ${response.body}');
    }
  }

  /// Follow/Unfollow user
  Future<Map<String, dynamic>> toggleFollow(String userId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/users/$userId/follow'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return {
        'isFollowing': data['data']['isFollowing'],
        'message': data['message'],
      };
    } else {
      throw Exception('Failed to toggle follow: ${response.body}');
    }
  }

  /// Get user followers
  Future<List<UserProfile>> getFollowers(String userId, {int page = 1, int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users/$userId/followers?page=$page&limit=$limit'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final followers = (data['data']['followers'] as List)
          .map((user) => UserProfile.fromJson(user))
          .toList();
      return followers;
    } else {
      throw Exception('Failed to load followers: ${response.body}');
    }
  }

  /// Get user following
  Future<List<UserProfile>> getFollowing(String userId, {int page = 1, int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users/$userId/following?page=$page&limit=$limit'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final following = (data['data']['following'] as List)
          .map((user) => UserProfile.fromJson(user))
          .toList();
      return following;
    } else {
      throw Exception('Failed to load following: ${response.body}');
    }
  }

  /// Get user videos/content
  Future<List<dynamic>> getUserContent(String userId, {int page = 1, int limit = 20}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/content/user/$userId?page=$page&limit=$limit'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['content'] as List;
    } else {
      throw Exception('Failed to load content: ${response.body}');
    }
  }

  /// Upload avatar
  Future<String> uploadAvatar(String filePath) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/api/users/upload-avatar'),
    );
    
    if (authToken != null) {
      request.headers['Authorization'] = 'Bearer $authToken';
    }
    
    request.files.add(await http.MultipartFile.fromPath('avatar', filePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['avatarUrl'];
    } else {
      throw Exception('Failed to upload avatar: ${response.body}');
    }
  }

  /// Update privacy settings
  Future<void> updatePrivacySettings({
    bool? isPrivate,
    String? allowMessages,
    String? allowComments,
    bool? showOnlineStatus,
  }) async {
    final body = <String, dynamic>{
      'privacySettings': {},
    };

    if (isPrivate != null) body['privacySettings']['isPrivate'] = isPrivate;
    if (allowMessages != null) body['privacySettings']['allowMessages'] = allowMessages;
    if (allowComments != null) body['privacySettings']['allowComments'] = allowComments;
    if (showOnlineStatus != null) body['privacySettings']['showOnlineStatus'] = showOnlineStatus;

    final response = await http.put(
      Uri.parse('$baseUrl/api/users/profile'),
      headers: _headers,
      body: json.encode(body),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update privacy settings: ${response.body}');
    }
  }

  /// Update notification settings
  Future<void> updateNotificationSettings(Map<String, bool> settings) async {
    final body = {
      'notificationSettings': settings,
    };

    final response = await http.put(
      Uri.parse('$baseUrl/api/users/profile'),
      headers: _headers,
      body: json.encode(body),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update notification settings: ${response.body}');
    }
  }
}
