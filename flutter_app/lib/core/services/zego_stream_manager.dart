import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:zego_express_engine/zego_express_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'live_streaming_service.dart';

/// ZegoCloud stream role
enum ZegoStreamRole {
  host,    // Publisher
  viewer,  // Audience
}

/// ZegoCloud stream quality preset
enum ZegoStreamQuality {
  low,     // 480p, 15fps
  medium,  // 720p, 24fps
  high,    // 720p, 30fps
  ultra,   // 1080p, 30fps
}

/// ZegoCloud streaming manager for live broadcasts
class ZegoStreamManager {
  static final ZegoStreamManager _instance = ZegoStreamManager._internal();
  factory ZegoStreamManager() => _instance;
  ZegoStreamManager._internal();

  bool _isInitialized = false;
  ZegoStreamRole _role = ZegoStreamRole.viewer;
  bool _isPublishing = false;
  bool _isPlaying = false;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isFrontCamera = true;
  String? _currentStreamID;
  String? _currentRoomID;

  // Stream controllers for events
  final _viewerCountController = StreamController<int>.broadcast();
  final _commentController = StreamController<Map<String, dynamic>>.broadcast();
  final _giftController = StreamController<Map<String, dynamic>>.broadcast();
  final _likeController = StreamController<int>.broadcast();
  final _userJoinedController = StreamController<String>.broadcast();
  final _userLeftController = StreamController<String>.broadcast();
  final _errorController = StreamController<String>.broadcast();
  final _roomStateController = StreamController<ZegoRoomState>.broadcast();

  // Event streams
  Stream<int> get viewerCountStream => _viewerCountController.stream;
  Stream<Map<String, dynamic>> get commentStream => _commentController.stream;
  Stream<Map<String, dynamic>> get giftStream => _giftController.stream;
  Stream<int> get likeStream => _likeController.stream;
  Stream<String> get userJoinedStream => _userJoinedController.stream;
  Stream<String> get userLeftStream => _userLeftController.stream;
  Stream<String> get errorStream => _errorController.stream;
  Stream<ZegoRoomState> get roomStateStream => _roomStateController.stream;

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isPublishing => _isPublishing;
  bool get isPlaying => _isPlaying;
  bool get isMuted => _isMuted;
  bool get isCameraOff => _isCameraOff;
  bool get isFrontCamera => _isFrontCamera;
  bool get isHost => _role == ZegoStreamRole.host;
  String? get currentStreamID => _currentStreamID;
  String? get currentRoomID => _currentRoomID;

  /// Initialize ZegoCloud engine
  Future<bool> initialize(int appID, String appSign) async {
    try {
      if (_isInitialized) {
        debugPrint('ZegoCloud engine already initialized');
        return true;
      }

      // Request permissions
      await _requestPermissions();

      // Create engine
      await ZegoExpressEngine.createEngineWithProfile(
        ZegoEngineProfile(
          appID,
          ZegoScenario.General,
          appSign: appSign,
        ),
      );

      // Set up event handlers
      _registerEventHandlers();

      // Enable hardware encoding
      await ZegoExpressEngine.instance.enableHardwareEncoder(true);

      // Set audio config - ZegoAudioConfig(bitrate, channel, codecID)
      await ZegoExpressEngine.instance.setAudioConfig(
        ZegoAudioConfig(48000, ZegoAudioChannel.Mono, ZegoAudioCodecID.Default),
      );

      _isInitialized = true;
      debugPrint('ZegoCloud engine initialized successfully');
      return true;
    } catch (e) {
      debugPrint('Error initializing ZegoCloud engine: $e');
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
    ZegoExpressEngine.onRoomStateUpdate = (String roomID, ZegoRoomState state, int errorCode, Map<String, dynamic> extendedData) {
      debugPrint('Room state updated: $roomID - $state');
      _roomStateController.add(state);
      
      if (errorCode != 0) {
        _errorController.add('Room error: $errorCode');
      }
    };

    ZegoExpressEngine.onRoomUserUpdate = (String roomID, ZegoUpdateType updateType, List<ZegoUser> userList) {
      for (var user in userList) {
        if (updateType == ZegoUpdateType.Add) {
          debugPrint('User joined: ${user.userID}');
          _userJoinedController.add(user.userID);
        } else {
          debugPrint('User left: ${user.userID}');
          _userLeftController.add(user.userID);
        }
      }
    };

    ZegoExpressEngine.onPublisherStateUpdate = (String streamID, ZegoPublisherState state, int errorCode, Map<String, dynamic> extendedData) {
      debugPrint('Publisher state: $streamID - $state');
      if (errorCode != 0) {
        _errorController.add('Publishing error: $errorCode');
      }
    };

    ZegoExpressEngine.onPlayerStateUpdate = (String streamID, ZegoPlayerState state, int errorCode, Map<String, dynamic> extendedData) {
      debugPrint('Player state: $streamID - $state');
      if (errorCode != 0) {
        _errorController.add('Playing error: $errorCode');
      }
    };

    ZegoExpressEngine.onRoomStreamUpdate = (String roomID, ZegoUpdateType updateType, List<ZegoStream> streamList, Map<String, dynamic> extendedData) {
      debugPrint('Stream update in room: $roomID, type: $updateType');
    };
  }

  /// Start broadcasting (host)
  Future<bool> startBroadcasting({
    required LiveStreamConfig streamConfig,
    ZegoStreamQuality quality = ZegoStreamQuality.high,
  }) async {
    try {
      if (!_isInitialized) {
        throw Exception('Engine not initialized');
      }

      _role = ZegoStreamRole.host;
      _currentRoomID = streamConfig.channelId;
      _currentStreamID = streamConfig.streamId;

      // Configure video quality
      await _configureVideoQuality(quality);

      // Login to room
      final roomConfig = ZegoRoomConfig(0, true, '');
      final user = ZegoUser(streamConfig.streamId, streamConfig.streamId);
      
      await ZegoExpressEngine.instance.loginRoom(
        streamConfig.channelId,
        user,
        config: roomConfig,
      );

      // Enable camera
      await ZegoExpressEngine.instance.enableCamera(true);

      // Start preview
      await ZegoExpressEngine.instance.startPreview();

      // Start publishing
      await ZegoExpressEngine.instance.startPublishingStream(streamConfig.streamId);

      _isPublishing = true;
      debugPrint('Broadcasting started successfully');
      return true;
    } catch (e) {
      debugPrint('Error starting broadcast: $e');
      _errorController.add('Failed to start broadcasting: $e');
      return false;
    }
  }

  /// Join as viewer
  Future<bool> joinAsViewer({
    required LiveStreamConfig streamConfig,
  }) async {
    try {
      if (!_isInitialized) {
        throw Exception('Engine not initialized');
      }

      _role = ZegoStreamRole.viewer;
      _currentRoomID = streamConfig.channelId;
      _currentStreamID = streamConfig.streamId;

      // Login to room
      final roomConfig = ZegoRoomConfig(0, true, '');
      final user = ZegoUser('viewer_${DateTime.now().millisecondsSinceEpoch}', 'Viewer');
      
      await ZegoExpressEngine.instance.loginRoom(
        streamConfig.channelId,
        user,
        config: roomConfig,
      );

      // Start playing stream
      await ZegoExpressEngine.instance.startPlayingStream(
        streamConfig.streamId,
      );

      _isPlaying = true;
      debugPrint('Joined as viewer successfully');
      return true;
    } catch (e) {
      debugPrint('Error joining as viewer: $e');
      _errorController.add('Failed to join stream: $e');
      return false;
    }
  }

  /// Configure video quality
  Future<void> _configureVideoQuality(ZegoStreamQuality quality) async {
    ZegoVideoConfig config;

    switch (quality) {
      case ZegoStreamQuality.low:
        config = ZegoVideoConfig.preset(ZegoVideoConfigPreset.Preset360P);
        break;
      case ZegoStreamQuality.medium:
        config = ZegoVideoConfig.preset(ZegoVideoConfigPreset.Preset540P);
        break;
      case ZegoStreamQuality.high:
        config = ZegoVideoConfig.preset(ZegoVideoConfigPreset.Preset720P);
        break;
      case ZegoStreamQuality.ultra:
        config = ZegoVideoConfig.preset(ZegoVideoConfigPreset.Preset1080P);
        break;
    }

    await ZegoExpressEngine.instance.setVideoConfig(config);
  }

  /// Toggle microphone mute
  Future<void> toggleMute() async {
    if (!_isInitialized) return;

    _isMuted = !_isMuted;
    await ZegoExpressEngine.instance.muteMicrophone(_isMuted);
    debugPrint('Microphone ${_isMuted ? 'muted' : 'unmuted'}');
  }

  /// Toggle camera on/off
  Future<void> toggleCamera() async {
    if (!_isInitialized) return;

    _isCameraOff = !_isCameraOff;
    await ZegoExpressEngine.instance.enableCamera(!_isCameraOff);
    debugPrint('Camera ${_isCameraOff ? 'off' : 'on'}');
  }

  /// Switch camera (front/back)
  Future<void> switchCamera() async {
    if (!_isInitialized) return;

    await ZegoExpressEngine.instance.useFrontCamera(!_isFrontCamera);
    _isFrontCamera = !_isFrontCamera;
    debugPrint('Switched to ${_isFrontCamera ? 'front' : 'back'} camera');
  }

  /// Set video quality dynamically
  Future<void> setStreamQuality(ZegoStreamQuality quality) async {
    if (!_isInitialized) return;
    await _configureVideoQuality(quality);
    debugPrint('Stream quality changed to: $quality');
  }

  /// Enable beauty effects
  Future<void> enableBeautyEffects({
    int whitenIntensity = 70,
    int smoothIntensity = 50,
    int sharpenIntensity = 30,
  }) async {
    if (!_isInitialized) return;

    await ZegoExpressEngine.instance.enableBeautify(
      ZegoBeautifyFeature.SkinWhiten | ZegoBeautifyFeature.Sharpen,
    );
    
    await ZegoExpressEngine.instance.setBeautifyOption(
      ZegoBeautifyOption(
        whitenIntensity.toDouble(),
        smoothIntensity.toDouble(),
        sharpenIntensity.toDouble(),
      ),
    );
    
    debugPrint('Beauty effects enabled');
  }

  /// Disable beauty effects
  Future<void> disableBeautyEffects() async {
    if (!_isInitialized) return;

    await ZegoExpressEngine.instance.enableBeautify(ZegoBeautifyFeature.None);
    debugPrint('Beauty effects disabled');
  }

  /// Enable virtual background (optional advanced feature)
  Future<void> enableVirtualBackground(String imagePath) async {
    if (!_isInitialized) return;

    try {
      // Virtual background requires ZegoEffects SDK license
      debugPrint('Virtual background requested: $imagePath');
      // Note: Full implementation requires additional setup
    } catch (e) {
      debugPrint('Error enabling virtual background: $e');
    }
  }

  /// Disable virtual background
  Future<void> disableVirtualBackground() async {
    if (!_isInitialized) return;
    try {
      debugPrint('Virtual background disabled');
    } catch (e) {
      debugPrint('Error disabling virtual background: $e');
    }
  }

  /// Leave room and stop streaming
  Future<void> leaveRoom() async {
    if (!_isInitialized) return;

    try {
      if (_isPublishing) {
        await ZegoExpressEngine.instance.stopPublishingStream();
        await ZegoExpressEngine.instance.stopPreview();
        _isPublishing = false;
      }

      if (_isPlaying) {
        await ZegoExpressEngine.instance.stopPlayingStream(_currentStreamID!);
        _isPlaying = false;
      }

      await ZegoExpressEngine.instance.logoutRoom(_currentRoomID);
      
      _currentRoomID = null;
      _currentStreamID = null;
      
      debugPrint('Left room successfully');
    } catch (e) {
      debugPrint('Error leaving room: $e');
    }
  }

  /// Get connection statistics
  Future<Map<String, dynamic>> getConnectionStats() async {
    if (!_isInitialized) return {};

    return {
      'isPublishing': _isPublishing,
      'isPlaying': _isPlaying,
      'role': _role.name,
      'isMuted': _isMuted,
      'isCameraOff': _isCameraOff,
      'roomID': _currentRoomID,
      'streamID': _currentStreamID,
    };
  }

  /// Dispose engine and clean up
  Future<void> dispose() async {
    try {
      if (_isPublishing || _isPlaying) {
        await leaveRoom();
      }

      await ZegoExpressEngine.destroyEngine();
      _isInitialized = false;

      await _viewerCountController.close();
      await _commentController.close();
      await _giftController.close();
      await _likeController.close();
      await _userJoinedController.close();
      await _userLeftController.close();
      await _errorController.close();
      await _roomStateController.close();

      debugPrint('ZegoCloud engine disposed');
    } catch (e) {
      debugPrint('Error disposing ZegoCloud engine: $e');
    }
  }

  /// Get ZegoCloud SDK version
  static Future<String> getSdkVersion() async {
    return await ZegoExpressEngine.getVersion();
  }

  /// Create ZegoCloud view widget for preview
  Future<Widget?> createPreviewView() async {
    return await ZegoExpressEngine.instance.createCanvasView((viewID) {
      ZegoExpressEngine.instance.startPreview(canvas: ZegoCanvas(viewID));
    });
  }

  /// Create ZegoCloud view widget for playback
  Future<Widget?> createPlayView(String streamID) async {
    return await ZegoExpressEngine.instance.createCanvasView((viewID) {
      ZegoExpressEngine.instance.startPlayingStream(
        streamID,
        canvas: ZegoCanvas(viewID),
      );
    });
  }
}
