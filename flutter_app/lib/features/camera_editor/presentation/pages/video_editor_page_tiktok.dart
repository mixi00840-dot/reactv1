import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart' hide Caption;
import 'package:video_thumbnail/video_thumbnail.dart' as vt;
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import '../../models/video_editing_models.dart';
import '../../providers/video_editor_provider.dart';
import '../../services/ffmpeg_video_processor.dart';
import '../widgets/editor/editor_top_bar.dart';
import '../widgets/editor/editor_bottom_toolbar.dart';
import '../widgets/editor/editor_timeline_slim.dart';
import '../widgets/editor/text_editor_overlay.dart';
import '../widgets/editor/sticker_selector_overlay.dart';
import '../widgets/video_effects_picker.dart';
import '../widgets/audio_mixer_panel.dart';
import '../widgets/caption_editor.dart';
import '../../../posts/presentation/pages/post_creation_page.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/services/video_effects_service.dart';
import '../../../../../core/services/audio_mixer_service.dart';
import '../../../../../core/services/caption_service.dart';

/// TikTok-style video editor page
/// Clean minimal UI with tap-to-play, horizontal tools, transparent overlays
class VideoEditorPageTikTok extends ConsumerStatefulWidget {
  final List<String> segmentPaths;
  final Duration totalDuration;
  final String? selectedFilter;
  final double speed;

  const VideoEditorPageTikTok({
    super.key,
    required this.segmentPaths,
    required this.totalDuration,
    this.selectedFilter,
    this.speed = 1.0,
  });

  @override
  ConsumerState<VideoEditorPageTikTok> createState() => _VideoEditorPageTikTokState();
}

class _VideoEditorPageTikTokState extends ConsumerState<VideoEditorPageTikTok> {
  VideoPlayerController? _videoController;
  bool _isInitializing = true;
  String? _stitchedPreviewPath;
  List<Uint8List> _thumbnails = [];
  String? _selectedTool;
  bool _showTextEditor = false;
  bool _showStickerSelector = false;
  VideoEffect _selectedEffect = VideoEffect.none;
  List<AudioTrack> _audioTracks = [];
  List<Caption> _captions = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializeEditor();
      }
    });
  }

  @override
  void dispose() {
    _videoController?.dispose();
    // Clean up stitched preview
    if (_stitchedPreviewPath != null) {
      try {
        File(_stitchedPreviewPath!).deleteSync();
      } catch (_) {}
    }
    super.dispose();
  }

  Future<void> _initializeEditor() async {
    try {
      // Initialize video editor project
      ref.read(videoEditorProvider.notifier).initializeProject(
            segmentPaths: widget.segmentPaths,
            totalDuration: widget.totalDuration,
            selectedFilter: widget.selectedFilter,
            speed: widget.speed,
          );

      // Stitch segments for preview
      if (widget.segmentPaths.length > 1) {
        await _stitchSegmentsForPreview();
      } else {
        await _setupVideoPlayer(widget.segmentPaths.first);
      }

      // Generate thumbnails
      await _generateThumbnails();

      if (mounted) {
        setState(() => _isInitializing = false);
        
        // Auto-play on load (TikTok behavior)
        _videoController?.play();
      }
    } catch (e) {
      debugPrint('❌ Editor initialization error: $e');
      if (mounted) {
        setState(() => _isInitializing = false);
        _showError('Failed to initialize editor');
      }
    }
  }

  Future<void> _stitchSegmentsForPreview() async {
    try {
      final directory = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        directory.path,
        'preview_stitched_$timestamp.mp4',
      );

      final result = await FFmpegVideoProcessor.stitchSegments(
        segmentPaths: widget.segmentPaths,
        outputPath: outputPath,
      );

      if (result != null && await File(result).exists()) {
        _stitchedPreviewPath = result;
        await _setupVideoPlayer(result);
      }
    } catch (e) {
      debugPrint('❌ Stitch preview error: $e');
    }
  }

  Future<void> _setupVideoPlayer(String videoPath) async {
    _videoController = VideoPlayerController.file(File(videoPath));
    await _videoController!.initialize();
    
    // Set looping (TikTok behavior)
    await _videoController!.setLooping(true);
    
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _generateThumbnails() async {
    try {
      final videoPath = _stitchedPreviewPath ?? widget.segmentPaths.first;
      final thumbnails = <Uint8List>[];

      // Generate 10 thumbnails
      for (int i = 0; i < 10; i++) {
        final timeMs = (widget.totalDuration.inMilliseconds * (i / 10)).toInt();
        final uint8list = await vt.VideoThumbnail.thumbnailData(
          video: videoPath,
          imageFormat: vt.ImageFormat.JPEG,
          maxWidth: 128,
          quality: 75,
          timeMs: timeMs,
        );

        if (uint8list != null) {
          thumbnails.add(uint8list);
        }
      }

      if (mounted) {
        setState(() => _thumbnails = thumbnails);
      }
    } catch (e) {
      debugPrint('❌ Thumbnail generation error: $e');
    }
  }

  void _togglePlayPause() {
    if (_videoController == null) return;

    if (_videoController!.value.isPlaying) {
      _videoController!.pause();
    } else {
      _videoController!.play();
    }
    setState(() {});
  }

  void _onToolSelected(String toolId) {
    setState(() {
      _selectedTool = toolId;
      _showTextEditor = false;
      _showStickerSelector = false;
    });

    switch (toolId) {
      case 'adjust':
        _showInfo('Drag timeline handles to trim video');
        break;
      case 'text':
        setState(() => _showTextEditor = true);
        break;
      case 'stickers':
        setState(() => _showStickerSelector = true);
        break;
      case 'effects':
        _showEffectsPicker();
        break;
      case 'filters':
        _showFilterSelector();
        break;
      case 'audio':
        _showAudioMixer();
        break;
      case 'speed':
        _showSpeedSelector();
        break;
      case 'captions':
        _showCaptionGenerator();
        break;
    }
  }

  void _showFilterSelector() {
    final filters = ['Normal', 'Vivid', 'Warm', 'Cool', 'B&W', 'Vintage', 'Cyberpunk'];
    final currentFilter = ref.read(videoEditorProvider)?.selectedFilter;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 16),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text(
              'Filters',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            ...filters.map((filter) => ListTile(
                  title: Text(
                    filter,
                    style: const TextStyle(color: Colors.white),
                  ),
                  trailing: currentFilter == filter
                      ? Icon(Icons.check, color: AppColors.primary)
                      : null,
                  onTap: () {
                    ref.read(videoEditorProvider.notifier).setFilter(
                          filter == 'Normal' ? null : filter,
                        );
                    Navigator.of(context).pop();
                  },
                )),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
          ],
        ),
      ),
    );
  }

  void _showEffectsPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => VideoEffectsPicker(
        currentEffect: _selectedEffect,
        onEffectSelected: (effect) async {
          setState(() {
            _selectedEffect = effect;
          });

          if (effect != VideoEffect.none) {
            _showInfo('Applying effect... This may take a moment');
            
            // Apply effect will be done at export time for better performance
            // For now, just store the selected effect
            ref.read(videoEditorProvider.notifier).setEffect(effect.name);
            
            _showInfo('Effect selected: ${effect.name}');
          } else {
            ref.read(videoEditorProvider.notifier).setEffect(null);
            _showInfo('Effect removed');
          }
        },
      ),
    );
  }

  void _showAudioMixer() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => AudioMixerPanel(
        videoPath: _stitchedPreviewPath ?? widget.segmentPaths.first,
        videoDuration: widget.totalDuration,
        audioTracks: _audioTracks,
        onTracksChanged: (tracks) {
          setState(() {
            _audioTracks = tracks;
          });
          _showInfo('Audio tracks updated');
        },
        onAddMusic: () {
          Navigator.pop(context);
          _addMusicTrack();
        },
        onRecordVoiceover: () {
          Navigator.pop(context);
          _recordVoiceover();
        },
      ),
    );
  }

  Future<void> _addMusicTrack() async {
    // TODO: Implement file picker for music
    _showInfo('Music selection coming soon - integrate with sound library');
  }

  Future<void> _recordVoiceover() async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => _VoiceoverRecordingDialog(
        duration: widget.totalDuration,
      ),
    );

    if (result == true) {
      _showInfo('Voiceover recorded successfully');
    }
  }

  Future<void> _showCaptionGenerator() async {
    // Show language selection dialog
    final languages = await CaptionService.getSupportedLanguages();
    
    final selectedLanguage = await showDialog<CaptionLanguage>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('Select Language', style: TextStyle(color: Colors.white)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: languages.length,
            itemBuilder: (context, index) {
              final lang = languages[index];
              return ListTile(
                leading: Text(lang.flag, style: const TextStyle(fontSize: 32)),
                title: Text(lang.name, style: const TextStyle(color: Colors.white)),
                onTap: () => Navigator.pop(context, lang),
              );
            },
          ),
        ),
      ),
    );

    if (selectedLanguage == null) return;

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.purple),
            const SizedBox(height: 16),
            const Text(
              'Generating captions...',
              style: TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Using ${selectedLanguage.name}',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ],
        ),
      ),
    );

    try {
      // Use stitched preview or first segment
      final videoPath = _stitchedPreviewPath ?? widget.segmentPaths.first;
      
      final result = await CaptionService.generateCaptions(
        videoPath: videoPath,
        languageCode: selectedLanguage.code,
        onProgress: (progress) {
          debugPrint('Caption generation progress: ${(progress * 100).toStringAsFixed(0)}%');
        },
      );

      Navigator.pop(context); // Close loading dialog

      if (result['success'] == true) {
        final captions = result['captions'] as List<Caption>;
        
        if (captions.isEmpty) {
          _showInfo('No speech detected in video');
          return;
        }

        // Navigate to caption editor
        final editedCaptions = await Navigator.push<List<Caption>>(
          context,
          MaterialPageRoute(
            builder: (context) => CaptionEditor(
              videoPath: videoPath,
              videoDuration: widget.totalDuration.inSeconds.toDouble(),
              initialCaptions: captions,
              onCaptionsChanged: (updatedCaptions) {
                setState(() {
                  _captions = updatedCaptions;
                });
              },
            ),
          ),
        );

        if (editedCaptions != null && editedCaptions.isNotEmpty) {
          setState(() {
            _captions = editedCaptions;
          });
          _showInfo('${editedCaptions.length} captions ready');
          
          // Update provider with captions
          ref.read(videoEditorProvider.notifier).setCaptions(_captions);
        }
      } else {
        _showInfo('Caption generation failed');
      }
    } catch (e) {
      Navigator.pop(context); // Close loading dialog
      debugPrint('❌ Caption generation error: $e');
      _showError('Failed to generate captions: ${e.toString()}');
    }
  }

  void _showSpeedSelector() {
    final speeds = [0.3, 0.5, 1.0, 2.0, 3.0];
    final currentSpeed = ref.read(videoEditorProvider)?.speed ?? 1.0;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 16),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text(
              'Speed',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            ...speeds.map((speed) => ListTile(
                  title: Text(
                    '${speed}x',
                    style: const TextStyle(color: Colors.white),
                  ),
                  trailing: currentSpeed == speed
                      ? Icon(Icons.check, color: AppColors.primary)
                      : null,
                  onTap: () {
                    ref.read(videoEditorProvider.notifier).setSpeed(speed);
                    Navigator.of(context).pop();
                  },
                )),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
          ],
        ),
      ),
    );
  }

  void _onTextEditorDone(String text, Color color, double fontSize, FontWeight weight) {
    // Add text overlay to video
    ref.read(videoEditorProvider.notifier).addTextOverlay(
          text: text,
          position: const Offset(0.5, 0.5), // Center
        );
    
    setState(() => _showTextEditor = false);
    _showInfo('Text added');
  }

  void _onStickerSelected(String stickerId) {
    // Add sticker to video (stickerId is actually emoji content)
    ref.read(videoEditorProvider.notifier).addStickerOverlay(
          stickerType: 'emoji',
          content: stickerId,
          position: const Offset(0.5, 0.5), // Center
        );
    
    setState(() => _showStickerSelector = false);
    _showInfo('Sticker added');
  }

  Future<void> _onNext() async {
    // Show export progress
    _showExportDialog();

    try {
      // Export video
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(
        directory.path,
        'mixillo_videos',
        'final_$timestamp.mp4',
      );

      await Directory(path.dirname(outputPath)).create(recursive: true);

      final result = await ref.read(videoEditorProvider.notifier).exportVideo(
            outputPath: outputPath,
            onProgress: (progress) {
              // Update progress
            },
          );

      if (!mounted) return;
      Navigator.of(context).pop(); // Close progress dialog

      if (result != null) {
        // Get video duration for post creation
        final videoFile = File(result);
        VideoPlayerController? tempController;
        Duration? videoDuration;
        
        try {
          tempController = VideoPlayerController.file(videoFile);
          await tempController.initialize();
          videoDuration = tempController.value.duration;
        } catch (e) {
          debugPrint('Error getting video duration: $e');
        } finally {
          tempController?.dispose();
        }

        // Navigate to unified post creation page (TikTok flow)
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => PostCreationPage(
              mediaPath: result,
              mediaType: 'video',
              videoDuration: videoDuration,
            ),
          ),
        );
      } else {
        _showError('Export failed');
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        _showError('Export error: $e');
      }
    }
  }

  void _showExportDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'Processing video...',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  void _showInfo(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.surface,
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(videoEditorProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: _isInitializing
          ? const Center(
              child: CircularProgressIndicator(color: Colors.white),
            )
          : Stack(
              fit: StackFit.expand,
              children: [
                // Video Player (Layer 0 - Full screen, tap to play)
                GestureDetector(
                  onTap: _togglePlayPause,
                  child: Center(
                    child: _videoController != null && _videoController!.value.isInitialized
                        ? AspectRatio(
                            aspectRatio: _videoController!.value.aspectRatio,
                            child: VideoPlayer(_videoController!),
                          )
                        : const Icon(Icons.error, color: Colors.white, size: 48),
                  ),
                ),

                // Text/Sticker Overlays (Layer 1)
                if (project != null)
                  Positioned.fill(
                    child: _buildOverlayPreview(project),
                  ),

                // UI Controls (Layer 2)
                SafeArea(
                  child: Stack(
                    children: [
                      // Top Bar
                      Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        child: EditorTopBar(
                          onBack: () => Navigator.of(context).pop(),
                          onNext: _onNext,
                        ),
                      ),

                      // Timeline (100px from bottom)
                      Positioned(
                        bottom: 100,
                        left: 0,
                        right: 0,
                        child: EditorTimelineSlim(
                          totalDuration: widget.totalDuration,
                          currentPosition: _videoController?.value.position ?? Duration.zero,
                          trimStart: project?.trimStart ?? Duration.zero,
                          trimEnd: project?.trimEnd ?? widget.totalDuration,
                          thumbnails: _thumbnails,
                        ),
                      ),

                      // Bottom Toolbar (50px from bottom)
                      Positioned(
                        bottom: 20,
                        left: 0,
                        right: 0,
                        child: EditorBottomToolbar(
                          selectedTool: _selectedTool,
                          onToolSelected: _onToolSelected,
                        ),
                      ),
                    ],
                  ),
                ),

                // Text Editor Overlay (Layer 3 - if open)
                if (_showTextEditor)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: TextEditorOverlay(
                      onDone: (text, color, fontSize, weight) {
                        _onTextEditorDone(text, color, fontSize, weight);
                      },
                      onCancel: () {
                        setState(() => _showTextEditor = false);
                      },
                    ),
                  ),

                // Sticker Selector Overlay (Layer 3 - if open)
                if (_showStickerSelector)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: StickerSelectorOverlay(
                      onStickerSelected: _onStickerSelected,
                      onClose: () {
                        setState(() => _showStickerSelector = false);
                      },
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildOverlayPreview(VideoEditingProject project) {
    final currentTime = _videoController?.value.position ?? Duration.zero;

    // Filter text overlays visible at current time
    final visibleTextOverlays = project.textOverlays.where((overlay) {
      return currentTime >= overlay.startTime && currentTime <= overlay.endTime;
    }).toList();

    // Filter sticker overlays visible at current time
    final visibleStickerOverlays = project.stickerOverlays.where((overlay) {
      return currentTime >= overlay.startTime && currentTime <= overlay.endTime;
    }).toList();

    return Stack(
      children: [
        // Text overlays
        ...visibleTextOverlays.map((overlay) => Positioned(
              left: overlay.position.dx * MediaQuery.of(context).size.width,
              top: overlay.position.dy * MediaQuery.of(context).size.height,
              child: Transform.rotate(
                angle: overlay.rotation,
                child: Transform.scale(
                  scale: overlay.scale,
                  child: Text(
                    overlay.text,
                    style: TextStyle(
                      color: overlay.color,
                      fontSize: overlay.fontSize,
                      fontWeight: overlay.fontWeight,
                      shadows: const [
                        Shadow(
                          color: Colors.black87,
                          blurRadius: 8,
                          offset: Offset(2, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )),

        // Sticker overlays
        ...visibleStickerOverlays.map((overlay) => Positioned(
              left: overlay.position.dx * MediaQuery.of(context).size.width,
              top: overlay.position.dy * MediaQuery.of(context).size.height,
              child: Transform.rotate(
                angle: overlay.rotation,
                child: Transform.scale(
                  scale: overlay.scale,
                  child: Text(
                    overlay.content, // Use content instead of stickerId
                    style: const TextStyle(fontSize: 48),
                  ),
                ),
              ),
            )),
      ],
    );
  }
}

/// Voiceover recording dialog
class _VoiceoverRecordingDialog extends StatefulWidget {
  final Duration duration;

  const _VoiceoverRecordingDialog({required this.duration});

  @override
  State<_VoiceoverRecordingDialog> createState() => _VoiceoverRecordingDialogState();
}

class _VoiceoverRecordingDialogState extends State<_VoiceoverRecordingDialog> {
  bool _isRecording = false;
  Duration _elapsed = Duration.zero;
  String? _recordedPath;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.grey[900],
      title: const Text(
        'Record Voiceover',
        style: TextStyle(color: Colors.white),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _isRecording ? Icons.mic : Icons.mic_none,
            size: 80,
            color: _isRecording ? Colors.red : Colors.grey,
          ),
          const SizedBox(height: 20),
          Text(
            _isRecording
                ? '${_elapsed.inSeconds}s / ${widget.duration.inSeconds}s'
                : 'Tap to start recording',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        if (!_isRecording && _recordedPath == null)
          ElevatedButton(
            onPressed: _startRecording,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Start'),
          ),
        if (_isRecording)
          ElevatedButton(
            onPressed: _stopRecording,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.grey,
            ),
            child: const Text('Stop'),
          ),
        if (_recordedPath != null)
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.pinkAccent,
            ),
            child: const Text('Use Recording'),
          ),
      ],
    );
  }

  Future<void> _startRecording() async {
    setState(() => _isRecording = true);
    
    _recordedPath = await AudioMixerService.recordVoiceover(
      duration: widget.duration,
      onProgress: (elapsed) {
        if (mounted) {
          setState(() => _elapsed = elapsed);
        }
      },
    );

    if (mounted) {
      setState(() => _isRecording = false);
    }
  }

  Future<void> _stopRecording() async {
    await AudioMixerService.stopRecording();
    setState(() => _isRecording = false);
  }

  @override
  void dispose() {
    if (_isRecording) {
      AudioMixerService.stopRecording();
    }
    super.dispose();
  }
}
