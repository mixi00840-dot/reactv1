import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/premium_button.dart';
import '../providers/camera_provider.dart';

/// Video Trim Editor - TikTok-style video trimming
class VideoTrimEditor extends StatefulWidget {
  final String videoPath;
  final Function(String trimmedPath)? onTrimmed;

  const VideoTrimEditor({
    super.key,
    required this.videoPath,
    this.onTrimmed,
  });

  @override
  State<VideoTrimEditor> createState() => _VideoTrimEditorState();
}

class _VideoTrimEditorState extends State<VideoTrimEditor> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  double _startTime = 0.0;
  double _endTime = 0.0;
  bool _isTrimming = false;
  
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    _controller = VideoPlayerController.file(File(widget.videoPath));
    await _controller!.initialize();
    
    setState(() {
      _isInitialized = true;
      _endTime = _controller!.value.duration.inMilliseconds.toDouble();
    });
    
    _controller!.addListener(_onVideoUpdate);
  }

  void _onVideoUpdate() {
    if (_controller!.value.position.inMilliseconds >= _endTime) {
      _controller!.pause();
      _controller!.seekTo(Duration(milliseconds: _startTime.toInt()));
    }
    setState(() {});
  }

  Future<void> _trimVideo() async {
    if (_endTime - _startTime < 1000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Video must be at least 1 second long'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isTrimming = true;
    });

    try {
      // First, upload video to get URL
      // Then call trim API
      final result = await _apiService.trimVideo(
        videoUrl: widget.videoPath, // In production, this would be the uploaded URL
        startTime: _startTime / 1000.0, // Convert to seconds
        endTime: _endTime / 1000.0,
      );

      if (mounted) {
        setState(() {
          _isTrimming = false;
        });

        if (widget.onTrimmed != null && result['url'] != null) {
          widget.onTrimmed!(result['url']);
        }

        Navigator.pop(context, result['url']);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isTrimming = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to trim video: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String _formatDuration(double milliseconds) {
    final duration = Duration(milliseconds: milliseconds.toInt());
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final totalDuration = _controller!.value.duration.inMilliseconds.toDouble();
    final currentPosition = _controller!.value.position.inMilliseconds.toDouble();

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Trim Video',
          style: AppTypography.headlineSmall(context).copyWith(
            color: Colors.white,
          ),
        ),
        actions: [
          if (_isTrimming)
            const Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 2,
              ),
            )
          else
            TextButton(
              onPressed: _trimVideo,
              child: Text(
                'Done',
                style: AppTypography.button(context).copyWith(
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Video Preview
          Expanded(
            child: Center(
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),
            ),
          ),

          // Trim Controls
          Container(
            padding: AppSpacing.screenPadding(),
            color: Colors.black,
            child: Column(
              children: [
                // Time Display
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDuration(_startTime),
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      'Duration: ${_formatDuration(_endTime - _startTime)}',
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      _formatDuration(_endTime),
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Trim Slider
                _buildTrimSlider(totalDuration, currentPosition),

                const SizedBox(height: 16),

                // Playback Controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: Icon(
                        _controller!.value.isPlaying
                            ? Icons.pause
                            : Icons.play_arrow,
                        color: Colors.white,
                      ),
                      onPressed: () {
                        if (_controller!.value.isPlaying) {
                          _controller!.pause();
                        } else {
                          _controller!.play();
                          _controller!.seekTo(Duration(milliseconds: _startTime.toInt()));
                        }
                        setState(() {});
                      },
                    ),
                    const SizedBox(width: 24),
                    Text(
                      _formatDuration(currentPosition),
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrimSlider(double totalDuration, double currentPosition) {
    return Column(
      children: [
        // Progress Bar
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            trackHeight: 4,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
            overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
          ),
          child: Stack(
            children: [
              // Background track
              Slider(
                value: currentPosition,
                min: 0,
                max: totalDuration,
                onChanged: (value) {
                  _controller!.seekTo(Duration(milliseconds: value.toInt()));
                  setState(() {});
                },
                activeColor: Colors.transparent,
                inactiveColor: Colors.white.withOpacity(0.3),
              ),
              // Trimmed section
              Positioned(
                left: (_startTime / totalDuration) * MediaQuery.of(context).size.width - 16,
                right: ((totalDuration - _endTime) / totalDuration) * MediaQuery.of(context).size.width - 16,
                top: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Trim Handles
        Row(
          children: [
            // Start Handle
            Expanded(
              child: GestureDetector(
                onHorizontalDragUpdate: (details) {
                  setState(() {
                    _startTime = (_startTime + details.delta.dx * totalDuration / MediaQuery.of(context).size.width)
                        .clamp(0.0, _endTime - 1000);
                    _controller!.seekTo(Duration(milliseconds: _startTime.toInt()));
                  });
                },
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      'Start',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // End Handle
            Expanded(
              child: GestureDetector(
                onHorizontalDragUpdate: (details) {
                  setState(() {
                    _endTime = (_endTime + details.delta.dx * totalDuration / MediaQuery.of(context).size.width)
                        .clamp(_startTime + 1000, totalDuration);
                  });
                },
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      'End',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

