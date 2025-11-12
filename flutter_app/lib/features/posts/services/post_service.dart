import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../core/services/api_service.dart';
import '../models/post_model.dart';
import '../models/privacy_setting.dart';

/// Post service for uploading and publishing videos
class PostService {
  final ApiService _apiService;

  PostService(this._apiService);

  /// Upload video to Cloudinary
  /// Returns the video URL and metadata
  Future<CloudinaryUploadResult> uploadVideoToCloudinary({
    required String videoPath,
    required Function(double) onProgress,
  }) async {
    try {
      final file = File(videoPath);
      final fileBytes = await file.readAsBytes();
      final fileName = videoPath.split('/').last;

      // Get Cloudinary configuration from backend
      final cloudinaryConfig = await _getCloudinaryConfig();

      // Create multipart request
      final uri = Uri.parse(cloudinaryConfig['uploadUrl']);
      final request = http.MultipartRequest('POST', uri);

      // Add file
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
        ),
      );

      // Add Cloudinary parameters
      request.fields['upload_preset'] =
          cloudinaryConfig['uploadPreset'] ?? 'mixillo_unsigned';
      request.fields['folder'] = 'videos';
      request.fields['resource_type'] = 'video';

      // Send request with progress tracking
      final streamedResponse = await request.send();

      if (streamedResponse.statusCode == 200) {
        final responseData = await streamedResponse.stream.bytesToString();
        final jsonResponse = json.decode(responseData);

        return CloudinaryUploadResult(
          videoUrl: jsonResponse['secure_url'],
          publicId: jsonResponse['public_id'],
          duration: jsonResponse['duration']?.toInt() ?? 0,
          width: jsonResponse['width'] ?? 0,
          height: jsonResponse['height'] ?? 0,
          format: jsonResponse['format'],
          bytes: jsonResponse['bytes'] ?? 0,
        );
      } else {
        throw Exception(
            'Upload failed with status: ${streamedResponse.statusCode}');
      }
    } catch (e) {
      print('❌ Upload to Cloudinary error: $e');
      rethrow;
    }
  }

  /// Get Cloudinary configuration from backend
  Future<Map<String, dynamic>> _getCloudinaryConfig() async {
    try {
      // For now, use default Cloudinary config
      // TODO: Fetch from backend /api/config endpoint
      return {
        'uploadUrl': 'https://api.cloudinary.com/v1_1/mixillo/upload',
        'uploadPreset': 'mixillo_unsigned',
        'cloudName': 'mixillo',
      };
    } catch (e) {
      print('❌ Get Cloudinary config error: $e');
      rethrow;
    }
  }

  /// Create content post after upload
  Future<Map<String, dynamic>> createPost({
    required String videoUrl,
    required String? thumbnailUrl,
    required PostData postData,
    required int duration,
    required int width,
    required int height,
  }) async {
    try {
      final response = await _apiService.post(
        '/content/mongodb',
        data: {
          'type': 'video',
          'title': postData.caption.isNotEmpty
              ? postData.caption.split('\n').first
              : null,
          'description': postData.caption,
          'videoUrl': videoUrl,
          'thumbnailUrl': thumbnailUrl,
          'duration': duration,
          'width': width,
          'height': height,
          'tags': postData.hashtags,
          'soundId': postData.soundId,
          'visibility': postData.privacy.apiValue,
          'allowComments': postData.allowComments,
          'allowDuet': postData.allowDuet,
          'location': postData.location,
          'taggedUsers': postData.taggedUserIds,
          if (postData.scheduledAt != null)
            'scheduledAt': postData.scheduledAt!.toIso8601String(),
        },
      );

      if (response['success'] == true) {
        return response['data'];
      } else {
        throw Exception(response['message'] ?? 'Failed to create post');
      }
    } catch (e) {
      print('❌ Create post error: $e');
      rethrow;
    }
  }

  /// Complete upload flow: Upload to Cloudinary + Create post
  Future<Map<String, dynamic>> uploadAndPost({
    required PostData postData,
    required Function(double) onProgress,
  }) async {
    try {
      // Step 1: Upload video to Cloudinary (0-80% progress)
      onProgress(0.0);
      final uploadResult = await uploadVideoToCloudinary(
        videoPath: postData.videoPath,
        onProgress: (progress) => onProgress(progress * 0.8),
      );
      onProgress(0.8);

      // Generate thumbnail URL from Cloudinary
      final thumbnailUrl = postData.thumbnailPath != null
          ? await _uploadThumbnail(postData.thumbnailPath!)
          : _generateThumbnailUrl(uploadResult.videoUrl);
      onProgress(0.85);

      // Step 2: Create content post (80-100% progress)
      final result = await createPost(
        videoUrl: uploadResult.videoUrl,
        thumbnailUrl: thumbnailUrl,
        postData: postData,
        duration: uploadResult.duration,
        width: uploadResult.width,
        height: uploadResult.height,
      );
      onProgress(1.0);

      return result;
    } catch (e) {
      print('❌ Upload and post error: $e');
      rethrow;
    }
  }

  /// Upload thumbnail to Cloudinary
  Future<String> _uploadThumbnail(String thumbnailPath) async {
    try {
      final file = File(thumbnailPath);
      final fileBytes = await file.readAsBytes();
      final fileName = thumbnailPath.split('/').last;

      final cloudinaryConfig = await _getCloudinaryConfig();
      final uri = Uri.parse(cloudinaryConfig['uploadUrl']);
      final request = http.MultipartRequest('POST', uri);

      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
        ),
      );

      request.fields['upload_preset'] = cloudinaryConfig['uploadPreset'];
      request.fields['folder'] = 'thumbnails';

      final streamedResponse = await request.send();
      if (streamedResponse.statusCode == 200) {
        final responseData = await streamedResponse.stream.bytesToString();
        final jsonResponse = json.decode(responseData);
        return jsonResponse['secure_url'];
      } else {
        throw Exception('Thumbnail upload failed');
      }
    } catch (e) {
      print('⚠️ Thumbnail upload error: $e');
      // Return generated thumbnail URL as fallback
      return '';
    }
  }

  /// Generate thumbnail URL from video URL (Cloudinary transformation)
  String _generateThumbnailUrl(String videoUrl) {
    return videoUrl
        .replaceAll('/upload/', '/upload/so_0,w_400,h_225,c_fill/')
        .replaceAll('.mp4', '.jpg');
  }

  /// Save post as draft
  Future<Map<String, dynamic>> saveDraft(PostData postData) async {
    try {
      final response = await _apiService.post(
        '/content/mongodb/draft',
        data: {
          'videoPath': postData.videoPath,
          'thumbnailPath': postData.thumbnailPath,
          ...postData.toJson(),
        },
      );

      if (response['success'] == true) {
        return response['data'];
      } else {
        throw Exception(response['message'] ?? 'Failed to save draft');
      }
    } catch (e) {
      print('❌ Save draft error: $e');
      rethrow;
    }
  }
}

/// Cloudinary upload result
class CloudinaryUploadResult {
  final String videoUrl;
  final String publicId;
  final int duration;
  final int width;
  final int height;
  final String format;
  final int bytes;

  const CloudinaryUploadResult({
    required this.videoUrl,
    required this.publicId,
    required this.duration,
    required this.width,
    required this.height,
    required this.format,
    required this.bytes,
  });

  String get formattedSize {
    final mb = bytes / (1024 * 1024);
    return '${mb.toStringAsFixed(1)} MB';
  }
}

