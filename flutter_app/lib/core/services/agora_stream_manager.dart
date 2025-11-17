import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'live_streaming_service.dart';

/// Agora stream role
enum AgoraStreamRole {
  broadcaster, // Host
  audience, // Viewer
}

/// Agora stream quality preset
enum AgoraStreamQuality {
  low, // 480p, 15fps, 400kbps
  medium, // 720p, 24fps, 1000kbps
  high, // 720p, 30fps, 1500kbps
  ultra, // 1080p, 30fps, 2500kbps
}

/// Agora streaming manager for live broadcasts
class AgoraStreamManager {
  static final AgoraStreamManager _instance = AgoraStreamManager._internal();
  factory AgoraStreamManager() => _instance;
  AgoraStreamManager._internal();

  RtcEngine? _engine;
  AgoraStreamRole _role = AgoraStreamRole.audience;
  bool _isJoined = false;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isFrontCamera = true;
  int _remoteUid = 0;

  // Stream controllers for events
  final _viewerCountController = StreamController<int>.broadcast();
  final _commentController = StreamController<Map<String, dynamic>>.broadcast();
  final _giftController = StreamController<Map<String, dynamic>>.broadcast();
  final _likeController = StreamController<int>.broadcast();
  final _userJoinedController = StreamController<int>.broadcast();
  final _userLeftController = StreamController<int>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  // Event streams
  Stream<int> get viewerCountStream => _viewerCountController.stream;
  Stream<Map<String, dynamic>> get commentStream => _commentController.stream;
  Stream<Map<String, dynamic>> get giftStream => _giftController.stream;
  Stream<int> get likeStream => _likeController.stream;
  Stream<int> get userJoinedStream => _userJoinedController.stream;
  Stream<int> get userLeftStream => _userLeftController.stream;
  Stream<String> get errorStream => _errorController.stream;

  // Getters
  bool get isInitialized => _engine != null;
  bool get isJoined => _isJoined;
  bool get isMuted => _isMuted;
  bool get isCameraOff => _isCameraOff;
  bool get isFrontCamera => _isFrontCamera;
  bool get isBroadcaster => _role == AgoraStreamRole.broadcaster;
  int get remoteUid => _remoteUid;
  RtcEngine? get engine => _engine; // Public getter for engine access

  /// Initialize Agora engine
  Future<bool> initialize(String appId) async {
    try {
      if (_engine != null) {
        debugPrint('Agora engine already initialized');
        return true;
      }

      // Request permissions
      await _requestPermissions();

      // Create engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(RtcEngineContext(
        appId: appId,
        channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
      ));

      // Register event handlers
      _registerEventHandlers();

      // Enable video
      await _engine!.enableVideo();
      await _engine!.enableAudio();

      debugPrint('Agora engine initialized successfully');
      return true;
    } catch (e) {
      debugPrint('Error initializing Agora engine: $e');
      _errorController.add('Failed to initialize: $e');
      return false;
    }
  }

  /// Request necessary permissions
  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  /// Register event handlers
  void _registerEventHandlers() {
    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint('Successfully joined channel: ${connection.channelId}');
          _isJoined = true;
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint('Remote user joined: $remoteUid');
          _remoteUid = remoteUid;
          _userJoinedController.add(remoteUid);
        },
        onUserOffline: (RtcConnection connection, int remoteUid,
            UserOfflineReasonType reason) {
          debugPrint('Remote user left: $remoteUid');
          _remoteUid = 0;
          _userLeftController.add(remoteUid);
        },
        onLeaveChannel: (RtcConnection connection, RtcStats stats) {
          debugPrint('Left channel');
          _isJoined = false;
        },
        onError: (ErrorCodeType err, String msg) {
          debugPrint('Agora error: $err - $msg');
          _errorController.add('Error: $msg');
        },
        onConnectionLost: (RtcConnection connection) {
          debugPrint('Connection lost');
          _errorController.add('Connection lost. Reconnecting...');
        },
        onRtcStats: (RtcConnection connection, RtcStats stats) {
          // Optional: Handle statistics
        },
      ),
    );
  }

  /// Start broadcasting (host)
  Future<bool> startBroadcasting({
    required LiveStreamConfig streamConfig,
    AgoraStreamQuality quality = AgoraStreamQuality.high,
  }) async {
    try {
      if (_engine == null) {
        throw Exception('Engine not initialized');
      }

      _role = AgoraStreamRole.broadcaster;

      // Set client role to broadcaster
      await _engine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

      // Configure video encoding
      await _configureVideoEncoding(quality);

      // Join channel
      await _engine!.joinChannel(
        token: streamConfig.token,
        channelId: streamConfig.channelId,
        uid: 0, // Let Agora assign UID
        options: const ChannelMediaOptions(
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
        ),
      );

      // Start preview
      await _engine!.startPreview();

      debugPrint('Broadcasting started successfully');
      return true;
    } catch (e) {
      debugPrint('Error starting broadcast: $e');
      _errorController.add('Failed to start broadcasting: $e');
      return false;
    }
  }

  /// Join as viewer (audience)
  Future<bool> joinAsViewer({
    required LiveStreamConfig streamConfig,
  }) async {
    try {
      if (_engine == null) {
        throw Exception('Engine not initialized');
      }

      _role = AgoraStreamRole.audience;

      // Set client role to audience
      await _engine!.setClientRole(role: ClientRoleType.clientRoleAudience);

      // Join channel
      await _engine!.joinChannel(
        token: streamConfig.token,
        channelId: streamConfig.channelId,
        uid: 0,
        options: const ChannelMediaOptions(
          channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
          clientRoleType: ClientRoleType.clientRoleAudience,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        ),
      );

      debugPrint('Joined as viewer successfully');
      return true;
    } catch (e) {
      debugPrint('Error joining as viewer: $e');
      _errorController.add('Failed to join stream: $e');
      return false;
    }
  }

  /// Configure video encoding based on quality preset
  Future<void> _configureVideoEncoding(AgoraStreamQuality quality) async {
    VideoEncoderConfiguration config;

    switch (quality) {
      case AgoraStreamQuality.low:
        config = const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 480, height: 640),
          frameRate: 15,
          bitrate: 400,
          orientationMode: OrientationMode.orientationModeFixedPortrait,
        );
        break;
      case AgoraStreamQuality.medium:
        config = const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 720, height: 1280),
          frameRate: 24,
          bitrate: 1000,
          orientationMode: OrientationMode.orientationModeFixedPortrait,
        );
        break;
      case AgoraStreamQuality.high:
        config = const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 720, height: 1280),
          frameRate: 30,
          bitrate: 1500,
          orientationMode: OrientationMode.orientationModeFixedPortrait,
        );
        break;
      case AgoraStreamQuality.ultra:
        config = const VideoEncoderConfiguration(
          dimensions: VideoDimensions(width: 1080, height: 1920),
          frameRate: 30,
          bitrate: 2500,
          orientationMode: OrientationMode.orientationModeFixedPortrait,
        );
        break;
    }

    await _engine!.setVideoEncoderConfiguration(config);
  }

  /// Toggle microphone mute
  Future<void> toggleMute() async {
    if (_engine == null) return;

    _isMuted = !_isMuted;
    await _engine!.muteLocalAudioStream(_isMuted);
    debugPrint('Microphone ${_isMuted ? 'muted' : 'unmuted'}');
  }

  /// Toggle camera on/off
  Future<void> toggleCamera() async {
    if (_engine == null) return;

    _isCameraOff = !_isCameraOff;
    await _engine!.muteLocalVideoStream(_isCameraOff);
    debugPrint('Camera ${_isCameraOff ? 'off' : 'on'}');
  }

  /// Switch camera (front/back)
  Future<void> switchCamera() async {
    if (_engine == null) return;

    await _engine!.switchCamera();
    _isFrontCamera = !_isFrontCamera;
    debugPrint('Switched to ${_isFrontCamera ? 'front' : 'back'} camera');
  }

  /// Set video quality dynamically
  Future<void> setStreamQuality(AgoraStreamQuality quality) async {
    if (_engine == null) return;
    await _configureVideoEncoding(quality);
    debugPrint('Stream quality changed to: $quality');
  }

  /// Enable beauty effects
  Future<void> enableBeautyEffects({
    double lighteningLevel = 0.7,
    double smoothnessLevel = 0.5,
    double rednessLevel = 0.1,
  }) async {
    if (_engine == null) return;

    await _engine!.setBeautyEffectOptions(
      enabled: true,
      options: BeautyOptions(
        lighteningContrastLevel:
            LighteningContrastLevel.lighteningContrastNormal,
        lighteningLevel: lighteningLevel,
        smoothnessLevel: smoothnessLevel,
        rednessLevel: rednessLevel,
      ),
    );
    debugPrint('Beauty effects enabled');
  }

  /// Disable beauty effects
  Future<void> disableBeautyEffects() async {
    if (_engine == null) return;

    await _engine!.setBeautyEffectOptions(
      enabled: false,
      options: const BeautyOptions(),
    );
    debugPrint('Beauty effects disabled');
  }

  /// Leave channel
  Future<void> leaveChannel() async {
    if (_engine == null) return;

    try {
      await _engine!.leaveChannel();
      _isJoined = false;
      _remoteUid = 0;
      debugPrint('Left channel successfully');
    } catch (e) {
      debugPrint('Error leaving channel: $e');
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    if (_engine == null) return {};

    // Note: Actual stats would come from onRtcStats callback
    return {
      'isJoined': _isJoined,
      'role': _role.name,
      'isMuted': _isMuted,
      'isCameraOff': _isCameraOff,
      'remoteUid': _remoteUid,
    };
  }

  /// Dispose engine and clean up
  Future<void> dispose() async {
    try {
      if (_isJoined) {
        await leaveChannel();
      }

      await _engine?.release();
      _engine = null;

      await _viewerCountController.close();
      await _commentController.close();
      await _giftController.close();
      await _likeController.close();
      await _userJoinedController.close();
      await _userLeftController.close();
      await _errorController.close();

      debugPrint('Agora engine disposed');
    } catch (e) {
      debugPrint('Error disposing Agora engine: $e');
    }
  }

  /// Get Agora SDK version
  static String getSdkVersion() {
    return '6.3.0'; // Return the version as string
  }
}
