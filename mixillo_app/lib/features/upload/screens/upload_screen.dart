import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../services/camera_service.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_timer.dart';
import 'media_editor_screen.dart';
import 'gallery_picker_screen.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> with WidgetsBindingObserver {
  final CameraService _cameraService = CameraService();
  final ImagePicker _picker = ImagePicker();
  
  bool _isRecording = false;
  bool _isPaused = false;
  bool _isPhotoMode = false;
  int _recordingSeconds = 0;
  
  static const int maxRecordingSeconds = 60;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraService.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_cameraService.isInitialized) return;

    if (state == AppLifecycleState.inactive) {
      _cameraService.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      await _cameraService.initialize();
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      _showError('Failed to initialize camera: $e');
    }
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

  Future<void> _toggleCamera() async {
    try {
      await _cameraService.switchCamera();
      setState(() {});
    } catch (e) {
      _showError('Failed to switch camera');
    }
  }

  Future<void> _toggleFlash() async {
    try {
      await _cameraService.toggleFlash();
      setState(() {});
    } catch (e) {
      _showError('Failed to toggle flash');
    }
  }

  void _toggleMode() {
    setState(() {
      _isPhotoMode = !_isPhotoMode;
    });
  }

  Future<void> _capturePhoto() async {
    try {
      final path = await _cameraService.takePicture();
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MediaEditorScreen(
              mediaPath: path,
              isVideo: false,
            ),
          ),
        );
      }
    } catch (e) {
      _showError('Failed to capture photo');
    }
  }

  Future<void> _startRecording() async {
    try {
      await _cameraService.startVideoRecording();
      setState(() {
        _isRecording = true;
        _recordingSeconds = 0;
      });
      _startTimer();
    } catch (e) {
      _showError('Failed to start recording');
    }
  }

  Future<void> _stopRecording() async {
    try {
      final path = await _cameraService.stopVideoRecording();
      setState(() {
        _isRecording = false;
        _isPaused = false;
        _recordingSeconds = 0;
      });
      
      if (mounted && path != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MediaEditorScreen(
              mediaPath: path,
              isVideo: true,
            ),
          ),
        );
      }
    } catch (e) {
      _showError('Failed to stop recording');
    }
  }

  Future<void> _pauseRecording() async {
    try {
      await _cameraService.pauseVideoRecording();
      setState(() {
        _isPaused = true;
      });
    } catch (e) {
      _showError('Failed to pause recording');
    }
  }

  Future<void> _resumeRecording() async {
    try {
      await _cameraService.resumeVideoRecording();
      setState(() {
        _isPaused = false;
      });
    } catch (e) {
      _showError('Failed to resume recording');
    }
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (_isRecording && !_isPaused) {
        setState(() {
          _recordingSeconds++;
        });
        
        if (_recordingSeconds >= maxRecordingSeconds) {
          await _stopRecording();
          return false;
        }
      }
      return _isRecording;
    });
  }

  Future<void> _openGallery() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const GalleryPickerScreen(),
      ),
    );

    if (result != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MediaEditorScreen(
            mediaPath: result['path'],
            isVideo: result['isVideo'],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (!_cameraService.isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              Text(
                'Initializing camera...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          Center(
            child: AspectRatio(
              aspectRatio: _cameraService.controller!.value.aspectRatio,
              child: CameraPreview(_cameraService.controller!),
            ),
          ),

          // Top Bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Close Button
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                    onPressed: () => Navigator.pop(context),
                  ),

                  // Mode Toggle
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: _toggleMode,
                          child: Text(
                            'Photo',
                            style: TextStyle(
                              color: _isPhotoMode ? AppColors.primary : Colors.white,
                              fontWeight: _isPhotoMode ? FontWeight.bold : FontWeight.normal,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        GestureDetector(
                          onTap: _toggleMode,
                          child: Text(
                            'Video',
                            style: TextStyle(
                              color: !_isPhotoMode ? AppColors.primary : Colors.white,
                              fontWeight: !_isPhotoMode ? FontWeight.bold : FontWeight.normal,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Settings
                  IconButton(
                    icon: const Icon(Icons.settings, color: Colors.white, size: 28),
                    onPressed: () {
                      // Open settings
                    },
                  ),
                ],
              ),
            ),
          ),

          // Recording Timer
          if (_isRecording)
            SafeArea(
              child: Align(
                alignment: Alignment.topCenter,
                child: RecordingTimer(
                  seconds: _recordingSeconds,
                  isPaused: _isPaused,
                  maxSeconds: maxRecordingSeconds,
                ),
              ),
            ),

          // Camera Controls
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              child: CameraControls(
                isPhotoMode: _isPhotoMode,
                isRecording: _isRecording,
                isPaused: _isPaused,
                flashMode: _cameraService.flashMode,
                onCapture: _isPhotoMode ? _capturePhoto : (_isRecording ? _stopRecording : _startRecording),
                onPauseResume: _isPaused ? _resumeRecording : _pauseRecording,
                onFlipCamera: _toggleCamera,
                onFlashToggle: _toggleFlash,
                onGalleryOpen: _openGallery,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
