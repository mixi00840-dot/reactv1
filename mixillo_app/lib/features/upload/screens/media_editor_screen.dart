import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../core/theme/app_colors.dart';
import 'post_details_screen.dart';

class MediaEditorScreen extends StatefulWidget {
  final String mediaPath;
  final bool isVideo;

  const MediaEditorScreen({
    super.key,
    required this.mediaPath,
    required this.isVideo,
  });

  @override
  State<MediaEditorScreen> createState() => _MediaEditorScreenState();
}

class _MediaEditorScreenState extends State<MediaEditorScreen> {
  VideoPlayerController? _videoController;
  bool _isPlaying = false;
  String _selectedFilter = 'None';
  
  final List<String> _filters = [
    'None',
    'Vivid',
    'Warm',
    'Cool',
    'B&W',
    'Vintage',
    'Fade',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.isVideo) {
      _initializeVideo();
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    _videoController = VideoPlayerController.file(File(widget.mediaPath));
    await _videoController!.initialize();
    await _videoController!.setLooping(true);
    setState(() {});
  }

  void _togglePlay() {
    setState(() {
      if (_isPlaying) {
        _videoController?.pause();
      } else {
        _videoController?.play();
      }
      _isPlaying = !_isPlaying;
    });
  }

  void _goToPostDetails() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PostDetailsScreen(
          mediaPath: widget.mediaPath,
          isVideo: widget.isVideo,
          filter: _selectedFilter,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Edit',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: _goToPostDetails,
            child: const Text(
              'Next',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Media Preview
          Expanded(
            child: Center(
              child: widget.isVideo
                  ? (_videoController?.value.isInitialized ?? false)
                      ? Stack(
                          alignment: Alignment.center,
                          children: [
                            AspectRatio(
                              aspectRatio: _videoController!.value.aspectRatio,
                              child: VideoPlayer(_videoController!),
                            ),
                            if (!_isPlaying)
                              IconButton(
                                icon: const Icon(
                                  Icons.play_circle_outline,
                                  color: Colors.white,
                                  size: 64,
                                ),
                                onPressed: _togglePlay,
                              ),
                          ],
                        )
                      : const CircularProgressIndicator(color: AppColors.primary)
                  : Image.file(
                      File(widget.mediaPath),
                      fit: BoxFit.contain,
                    ),
            ),
          ),

          // Editing Tools
          Container(
            color: isDark ? AppColors.darkCard : AppColors.lightCard,
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                // Filters
                SizedBox(
                  height: 100,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _filters.length,
                    itemBuilder: (context, index) {
                      final filter = _filters[index];
                      final isSelected = _selectedFilter == filter;
                      
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedFilter = filter;
                          });
                        },
                        child: Container(
                          width: 70,
                          margin: const EdgeInsets.only(right: 12),
                          child: Column(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : Colors.transparent,
                                    width: 2,
                                  ),
                                  image: DecorationImage(
                                    image: FileImage(File(widget.mediaPath)),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                filter,
                                style: TextStyle(
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark ? Colors.white70 : Colors.black54),
                                  fontSize: 11,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 16),

                // Edit Options
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildEditOption(
                      icon: Icons.music_note,
                      label: 'Sounds',
                      onTap: () {
                        // Add sound
                      },
                    ),
                    _buildEditOption(
                      icon: Icons.text_fields,
                      label: 'Text',
                      onTap: () {
                        // Add text
                      },
                    ),
                    _buildEditOption(
                      icon: Icons.emoji_emotions,
                      label: 'Stickers',
                      onTap: () {
                        // Add stickers
                      },
                    ),
                    if (widget.isVideo)
                      _buildEditOption(
                        icon: Icons.content_cut,
                        label: 'Trim',
                        onTap: () {
                          // Trim video
                        },
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

  Widget _buildEditOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : Colors.black12,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isDark ? Colors.white : Colors.black,
              size: 24,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: isDark ? Colors.white70 : Colors.black54,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
