import 'dart:io';
import 'dart:typed_data';
import 'package:video_thumbnail/video_thumbnail.dart' as vt;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import '../../models/video_editing_models.dart';
import '../../providers/video_editor_provider.dart';
import '../../providers/audio_editor_provider.dart';
import '../widgets/editor/video_trimmer.dart';
import '../widgets/editor/text_overlay_editor.dart';
import '../widgets/editor/sticker_selector.dart';
import '../widgets/audio/audio_mixer_widget.dart';
import '../../services/ffmpeg_video_processor.dart';

class VideoEditorPage extends ConsumerStatefulWidget {
  final List<String> segmentPaths;
  final Duration totalDuration;
  final String? selectedFilter;
  final double speed;

  const VideoEditorPage({
    super.key,
    required this.segmentPaths,
    required this.totalDuration,
    this.selectedFilter,
    this.speed = 1.0,
  });

  @override
  ConsumerState<VideoEditorPage> createState() => _VideoEditorPageState();
}

class _VideoEditorPageState extends ConsumerState<VideoEditorPage> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _isInitializing = true;
  TextOverlay? _editingTextOverlay;
  String? _selectedStickerId;
  String? _stitchedPreviewPath; // temp stitched file for multi-segment preview
  List<Uint8List> _thumbnails = const [];

  @override
  void initState() {
    super.initState();
    // Defer initialization until after the first frame to avoid StateNotifier errors
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializeEditor();
      }
    });
  }

  Future<void> _initializeEditor() async {
    // Initialize video editor provider
    ref.read(videoEditorProvider.notifier).initializeProject(
          segmentPaths: widget.segmentPaths,
          totalDuration: widget.totalDuration,
          selectedFilter: widget.selectedFilter,
          speed: widget.speed,
        );

    // Initialize video player with first segment
    await _initializeVideoPlayer();
  }

  Future<void> _initializeVideoPlayer() async {
    try {
      // For multi-segment videos, we'll need to stitch them first for preview
      String videoPath;
      if (widget.segmentPaths.length > 1) {
        final tempDir = await getTemporaryDirectory();
        final previewPath = path.join(
          tempDir.path,
          'preview_stitched_${DateTime.now().millisecondsSinceEpoch}.mp4',
        );
        final stitched = await FFmpegVideoProcessor.stitchSegments(
          segmentPaths: widget.segmentPaths,
          outputPath: previewPath,
        );
        if (stitched != null) {
          _stitchedPreviewPath = stitched;
          videoPath = stitched;
        } else {
          // Fallback to first segment if stitching fails
          videoPath = widget.segmentPaths.first;
        }
      } else {
        videoPath = widget.segmentPaths.first;
      }

      _videoController = VideoPlayerController.file(File(videoPath));
      await _videoController!.initialize();

  // Generate timeline thumbnails after we know duration
  await _generateThumbnails(videoPath, _videoController!.value.duration);

      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        autoPlay: false,
        looping: true,
        showControls: false, // We'll use custom controls
        aspectRatio: _videoController!.value.aspectRatio,
      );

      // Listen to playback position for overlay visibility
      _videoController!.addListener(_onPlaybackPositionChanged);

      setState(() {
        _isInitializing = false;
      });
    } catch (e) {
      debugPrint('Error initializing video player: $e');
      setState(() {
        _isInitializing = false;
      });
    }
  }

  Future<void> _generateThumbnails(String videoPath, Duration duration) async {
    try {
      // Number of thumbs based on typical phone width; keep it lightweight
      const int targetCount = 12;
      final int totalMs = duration.inMilliseconds;
      if (totalMs <= 0) return;

      final List<Uint8List> results = [];
      // Lazy import to avoid issues: use video_thumbnail package
      // ignore: avoid_dynamic_calls
      for (int i = 0; i < targetCount; i++) {
        final timeMs = ((i + 0.5) / targetCount * totalMs).toInt().clamp(0, totalMs - 1);
        final bytes = await _createThumbnail(videoPath, timeMs);
        if (bytes != null) {
          results.add(bytes);
        }
      }
      if (mounted) setState(() => _thumbnails = results);
    } catch (e) {
      debugPrint('⚠️ Thumbnail generation failed: $e');
    }
  }

  Future<Uint8List?> _createThumbnail(String videoPath, int timeMs) async {
    try {
      final data = await vt.VideoThumbnail.thumbnailData(
        video: videoPath,
        timeMs: timeMs,
        imageFormat: vt.ImageFormat.PNG,
        quality: 75,
      );
      return data;
    } catch (e) {
      debugPrint('⚠️ Single thumbnail failed: $e');
      return null;
    }
  }

  void _onPlaybackPositionChanged() {
    if (_videoController != null && _videoController!.value.isPlaying) {
      ref.read(playbackPositionProvider.notifier).state =
          _videoController!.value.position;
    }
  }

  @override
  void dispose() {
    // Clean up temporary stitched preview file
    if (_stitchedPreviewPath != null) {
      try {
        File(_stitchedPreviewPath!).deleteSync();
      } catch (_) {}
    }
    _videoController?.removeListener(_onPlaybackPositionChanged);
    _videoController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  void _togglePlayback() {
    if (_videoController != null) {
      if (_videoController!.value.isPlaying) {
        _videoController!.pause();
      } else {
        _videoController!.play();
      }
      setState(() {});
    }
  }

  Future<void> _onExport() async {
    final project = ref.read(videoEditorProvider);
    if (project == null) return;

    // Show export dialog
    final shouldExport = await showDialog<bool>(
      context: context,
      builder: (context) => _ExportDialog(),
    );

    if (shouldExport == true) {
      _performExport(project);
    }
  }

  Future<void> _performExport(VideoEditingProject project) async {
    try {
      // Pause playback during export
      _videoController?.pause();

      // Show progress dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => _ExportProgressDialog(),
      );

      // Generate output path
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        directory.path,
        'mixillo_videos',
        'export_$timestamp.mp4',
      );

      // Ensure directory exists
      await Directory(path.dirname(outputPath)).create(recursive: true);

      // Export video with edits (0-80% progress)
      final videoResult = await ref.read(videoEditorProvider.notifier).exportVideo(
            outputPath: outputPath,
            onProgress: (progress) {
              ref.read(exportProgressProvider.notifier).state = progress * 0.8;
            },
          );

      if (videoResult == null) {
        if (mounted) Navigator.of(context).pop();
        _showErrorDialog('Video export failed. Please try again.');
        return;
      }

      String finalOutputPath = videoResult;

      // Check if audio editing was done (80-100% progress)
      final audioProject = ref.read(audioEditorProvider);
      if (audioProject != null && audioProject.hasAudioEdits) {
        debugPrint('🎵 Processing audio edits...');
        ref.read(exportProgressProvider.notifier).state = 0.85;

        // Generate final output path with audio
        final finalPath = path.join(
          directory.path,
          'mixillo_videos',
          'final_$timestamp.mp4',
        );

        // Process audio and merge with video
        final audioProcessedResult = await ref.read(audioEditorProvider.notifier).processAudio(
              outputVideoPath: finalPath,
              onProgress: (progress) {
                ref.read(exportProgressProvider.notifier).state = 0.85 + (progress * 0.15);
              },
            );

        if (audioProcessedResult != null) {
          finalOutputPath = audioProcessedResult;
          
          // Clean up temporary video file
          try {
            await File(videoResult).delete();
          } catch (e) {
            debugPrint('⚠️ Failed to clean up temp file: $e');
          }
        } else {
          debugPrint('⚠️ Audio processing failed, using video without audio edits');
        }
      }

      // Close progress dialog
      ref.read(exportProgressProvider.notifier).state = 1.0;
      if (mounted) Navigator.of(context).pop();

      // Show success dialog
      _showSuccessDialog(finalOutputPath);
    } catch (e) {
      // Close progress dialog if open
      if (mounted) Navigator.of(context).pop();
      _showErrorDialog('Export error: ${e.toString()}');
    }
  }

  void _showSuccessDialog(String outputPath) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 12),
            Text('Export Complete'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your video has been exported successfully!'),
            const SizedBox(height: 16),
            Text(
              'Saved to:\n$outputPath',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // Return to camera
            },
            child: const Text('Done'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Share video
            },
            child: const Text('Share'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error, color: Colors.red, size: 28),
            SizedBox(width: 12),
            Text('Export Failed'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _onTextOverlayTap(TextOverlay overlay) {
    setState(() {
      _editingTextOverlay = overlay;
      _selectedStickerId = null;
    });
  }

  void _onStickerOverlayTap(StickerOverlay overlay) {
    setState(() {
      _selectedStickerId = overlay.id;
      _editingTextOverlay = null;
    });
  }

  void _closeEditors() {
    setState(() {
      _editingTextOverlay = null;
      _selectedStickerId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(videoEditorProvider);
    final playbackPosition = ref.watch(playbackPositionProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Edit Video',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download, color: Colors.white),
            onPressed: _onExport,
          ),
        ],
      ),
      body: _isInitializing
          ? const Center(
              child: CircularProgressIndicator(color: Colors.white),
            )
          : Stack(
              children: [
                // Video Player
                Center(
                  child: _chewieController != null
                      ? AspectRatio(
                          aspectRatio: _videoController!.value.aspectRatio,
                          child: Chewie(controller: _chewieController!),
                        )
                      : const Icon(Icons.error, color: Colors.white, size: 48),
                ),

                // Overlay Preview Layer
                if (project != null)
                  Positioned.fill(
                    child: _OverlayPreviewLayer(
                      project: project,
                      currentTime: playbackPosition,
                      onTextOverlayTap: _onTextOverlayTap,
                      onStickerOverlayTap: _onStickerOverlayTap,
                      selectedStickerId: _selectedStickerId,
                    ),
                  ),

                // Playback Control
                Positioned(
                  bottom: 200,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: IconButton(
                      icon: Icon(
                        _videoController?.value.isPlaying == true
                            ? Icons.pause_circle_filled
                            : Icons.play_circle_filled,
                        size: 64,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                      onPressed: _togglePlayback,
                    ),
                  ),
                ),

                // Video Trimmer
                if (project != null)
                  Positioned(
                    bottom: 120,
                    left: 16,
                    right: 16,
                    child: VideoTrimmer(
                      totalDuration: project.totalDuration,
                      thumbnails: _thumbnails,
                      onTrimChanged: (start, end) {
                        ref
                            .read(videoEditorProvider.notifier)
                            .setTrimRange(start, end);
                      },
                    ),
                  ),

                // Editor Toolbar
                Positioned(
                  bottom: 16,
                  left: 0,
                  right: 0,
                  child: _EditorToolbar(
                    onFilterTap: () => _showFilterSelector(),
                    onSpeedTap: () => _showSpeedSelector(),
                    onAudioTap: () => _showAudioMixer(),
                  ),
                ),

                // Text Overlay Editor (when editing)
                if (_editingTextOverlay != null)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: TextOverlayEditor(
                      overlay: _editingTextOverlay!,
                      onDelete: _closeEditors,
                    ),
                  ),
              ],
            ),
    );
  }

  void _showFilterSelector() {
    // Since FilterSelector is a standalone widget, we won't use it directly
    // Instead, show a simple list of filters
    final filters = ['None', 'Vivid', 'Warm', 'Cool', 'B&W', 'Vintage'];
    final currentFilter = ref.read(videoEditorProvider)?.selectedFilter;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black87,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select Filter',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...filters.map((filterName) => ListTile(
              title: Text(filterName, style: const TextStyle(color: Colors.white)),
              trailing: currentFilter == filterName
                  ? const Icon(Icons.check, color: Colors.white)
                  : null,
              onTap: () {
                ref.read(videoEditorProvider.notifier).setFilter(
                  filterName == 'None' ? null : filterName
                );
                Navigator.of(context).pop();
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showSpeedSelector() {
    final speeds = [0.3, 0.5, 1.0, 2.0, 3.0];
    final speedLabels = {
      0.3: '0.3x',
      0.5: '0.5x',
      1.0: '1x',
      2.0: '2x',
      3.0: '3x',
    };
    final currentSpeed = ref.read(videoEditorProvider)?.speed ?? 1.0;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black87,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select Speed',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...speeds.map((speed) => ListTile(
              title: Text(
                speedLabels[speed]!,
                style: const TextStyle(color: Colors.white),
              ),
              trailing: currentSpeed == speed
                  ? const Icon(Icons.check, color: Colors.white)
                  : null,
              onTap: () {
                ref.read(videoEditorProvider.notifier).setSpeed(speed);
                Navigator.of(context).pop();
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showAudioMixer() {
    final project = ref.read(videoEditorProvider);
    if (project == null) return;

    // Initialize audio editor with current video
    String videoPath;
    if (project.segmentPaths.length == 1) {
      videoPath = project.segmentPaths.first;
    } else {
      // For multi-segment, use the first segment
      // In a real app, you'd stitch segments first
      videoPath = project.segmentPaths.first;
    }

    ref.read(audioEditorProvider.notifier).initializeProject(
          videoPath: videoPath,
          videoDuration: project.totalDuration,
        );

    // Show audio mixer in a bottom sheet
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white30,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Audio mixer
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: const AudioMixerWidget(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Overlay Preview Layer Widget
class _OverlayPreviewLayer extends StatelessWidget {
  final VideoEditingProject project;
  final Duration currentTime;
  final Function(TextOverlay) onTextOverlayTap;
  final Function(StickerOverlay) onStickerOverlayTap;
  final String? selectedStickerId;

  const _OverlayPreviewLayer({
    required this.project,
    required this.currentTime,
    required this.onTextOverlayTap,
    required this.onStickerOverlayTap,
    this.selectedStickerId,
  });

  @override
  Widget build(BuildContext context) {
    final visibleTextOverlays = project.textOverlays
        .where((overlay) => overlay.isVisibleAt(currentTime))
        .toList();

    final visibleStickerOverlays = project.stickerOverlays
        .where((overlay) => overlay.isVisibleAt(currentTime))
        .toList();

    return Stack(
      children: [
        // Text Overlays
        ...visibleTextOverlays.map((overlay) => Positioned(
              left: overlay.position.dx * MediaQuery.of(context).size.width,
              top: overlay.position.dy * MediaQuery.of(context).size.height,
              child: GestureDetector(
                onTap: () => onTextOverlayTap(overlay),
                child: Transform.rotate(
                  angle: overlay.rotation,
                  child: Transform.scale(
                    scale: overlay.scale,
                    child: Container(
                      padding: overlay.backgroundColor != null
                          ? const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4)
                          : null,
                      decoration: overlay.backgroundColor != null
                          ? BoxDecoration(
                              color: overlay.backgroundColor,
                              borderRadius: BorderRadius.circular(4),
                            )
                          : null,
                      child: Text(
                        overlay.text,
                        style: TextStyle(
                          fontSize: overlay.fontSize,
                          color: overlay.color,
                          fontWeight: overlay.fontWeight,
                        ),
                        textAlign: overlay.textAlign,
                      ),
                    ),
                  ),
                ),
              ),
            )),

        // Sticker Overlays
        ...visibleStickerOverlays.map((overlay) => Positioned(
              left: overlay.position.dx * MediaQuery.of(context).size.width,
              top: overlay.position.dy * MediaQuery.of(context).size.height,
              child: DraggableStickerOverlay(
                overlay: overlay,
                videoSize: MediaQuery.of(context).size,
                onTap: () => onStickerOverlayTap(overlay),
              ),
            )),
      ],
    );
  }
}

// Editor Toolbar Widget
class _EditorToolbar extends StatelessWidget {
  final VoidCallback onFilterTap;
  final VoidCallback onSpeedTap;
  final VoidCallback onAudioTap;

  const _EditorToolbar({
    required this.onFilterTap,
    required this.onSpeedTap,
    required this.onAudioTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      color: Colors.black54,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _ToolbarButton(
            icon: Icons.content_cut,
            label: 'Trim',
            onTap: () {
              // Trimmer is always visible
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Drag handles to trim video'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          AddTextButton(),
          AddStickerButton(),
          _ToolbarButton(
            icon: Icons.audiotrack,
            label: 'Audio',
            onTap: onAudioTap,
          ),
          _ToolbarButton(
            icon: Icons.filter,
            label: 'Filter',
            onTap: onFilterTap,
          ),
          _ToolbarButton(
            icon: Icons.speed,
            label: 'Speed',
            onTap: onSpeedTap,
          ),
        ],
      ),
    );
  }
}

// Toolbar Button Widget
class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ToolbarButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

// Export Dialog Widget
class _ExportDialog extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      title: const Text('Export Video'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Choose export quality:'),
          const SizedBox(height: 16),
          _QualityOption(label: '720p HD', value: '720p'),
          _QualityOption(label: '1080p Full HD', value: '1080p'),
          _QualityOption(label: '4K Ultra HD', value: '4K'),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Export'),
        ),
      ],
    );
  }
}

// Quality Option Widget
class _QualityOption extends StatelessWidget {
  final String label;
  final String value;

  const _QualityOption({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.circle_outlined),
      title: Text(label),
      trailing: const Icon(Icons.check, color: Colors.white70),
      onTap: () {
        // TODO: integrate selection state with provider
      },
    );
  }
}

// Export Progress Dialog Widget
class _ExportProgressDialog extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = ref.watch(exportProgressProvider);

    return AlertDialog(
      title: const Text('Exporting Video'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
          ),
          const SizedBox(height: 16),
          Text(
            '${(progress * 100).toInt()}%',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(_getProgressMessage(progress)),
        ],
      ),
    );
  }

  String _getProgressMessage(double progress) {
    if (progress < 0.2) return 'Stitching segments...';
    if (progress < 0.4) return 'Trimming video...';
    if (progress < 0.7) return 'Applying effects...';
    if (progress < 0.9) return 'Rendering overlays...';
    return 'Finalizing export...';
  }
}
