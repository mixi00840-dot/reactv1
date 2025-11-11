import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'package:iconsax/iconsax.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/theme/app_colors.dart';
import '../../models/camera_recording_state.dart';
import '../../providers/camera_recording_provider.dart';
import '../../providers/face_effects_provider.dart';
import '../../services/filter_service.dart';
import '../../services/beauty_effects_processor.dart';
import '../widgets/camera_controls/record_button.dart';
import '../widgets/camera_controls/speed_selector.dart';
import '../widgets/camera_controls/timer_selector.dart';
import '../widgets/camera_controls/filter_selector.dart';
import '../widgets/face_effects/beauty_selector.dart';
import '../widgets/face_effects/face_mask_selector.dart';
import '../widgets/face_effects/face_overlay_painter.dart';
import '../widgets/common/segment_indicator.dart';
import '../widgets/common/countdown_overlay.dart';
import 'video_editor_page.dart';

/// Enhanced TikTok-style camera page with multi-segment recording
class TikTokCameraPage extends ConsumerStatefulWidget {
  const TikTokCameraPage({super.key});

  @override
  ConsumerState<TikTokCameraPage> createState() => _TikTokCameraPageState();
}

class _TikTokCameraPageState extends ConsumerState<TikTokCameraPage>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isRecording = false;
  Timer? _recordingTimer;
  DateTime? _recordingStartTime;
  final _uuid = const Uuid();
  final _filterService = FilterService();
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        if (mounted) {
          _showError('No cameras available');
        }
        return;
      }

      final recordingState = ref.read(cameraRecordingProvider);
      final cameraIndex = recordingState.isFrontCamera ? 1 : 0;
      
      if (cameraIndex >= _cameras!.length) {
        if (mounted) {
          _showError('Selected camera not available');
        }
        return;
      }

      await _setupCamera(_cameras![cameraIndex]);
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      if (mounted) {
        _showError('Failed to initialize camera: $e');
      }
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
      if (mounted) {
        _showError('Failed to setup camera: $e');
      }
    }
  }

  /// Start camera image stream for real-time face detection
  void _startImageStream() {
    final faceEffectsState = ref.read(faceEffectsProvider);
    
    // Only start streaming if face tracking or beauty effects are enabled
    if (!faceEffectsState.isFaceTrackingEnabled && 
        !faceEffectsState.hasBeautyEffects) {
      return;
    }

    _cameraController?.startImageStream((cameraImage) {
      // Process face detection on every 5th frame for performance
      if (cameraImage.planes.isNotEmpty) {
        ref.read(faceEffectsProvider.notifier).processCameraFrame(cameraImage);
      }
    });
  }

  /// Stop camera image stream
  // ignore: unused_element
  void _stopImageStream() {
    _cameraController?.stopImageStream().catchError((e) {
      debugPrint('Error stopping image stream: $e');
    });
  }

  Future<void> _toggleCamera() async {
    if (_isRecording) return;

    ref.read(cameraRecordingProvider.notifier).toggleCamera();
    setState(() => _isInitialized = false);
    await _cameraController?.dispose();
    await _initializeCamera();
  }

  Future<void> _toggleFlash() async {
    final recordingState = ref.read(cameraRecordingProvider);
    final newFlashMode = !recordingState.isFlashOn;

    ref.read(cameraRecordingProvider.notifier).toggleFlash();

    if (_cameraController != null) {
      await _cameraController!.setFlashMode(
        newFlashMode ? FlashMode.torch : FlashMode.off,
      );
    }
  }

  void _applyZoom() {
    final recordingState = ref.read(cameraRecordingProvider);
    _cameraController?.setZoomLevel(recordingState.zoomLevel);
  }

  Future<void> _startRecording() async {
    if (_cameraController == null ||
        !_cameraController!.value.isInitialized ||
        _isRecording) {
      return;
    }

    final recordingState = ref.read(cameraRecordingProvider);
    if (!recordingState.canRecord) {
      _showError('Maximum duration reached');
      return;
    }

    try {
      final directory = await getTemporaryDirectory();
      // Generate unique file path for segment (used by camera controller internally)
      '${directory.path}/segment_${_uuid.v4()}.mp4';

      await _cameraController!.startVideoRecording();
      
      setState(() => _isRecording = true);
      _recordingStartTime = DateTime.now();
      
      ref.read(cameraRecordingProvider.notifier).setRecordingState(
        RecordingState.recording,
      );

      // Monitor recording duration
      _recordingTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
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

      // Add segment to state
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
    if (_isRecording) {
      _stopRecording();
    } else {
      final recordingState = ref.read(cameraRecordingProvider);
      
      if (recordingState.timerSeconds != null) {
        _startCountdown();
      } else {
        _startRecording();
      }
    }
  }

  void _onRecordLongPressStart() {
    if (!_isRecording) {
      _startRecording();
    }
  }

  void _onRecordLongPressEnd() {
    if (_isRecording) {
      _stopRecording();
    }
  }

  void _startCountdown() {
    final recordingState = ref.read(cameraRecordingProvider);
    final timerSeconds = recordingState.timerSeconds;
    
    if (timerSeconds == null) return;

    ref.read(cameraRecordingProvider.notifier).startCountdown();

    int remaining = timerSeconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
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

  void _onZoomStart() {
    // Zoom started
  }

  void _onZoomUpdate(double delta) {
    final recordingState = ref.read(cameraRecordingProvider);
    final newZoom = (recordingState.zoomLevel + delta).clamp(1.0, 10.0);
    
    ref.read(cameraRecordingProvider.notifier).setZoom(newZoom);
    _applyZoom();
  }

  void _onZoomEnd() {
    // Zoom ended
  }

  void _undoLastSegment() {
    ref.read(cameraRecordingProvider.notifier).removeLastSegment();
  }

  void _proceedToEdit() {
    final recordingState = ref.read(cameraRecordingProvider);
    
    if (recordingState.segments.isEmpty) {
      _showError('No video recorded');
      return;
    }

    // Navigate to video editor page
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => VideoEditorPage(
          segmentPaths: recordingState.segments.map((s) => s.filePath).toList(),
          totalDuration: recordingState.totalDuration,
          selectedFilter: recordingState.selectedFilter,
          speed: recordingState.currentSpeed,
        ),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final seconds = duration.inSeconds;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  void _showError(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _cameraController == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final recordingState = ref.watch(cameraRecordingProvider);
    final faceEffectsState = ref.watch(faceEffectsProvider);
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview with Filters and Beauty Effects
          Center(
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Base camera preview with color filter
                _filterService.applyFilter(
                  ColorFiltered(
                    colorFilter: BeautyEffectsProcessor.getBeautyColorFilter(
                      faceEffectsState.beautySettings,
                    ),
                    child: CameraPreview(_cameraController!),
                  ),
                  recordingState.selectedFilter,
                ),

                // AR Face Overlays
                if (faceEffectsState.hasFaceMask && faceEffectsState.hasFaces)
                  CustomPaint(
                    painter: FaceOverlayPainter(
                      faces: faceEffectsState.detectedFaces,
                      landmarksCache: faceEffectsState.faceLandmarksCache,
                      selectedMask: faceEffectsState.selectedFaceMask,
                      imageSize: Size(
                        _cameraController!.value.previewSize?.height ?? 1920,
                        _cameraController!.value.previewSize?.width ?? 1080,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Countdown Overlay
          const CountdownOverlay(),

          // UI Controls
          SafeArea(
            child: Column(
              children: [
                // Top Bar
                _buildTopBar(),

                const Spacer(),

                // Bottom Controls
                _buildBottomControls(),
              ],
            ),
          ),

          // Segment Timeline Indicator
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 60),
                  const SegmentIndicator(),
                ],
              ),
            ),
          ),

          // Zoom Level Indicator
          if (recordingState.zoomLevel > 1.0)
            Positioned(
              top: screenSize.height * 0.4,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${recordingState.zoomLevel.toStringAsFixed(1)}x',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    final recordingState = ref.watch(cameraRecordingProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Close button
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),

          // Center controls
          Row(
            children: [
              // Flash
              GestureDetector(
                onTap: _toggleFlash,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: recordingState.isFlashOn
                        ? AppColors.primary.withOpacity(0.3)
                        : Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    recordingState.isFlashOn
                        ? Icons.flash_on
                        : Icons.flash_off,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Timer
              const TimerSelector(),
              
              const SizedBox(width: 12),

              // Sound (placeholder for now)
              GestureDetector(
                onTap: () {
                  // TODO: Open sound selector
                  _showError('Sound selector coming soon');
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: recordingState.selectedSoundId != null
                        ? AppColors.primary.withOpacity(0.3)
                        : Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Iconsax.music,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
            ],
          ),

          // Flip camera
          GestureDetector(
            onTap: _toggleCamera,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Iconsax.camera,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    final recordingState = ref.watch(cameraRecordingProvider);

    return Padding(
      padding: const EdgeInsets.only(bottom: 30, left: 16, right: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Speed selector
          const Center(child: SpeedSelector()),
          const SizedBox(height: 30),

          // Main controls row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left side controls
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const FilterSelector(),
                  const SizedBox(height: 12),
                  const BeautySelector(),
                  const SizedBox(height: 12),
                  const FaceMaskSelector(),
                ],
              ),

              const SizedBox(width: 20),

              // Record button (center)
              RecordButton(
                onTap: _onRecordTap,
                onLongPressStart: _onRecordLongPressStart,
                onLongPressEnd: _onRecordLongPressEnd,
                onZoomStart: _onZoomStart,
                onZoomUpdate: _onZoomUpdate,
                onZoomEnd: _onZoomEnd,
              ),

              const SizedBox(width: 20),

              // Undo / Next button
              if (recordingState.hasSegments)
                Column(
                  children: [
                    // Next button
                    GestureDetector(
                      onTap: _proceedToEdit,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Undo button
                    GestureDetector(
                      onTap: _undoLastSegment,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.undo,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                )
              else
                const SizedBox(width: 56),
            ],
          ),

          // Duration display
          if (recordingState.hasSegments) ...[
            const SizedBox(height: 16),
            Text(
              _formatDuration(recordingState.totalDuration),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
