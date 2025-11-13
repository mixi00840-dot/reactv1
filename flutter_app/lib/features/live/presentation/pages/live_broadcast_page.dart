import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../../../../core/services/agora_stream_manager.dart';
import '../../../../core/services/live_streaming_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/glass_widgets.dart';
import 'package:iconsax/iconsax.dart';

/// Live streaming broadcaster page (host view)
class LiveBroadcastPage extends StatefulWidget {
  final String title;
  final String? description;

  const LiveBroadcastPage({
    super.key,
    required this.title,
    this.description,
  });

  @override
  State<LiveBroadcastPage> createState() => _LiveBroadcastPageState();
}

class _LiveBroadcastPageState extends State<LiveBroadcastPage> {
  final AgoraStreamManager _agoraManager = AgoraStreamManager();
  final LiveStreamingService _streamingService = LiveStreamingService();
  final SocketService _socketService = SocketService();
  final TextEditingController _messageController = TextEditingController();

  LiveStreamConfig? _streamConfig;
  bool _isLoading = true;
  bool _isLive = false;
  int _viewerCount = 0;
  int _likeCount = 0;
  final List<LiveComment> _comments = [];
  Timer? _durationTimer;
  Duration _streamDuration = Duration.zero;
  AgoraStreamQuality _currentQuality = AgoraStreamQuality.high;

  @override
  void initState() {
    super.initState();
    _initializeLiveStream();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _messageController.dispose();
    _agoraManager.leaveChannel();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  /// Initialize live stream
  Future<void> _initializeLiveStream() async {
    try {
      setState(() => _isLoading = true);

      // Create stream
      _streamConfig = await _streamingService.createLiveStream(
        title: widget.title,
        description: widget.description,
        provider: 'agora',
      );

      // Initialize Agora
      final appId = _streamConfig!.config['appId'] ?? '';
      final initialized = await _agoraManager.initialize(appId);

      if (!initialized) {
        throw Exception('Failed to initialize Agora');
      }

      // Start broadcasting
      final started = await _agoraManager.startBroadcasting(
        streamConfig: _streamConfig!,
        quality: _currentQuality,
      );

      if (!started) {
        throw Exception('Failed to start broadcasting');
      }

      // Mark stream as live
      await _streamingService.startLiveStream(_streamConfig!.streamId);

      // Connect socket for real-time updates
      _socketService.connect();
      // Join livestream room via socket
      // Note: SocketService doesn't have joinLivestream method yet, using joinVideoRoom
      _socketService.joinVideoRoom(_streamConfig!.streamId);

      // Listen to socket events
      _listenToSocketEvents();

      // Start duration timer
      _startDurationTimer();

      setState(() {
        _isLoading = false;
        _isLive = true;
      });
    } catch (e) {
      debugPrint('Error initializing live stream: $e');
      setState(() => _isLoading = false);
      _showError('Failed to start live stream: $e');
    }
  }

  /// Listen to socket events
  void _listenToSocketEvents() {
    // Listen to viewer count updates
    _socketService.videoViewStream.listen((data) {
      if (mounted) {
        setState(() {
          _viewerCount = data['viewerCount'] ?? _viewerCount;
        });
      }
    });

    // Listen to comments
    _socketService.videoCommentStream.listen((data) {
      if (mounted) {
        final comment = LiveComment(
          id: data['id'] ?? '',
          userId: data['userId'] ?? '',
          username: data['username'] ?? 'Anonymous',
          avatar: data['avatar'],
          message: data['message'] ?? '',
          timestamp: DateTime.now(),
        );
        setState(() {
          _comments.add(comment);
          if (_comments.length > 50) {
            _comments.removeAt(0);
          }
        });
      }
    });

    // Listen to likes
    _socketService.videoLikeStream.listen((data) {
      if (mounted) {
        setState(() {
          _likeCount = data['likes'] ?? _likeCount;
        });
        _showFloatingHeart();
      }
    });
  }

  /// Start duration timer
  void _startDurationTimer() {
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _streamDuration = Duration(seconds: _streamDuration.inSeconds + 1);
        });
      }
    });
  }

  /// End live stream
  Future<void> _endLiveStream() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Live Stream?'),
        content: const Text('Are you sure you want to end this live stream?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('End Stream', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await _agoraManager.leaveChannel();
        await _streamingService.endLiveStream(_streamConfig!.streamId);
        _socketService.leaveVideoRoom(_streamConfig!.streamId);
        _durationTimer?.cancel();

        if (mounted) {
          Navigator.pop(context);
        }
      } catch (e) {
        debugPrint('Error ending stream: $e');
      }
    }
  }

  /// Toggle microphone mute
  Future<void> _toggleMute() async {
    await _agoraManager.toggleMute();
    setState(() {});
  }

  /// Toggle camera
  Future<void> _toggleCamera() async {
    await _agoraManager.toggleCamera();
    setState(() {});
  }

  /// Switch camera
  Future<void> _switchCamera() async {
    await _agoraManager.switchCamera();
    setState(() {});
  }

  /// Change stream quality
  Future<void> _changeQuality() async {
    final quality = await showDialog<AgoraStreamQuality>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stream Quality'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: AgoraStreamQuality.values.map((q) {
            return ListTile(
              title: Text(q.name.toUpperCase()),
              subtitle: Text(_getQualityDescription(q)),
              trailing: _currentQuality == q 
                  ? const Icon(Icons.check, color: AppColors.primary)
                  : null,
              onTap: () => Navigator.pop(context, q),
            );
          }).toList(),
        ),
      ),
    );

    if (quality != null && quality != _currentQuality) {
      await _agoraManager.setStreamQuality(quality);
      setState(() => _currentQuality = quality);
      _showInfo('Quality changed to ${quality.name}');
    }
  }

  String _getQualityDescription(AgoraStreamQuality quality) {
    switch (quality) {
      case AgoraStreamQuality.low:
        return '480p, 15fps, 400kbps';
      case AgoraStreamQuality.medium:
        return '720p, 24fps, 1000kbps';
      case AgoraStreamQuality.high:
        return '720p, 30fps, 1500kbps';
      case AgoraStreamQuality.ultra:
        return '1080p, 30fps, 2500kbps';
    }
  }

  /// Show floating heart animation
  void _showFloatingHeart() {
    // TODO: Implement floating heart animation overlay
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showInfo(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Agora Video View
          Center(
            child: _isLive && _agoraManager.engine != null
                ? AgoraVideoView(
                    controller: VideoViewController(
                      rtcEngine: _agoraManager.engine!,
                      canvas: const VideoCanvas(uid: 0),
                    ),
                  )
                : Container(color: Colors.black),
          ),

          // Top bar
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                const Spacer(),
                _buildComments(),
                _buildBottomControls(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Close button
          GlassContainer(
            padding: const EdgeInsets.all(8),
            borderRadius: BorderRadius.circular(20),
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: _endLiveStream,
            ),
          ),
          const SizedBox(width: 12),

          // Live indicator + Duration
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            borderRadius: BorderRadius.circular(20),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'LIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _streamingService.formatStreamDuration(_streamDuration),
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Viewer count
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            borderRadius: BorderRadius.circular(20),
            child: Row(
              children: [
                const Icon(Icons.remove_red_eye, color: Colors.white, size: 16),
                const SizedBox(width: 4),
                Text(
                  _streamingService.formatViewerCount(_viewerCount),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
          const Spacer(),

          // Quality button
          GlassContainer(
            padding: const EdgeInsets.all(8),
            borderRadius: BorderRadius.circular(20),
            child: IconButton(
              icon: const Icon(Iconsax.setting_2, color: Colors.white),
              onPressed: _changeQuality,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComments() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: SizedBox(
        height: 200,
        child: ListView.builder(
          reverse: true,
          itemCount: _comments.length,
          itemBuilder: (context, index) {
            final comment = _comments[_comments.length - 1 - index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: GlassContainer(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                borderRadius: BorderRadius.circular(16),
                child: RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: '${comment.username}: ',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      TextSpan(
                        text: comment.message,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Camera switch
          _buildControlButton(
            icon: Iconsax.camera_slash,
            isActive: !_agoraManager.isCameraOff,
            onTap: _toggleCamera,
          ),
          const SizedBox(width: 12),

          // Flip camera
          _buildControlButton(
            icon: Iconsax.refresh,
            onTap: _switchCamera,
          ),
          const SizedBox(width: 12),

          // Microphone
          _buildControlButton(
            icon: _agoraManager.isMuted ? Iconsax.microphone_slash : Iconsax.microphone,
            isActive: !_agoraManager.isMuted,
            onTap: _toggleMute,
          ),
          const Spacer(),

          // Like count
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            borderRadius: BorderRadius.circular(24),
            child: Row(
              children: [
                const Icon(Iconsax.heart5, color: Colors.red, size: 20),
                const SizedBox(width: 6),
                Text(
                  _streamingService.formatViewerCount(_likeCount),
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    bool isActive = true,
    required VoidCallback onTap,
  }) {
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      borderRadius: BorderRadius.circular(24),
      child: GestureDetector(
        onTap: onTap,
        child: Icon(
          icon,
          color: isActive ? Colors.white : Colors.white54,
          size: 24,
        ),
      ),
    );
  }
}
