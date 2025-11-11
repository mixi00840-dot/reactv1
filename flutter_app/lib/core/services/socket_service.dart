import 'dart:async';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final AuthService _authService = AuthService();
  String? _currentVideoRoom;

  // Event streams
  final _videoLikeController = StreamController<Map<String, dynamic>>.broadcast();
  final _videoCommentController = StreamController<Map<String, dynamic>>.broadcast();
  final _videoViewController = StreamController<Map<String, dynamic>>.broadcast();
  final _videoShareController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get videoLikeStream => _videoLikeController.stream;
  Stream<Map<String, dynamic>> get videoCommentStream => _videoCommentController.stream;
  Stream<Map<String, dynamic>> get videoViewStream => _videoViewController.stream;
  Stream<Map<String, dynamic>> get videoShareStream => _videoShareController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    final socketUrl = dotenv.env['SOCKET_URL'] ?? 'http://localhost:5000';
    final token = await _authService.getToken();

    _socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      print('✅ Socket.IO connected');
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket.IO disconnected');
    });

    _socket!.onConnectError((error) {
      print('❌ Socket.IO connection error: $error');
    });

    _socket!.onError((error) {
      print('❌ Socket.IO error: $error');
    });

    // Listen to video interaction events
    _setupEventListeners();
  }

  void _setupEventListeners() {
    // Video like event
    _socket!.on('video:like', (data) {
      print('📥 Received video:like event: $data');
      _videoLikeController.add(Map<String, dynamic>.from(data));
    });

    // Video comment event
    _socket!.on('video:comment', (data) {
      print('📥 Received video:comment event: $data');
      _videoCommentController.add(Map<String, dynamic>.from(data));
    });

    // Video view event
    _socket!.on('video:view', (data) {
      print('📥 Received video:view event: $data');
      _videoViewController.add(Map<String, dynamic>.from(data));
    });

    // Video share event
    _socket!.on('video:share', (data) {
      print('📥 Received video:share event: $data');
      _videoShareController.add(Map<String, dynamic>.from(data));
    });

    // Video joined confirmation
    _socket!.on('video:joined', (data) {
      print('✅ Joined video room: ${data['contentId']}');
    });

    // Video left confirmation
    _socket!.on('video:left', (data) {
      print('👋 Left video room: ${data['contentId']}');
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
      print('🚪 Joining video room: $videoId');
    }
  }

  // Leave a video room
  void leaveVideoRoom(String videoId) {
    if (_socket?.connected == true) {
      _socket!.emit('video:leave', {'contentId': videoId});
      if (_currentVideoRoom == videoId) {
        _currentVideoRoom = null;
      }
      print('👋 Leaving video room: $videoId');
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
    if (_currentVideoRoom != null) {
      leaveVideoRoom(_currentVideoRoom!);
    }
    _socket?.disconnect();
    _socket?.dispose();
    print('❌ Socket.IO disconnected manually');
  }

  // Dispose streams
  void dispose() {
    disconnect();
    _videoLikeController.close();
    _videoCommentController.close();
    _videoViewController.close();
    _videoShareController.close();
  }
}
