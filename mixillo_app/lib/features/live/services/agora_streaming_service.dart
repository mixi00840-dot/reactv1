import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../models/streaming_provider_model.dart';
import 'streaming_service_interface.dart';

/// Agora RTC Engine implementation
class AgoraStreamingService implements StreamingServiceInterface {
  RtcEngine? _engine;
  StreamingProviderConfig? _config;
  bool _isInitialized = false;
  bool _isStreaming = false;
  String? _currentStreamId;
  String? _currentUserId;

  @override
  Future<void> initialize(StreamingProviderConfig config) async {
    _config = config;
    
    // Create Agora engine instance
    _engine = createAgoraRtcEngine();
    await _engine!.initialize(RtcEngineContext(
      appId: config.appId,
      channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
    ));

    // Set up event handlers
    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          print('Agora: Joined channel successfully');
        },
        onLeaveChannel: (RtcConnection connection, RtcStats stats) {
          print('Agora: Left channel');
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          print('Agora: User joined: $remoteUid');
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          print('Agora: User offline: $remoteUid');
        },
        onError: (ErrorCodeType err, String msg) {
          print('Agora error: $err - $msg');
        },
      ),
    );

    _isInitialized = true;
  }

  @override
  Future<Map<String, dynamic>> startStream({
    required String streamId,
    required String userId,
    String? title,
    bool isPrivate = false,
  }) async {
    if (!_isInitialized || _engine == null) {
      throw Exception('Agora service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    // Enable video and audio
    await _engine!.enableVideo();
    await _engine!.enableAudio();
    await _engine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

    // Generate token (should be fetched from backend)
    final token = await getStreamToken(
      streamId: streamId,
      userId: userId,
    );

    // Join channel
    await _engine!.joinChannel(
      token: token,
      channelId: streamId,
      uid: int.tryParse(userId) ?? 0,
      options: const ChannelMediaOptions(),
    );

    _isStreaming = true;

    return {
      'streamId': streamId,
      'channelId': streamId,
      'token': token,
      'appId': _config!.appId,
      'provider': 'agora',
    };
  }

  @override
  Future<Map<String, dynamic>> joinStream({
    required String streamId,
    required String userId,
  }) async {
    if (!_isInitialized || _engine == null) {
      throw Exception('Agora service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    // Set as audience
    await _engine!.setClientRole(role: ClientRoleType.clientRoleAudience);
    await _engine!.enableVideo();
    await _engine!.enableAudio();

    final token = await getStreamToken(
      streamId: streamId,
      userId: userId,
    );

    await _engine!.joinChannel(
      token: token,
      channelId: streamId,
      uid: int.tryParse(userId) ?? 0,
      options: const ChannelMediaOptions(),
    );

    return {
      'streamId': streamId,
      'channelId': streamId,
      'token': token,
      'appId': _config!.appId,
      'provider': 'agora',
    };
  }

  @override
  Future<void> leaveStream(String streamId) async {
    if (_engine != null && _isStreaming) {
      await _engine!.leaveChannel();
      _isStreaming = false;
      _currentStreamId = null;
      _currentUserId = null;
    }
  }

  @override
  Future<void> endStream(String streamId) async {
    await leaveStream(streamId);
  }

  @override
  Future<String> getStreamToken({
    required String streamId,
    required String userId,
    int expireTime = 3600,
  }) async {
    // In production, fetch token from backend
    // For now, return empty token (development mode)
    return '';
  }

  @override
  Future<void> toggleCamera(bool enabled) async {
    if (_engine != null) {
      await _engine!.enableLocalVideo(enabled);
    }
  }

  @override
  Future<void> toggleMicrophone(bool enabled) async {
    if (_engine != null) {
      await _engine!.muteLocalAudioStream(!enabled);
    }
  }

  @override
  Future<void> switchCamera() async {
    if (_engine != null) {
      await _engine!.switchCamera();
    }
  }

  @override
  Future<void> setVideoQuality({
    int? width,
    int? height,
    int? bitrate,
    int? frameRate,
  }) async {
    if (_engine != null) {
      final videoEncoderConfiguration = VideoEncoderConfiguration(
        dimensions: width != null && height != null
            ? VideoDimensions(width: width, height: height)
            : null,
        bitrate: bitrate,
        frameRate: frameRate,
      );
      await _engine!.setVideoEncoderConfiguration(videoEncoderConfiguration);
    }
  }

  @override
  Future<Map<String, dynamic>> getStreamStats() async {
    if (_engine == null) {
      return {};
    }

    // Get local video stats
    final localStats = await _engine!.getLocalVideoStats();
    
    return {
      'localVideoStats': localStats,
      'provider': 'agora',
    };
  }

  @override
  Future<void> dispose() async {
    if (_engine != null) {
      await _engine!.leaveChannel();
      await _engine!.release();
      _engine = null;
    }
    _isInitialized = false;
    _isStreaming = false;
    _currentStreamId = null;
    _currentUserId = null;
  }
}

