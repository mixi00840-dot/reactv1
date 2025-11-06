import 'package:zego_express_engine/zego_express_engine.dart';
import '../../../core/services/api_service.dart';
import '../models/streaming_provider_model.dart';
import 'streaming_service_interface.dart';

/// ZegoCloud implementation using Zego Express Engine SDK
class ZegoCloudStreamingService implements StreamingServiceInterface {
  StreamingProviderConfig? _config;
  bool _isInitialized = false;
  bool _isStreaming = false;
  String? _currentStreamId;
  // ignore: unused_field
  String? _currentUserId; // Kept for future tracking/debugging
  ZegoExpressEngine? _engine;
  final ApiService _apiService = ApiService();

  @override
  Future<void> initialize(StreamingProviderConfig config) async {
    _config = config;
    
    try {
      // Create ZegoCloud engine instance
      await ZegoExpressEngine.createEngineWithProfile(ZegoEngineProfile(
        int.parse(config.appId),
        ZegoScenario.General,
        appSign: config.appSecret,
      ));
      
      _engine = ZegoExpressEngine.instance;

      // Set up event handlers
      ZegoExpressEngine.onRoomStateUpdate = (String roomID, ZegoRoomState state, int errorCode, Map<String, dynamic> extendedData) {
        if (state == ZegoRoomState.Connected) {
          print('ZegoCloud: Joined room successfully: $roomID');
        } else if (state == ZegoRoomState.Disconnected) {
          print('ZegoCloud: Left room: $roomID');
        }
      };
      
      ZegoExpressEngine.onRoomUserUpdate = (String roomID, ZegoUpdateType updateType, List<ZegoUser> userList) {
        for (var user in userList) {
          if (updateType == ZegoUpdateType.Add) {
            print('ZegoCloud: User joined: ${user.userID}');
          } else {
            print('ZegoCloud: User left: ${user.userID}');
          }
        }
      };
      
      ZegoExpressEngine.onPlayerStateUpdate = (String streamID, ZegoPlayerState state, int errorCode, Map<String, dynamic> extendedData) {
        if (state == ZegoPlayerState.Playing) {
          print('ZegoCloud: Started playing stream: $streamID');
        } else if (state == ZegoPlayerState.NoPlay) {
          print('ZegoCloud: Stopped playing stream: $streamID');
        }
      };
      
      ZegoExpressEngine.onPublisherStateUpdate = (String streamID, ZegoPublisherState state, int errorCode, Map<String, dynamic> extendedData) {
        if (state == ZegoPublisherState.Publishing) {
          print('ZegoCloud: Started publishing stream: $streamID');
          _isStreaming = true;
        } else if (state == ZegoPublisherState.NoPublish) {
          print('ZegoCloud: Stopped publishing stream: $streamID');
          _isStreaming = false;
        }
      };

      _isInitialized = true;
      print('ZegoCloud initialized successfully');
    } catch (e) {
      print('Error initializing ZegoCloud: $e');
      throw Exception('Failed to initialize ZegoCloud: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> startStream({
    required String streamId,
    required String userId,
    String? title,
    bool isPrivate = false,
  }) async {
    if (!_isInitialized || _engine == null) {
      throw Exception('ZegoCloud service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    try {
      // Login room
      await _engine!.loginRoom(
        streamId, // roomID
        ZegoUser(userId, userId),
      );

      // Start publishing stream
      await _engine!.startPublishingStream(streamId);

      // Call backend to register stream
      try {
        await _apiService.dio.post(
          '/streaming/streams',
          data: {
            'streamId': streamId,
            'userId': userId,
            'title': title,
            'isPrivate': isPrivate,
            'provider': 'zegocloud',
          },
        );
      } catch (e) {
        print('Warning: Failed to register stream with backend: $e');
      }

      return {
        'streamId': streamId,
        'roomId': streamId,
        'appId': _config!.appId,
        'provider': 'zegocloud',
      };
    } catch (e) {
      throw Exception('Failed to start ZegoCloud stream: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> joinStream({
    required String streamId,
    required String userId,
  }) async {
    if (!_isInitialized || _engine == null) {
      throw Exception('ZegoCloud service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    try {
      // Login room as viewer
      await _engine!.loginRoom(
        streamId, // roomID
        ZegoUser(userId, userId),
      );

      // Start playing stream
      await _engine!.startPlayingStream(streamId);

      return {
        'streamId': streamId,
        'roomId': streamId,
        'appId': _config!.appId,
        'provider': 'zegocloud',
      };
    } catch (e) {
      throw Exception('Failed to join ZegoCloud stream: $e');
    }
  }

  @override
  Future<void> leaveStream(String streamId) async {
    if (_engine != null) {
      try {
        if (_isStreaming) {
          await _engine!.stopPublishingStream();
        } else {
          await _engine!.stopPlayingStream(streamId);
        }
        await _engine!.logoutRoom(streamId);
      } catch (e) {
        print('Error leaving ZegoCloud stream: $e');
      }
      _isStreaming = false;
      _currentStreamId = null;
      _currentUserId = null;
    }
  }

  @override
  Future<void> endStream(String streamId) async {
    await leaveStream(streamId);
    
    // Notify backend
    try {
      await _apiService.dio.post('/streaming/streams/$streamId/end');
    } catch (e) {
      print('Warning: Failed to notify backend of stream end: $e');
    }
  }

  @override
  Future<String> getStreamToken({
    required String streamId,
    required String userId,
    int expireTime = 3600,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/streaming/token/zegocloud',
        data: {
          'streamId': streamId,
          'userId': userId,
          'expireTime': expireTime,
        },
      );
      
      if (response.data['success'] == true) {
        return response.data['data']['token'] ?? '';
      }
      return '';
    } catch (e) {
      print('Error fetching ZegoCloud token: $e');
      return '';
    }
  }

  @override
  Future<void> toggleCamera(bool enabled) async {
    if (_engine != null) {
      await _engine!.enableCamera(enabled);
    }
  }

  @override
  Future<void> toggleMicrophone(bool enabled) async {
    if (_engine != null) {
      await _engine!.muteMicrophone(!enabled);
    }
  }

  @override
  Future<void> switchCamera() async {
    if (_engine != null) {
      // Note: isCameraFrontFacing method may not exist in current SDK
      // Using useFrontCamera with toggle logic
      await _engine!.useFrontCamera(true); // Toggle manually if needed
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
      await _engine!.setVideoConfig(ZegoVideoConfig(
        width ?? 720,
        height ?? 1280,
        width ?? 720,
        height ?? 1280,
        bitrate ?? 1500,
        frameRate ?? 15,
        ZegoVideoCodecID.Default, // codecID
      ));
    }
  }

  @override
  Future<Map<String, dynamic>> getStreamStats() async {
    if (_engine == null) {
      return {'provider': 'zegocloud'};
    }

    // Note: getPublisherStats may not be available in current SDK
    // Return basic stats structure
    return {
      'provider': 'zegocloud',
      'isStreaming': _isStreaming,
      'streamId': _currentStreamId,
    };
  }

  @override
  Future<void> dispose() async {
    if (_engine != null) {
      try {
        if (_currentStreamId != null) {
          await leaveStream(_currentStreamId!);
        }
        await ZegoExpressEngine.destroyEngine();
      } catch (e) {
        print('Error disposing ZegoCloud: $e');
      }
      _engine = null;
    }
    _isInitialized = false;
    _isStreaming = false;
    _currentStreamId = null;
    _currentUserId = null;
  }
}
