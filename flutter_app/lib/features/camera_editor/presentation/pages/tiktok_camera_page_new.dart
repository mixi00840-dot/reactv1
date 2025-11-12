import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/camera_recording_state.dart';
import '../../models/camera_mode.dart';
import '../../models/flash_mode.dart';
import '../../providers/camera_recording_provider.dart';
import '../../providers/face_effects_provider.dart';
import '../widgets/camera_ui/top_bar_widget.dart';
import '../widgets/camera_ui/right_side_bar_widget.dart';
import '../widgets/camera_ui/bottom_bar_widget.dart';
import '../widgets/camera_ui/mode_selector_widget.dart';
import '../widgets/camera_ui/recording_indicator_widget.dart';
import '../widgets/camera_ui/zoom_slider_widget.dart';
import '../widgets/camera_ui/camera_preview_widget.dart';
import '../widgets/camera_ui/speed_selector_sheet.dart';
import '../widgets/camera_ui/sound_pill_widget.dart';
import '../widgets/common/countdown_overlay.dart';
import '../widgets/common/segment_indicator.dart';
import '../widgets/face_effects/beauty_selector.dart';
// Replaced legacy immediate-apply filter selector with staged FiltersSheet
import '../widgets/camera_ui/filters_sheet.dart';
import 'video_editor_page_tiktok.dart';
import 'photo_preview_page.dart';
import '../../../sounds/presentation/pages/sound_library_page.dart';
import '../../../sounds/providers/selected_sound_provider.dart';

/// TikTok-style camera page with professional UI and animations
class TikTokCameraPageNew extends ConsumerStatefulWidget {
  const TikTokCameraPageNew({super.key});

  @override
  ConsumerState<TikTokCameraPageNew> createState() =>
      _TikTokCameraPageNewState();
}

class _TikTokCameraPageNewState extends ConsumerState<TikTokCameraPageNew>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isRecording = false;
  Timer? _recordingTimer;
  Timer? _countdownTimer;
  DateTime? _recordingStartTime;
  final _uuid = const Uuid();
  bool _showZoomSlider = false;
  Timer? _zoomSliderTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    _zoomSliderTimer?.cancel();

    // Stop image stream before disposing camera
    if (_cameraController?.value.isStreamingImages ?? false) {
      _cameraController?.stopImageStream().catchError((e) {
        debugPrint('Error stopping image stream during dispose: $e');
      });
    }

    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      if (_cameraController?.value.isStreamingImages ?? false) {
        _cameraController?.stopImageStream().catchError((e) {
          debugPrint('Error stopping image stream: $e');
        });
      }
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        if (mounted) _showError('No cameras available');
        return;
      }

      final recordingState = ref.read(cameraRecordingProvider);
      final cameraIndex = recordingState.isFrontCamera ? 1 : 0;

      if (cameraIndex >= _cameras!.length) {
        if (mounted) _showError('Selected camera not available');
        return;
      }

      await _setupCamera(_cameras![cameraIndex]);
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      if (mounted) _showError('Failed to initialize camera: $e');
    }
  }

  Future<void> _setupCamera(CameraDescription camera) async {
    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await _cameraController!.initialize();
      await _cameraController!.prepareForVideoRecording();

      // Start camera image stream for face detection
      _startImageStream();

      if (mounted) {
        setState(() => _isInitialized = true);
        _applyZoom();
      }
    } catch (e) {
      debugPrint('Error setting up camera: $e');
      if (mounted) _showError('Failed to setup camera: $e');
    }
  }

  void _startImageStream() {
    final faceEffectsState = ref.read(faceEffectsProvider);

    if (!faceEffectsState.isFaceTrackingEnabled &&
        !faceEffectsState.hasBeautyEffects) {
      return;
    }

    _cameraController?.startImageStream((cameraImage) {
      if (cameraImage.planes.isNotEmpty) {
        ref.read(faceEffectsProvider.notifier).processCameraFrame(cameraImage);
      }
    });
  }

  Future<void> _toggleCamera() async {
    final recordingState = ref.read(cameraRecordingProvider);
    if (_isRecording || recordingState.isCountingDown) {
      _showError('Cannot switch camera while recording');
      return;
    }

    ref.read(cameraRecordingProvider.notifier).toggleCamera();
    setState(() => _isInitialized = false);
    await _cameraController?.dispose();
    await _initializeCamera();
  }

  Future<void> _toggleFlash() async {
    final recordingState = ref.read(cameraRecordingProvider);
    if (_isRecording || recordingState.isCountingDown) {
      _showError('Cannot change flash while recording');
      return;
    }

    // Cycle through flash modes
    ref.read(cameraRecordingProvider.notifier).toggleFlash();
    
    // Get new flash mode and apply to camera
    final newFlashMode = ref.read(cameraRecordingProvider).flashMode;
    
    if (_cameraController != null) {
      await _cameraController!.setFlashMode(newFlashMode.toCameraFlashMode());
    }

    // Show feedback
    final modeNames = {
      AppFlashMode.off: 'Flash off',
      AppFlashMode.auto: 'Flash auto',
      AppFlashMode.on: 'Flash on',
    };
    _showInfo(modeNames[newFlashMode] ?? 'Flash updated');
  }

  void _applyZoom() {
    final recordingState = ref.read(cameraRecordingProvider);
    _cameraController?.setZoomLevel(recordingState.zoomLevel);
  }

  void _onZoomChanged(double zoom) {
    ref.read(cameraRecordingProvider.notifier).setZoom(zoom);
    _applyZoom();

    // Show zoom slider and hide after 2 seconds
    setState(() => _showZoomSlider = true);
    _zoomSliderTimer?.cancel();
    _zoomSliderTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) setState(() => _showZoomSlider = false);
    });
  }

  void _onModeChanged(CameraMode mode) {
    if (_isRecording) {
      _showError('Cannot change mode while recording');
      return;
    }

    // Update mode in provider (this will also update maxDuration)
    ref.read(cameraRecordingProvider.notifier).setMode(mode);
    
    // Show feedback
    final modeNames = {
      CameraMode.live: 'Live streaming',
      CameraMode.video15s: '15 second video',
      CameraMode.video60s: '60 second video',
      CameraMode.video10m: '10 minute video',
      CameraMode.photo: 'Photo mode',
    };
    
    _showInfo('Switched to ${modeNames[mode]}');
    
    // Handle live mode (future implementation)
    if (mode.isLiveMode) {
      _showInfo('Live streaming coming soon');
    }
  }

  Future<void> _startRecording() async {
    if (_cameraController == null ||
        !_cameraController!.value.isInitialized ||
        _isRecording) {
      return;
    }

    // If in photo mode, perform still capture instead of video recording
    final recordingState = ref.read(cameraRecordingProvider);
    if (recordingState.isPhotoMode) {
      await _capturePhoto();
      return;
    }

    // Video recording path
    if (!recordingState.canRecord) {
      _showError('Maximum duration reached');
      return;
    }

    try {
      final directory = await getTemporaryDirectory();
      '${directory.path}/segment_${_uuid.v4()}.mp4';

      await _cameraController!.startVideoRecording();

      setState(() => _isRecording = true);
      _recordingStartTime = DateTime.now();

      ref.read(cameraRecordingProvider.notifier).setRecordingState(
            RecordingState.recording,
          );

      _recordingTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
        if (!mounted) return;
        final recordingState = ref.read(cameraRecordingProvider);
        if (recordingState.totalDuration >= recordingState.maxDuration) {
          _stopRecording();
        }
      });
    } catch (e) {
      debugPrint('Error starting recording: $e');
      setState(() => _isRecording = false);
      _showError('Failed to start recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    if (!_isRecording || _cameraController == null) return;

    _recordingTimer?.cancel();

    try {
      final videoFile = await _cameraController!.stopVideoRecording();
      final duration = DateTime.now().difference(_recordingStartTime!);

      setState(() => _isRecording = false);

      ref.read(cameraRecordingProvider.notifier).addSegment(
            videoFile.path,
            duration,
          );

      ref.read(cameraRecordingProvider.notifier).setRecordingState(
            RecordingState.idle,
          );
    } catch (e) {
      debugPrint('Error stopping recording: $e');
      setState(() => _isRecording = false);
      _showError('Failed to stop recording: $e');
    }
  }

  void _onRecordTap() {
    final recordingState = ref.read(cameraRecordingProvider);

    if (recordingState.isPhotoMode) {
      // Photo mode ignores ongoing video recording state
      if (recordingState.timerSeconds != null && recordingState.timerSeconds! > 0) {
        _startCountdown();
      } else {
        HapticFeedback.lightImpact();
        _startRecording(); // internally routes to _capturePhoto()
      }
      return;
    }

    if (_isRecording) {
      HapticFeedback.selectionClick();
      _stopRecording();
    } else {
      if (recordingState.timerSeconds != null && recordingState.timerSeconds! > 0) {
        _startCountdown();
      } else {
        HapticFeedback.lightImpact();
        _startRecording();
      }
    }
  }

  void _startCountdown() {
    final recordingState = ref.read(cameraRecordingProvider);
    final timerSeconds = recordingState.timerSeconds;

    if (timerSeconds == null) return;

    ref.read(cameraRecordingProvider.notifier).startCountdown();

    int remaining = timerSeconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      remaining--;

      if (remaining > 0) {
        ref.read(cameraRecordingProvider.notifier).updateCountdown(remaining);
      } else {
        timer.cancel();
        ref.read(cameraRecordingProvider.notifier).updateCountdown(0);
        _startRecording();
      }
    });
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      _showError('Camera not ready');
      return;
    }
    // Prevent re-entrancy spam taps
    if (_isRecording) return;
    // Capture navigator and messenger before async gap to avoid context across async warning
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final file = await _cameraController!.takePicture();
      if (!mounted) return;
      ref.read(cameraRecordingProvider.notifier).setLastPhoto(file.path);

      // Navigate to lightweight preview/editor
      if (mounted) {
        final accepted = await navigator.push<bool>(
          MaterialPageRoute(
            builder: (_) => PhotoPreviewPage(imagePath: file.path),
          ),
        );
        if (accepted != true) {
          // User chose Retake: keep lastPhotoPath but allow overwrite next capture
          // Optionally could clear; leaving for quick comparison
        } else {
          // Photo accepted. Future: enqueue for edit/export pipeline.
          HapticFeedback.selectionClick();
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Photo saved'),
              duration: Duration(seconds: 1),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error capturing photo: $e');
      _showError('Failed to capture photo');
    }
  }

  void _proceedToEdit() {
    final recordingState = ref.read(cameraRecordingProvider);

    if (recordingState.segments.isEmpty) {
      _showError('No video recorded');
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => VideoEditorPageTikTok(
          segmentPaths: recordingState.segments.map((s) => s.filePath).toList(),
          totalDuration: recordingState.totalDuration,
          selectedFilter: recordingState.selectedFilter,
          speed: recordingState.currentSpeed,
        ),
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showInfo(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.black87),
        ),
        backgroundColor: Colors.white.withValues(alpha: 0.9),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(milliseconds: 1500),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 80),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recordingState = ref.watch(cameraRecordingProvider);
    final faceEffectsState = ref.watch(faceEffectsProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview (Layer 0)
          CameraPreviewWidget(
            controller: _cameraController,
            isInitialized: _isInitialized,
          ),

          // Countdown Overlay (Layer 1)
          if (recordingState.isCountingDown) const CountdownOverlay(),

          // UI Controls (Layer 2)
          if (_isInitialized)
            SafeArea(
              child: Stack(
                children: [
                  // Top Bar
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: TopBarWidget(
                      onClose: () => Navigator.pop(context),
                      timerSeconds: recordingState.timerSeconds,
                      onMoreMenu: () {
                        _showInfo('More options coming soon');
                      },
                    ),
                  ),

                  // Sound Pill (below top bar, if sound selected)
                  if (recordingState.selectedSoundId != null)
                    Positioned(
                      top: 70,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Consumer(
                          builder: (context, ref, child) {
                            final selectedSound = ref.watch(selectedSoundProvider);
                            if (!selectedSound.hasSound) return const SizedBox.shrink();
                            
                            return SoundPillWidget(
                              soundName: selectedSound.sound!.title,
                              artistName: selectedSound.sound!.artistName,
                              onTap: () async {
                                // Open sound library to change
                                await SoundLibraryPage.show(context);
                                
                                // Sync selected sound
                                if (mounted) {
                                  final newSound = ref.read(selectedSoundProvider);
                                  if (newSound.hasSound) {
                                    ref.read(cameraRecordingProvider.notifier).setSound(
                                      newSound.soundId,
                                      newSound.soundDuration,
                                    );
                                  }
                                }
                              },
                              onRemove: () {
                                ref.read(cameraRecordingProvider.notifier).setSound(null, null);
                                ref.read(selectedSoundProvider.notifier).clearSound();
                                HapticFeedback.mediumImpact();
                                _showInfo('Sound removed');
                              },
                            );
                          },
                        ),
                      ),
                    ),

                  // Recording Indicator (top-left)
                  if (_isRecording)
                    Positioned(
                      top: 80,
                      left: 16,
                      child: RecordingIndicatorWidget(
                        currentDuration: recordingState.totalDuration,
                        maxDuration: recordingState.maxDuration,
                        isRecording: _isRecording,
                      ),
                    ),

                  // Segment Indicator (below top bar)
                  if (recordingState.hasSegments)
                    Positioned(
                      top: 65,
                      left: 0,
                      right: 0,
                      child: const SegmentIndicator(),
                    ),

                  // Right Side Bar
                  Positioned(
                    right: 0,
                    top: 84, // align just below top bar
                    child: RightSideBarWidget(
                      onFlipCamera: _toggleCamera,
                      onFlashToggle: _toggleFlash,
                      onSpeedSelector: () async {
                        if (_isRecording || recordingState.isCountingDown) {
                          _showError('Cannot change speed while recording');
                          return;
                        }
                        final newSpeed = await SpeedSelectorSheet.show(
                          context,
                          recordingState.currentSpeed,
                        );
                        if (newSpeed != null) {
                          ref.read(cameraRecordingProvider.notifier).setSpeed(newSpeed);
                          HapticFeedback.selectionClick();
                          final speedNames = {
                            0.3: 'Very slow',
                            0.5: 'Slow',
                            1.0: 'Normal',
                            2.0: 'Fast',
                            3.0: 'Very fast',
                          };
                          _showInfo('Speed set to ${speedNames[newSpeed]}');
                        }
                      },
                      onBeautyEffects: () {
                        // Open staged beauty modal directly (avoid nested sheets)
                        BeautySelector.show(context, ref);
                      },
                      onFilters: () {
                        // Show new staged filters sheet with Apply/Cancel
                        showModalBottomSheet(
                          context: context,
                          backgroundColor: Colors.transparent,
                          isScrollControlled: false,
                          builder: (context) => const FiltersSheet(),
                        );
                      },
                      onSoundPicker: () async {
                        if (_isRecording || recordingState.isCountingDown) {
                          _showError('Cannot change sound while recording');
                          return;
                        }
                        
                        // Open sound library
                        await SoundLibraryPage.show(context);
                        
                        // Sync selected sound with camera recording state
                        if (mounted) {
                          final selectedSound = ref.read(selectedSoundProvider);
                          if (selectedSound.hasSound) {
                            ref.read(cameraRecordingProvider.notifier).setSound(
                              selectedSound.soundId,
                              selectedSound.soundDuration,
                            );
                          }
                        }
                      },
                      onTimerSettings: () {
                        if (_isRecording || recordingState.isCountingDown) {
                          _showError('Cannot change timer while recording');
                        } else {
                          _showInfo('Timer settings coming soon');
                        }
                      },
                      onToggleMode: () {
                        ref.read(cameraRecordingProvider.notifier).togglePhotoMode();
                      },
                      flashMode: recordingState.flashMode,
                      currentSpeed: recordingState.currentSpeed,
                      hasBeautyEffects: faceEffectsState.hasBeautyEffects,
                      hasFilters: recordingState.selectedFilter != null,
                      isRecording: _isRecording,
                      isPhotoMode: recordingState.isPhotoMode,
                    ),
                  ),

                  // Zoom Slider (right side, vertically centered - TikTok style)
                  if (_showZoomSlider)
                    Positioned(
                      right: 80, // Left of the sidebar (sidebar is 60px wide + 20px padding)
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: ZoomSliderWidget(
                          currentZoom: recordingState.zoomLevel,
                          minZoom: 1.0,
                          maxZoom: 8.0,
                          onZoomChanged: _onZoomChanged,
                          isVisible: _showZoomSlider,
                        ),
                      ),
                    ),

                  // Mode Selector (above bottom bar)
                  Positioned(
                    bottom: 85,  // Reduced from 120 to 85 for tighter TikTok-style spacing
                    left: 0,
                    right: 0,
                    child: ModeSelectorWidget(
                      selectedMode: recordingState.mode,
                      onModeChanged: _onModeChanged,
                      isRecording: _isRecording,
                    ),
                  ),

                  // Bottom Bar
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: BottomBarWidget(
                      mode: recordingState.mode,
                      onGalleryTap: () {
                        _showInfo('Gallery coming soon');
                      },
                      onRecordTap: _onRecordTap,
                        onRecordLongPressStart: () {
                          final rs = ref.read(cameraRecordingProvider);
                          if (!rs.isPhotoMode) _startRecording();
                        },
                        onRecordLongPressEnd: () {
                          final rs = ref.read(cameraRecordingProvider);
                          if (!rs.isPhotoMode) _stopRecording();
                        },
                      onUploadTap: () {
                        _showInfo('Upload coming soon');
                      },
                      onDeleteSegment: () {
                        HapticFeedback.mediumImpact();
                        ref.read(cameraRecordingProvider.notifier).deleteLastSegment();
                        _showInfo('Last segment deleted');
                      },
                      latestVideoPath: recordingState.isPhotoMode
                          ? recordingState.lastPhotoPath
                          : (recordingState.segments.isNotEmpty
                              ? recordingState.segments.last.filePath
                              : null),
                      isRecording: _isRecording,
                      segmentCount: recordingState.segments.length,
                    ),
                  ),

                  // Next Button (when segments exist)
                  if (recordingState.hasSegments && !_isRecording)
                    Positioned(
                      bottom: 140,
                      right: 20,
                      child: GestureDetector(
                        onTap: _proceedToEdit,
                        child: Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.5),
                                blurRadius: 12,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Loading Overlay (Layer 3)
          if (!_isInitialized)
            Container(
              color: Colors.black,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Initializing camera...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
