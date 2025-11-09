import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../core/services/api_helper.dart';
import '../models/streaming_provider_model.dart';
import 'streaming_service_interface.dart';

/// WebRTC implementation using flutter_webrtc and Socket.IO for signaling
class WebRTCStreamingService implements StreamingServiceInterface {
  // ignore: unused_field
  StreamingProviderConfig? _config; // Stored for future use
  IO.Socket? _socket;
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  bool _isInitialized = false;
  bool _isStreaming = false;
  String? _currentStreamId;
  // ignore: unused_field
  String? _currentUserId; // Kept for future tracking/debugging
  final ApiHelper _api = ApiHelper();

  // WebRTC configuration
  final Map<String, dynamic> _rtcConfiguration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
    ],
  };

  @override
  Future<void> initialize(StreamingProviderConfig config) async {
    _config = config;
    
    // Connect to WebRTC signaling server via Socket.IO
    final serverUrl = config.serverUrl ?? 'wss://mixillo-backend-52242135857.europe-west1.run.app';
    
    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      print('WebRTC: Connected to signaling server');
    });

    _socket!.onDisconnect((_) {
      print('WebRTC: Disconnected from signaling server');
    });

    _socket!.onError((error) {
      print('WebRTC error: $error');
    });

    // Listen for WebRTC signaling events
    _setupWebRTCSignaling();

    _isInitialized = true;
  }

  void _setupWebRTCSignaling() {
    if (_socket == null) return;

    // Handle offer
    _socket!.on('webrtc:offer', (data) async {
      try {
        final offer = RTCSessionDescription(data['sdp'], data['type']);
        await _peerConnection?.setRemoteDescription(offer);
        final answer = await _peerConnection!.createAnswer();
        await _peerConnection!.setLocalDescription(answer);
        _socket!.emit('webrtc:answer', {
          'sdp': answer.sdp,
          'type': answer.type,
          'streamId': _currentStreamId,
        });
      } catch (e) {
        print('Error handling offer: $e');
      }
    });

    // Handle answer
    _socket!.on('webrtc:answer', (data) async {
      try {
        final answer = RTCSessionDescription(data['sdp'], data['type']);
        await _peerConnection?.setRemoteDescription(answer);
      } catch (e) {
        print('Error handling answer: $e');
      }
    });

    // Handle ICE candidate
    _socket!.on('webrtc:ice-candidate', (data) async {
      try {
        final candidate = RTCIceCandidate(
          data['candidate'],
          data['sdpMid'],
          data['sdpMLineIndex'],
        );
        await _peerConnection?.addCandidate(candidate);
      } catch (e) {
        print('Error handling ICE candidate: $e');
      }
    });

    // Handle peer joined
    _socket!.on('webrtc:peer-joined', (data) {
      print('WebRTC: Peer joined: ${data['userId']}');
    });

    // Handle peer left
    _socket!.on('webrtc:peer-left', (data) {
      print('WebRTC: Peer left: ${data['userId']}');
      _remoteStream = null;
    });
  }

  Future<void> _createPeerConnection() async {
    _peerConnection = await createPeerConnection(_rtcConfiguration);

    // Handle ICE candidates
    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      _socket?.emit('webrtc:ice-candidate', {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
        'streamId': _currentStreamId,
      });
    };

    // Handle remote stream
    _peerConnection!.onAddStream = (MediaStream stream) {
      _remoteStream = stream;
      print('WebRTC: Received remote stream');
    };

    // Handle connection state
    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      print('WebRTC: Connection state: $state');
    };
  }

  Future<void> _getUserMedia() async {
    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': {
        'facingMode': 'user',
        'width': {'ideal': 720},
        'height': {'ideal': 1280},
      },
    });

    // Add tracks to peer connection
    _localStream!.getTracks().forEach((track) {
      _peerConnection?.addTrack(track, _localStream!);
    });
  }

  @override
  Future<Map<String, dynamic>> startStream({
    required String streamId,
    required String userId,
    String? title,
    bool isPrivate = false,
  }) async {
    if (!_isInitialized || _socket == null) {
      throw Exception('WebRTC service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    try {
      // Create peer connection
      await _createPeerConnection();
      
      // Get user media
      await _getUserMedia();

      // Join WebRTC room
      _socket!.emit('webrtc:join-room', {
        'roomId': streamId,
        'userId': userId,
        'streamId': streamId,
        'role': 'broadcaster',
      });

      // Create offer
      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);
      
      _socket!.emit('webrtc:offer', {
        'sdp': offer.sdp,
        'type': offer.type,
        'streamId': streamId,
      });

      // Call backend to start WebRTC stream
      try {
        final response = await _api.dio.post(
          '/webrtc/stream/start',
          data: {
            'streamId': streamId,
            'userId': userId,
            'title': title,
            'isPrivate': isPrivate,
          },
        );

        if (response.data['success'] == true) {
          _isStreaming = true;
          return {
            'streamId': streamId,
            'roomId': streamId,
            'provider': 'webrtc',
            'localStream': _localStream,
            ...response.data['data'],
          };
        }
      } catch (e) {
        print('Warning: Failed to register stream with backend: $e');
      }

      _isStreaming = true;
      return {
        'streamId': streamId,
        'roomId': streamId,
        'provider': 'webrtc',
        'localStream': _localStream,
      };
    } catch (e) {
      throw Exception('Failed to start WebRTC stream: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> joinStream({
    required String streamId,
    required String userId,
  }) async {
    if (!_isInitialized || _socket == null) {
      throw Exception('WebRTC service not initialized');
    }

    _currentStreamId = streamId;
    _currentUserId = userId;

    try {
      // Create peer connection
      await _createPeerConnection();

      // Join WebRTC room as viewer
      _socket!.emit('webrtc:join-room', {
        'roomId': streamId,
        'userId': userId,
        'streamId': streamId,
        'role': 'viewer',
      });

      try {
        final response = await _api.dio.get('/webrtc/stream/$streamId/join');

        if (response.data['success'] == true) {
          return {
            'streamId': streamId,
            'roomId': streamId,
            'provider': 'webrtc',
            'remoteStream': _remoteStream,
            ...response.data['data'],
          };
        }
      } catch (e) {
        print('Warning: Failed to join stream via backend: $e');
      }

      return {
        'streamId': streamId,
        'roomId': streamId,
        'provider': 'webrtc',
        'remoteStream': _remoteStream,
      };
    } catch (e) {
      throw Exception('Failed to join WebRTC stream: $e');
    }
  }

  @override
  Future<void> leaveStream(String streamId) async {
    try {
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) {
          track.stop();
        });
        _localStream!.dispose();
        _localStream = null;
      }

      if (_remoteStream != null) {
        _remoteStream!.getTracks().forEach((track) {
          track.stop();
        });
        _remoteStream!.dispose();
        _remoteStream = null;
      }

      if (_peerConnection != null) {
        await _peerConnection!.close();
        _peerConnection = null;
      }

      if (_socket != null && _isStreaming) {
        _socket!.emit('webrtc:leave-room', {'roomId': streamId});
      }

      _isStreaming = false;
      _currentStreamId = null;
      _currentUserId = null;
    } catch (e) {
      print('Error leaving WebRTC stream: $e');
    }
  }

  @override
  Future<void> endStream(String streamId) async {
    await leaveStream(streamId);
    
    // Notify backend
    try {
      await _api.dio.post('/webrtc/stream/$streamId/end');
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
    // WebRTC doesn't use tokens in the same way
    return '';
  }

  @override
  Future<void> toggleCamera(bool enabled) async {
    if (_localStream != null) {
      _localStream!.getVideoTracks().forEach((track) {
        track.enabled = enabled;
      });
    }
  }

  @override
  Future<void> toggleMicrophone(bool enabled) async {
    if (_localStream != null) {
      _localStream!.getAudioTracks().forEach((track) {
        track.enabled = enabled;
      });
    }
  }

  @override
  Future<void> switchCamera() async {
    if (_localStream != null) {
      final videoTrack = _localStream!.getVideoTracks().first;
      await Helper.switchCamera(videoTrack);
    }
  }

  @override
  Future<void> setVideoQuality({
    int? width,
    int? height,
    int? bitrate,
    int? frameRate,
  }) async {
    if (_localStream != null && _localStream!.getVideoTracks().isNotEmpty) {
      // Note: setParameters may not be available on MediaStreamTrack
      // Video quality is typically set during track initialization
      // Consider re-initializing the stream with new constraints if needed
      print('Video quality adjustment requested: ${width}x$height @ $frameRate fps, bitrate: $bitrate');
    }
  }

  @override
  Future<Map<String, dynamic>> getStreamStats() async {
    if (_peerConnection == null) {
      return {'provider': 'webrtc'};
    }

    try {
      final stats = await _peerConnection!.getStats();
      return {
        'provider': 'webrtc',
        'stats': stats,
      };
    } catch (e) {
      return {'provider': 'webrtc'};
    }
  }

  @override
  Future<void> dispose() async {
    await leaveStream(_currentStreamId ?? '');
    
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    
    _isInitialized = false;
    _isStreaming = false;
    _currentStreamId = null;
    _currentUserId = null;
  }

  // Getters for UI
  MediaStream? get localStream => _localStream;
  MediaStream? get remoteStream => _remoteStream;
}
