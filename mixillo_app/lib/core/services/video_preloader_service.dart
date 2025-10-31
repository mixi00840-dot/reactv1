import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// Video Preloader Service
/// Preloads videos before they are displayed for smooth playback
class VideoPreloaderService {
  static final VideoPreloaderService _instance = VideoPreloaderService._internal();
  factory VideoPreloaderService() => _instance;
  VideoPreloaderService._internal();

  final Map<String, VideoPlayerController> _controllers = {};
  final Map<String, bool> _initializedVideos = {};
  final Set<String> _currentlyPreloading = {};
  
  static const int maxCachedVideos = 5;
  static const int preloadAheadCount = 2; // Preload next 2 videos

  /// Get or create video controller
  Future<VideoPlayerController?> getController(String videoUrl) async {
    if (_controllers.containsKey(videoUrl)) {
      return _controllers[videoUrl];
    }

    return await _initializeController(videoUrl);
  }

  /// Initialize video controller
  Future<VideoPlayerController?> _initializeController(String videoUrl) async {
    if (_currentlyPreloading.contains(videoUrl)) {
      // Wait for ongoing initialization
      await Future.doWhile(() async {
        await Future.delayed(const Duration(milliseconds: 100));
        return _currentlyPreloading.contains(videoUrl);
      });
      return _controllers[videoUrl];
    }

    _currentlyPreloading.add(videoUrl);

    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl));
      
      await controller.initialize();
      await controller.setLooping(true);
      await controller.setVolume(1.0);

      // Clean up old controllers if cache is full
      if (_controllers.length >= maxCachedVideos) {
        _cleanupOldestController();
      }

      _controllers[videoUrl] = controller;
      _initializedVideos[videoUrl] = true;
      
      debugPrint('Video initialized: $videoUrl');
      
      return controller;
    } catch (e) {
      debugPrint('Error initializing video: $e');
      return null;
    } finally {
      _currentlyPreloading.remove(videoUrl);
    }
  }

  /// Preload videos in advance
  Future<void> preloadVideos(List<String> videoUrls, int currentIndex) async {
    // Preload current and next videos
    final videosToPreload = <String>[];
    
    for (int i = 0; i < preloadAheadCount; i++) {
      final index = currentIndex + i;
      if (index < videoUrls.length) {
        videosToPreload.add(videoUrls[index]);
      }
    }

    final futures = videosToPreload.map((url) {
      if (!_controllers.containsKey(url) && !_currentlyPreloading.contains(url)) {
        return _initializeController(url);
      }
      return Future.value(null);
    });

    await Future.wait(futures);
  }

  /// Check if video is ready to play
  bool isVideoReady(String videoUrl) {
    return _initializedVideos[videoUrl] == true &&
        _controllers[videoUrl]?.value.isInitialized == true;
  }

  /// Clean up oldest controller
  void _cleanupOldestController() {
    if (_controllers.isEmpty) return;

    final oldestKey = _controllers.keys.first;
    final controller = _controllers.remove(oldestKey);
    _initializedVideos.remove(oldestKey);
    
    controller?.dispose();
    
    debugPrint('Cleaned up video controller: $oldestKey');
  }

  /// Dispose specific controller
  void disposeController(String videoUrl) {
    final controller = _controllers.remove(videoUrl);
    _initializedVideos.remove(videoUrl);
    controller?.dispose();
    
    debugPrint('Disposed video controller: $videoUrl');
  }

  /// Dispose all controllers
  void disposeAll() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    
    _controllers.clear();
    _initializedVideos.clear();
    _currentlyPreloading.clear();
    
    debugPrint('Disposed all video controllers');
  }

  /// Get cache info
  Map<String, dynamic> getCacheInfo() {
    return {
      'totalCached': _controllers.length,
      'maxCache': maxCachedVideos,
      'initialized': _initializedVideos.length,
      'preloading': _currentlyPreloading.length,
    };
  }
}

/// Preloaded Video Player Widget
class PreloadedVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool autoPlay;
  final bool showControls;
  final VoidCallback? onVideoReady;

  const PreloadedVideoPlayer({
    Key? key,
    required this.videoUrl,
    this.autoPlay = false,
    this.showControls = true,
    this.onVideoReady,
  }) : super(key: key);

  @override
  State<PreloadedVideoPlayer> createState() => _PreloadedVideoPlayerState();
}

class _PreloadedVideoPlayerState extends State<PreloadedVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _setupVideo();
  }

  Future<void> _setupVideo() async {
    try {
      final controller = await VideoPreloaderService().getController(widget.videoUrl);
      
      if (controller == null) {
        setState(() {
          _error = 'Failed to load video';
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _controller = controller;
        _isLoading = false;
      });

      if (widget.autoPlay) {
        await _controller!.play();
      }

      widget.onVideoReady?.call();
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    // Don't dispose controller here - it's managed by the service
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
        ),
      );
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        AspectRatio(
          aspectRatio: _controller!.value.aspectRatio,
          child: VideoPlayer(_controller!),
        ),
        if (widget.showControls) _buildControls(),
      ],
    );
  }

  Widget _buildControls() {
    return GestureDetector(
      onTap: () {
        if (_controller!.value.isPlaying) {
          _controller!.pause();
        } else {
          _controller!.play();
        }
        setState(() {});
      },
      child: Container(
        color: Colors.transparent,
        child: Center(
          child: AnimatedOpacity(
            opacity: _controller!.value.isPlaying ? 0.0 : 1.0,
            duration: const Duration(milliseconds: 200),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.play_arrow,
                size: 48,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
