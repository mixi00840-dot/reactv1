import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;
import '../../../core/services/api_helper.dart';

class UploadService {
  final ApiHelper _api = ApiHelper();

  /// Get presigned URL for direct upload
  Future<Map<String, dynamic>> getPresignedUrl({
    required String fileName,
    required int fileSize,
    required String mimeType,
    String? contentType,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _api.dio.post(
        '/upload/presigned-url',
        data: {
          'fileName': fileName,
          'fileSize': fileSize,
          'mimeType': mimeType,
          'contentType': contentType ?? mimeType,
          if (metadata != null) 'metadata': metadata,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to get presigned URL');
    } catch (e) {
      print('Error getting presigned URL: $e');
      rethrow;
    }
  }

  /// Upload file directly to backend (fallback)
  Future<Map<String, dynamic>> uploadDirect(File file) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: path.basename(file.path),
        ),
      });

      final response = await _api.dio.post(
        '/upload/direct',
        data: formData,
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Upload failed');
    } catch (e) {
      print('Error uploading file: $e');
      rethrow;
    }
  }

  /// Upload file using presigned URL
  Future<bool> uploadToPresignedUrl({
    required String presignedUrl,
    required File file,
    Function(int sent, int total)? onProgress,
  }) async {
    try {
      final dio = Dio();
      
      final fileBytes = await file.readAsBytes();
      
      await dio.put(
        presignedUrl,
        data: fileBytes,
        options: Options(
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        ),
        onSendProgress: (sent, total) {
          if (onProgress != null) {
            onProgress(sent, total);
          }
        },
      );

      return true;
    } catch (e) {
      print('Error uploading to presigned URL: $e');
      return false;
    }
  }

  /// Initialize upload session (for chunked uploads)
  Future<Map<String, dynamic>> initializeUpload({
    required String fileName,
    required int fileSize,
    required String mimeType,
    int chunkSize = 5 * 1024 * 1024, // 5MB
    String? uploadType,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _api.dio.post(
        '/content/upload/initialize',
        data: {
          'fileName': fileName,
          'fileSize': fileSize,
          'mimeType': mimeType,
          'chunkSize': chunkSize,
          if (uploadType != null) 'uploadType': uploadType,
          if (metadata != null) 'metadata': metadata,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to initialize upload');
    } catch (e) {
      print('Error initializing upload: $e');
      rethrow;
    }
  }

  /// Upload chunk
  Future<bool> uploadChunk({
    required String sessionId,
    required int chunkIndex,
    required File chunkFile,
  }) async {
    try {
      final formData = FormData.fromMap({
        'chunk': await MultipartFile.fromFile(
          chunkFile.path,
          filename: 'chunk_$chunkIndex',
        ),
      });

      final response = await _api.dio.post(
        '/content/upload/$sessionId/chunk',
        data: formData,
      );

      return response.data['success'] == true;
    } catch (e) {
      print('Error uploading chunk: $e');
      return false;
    }
  }

  /// Complete upload
  Future<Map<String, dynamic>> completeUpload(String sessionId) async {
    try {
      final response = await _api.dio.post(
        '/content/upload/$sessionId/complete',
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to complete upload');
    } catch (e) {
      print('Error completing upload: $e');
      rethrow;
    }
  }

  /// Get upload status
  Future<Map<String, dynamic>> getUploadStatus(String sessionId) async {
    try {
      final response = await _api.dio.get(
        '/content/upload/$sessionId/status',
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to get upload status');
    } catch (e) {
      print('Error getting upload status: $e');
      rethrow;
    }
  }

  /// Upload video with compression
  Future<Map<String, dynamic>> uploadVideo({
    required File videoFile,
    Function(int sent, int total)? onProgress,
    bool compress = true,
  }) async {
    try {
      File fileToUpload = videoFile;
      
      // TODO: Add video compression here using video_compress package
      // if (compress) {
      //   fileToUpload = await VideoCompress.compressVideo(
      //     videoFile.path,
      //     quality: VideoQuality.MediumQuality,
      //   );
      // }

      final fileName = path.basename(fileToUpload.path);
      final fileSize = await fileToUpload.length();
      final mimeType = 'video/mp4';

      // Try presigned URL first
      try {
        final presignedData = await getPresignedUrl(
          fileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          contentType: 'video',
        );

        final presignedUrl = presignedData['presignedUrl'] ?? presignedData['uploadUrl'];
        
        if (presignedUrl != null && presignedUrl.isNotEmpty) {
          final success = await uploadToPresignedUrl(
            presignedUrl: presignedUrl,
            file: fileToUpload,
            onProgress: onProgress,
          );

          if (success) {
            return presignedData;
          }
        }
      } catch (e) {
        print('Presigned upload failed, falling back to direct: $e');
      }

      // Fallback to direct upload
      return await uploadDirect(fileToUpload);
    } catch (e) {
      print('Error uploading video: $e');
      rethrow;
    }
  }

  /// Upload image
  Future<Map<String, dynamic>> uploadImage({
    required File imageFile,
    Function(int sent, int total)? onProgress,
  }) async {
    try {
      final fileName = path.basename(imageFile.path);
      final fileSize = await imageFile.length();
      final mimeType = 'image/jpeg';

      // Try presigned URL first
      try {
        final presignedData = await getPresignedUrl(
          fileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          contentType: 'image',
        );

        final presignedUrl = presignedData['presignedUrl'] ?? presignedData['uploadUrl'];
        
        if (presignedUrl != null && presignedUrl.isNotEmpty) {
          final success = await uploadToPresignedUrl(
            presignedUrl: presignedUrl,
            file: imageFile,
            onProgress: onProgress,
          );

          if (success) {
            return presignedData;
          }
        }
      } catch (e) {
        print('Presigned upload failed, falling back to direct: $e');
      }

      // Fallback to direct upload
      return await uploadDirect(imageFile);
    } catch (e) {
      print('Error uploading image: $e');
      rethrow;
    }
  }
}

