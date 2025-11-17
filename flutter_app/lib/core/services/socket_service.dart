import 'dart:async';
import 'dart:math';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'auth_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final AuthService _authService = AuthService();
  String? _currentVideoRoom;

  // Auto-reconnect management
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  bool _isManualDisconnect = false;

  // Event streams
  final _videoLikeController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _videoCommentController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _videoViewController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _videoShareController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Post event streams
  final _postLikeController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _postCommentController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _postUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  // Story event streams
  final _storyAddedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _storyDeletedController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _storyViewedController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get videoLikeStream =>
      _videoLikeController.stream;
  Stream<Map<String, dynamic>> get videoCommentStream =>
      _videoCommentController.stream;
  Stream<Map<String, dynamic>> get videoViewStream =>
      _videoViewController.stream;
  Stream<Map<String, dynamic>> get videoShareStream =>
      _videoShareController.stream;

  Stream<Map<String, dynamic>> get postLikeStream => _postLikeController.stream;
  Stream<Map<String, dynamic>> get postCommentStream =>
      _postCommentController.stream;
  Stream<Map<String, dynamic>> get postUpdateStream =>
      _postUpdateController.stream;

  Stream<Map<String, dynamic>> get storyAddedStream =>
      _storyAddedController.stream;
  Stream<Map<String, dynamic>> get storyDeletedStream =>
      _storyDeletedController.stream;
  Stream<Map<String, dynamic>> get storyViewedStream =>
      _storyViewedController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket?.connected == true) {
      debugPrint('✅ Socket already connected');
      return;
    }

    _isManualDisconnect = false;
    final socketUrl = dotenv.env['SOCKET_URL'] ?? 'http://localhost:5000';
    final token =
        await _authService.getValidToken(); // Use valid token with auto-refresh

    // Dispose old socket if exists
    if (_socket != null) {
      _socket!.dispose();
    }

    _socket = io.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'reconnection': true,
      'reconnectionAttempts': 5,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'timeout': 20000,
      'auth': {'token': token},
    });

    _socket!.connect();
    _socket!.connect();

    _socket!.onConnect((_) {
      _reconnectAttempts = 0; // Reset on successful connection
      debugPrint('✅ Socket.IO connected successfully');
    });

    _socket!.onDisconnect((reason) {
      debugPrint('❌ Socket.IO disconnected: $reason');

      // Auto-reconnect unless manually disconnected
      if (!_isManualDisconnect && reason != 'io client disconnect') {
        _scheduleReconnect();
      }
    });

    _socket!.onConnectError((error) {
      debugPrint('❌ Socket.IO connection error: $error');
      _scheduleReconnect();
    });

    _socket!.onError((error) {
      debugPrint('❌ Socket.IO error: $error');
    });

    // Listen to video interaction events
    _setupEventListeners();
  }

  /// Schedule reconnection with exponential backoff
  void _scheduleReconnect() {
    if (_isManualDisconnect) return;
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('❌ Max reconnection attempts reached. Giving up.');
      return;
    }

    _reconnectTimer?.cancel();

    // Exponential backoff: 2^attempts seconds, max 30 seconds
    final delay = Duration(
      seconds: min(30, pow(2, _reconnectAttempts).toInt()),
    );

    _reconnectAttempts++;
    debugPrint(
        '🔄 Reconnecting in ${delay.inSeconds}s (attempt $_reconnectAttempts/$_maxReconnectAttempts)');

    _reconnectTimer = Timer(delay, () {
      if (!_isManualDisconnect) {
        debugPrint('🔄 Attempting reconnection...');
        connect();
      }
    });
  }

  void _setupEventListeners() {
    // Video like event
    _socket!.on('video:like', (data) {
      debugPrint('📥 Received video:like event: $data');
      _videoLikeController.add(Map<String, dynamic>.from(data));
    });

    // Video comment event
    _socket!.on('video:comment', (data) {
      debugPrint('📥 Received video:comment event: $data');
      _videoCommentController.add(Map<String, dynamic>.from(data));
    });

    // Video view event
    _socket!.on('video:view', (data) {
      debugPrint('📥 Received video:view event: $data');
      _videoViewController.add(Map<String, dynamic>.from(data));
    });

    // Video share event
    _socket!.on('video:share', (data) {
      debugPrint('📥 Received video:share event: $data');
      _videoShareController.add(Map<String, dynamic>.from(data));
    });

    // Video joined confirmation
    _socket!.on('video:joined', (data) {
      debugPrint('✅ Joined video room: ${data['contentId']}');
    });

    // Video left confirmation
    _socket!.on('video:left', (data) {
      debugPrint('👋 Left video room: ${data['contentId']}');
    });

    // Post events
    _socket!.on('post_liked', (data) {
      debugPrint('📥 Received post_liked event: $data');
      _postLikeController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('post_unliked', (data) {
      debugPrint('📥 Received post_unliked event: $data');
      _postLikeController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('comment_added', (data) {
      debugPrint('📥 Received comment_added event: $data');
      _postCommentController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('post_updated', (data) {
      debugPrint('📥 Received post_updated event: $data');
      _postUpdateController.add(Map<String, dynamic>.from(data));
    });

    // Story events
    _socket!.on('story_added', (data) {
      debugPrint('📥 Received story_added event: $data');
      _storyAddedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('story_deleted', (data) {
      debugPrint('📥 Received story_deleted event: $data');
      _storyDeletedController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('story_viewed', (data) {
      debugPrint('📥 Received story_viewed event: $data');
      _storyViewedController.add(Map<String, dynamic>.from(data));
    });
  }

  // Join a video room
  void joinVideoRoom(String videoId) {
    if (_socket?.connected == true) {
      // Leave current room if exists
      if (_currentVideoRoom != null && _currentVideoRoom != videoId) {
        leaveVideoRoom(_currentVideoRoom!);
      }

      _socket!.emit('video:join', {'contentId': videoId});
      _currentVideoRoom = videoId;
      debugPrint('🚪 Joining video room: $videoId');
    }
  }

  // Leave a video room
  void leaveVideoRoom(String videoId) {
    if (_socket?.connected == true) {
      _socket!.emit('video:leave', {'contentId': videoId});
      if (_currentVideoRoom == videoId) {
        _currentVideoRoom = null;
      }
      debugPrint('👋 Leaving video room: $videoId');
    }
  }

  // Emit typing indicator for comments
  void emitTyping(String videoId, bool isTyping) {
    if (_socket?.connected == true) {
      _socket!.emit('video:comment_typing', {
        'contentId': videoId,
        'isTyping': isTyping,
      });
    }
  }

  // Disconnect
  void disconnect() {
    _isManualDisconnect = true;
    _reconnectTimer?.cancel();

    if (_currentVideoRoom != null) {
      leaveVideoRoom(_currentVideoRoom!);
    }
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    debugPrint('❌ Socket.IO disconnected manually');
  }

  // Dispose streams
  void dispose() {
    disconnect();
    _videoLikeController.close();
    _videoCommentController.close();
    _videoViewController.close();
    _videoShareController.close();
    _postLikeController.close();
    _postCommentController.close();
    _postUpdateController.close();
    _storyAddedController.close();
    _storyDeletedController.close();
    _storyViewedController.close();
  }
}
