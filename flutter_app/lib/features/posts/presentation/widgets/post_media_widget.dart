import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../../../../core/theme/app_colors.dart';

/// Widget to display post media (images or video) with autoplay support
class PostMediaWidget extends StatefulWidget {
  final List<String> mediaUrls;
  final bool isVideo;
  final String? thumbnailUrl;
  final int? duration;
  final double aspectRatio;
  final bool autoplay;

  const PostMediaWidget({
    super.key,
    required this.mediaUrls,
    required this.isVideo,
    this.thumbnailUrl,
    this.duration,
    this.aspectRatio = 4 / 5,
    this.autoplay = true,
  });

  @override
  State<PostMediaWidget> createState() => _PostMediaWidgetState();
}

class _PostMediaWidgetState extends State<PostMediaWidget> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  int _currentImageIndex = 0;
  bool _isVideoInitialized = false;
  bool _isMuted = false;
  bool _hasError = false;
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    if (widget.isVideo && widget.mediaUrls.isNotEmpty) {
      _initializeVideo();
    }
  }

  Future<void> _initializeVideo() async {
    try {
      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(widget.mediaUrls.first),
      );

      await _videoController!.initialize();

      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        aspectRatio: widget.aspectRatio,
        autoPlay: false, // We'll control this with visibility detector
        looping: true,
        showControls: false,
        allowFullScreen: false,
        allowMuting: true,
        allowPlaybackSpeedChanging: false,
      );

      if (mounted) {
        setState(() {
          _isVideoInitialized = true;
          _hasError = false;
        });

        // Auto-play if visible
        if (_isVisible && widget.autoplay) {
          _videoController?.play();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _isVideoInitialized = false;
        });
      }
      debugPrint('Error initializing video: $e');
    }
  }

  void _handleVisibilityChanged(VisibilityInfo info) {
    _isVisible = info.visibleFraction >= 0.6;

    if (_isVisible && widget.autoplay && _isVideoInitialized) {
      _videoController?.play();
    } else if (!_isVisible && _isVideoInitialized) {
      _videoController?.pause();
    }
  }

  void _toggleMute() {
    if (_videoController != null) {
      setState(() {
        _isMuted = !_isMuted;
        _videoController!.setVolume(_isMuted ? 0 : 1);
      });
    }
  }

  void _togglePlayPause() {
    if (_videoController != null) {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
      } else {
        _videoController!.play();
      }
      setState(() {});
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isVideo) {
      return _buildVideoPlayer();
    } else {
      return _buildImageCarousel();
    }
  }

  Widget _buildVideoPlayer() {
    return VisibilityDetector(
      key: Key('video_${widget.mediaUrls.first}'),
      onVisibilityChanged: _handleVisibilityChanged,
      child: AspectRatio(
        aspectRatio: widget.aspectRatio,
        child: Container(
          color: Colors.black,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Video player or thumbnail
              if (_isVideoInitialized && !_hasError)
                GestureDetector(
                  onTap: _togglePlayPause,
                  onLongPress: _toggleMute,
                  child: Chewie(controller: _chewieController!),
                )
              else if (_hasError && widget.thumbnailUrl != null)
                _buildThumbnail()
              else if (!_isVideoInitialized)
                _buildLoadingState(),

              // Mute indicator
              if (_isVideoInitialized && !_hasError)
                Positioned(
                  top: 12,
                  right: 12,
                  child: GestureDetector(
                    onTap: _toggleMute,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isMuted ? Icons.volume_off : Icons.volume_up,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ),

              // Duration badge
              if (widget.duration != null)
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _formatDuration(widget.duration!),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

              // Error overlay
              if (_hasError)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 48,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Video unavailable',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThumbnail() {
    return CachedNetworkImage(
      imageUrl: widget.thumbnailUrl!,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: AppColors.glassMedium,
        child: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation(AppColors.primary),
          ),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        color: AppColors.glassMedium,
        child: const Icon(Icons.error, color: AppColors.error),
      ),
    );
  }

  Widget _buildLoadingState() {
    if (widget.thumbnailUrl != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          _buildThumbnail(),
          Container(
            color: Colors.black.withOpacity(0.3),
            child: const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(Colors.white),
              ),
            ),
          ),
        ],
      );
    }

    return Container(
      color: AppColors.glassMedium,
      child: const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation(AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildImageCarousel() {
    return AspectRatio(
      aspectRatio: widget.aspectRatio,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: widget.mediaUrls.length,
            onPageChanged: (index) {
              setState(() {
                _currentImageIndex = index;
              });
            },
            itemBuilder: (context, index) {
              return CachedNetworkImage(
                imageUrl: widget.mediaUrls[index],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.glassMedium,
                  child: const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation(AppColors.primary),
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.glassMedium,
                  child: const Icon(Icons.error, color: AppColors.error),
                ),
              );
            },
          ),

          // Page indicators
          if (widget.mediaUrls.length > 1)
            Positioned(
              top: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.mediaUrls.length,
                  (index) => Container(
                    width: index == _currentImageIndex ? 8 : 6,
                    height: index == _currentImageIndex ? 8 : 6,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: index == _currentImageIndex
                          ? Colors.white
                          : Colors.white.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    final minutes = duration.inMinutes;
    final secs = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }
}
