import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../../../../core/services/stream_provider_manager.dart';
import '../../../../core/services/live_streaming_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/glass_widgets.dart';
import 'package:iconsax/iconsax.dart';

/// Unified live streaming broadcaster page (supports Agora & ZegoCloud)
class UnifiedLiveBroadcastPage extends StatefulWidget {
  final String title;
  final String? description;

  const UnifiedLiveBroadcastPage({
    super.key,
    required this.title,
    this.description,
  });

  @override
  State<UnifiedLiveBroadcastPage> createState() =>
      _UnifiedLiveBroadcastPageState();
}

class _UnifiedLiveBroadcastPageState extends State<UnifiedLiveBroadcastPage> {
  final StreamProviderManager _providerManager = StreamProviderManager();
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
  String _currentQuality = 'high';
  Widget? _zegoPreviewWidget; // Cache ZegoCloud preview widget

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
    _providerManager.leaveStream();
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

      // ✅ IMPROVED: Load saved provider preference first
      await _providerManager.initializeWithPreference();
      debugPrint(
          '🎯 Initial provider: ${_providerManager.currentProvider.name}');

      // ✅ IMPROVED: Get providers with graceful fallback
      try {
        final providers = await _streamingService.getProviders();
        if (providers.isNotEmpty) {
          // Find active provider or use saved preference
          final activeProvider = providers.firstWhere(
            (p) => p['enabled'] == true,
            orElse: () => providers.first,
          );
          final providerName = activeProvider['name'] ?? 'agora';
          await _providerManager.setProviderByName(providerName);
          debugPrint('✅ Using provider: $providerName');
        }
      } catch (e) {
        // ✅ IMPROVED: Continue with saved preference if API fails
        debugPrint('⚠️ Could not fetch providers from API: $e');
        debugPrint(
            '📱 Continuing with saved preference: ${_providerManager.currentProvider.name}');
      }

      // Create stream with selected provider
      final providerName =
          _providerManager.currentProvider == StreamProvider.agora
              ? 'agora'
              : 'zegocloud';

      _streamConfig = await _streamingService.createLiveStream(
        title: widget.title,
        description: widget.description,
        provider: providerName,
      );

      // Initialize provider with config
      final initialized =
          await _providerManager.initialize(_streamConfig!.config);

      if (!initialized) {
        throw Exception('Failed to initialize streaming provider');
      }

      // Start broadcasting
      final started = await _providerManager.startBroadcasting(
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
      _socketService.joinVideoRoom(_streamConfig!.streamId);

      // Listen to socket events
      _listenToSocketEvents();

      // Start duration timer
      _startDurationTimer();

      // For ZegoCloud, create preview widget
      if (_providerManager.currentProvider == StreamProvider.zegocloud) {
        _zegoPreviewWidget = await _providerManager.getPreviewWidgetAsync();
      }

      setState(() {
        _isLoading = false;
        _isLive = true;
      });

      _showInfo('Live with ${_providerManager.getProviderName()}');
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
            child:
                const Text('End Stream', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await _providerManager.leaveStream();
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
    await _providerManager.toggleMute();
    setState(() {});
  }

  /// Toggle camera
  Future<void> _toggleCamera() async {
    await _providerManager.toggleCamera();
    setState(() {});
  }

  /// Switch camera
  Future<void> _switchCamera() async {
    await _providerManager.switchCamera();
    setState(() {});
  }

  /// Change stream quality
  Future<void> _changeQuality() async {
    final quality = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stream Quality'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['low', 'medium', 'high', 'ultra'].map((q) {
            return ListTile(
              title: Text(q.toUpperCase()),
              subtitle: Text(_providerManager.getQualityDescription(q)),
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
      await _providerManager.setStreamQuality(quality);
      setState(() => _currentQuality = quality);
      _showInfo('Quality changed to $quality');
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
          // Video View (provider-specific)
          Center(
            child: _buildVideoView(),
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

  Widget _buildVideoView() {
    if (!_isLive) {
      return Container(color: Colors.black);
    }

    // For Agora
    if (_providerManager.currentProvider == StreamProvider.agora) {
      final engine = _providerManager.agoraManager.engine;
      if (engine != null) {
        return AgoraVideoView(
          controller: VideoViewController(
            rtcEngine: engine,
            canvas: const VideoCanvas(uid: 0),
          ),
        );
      }
    }

    // For ZegoCloud
    else if (_providerManager.currentProvider == StreamProvider.zegocloud) {
      if (_zegoPreviewWidget != null) {
        return _zegoPreviewWidget!;
      }
    }

    return Container(color: Colors.black);
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

          // Provider badge
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            borderRadius: BorderRadius.circular(20),
            child: Text(
              _providerManager.getProviderName(),
              style: const TextStyle(color: Colors.white70, fontSize: 11),
            ),
          ),
          const SizedBox(width: 12),

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
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
          // Camera toggle
          _buildControlButton(
            icon: Iconsax.camera_slash,
            isActive: !_providerManager.isCameraOff,
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
            icon: _providerManager.isMuted
                ? Iconsax.microphone_slash
                : Iconsax.microphone,
            isActive: !_providerManager.isMuted,
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
