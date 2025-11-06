import '../models/streaming_provider_model.dart';

/// Abstract interface for streaming providers
/// Allows dynamic switching between Agora, ZegoCloud, and WebRTC
abstract class StreamingServiceInterface {
  /// Initialize the streaming service with provider config
  Future<void> initialize(StreamingProviderConfig config);

  /// Start a live stream
  /// Returns stream configuration (appId, token, channel, etc.)
  Future<Map<String, dynamic>> startStream({
    required String streamId,
    required String userId,
    String? title,
    bool isPrivate = false,
  });

  /// Join a stream as viewer
  Future<Map<String, dynamic>> joinStream({
    required String streamId,
    required String userId,
  });

  /// Leave a stream
  Future<void> leaveStream(String streamId);

  /// End/Stop a stream
  Future<void> endStream(String streamId);

  /// Get stream token (for authentication)
  Future<String> getStreamToken({
    required String streamId,
    required String userId,
    int expireTime = 3600,
  });

  /// Enable/disable camera
  Future<void> toggleCamera(bool enabled);

  /// Enable/disable microphone
  Future<void> toggleMicrophone(bool enabled);

  /// Switch camera (front/back)
  Future<void> switchCamera();

  /// Set video quality
  Future<void> setVideoQuality({
    int? width,
    int? height,
    int? bitrate,
    int? frameRate,
  });

  /// Get stream statistics
  Future<Map<String, dynamic>> getStreamStats();

  /// Cleanup resources
  Future<void> dispose();
}

