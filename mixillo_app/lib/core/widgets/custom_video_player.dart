import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';

/// Custom video player widget with TikTok-style controls
/// Features: Auto-play, tap to pause, swipe seek, mute toggle
class CustomVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool autoPlay;
  final bool looping;
  final bool showControls;
  final Function(bool isPlaying)? onPlayStateChanged;
  final VoidCallback? onDoubleTap; // For like animation

  const CustomVideoPlayer({
    super.key,
    required this.videoUrl,
    this.autoPlay = true,
    this.looping = true,
    this.showControls = false,
    this.onPlayStateChanged,
    this.onDoubleTap,
  });

  @override
  State<CustomVideoPlayer> createState() => _CustomVideoPlayerState();
}

class _CustomVideoPlayerState extends State<CustomVideoPlayer> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _showControls = false;
  bool _isMuted = false;
  Timer? _hideControlsTimer;
  
  // For progress tracking
  double _currentPosition = 0;
  double _totalDuration = 1;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void didUpdateWidget(CustomVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _controller.dispose();
      _initializeVideo();
    }
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    try {
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
      );

      await _controller.initialize();

      if (!mounted) return;

      setState(() {
        _isInitialized = true;
        _hasError = false;
        _totalDuration = _controller.value.duration.inMilliseconds.toDouble();
      });

      // Setup looping
      if (widget.looping) {
        _controller.setLooping(true);
      }

      // Auto-play
      if (widget.autoPlay) {
        await _controller.play();
        widget.onPlayStateChanged?.call(true);
      }

      // Listen to position updates
      _controller.addListener(_videoListener);
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
      }
    }
  }

  void _videoListener() {
    if (!mounted || !_controller.value.isInitialized) return;

    final position = _controller.value.position.inMilliseconds.toDouble();
    if (position != _currentPosition) {
      setState(() {
        _currentPosition = position;
      });
    }
  }

  void _togglePlayPause() {
    if (_controller.value.isPlaying) {
      _controller.pause();
      widget.onPlayStateChanged?.call(false);
    } else {
      _controller.play();
      widget.onPlayStateChanged?.call(true);
    }
    setState(() {});
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
      _controller.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  void _showControlsTemporarily() {
    setState(() {
      _showControls = true;
    });

    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _showControls = false;
        });
      }
    });
  }

  void _seek(double milliseconds) {
    final duration = Duration(milliseconds: milliseconds.toInt());
    _controller.seekTo(duration);
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: Key(widget.videoUrl),
      onVisibilityChanged: (info) {
        if (!_isInitialized) return;

        // Auto-play when 50% visible
        if (info.visibleFraction >= 0.5) {
          if (!_controller.value.isPlaying && widget.autoPlay) {
            _controller.play();
            widget.onPlayStateChanged?.call(true);
          }
        } else {
          // Pause when not visible
          if (_controller.value.isPlaying) {
            _controller.pause();
            widget.onPlayStateChanged?.call(false);
          }
        }
      },
      child: Container(
        color: Colors.black,
        child: _hasError
            ? _buildErrorWidget()
            : !_isInitialized
                ? _buildLoadingWidget()
                : _buildVideoPlayer(),
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return const Center(
      child: CircularProgressIndicator(
        color: Colors.white,
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.white,
            size: 48,
          ),
          const SizedBox(height: 16),
          const Text(
            'Failed to load video',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _hasError = false;
              });
              _initializeVideo();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPlayer() {
    return GestureDetector(
      onTap: () {
        if (widget.showControls) {
          _togglePlayPause();
          _showControlsTemporarily();
        } else {
          _togglePlayPause();
        }
      },
      onDoubleTap: widget.onDoubleTap,
      onVerticalDragUpdate: widget.showControls
          ? null
          : (details) {
              // Swipe up/down for seek (disabled for feed)
            },
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller.value.size.width,
              height: _controller.value.size.height,
              child: VideoPlayer(_controller),
            ),
          ),

          // Play/Pause indicator (center)
          if (_showControls || !_controller.value.isPlaying)
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 50,
                ),
              ),
            ),

          // Mute button (top right)
          Positioned(
            top: 40,
            right: 16,
            child: GestureDetector(
              onTap: _toggleMute,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),

          // Progress bar (bottom)
          if (widget.showControls && _showControls)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildProgressBar(),
            ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      color: Colors.black.withValues(alpha: 0.3),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Text(
            _formatDuration(Duration(milliseconds: _currentPosition.toInt())),
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SliderTheme(
              data: SliderThemeData(
                trackHeight: 2,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
              ),
              child: Slider(
                value: _currentPosition.clamp(0, _totalDuration),
                min: 0,
                max: _totalDuration,
                activeColor: Colors.white,
                inactiveColor: Colors.white.withValues(alpha: 0.3),
                onChanged: (value) {
                  setState(() {
                    _currentPosition = value;
                  });
                },
                onChangeEnd: (value) {
                  _seek(value);
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _formatDuration(Duration(milliseconds: _totalDuration.toInt())),
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
