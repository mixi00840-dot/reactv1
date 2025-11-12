import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:video_thumbnail/video_thumbnail.dart' as vt;
import 'package:path_provider/path_provider.dart';
import '../../../../core/theme/app_colors.dart';

/// Cover selector page for choosing video thumbnail
/// Allows scrubbing through video to select the perfect frame
class CoverSelectorPage extends StatefulWidget {
  final String videoPath;
  final String? currentCoverPath;

  const CoverSelectorPage({
    super.key,
    required this.videoPath,
    this.currentCoverPath,
  });

  @override
  State<CoverSelectorPage> createState() => _CoverSelectorPageState();
}

class _CoverSelectorPageState extends State<CoverSelectorPage> {
  VideoPlayerController? _videoController;
  bool _isInitialized = false;
  List<String> _thumbnails = [];
  bool _isGeneratingThumbnails = true;
  int _selectedThumbnailIndex = 0;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
    _generateThumbnails();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _initializePlayer() async {
    _videoController = VideoPlayerController.file(File(widget.videoPath));
    await _videoController!.initialize();
    setState(() => _isInitialized = true);
  }

  Future<void> _generateThumbnails() async {
    try {
      final directory = await getTemporaryDirectory();
      final thumbnailsDir = Directory('${directory.path}/cover_thumbnails');
      if (!await thumbnailsDir.exists()) {
        await thumbnailsDir.create(recursive: true);
      }

      final thumbnails = <String>[];
      
      // Generate 5 thumbnails at different timestamps
      final duration = _videoController?.value.duration ?? Duration.zero;
      final intervals = [0.0, 0.25, 0.5, 0.75, 0.95];

      for (int i = 0; i < intervals.length; i++) {
        final timeMs = (duration.inMilliseconds * intervals[i]).toInt();
        final thumbnailPath = await vt.VideoThumbnail.thumbnailFile(
          video: widget.videoPath,
          thumbnailPath: thumbnailsDir.path,
          imageFormat: vt.ImageFormat.JPEG,
          maxWidth: 400,
          quality: 90,
          timeMs: timeMs,
        );

        if (thumbnailPath != null) {
          thumbnails.add(thumbnailPath);
        }
      }

      setState(() {
        _thumbnails = thumbnails;
        _isGeneratingThumbnails = false;
      });
    } catch (e) {
      print('❌ Generate thumbnails error: $e');
      setState(() => _isGeneratingThumbnails = false);
    }
  }

  void _onDone() {
    if (_thumbnails.isNotEmpty && _selectedThumbnailIndex < _thumbnails.length) {
      Navigator.of(context).pop(_thumbnails[_selectedThumbnailIndex]);
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Select Cover',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _thumbnails.isNotEmpty ? _onDone : null,
            child: Text(
              'Done',
              style: TextStyle(
                color: _thumbnails.isNotEmpty
                    ? AppColors.primary
                    : AppColors.textDisabled,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Video Preview (scrubber)
          if (_isInitialized)
            Container(
              height: 300,
              color: Colors.black,
              child: Center(
                child: AspectRatio(
                  aspectRatio: _videoController!.value.aspectRatio,
                  child: VideoPlayer(_videoController!),
                ),
              ),
            ),

          // Timeline Scrubber
          if (_isInitialized)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Scrub to select frame',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  VideoProgressIndicator(
                    _videoController!,
                    allowScrubbing: true,
                    colors: VideoProgressColors(
                      playedColor: AppColors.primary,
                      bufferedColor: AppColors.textTertiary,
                      backgroundColor: AppColors.border,
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 24),

          // Auto-generated thumbnails
          if (_isGeneratingThumbnails)
            const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
              ),
            )
          else if (_thumbnails.isNotEmpty)
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Auto-generated options',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.75,
                      ),
                      itemCount: _thumbnails.length,
                      itemBuilder: (context, index) {
                        return _buildThumbnailOption(index);
                      },
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildThumbnailOption(int index) {
    final isSelected = index == _selectedThumbnailIndex;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedThumbnailIndex = index);
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 3 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 12,
                    spreadRadius: 2,
                  ),
                ]
              : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.file(
                File(_thumbnails[index]),
                fit: BoxFit.cover,
              ),
              
              // Selected overlay
              if (isSelected)
                Container(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  child: const Center(
                    child: Icon(
                      Icons.check_circle,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

