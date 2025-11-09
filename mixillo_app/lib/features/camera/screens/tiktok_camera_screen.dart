import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_progress_bar.dart';
import '../widgets/camera_top_bar.dart';
import '../widgets/speed_selector.dart';
import '../widgets/filter_selector.dart';
import '../models/video_clip.dart';
import 'video_processing_screen.dart';

/// TikTok-style Camera Screen
/// Features: Multi-clip recording, speed control, filters, effects, sounds
class TikTokCameraScreen extends StatefulWidget {
  const TikTokCameraScreen({Key? key}) : super(key: key);

  @override
  State<TikTokCameraScreen> createState() => _TikTokCameraScreenState();
}

class _TikTokCameraScreenState extends State<TikTokCameraScreen>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  // ==================== CAMERA STATE ====================
  
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isCameraInitialized = false;
  bool _isFlashOn = false;
  
  // ==================== RECORDING STATE ====================
  
  bool _isRecording = false;
  List<VideoClip> _recordedClips = [];
  double _recordingProgress = 0.0;
  Timer? _recordingTimer;
  DateTime? _recordingStartTime;
  
  // Maximum recording duration (3 minutes like TikTok)
  final int maxRecordingDurationSeconds = 180;
  
  // Minimum clip duration (1 second)
  final int minClipDurationMs = 1000;
  
  // ==================== SPEED CONTROL ====================
  
  double _selectedSpeed = 1.0;
  final List<double> _speedOptions = [0.3, 0.5, 1.0, 2.0, 3.0];
  
  // ==================== FILTERS & EFFECTS ====================
  
  String? _selectedFilter;
  final List<String> _filters = [
    'None',
    'Vintage',
    'B&W',
    'Sepia',
    'Vivid',
    'Cool',
    'Warm',
  ];
  
  // ==================== UI STATE ====================
  
  bool _showSpeedSelector = false;
  bool _showFilterSelector = false;
  bool _showSoundSelector = false;
  bool _showTimerSelector = false;
  
  int _timerSeconds = 0;
  bool _timerCountingDown = false;
  int _countdownValue = 0;
  
  // ==================== ANIMATIONS ====================
  
  late AnimationController _recordButtonAnimationController;
  late AnimationController _flashAnimationController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeAnimations();
    _requestPermissionsAndInitCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _recordingTimer?.cancel();
    _recordButtonAnimationController.dispose();
    _flashAnimationController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _cameraController;

    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera(_cameras[_selectedCameraIndex]);
    }
  }

  // ==================== INITIALIZATION ====================

  void _initializeAnimations() {
    // Record button pulse animation
    _recordButtonAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _recordButtonAnimationController.repeat(reverse: true);

    // Flash animation
    _flashAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  Future<void> _requestPermissionsAndInitCamera() async {
    // Request camera and microphone permissions
    final cameraStatus = await Permission.camera.request();
    final microphoneStatus = await Permission.microphone.request();

    if (cameraStatus.isGranted && microphoneStatus.isGranted) {
      await _initializeCameras();
    } else {
      _showPermissionDeniedDialog();
    }
  }

  Future<void> _initializeCameras() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        await _initializeCamera(_cameras[0]);
      }
    } catch (e) {
      debugPrint('Error initializing cameras: $e');
    }
  }

  Future<void> _initializeCamera(CameraDescription camera) async {
    final previousController = _cameraController;
    
    final CameraController cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    await previousController?.dispose();

    if (mounted) {
      setState(() {
        _cameraController = cameraController;
      });
    }

    cameraController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });

    try {
      await cameraController.initialize();
      await cameraController.setFlashMode(FlashMode.off);
      
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  // ==================== CAMERA CONTROLS ====================

  Future<void> _toggleCamera() async {
    if (_cameras.length < 2) return;

    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    await _initializeCamera(_cameras[_selectedCameraIndex]);
  }

  Future<void> _toggleFlash() async {
    if (_cameraController == null) return;

    setState(() {
      _isFlashOn = !_isFlashOn;
    });

    await _cameraController!.setFlashMode(
      _isFlashOn ? FlashMode.torch : FlashMode.off,
    );

    // Flash animation
    _flashAnimationController.forward().then((_) {
      _flashAnimationController.reverse();
    });
  }

  // ==================== RECORDING CONTROLS ====================

  Future<void> _startRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    // Start timer countdown if set
    if (_timerSeconds > 0 && !_timerCountingDown) {
      await _startTimerCountdown();
      return;
    }

    try {
      setState(() {
        _isRecording = true;
        _recordingStartTime = DateTime.now();
      });

      await _cameraController!.startVideoRecording();
      _startRecordingTimer();

      // Haptic feedback
      HapticFeedback.mediumImpact();
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    if (_cameraController == null || !_isRecording) return;

    try {
      final XFile videoFile = await _cameraController!.stopVideoRecording();
      _recordingTimer?.cancel();

      final duration = DateTime.now().difference(_recordingStartTime!);

      // Only save clips longer than minimum duration
      if (duration.inMilliseconds >= minClipDurationMs) {
        setState(() {
          _recordedClips.add(VideoClip(
            path: videoFile.path,
            duration: duration,
            speed: _selectedSpeed,
            filter: _selectedFilter,
          ));
          _isRecording = false;
          _recordingStartTime = null;
        });

        // Haptic feedback
        HapticFeedback.mediumImpact();
      } else {
        // Delete too-short clip
        await File(videoFile.path).delete();
        setState(() {
          _isRecording = false;
        });
      }
    } catch (e) {
      debugPrint('Error stopping recording: $e');
    }
  }

  void _startRecordingTimer() {
    _recordingTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      final elapsed = DateTime.now().difference(_recordingStartTime!);
      final totalRecorded = _getTotalRecordedDuration() + elapsed;

      setState(() {
        _recordingProgress = totalRecorded.inMilliseconds /
            (maxRecordingDurationSeconds * 1000);
      });

      // Auto-stop if max duration reached
      if (totalRecorded.inSeconds >= maxRecordingDurationSeconds) {
        _stopRecording();
      }
    });
  }

  Duration _getTotalRecordedDuration() {
    return _recordedClips.fold(
      Duration.zero,
      (total, clip) => total + clip.duration,
    );
  }

  Future<void> _deleteLastClip() async {
    if (_recordedClips.isEmpty) return;

    final lastClip = _recordedClips.last;
    
    try {
      await File(lastClip.path).delete();
      setState(() {
        _recordedClips.removeLast();
        _updateRecordingProgress();
      });

      HapticFeedback.lightImpact();
    } catch (e) {
      debugPrint('Error deleting clip: $e');
    }
  }

  void _updateRecordingProgress() {
    final totalDuration = _getTotalRecordedDuration();
    setState(() {
      _recordingProgress = totalDuration.inMilliseconds /
          (maxRecordingDurationSeconds * 1000);
    });
  }

  // ==================== TIMER CONTROLS ====================

  Future<void> _startTimerCountdown() async {
    setState(() {
      _timerCountingDown = true;
      _countdownValue = _timerSeconds;
    });

    for (int i = _timerSeconds; i > 0; i--) {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      
      setState(() {
        _countdownValue = i - 1;
      });

      HapticFeedback.lightImpact();
    }

    setState(() {
      _timerCountingDown = false;
      _countdownValue = 0;
    });

    // Start recording after countdown
    await _startRecording();
  }

  // ==================== NAVIGATION ====================

  void _goToPreview() async {
    if (_recordedClips.isEmpty) return;

    // Dispose camera before navigating
    await _cameraController?.dispose();
    _cameraController = null;

    // Navigate to video processing screen
    if (mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => VideoProcessingScreen(
            clips: _recordedClips,
            audioPath: null, // TODO: Get selected audio path
          ),
        ),
      ).then((_) {
        // Re-initialize camera when returning
        _requestPermissionsAndInitCamera();
      });
    }
  }

  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permissions Required'),
        content: const Text(
          'Camera and microphone permissions are required to record videos.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  // ==================== UI BUILD ====================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: !_isCameraInitialized
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
              ),
            )
          : _buildCameraInterface(),
    );
  }

  Widget _buildCameraInterface() {
    return Stack(
      children: [
        // Camera Preview
        _buildCameraPreview(),

        // Timer Countdown Overlay
        if (_timerCountingDown) _buildTimerCountdown(),

        // Top Bar (Close, Flash, Speed, Timer, Flip)
        CameraTopBar(
          onClose: () => Navigator.pop(context),
          onFlashTap: _toggleFlash,
          isFlashOn: _isFlashOn,
          onSpeedTap: () {
            setState(() {
              _showSpeedSelector = !_showSpeedSelector;
              _showFilterSelector = false;
              _showSoundSelector = false;
            });
          },
          onTimerTap: () {
            setState(() {
              _showTimerSelector = !_showTimerSelector;
            });
          },
          onFlipTap: _toggleCamera,
          selectedSpeed: _selectedSpeed,
        ),

        // Speed Selector
        if (_showSpeedSelector)
          Positioned(
            top: 100,
            left: 0,
            right: 0,
            child: SpeedSelector(
              speeds: _speedOptions,
              selectedSpeed: _selectedSpeed,
              onSpeedSelected: (speed) {
                setState(() {
                  _selectedSpeed = speed;
                  _showSpeedSelector = false;
                });
              },
            ),
          ),

        // Filter Selector
        if (_showFilterSelector)
          Positioned(
            bottom: 180,
            left: 0,
            right: 0,
            child: FilterSelector(
              filters: _filters,
              selectedFilter: _selectedFilter,
              onFilterSelected: (filter) {
                setState(() {
                  _selectedFilter = filter;
                });
              },
            ),
          ),

        // Recording Progress Bar
        Positioned(
          top: 80,
          left: 0,
          right: 0,
          child: RecordingProgressBar(
            progress: _recordingProgress,
            clips: _recordedClips,
            maxDuration: maxRecordingDurationSeconds,
          ),
        ),

        // Bottom Controls
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: CameraControls(
            isRecording: _isRecording,
            hasClips: _recordedClips.isNotEmpty,
            onRecordStart: _startRecording,
            onRecordStop: _stopRecording,
            onDeleteLastClip: _deleteLastClip,
            onNext: _goToPreview,
            onEffectsTap: () {
              setState(() {
                _showFilterSelector = !_showFilterSelector;
                _showSpeedSelector = false;
              });
            },
            onSoundsTap: () {
              setState(() {
                _showSoundSelector = !_showSoundSelector;
                _showFilterSelector = false;
                _showSpeedSelector = false;
              });
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCameraPreview() {
    final size = MediaQuery.of(context).size;
    final cameraRatio = _cameraController!.value.aspectRatio;

    return SizedBox(
      width: size.width,
      height: size.height,
      child: FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: size.width,
          height: size.width * cameraRatio,
          child: CameraPreview(_cameraController!),
        ),
      ),
    );
  }

  Widget _buildTimerCountdown() {
    return Container(
      color: AppColors.overlay80,
      child: Center(
        child: Text(
          '$_countdownValue',
          style: const TextStyle(
            fontSize: 120,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
