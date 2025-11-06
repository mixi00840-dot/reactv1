import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:camera/camera.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/premium_button.dart';
import '../services/camera_service.dart';
import '../providers/camera_provider.dart';
import '../models/ar_filter_model.dart';
import '../widgets/filter_panel.dart';
import '../widgets/beauty_panel.dart';
import '../widgets/speed_selector.dart';
import '../widgets/sound_picker_panel.dart';
import '../widgets/voiceover_recorder.dart';
import '../widgets/recording_timer.dart';
import '../providers/sound_provider.dart';
import 'media_editor_screen.dart';
import 'gallery_picker_screen.dart';

/// Premium Camera Screen - TikTok-level camera with AR filters, beauty effects, and more
class PremiumCameraScreen extends StatefulWidget {
  const PremiumCameraScreen({super.key});

  @override
  State<PremiumCameraScreen> createState() => _PremiumCameraScreenState();
}

class _PremiumCameraScreenState extends State<PremiumCameraScreen>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  final CameraService _cameraService = CameraService();
  
  // UI State
  bool _isRecording = false;
  bool _isPaused = false;
  bool _isPhotoMode = true;
  int _recordingSeconds = 0;
  double _zoomLevel = 1.0;
  bool _showFilters = false;
  bool _showBeauty = false;
  bool _showSpeed = false;
  bool _showTimer = false;
  bool _showSounds = false;
  int _timerCountdown = 0;
  
  // Animations
  late AnimationController _captureAnimationController;
  late AnimationController _filterAnimationController;
  late Animation<double> _captureScaleAnimation;
  
  static const int maxRecordingSeconds = 60;
  static const List<int> timerOptions = [3, 5, 10];
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    _initializeAnimations();
    _loadFilters();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraService.dispose();
    _captureAnimationController.dispose();
    _filterAnimationController.dispose();
    super.dispose();
  }
  
  void _initializeAnimations() {
    _captureAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    
    _filterAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    
    _captureScaleAnimation = Tween<double>(begin: 1.0, end: 0.8).animate(
      CurvedAnimation(
        parent: _captureAnimationController,
        curve: Curves.easeInOut,
      ),
    );
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
  
  Future<void> _loadFilters() async {
    final cameraProvider = context.read<CameraProvider>();
    await cameraProvider.loadTrendingFilters();
    await cameraProvider.loadFeaturedFilters();
    
    // Load sounds
    final soundProvider = context.read<SoundProvider>();
    await soundProvider.loadTrendingSounds();
    await soundProvider.loadFeaturedSounds();
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
  
  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
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
  
  Future<void> _capturePhoto() async {
    _captureAnimationController.forward().then((_) {
      _captureAnimationController.reverse();
    });
    
    try {
      final path = await _cameraService.takePicture();
      if (mounted) {
        final provider = context.read<CameraProvider>();
        final processed = await provider.applyFilterToMedia(
          mediaUrl: path,
          isVideo: false,
        );
        
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MediaEditorScreen(
              mediaPath: processed['url'] ?? path,
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
        final cameraProvider = context.read<CameraProvider>();
        final soundProvider = context.read<SoundProvider>();
        
        // Apply filters and effects
        final processed = await cameraProvider.applyFilterToMedia(
          mediaUrl: path,
          isVideo: true,
        );
        
        // Record sound usage if sound is selected
        if (soundProvider.selectedSound.hasSound) {
          await soundProvider.recordSoundUsage(
            soundProvider.selectedSound.sound!.soundId,
          );
        }
        
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MediaEditorScreen(
              mediaPath: processed['url'] ?? path,
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
      if (_isRecording && !_isPaused && mounted) {
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
  
  void _handleZoom(double scale) {
    setState(() {
      _zoomLevel = (_zoomLevel * scale).clamp(1.0, 8.0);
    });
    _cameraService.setZoom(_zoomLevel);
  }
  
  void _handleFocus(Offset position, Size size) {
    _cameraService.setFocus(position, size);
  }
  
  @override
  Widget build(BuildContext context) {
    if (!_cameraService.isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Initializing camera...',
                style: AppTypography.bodyMedium(context).copyWith(
                  color: Colors.white,
                ),
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
          // Camera Preview with Gesture Detection
          GestureDetector(
            onScaleUpdate: (details) {
              _handleZoom(details.scale);
            },
            onTapDown: (details) {
              _handleFocus(
                details.localPosition,
                MediaQuery.of(context).size,
              );
            },
            child: Center(
              child: AspectRatio(
                aspectRatio: _cameraService.controller!.value.aspectRatio,
                child: CameraPreview(_cameraService.controller!),
              ),
            ),
          ),
          
          // Top Bar
          _buildTopBar(),
          
          // Recording Timer
          if (_isRecording) _buildRecordingTimer(),
          
          // Timer Countdown
          if (_showTimer && _timerCountdown > 0) _buildTimerCountdown(),
          
          // Selected Sound Indicator
          if (!_isPhotoMode && context.watch<SoundProvider>().selectedSound.hasSound)
            _buildSelectedSoundIndicator(),
          
          // Bottom Controls
          _buildBottomControls(),
          
          // Filter Panel
          if (_showFilters) _buildFilterPanel(),
          
          // Beauty Panel
          if (_showBeauty) _buildBeautyPanel(),
          
          // Speed Selector
          if (_showSpeed) _buildSpeedSelector(),
          
          // Sound Picker
          if (_showSounds) _buildSoundPicker(),
        ],
      ),
    );
  }
  
  Widget _buildTopBar() {
    return SafeArea(
      child: Padding(
        padding: AppSpacing.screenPadding(),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Close Button
            _buildTopButton(
              icon: Icons.close,
              onTap: () => Navigator.pop(context),
            ),
            
            // Mode Toggle (Photo/Video)
            Container(
              padding: AppSpacing.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
              ),
              child: Row(
                children: [
                  _buildModeButton('Photo', _isPhotoMode),
                  SizedBox(width: AppSpacing.md),
                  _buildModeButton('Video', !_isPhotoMode),
                ],
              ),
            ),
            
            // Settings/More Options
            _buildTopButton(
              icon: Icons.more_vert,
              onTap: () {
                // Show settings menu
              },
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildModeButton(String label, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _isPhotoMode = label == 'Photo';
        });
      },
      child: Text(
        label,
        style: AppTypography.titleMedium(context).copyWith(
          color: isSelected ? AppColors.primary : Colors.white,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
  
  Widget _buildTopButton({required IconData icon, required VoidCallback onTap}) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        shape: BoxShape.circle,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
      ),
    );
  }
  
  Widget _buildRecordingTimer() {
    return SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: Padding(
          padding: const EdgeInsets.only(top: 60),
          child: RecordingTimer(
            seconds: _recordingSeconds,
            isPaused: _isPaused,
            maxSeconds: maxRecordingSeconds,
          ),
        ),
      ),
    );
  }
  
  Widget _buildTimerCountdown() {
    return Center(
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            '$_timerCountdown',
            style: AppTypography.displayLarge(context).copyWith(
              color: Colors.white,
              fontSize: 48,
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildBottomControls() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Filter/Beauty/Speed Indicators
            if (_showFilters || _showBeauty || _showSpeed)
              Container(
                height: 120,
                color: Colors.transparent,
                child: const SizedBox.shrink(),
              ),
            
            // Main Controls Row
            Padding(
              padding: AppSpacing.screenPadding(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Gallery
                  _buildControlButton(
                    icon: Icons.photo_library,
                    onTap: _openGallery,
                  ),
                  
                  // Capture Button
                  _buildCaptureButton(),
                  
                  // Flip Camera
                  _buildControlButton(
                    icon: Icons.flip_camera_ios,
                    onTap: _toggleCamera,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            // Bottom Toolbar
            _buildBottomToolbar(),
            
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }
  
  Widget _buildControlButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }
  
  Widget _buildCaptureButton() {
    return GestureDetector(
      onTap: _isPhotoMode
          ? _capturePhoto
          : (_isRecording ? _stopRecording : _startRecording),
      onLongPress: _isPhotoMode ? null : _startRecording,
      child: ScaleTransition(
        scale: _captureScaleAnimation,
        child: Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white,
              width: 4,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isRecording ? Colors.red : Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildBottomToolbar() {
    return Container(
      padding: AppSpacing.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Flash
          _buildToolbarButton(
            icon: _getFlashIcon(),
            label: _getFlashLabel(),
            onTap: _toggleFlash,
          ),
          
          // Speed (Video only)
          if (!_isPhotoMode)
            _buildToolbarButton(
              icon: Icons.speed,
              label: '${context.watch<CameraProvider>().videoSpeed}x',
              onTap: () {
                setState(() {
                  _showSpeed = !_showSpeed;
                  _showFilters = false;
                  _showBeauty = false;
                });
              },
              isActive: _showSpeed,
            ),
          
          // Beauty
          _buildToolbarButton(
            icon: Icons.face_retouching_natural,
            label: 'Beauty',
            onTap: () {
              setState(() {
                _showBeauty = !_showBeauty;
                _showFilters = false;
                _showSpeed = false;
              });
            },
            isActive: _showBeauty,
          ),
          
          // Filters
          _buildToolbarButton(
            icon: Icons.filter_vintage,
            label: 'Filters',
            onTap: () {
              setState(() {
                _showFilters = !_showFilters;
                _showBeauty = false;
                _showSpeed = false;
              });
            },
            isActive: _showFilters,
          ),
          
          // Sound (Video only)
          if (!_isPhotoMode)
            _buildToolbarButton(
              icon: Icons.music_note,
              label: context.watch<SoundProvider>().selectedSound.hasSound ? 'Sound' : 'Add',
              onTap: () {
                setState(() {
                  _showSounds = !_showSounds;
                  _showFilters = false;
                  _showBeauty = false;
                  _showSpeed = false;
                });
              },
              isActive: _showSounds,
            ),
          
          // Timer
          _buildToolbarButton(
            icon: Icons.timer,
            label: 'Timer',
            onTap: () {
              setState(() {
                _showTimer = !_showTimer;
              });
            },
            isActive: _showTimer,
          ),
        ],
      ),
    );
  }
  
  Widget _buildToolbarButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isActive ? AppColors.primary : Colors.white,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.labelSmall(context).copyWith(
              color: isActive ? AppColors.primary : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFilterPanel() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 100,
      child: FilterPanel(
        onFilterSelected: (filter) {
          context.read<CameraProvider>().selectFilter(filter);
        },
        onClose: () {
          setState(() {
            _showFilters = false;
          });
        },
      ),
    );
  }
  
  Widget _buildBeautyPanel() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 100,
      child: BeautyPanel(
        onClose: () {
          setState(() {
            _showBeauty = false;
          });
        },
      ),
    );
  }
  
  Widget _buildSpeedSelector() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 100,
      child: SpeedSelector(
        onSpeedSelected: (speed) {
          context.read<CameraProvider>().setVideoSpeed(speed);
        },
        onClose: () {
          setState(() {
            _showSpeed = false;
          });
        },
      ),
    );
  }
  
  IconData _getFlashIcon() {
    switch (_cameraService.flashMode) {
      case FlashMode.off:
        return Icons.flash_off;
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      default:
        return Icons.flash_off;
    }
  }
  
  String _getFlashLabel() {
    switch (_cameraService.flashMode) {
      case FlashMode.off:
        return 'Off';
      case FlashMode.auto:
        return 'Auto';
      case FlashMode.always:
        return 'On';
      default:
        return 'Off';
    }
  }
  
  Widget _buildSoundPicker() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SoundPickerPanel(
        onSoundSelected: (sound) {
          final provider = context.read<SoundProvider>();
          provider.selectSound(sound);
          setState(() {
            _showSounds = false;
          });
        },
        onClose: () {
          setState(() {
            _showSounds = false;
          });
        },
        onVoiceoverTap: () {
          setState(() {
            _showSounds = false;
          });
          _showVoiceoverRecorder();
        },
      ),
    );
  }
  
  void _showVoiceoverRecorder() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => VoiceoverRecorder(
        onRecordingComplete: (path) {
          if (path != null) {
            final provider = context.read<SoundProvider>();
            provider.stopVoiceoverRecording(path);
          }
        },
        onClose: () => Navigator.pop(context),
      ),
    );
  }
  
  Widget _buildSelectedSoundIndicator() {
    final soundProvider = context.watch<SoundProvider>();
    final sound = soundProvider.selectedSound.sound;
    
    if (sound == null) return const SizedBox.shrink();
    
    return Positioned(
      left: 16,
      bottom: 200,
      child: SafeArea(
        child: GestureDetector(
          onTap: () {
            setState(() {
              _showSounds = true;
            });
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.music_note, color: AppColors.primary, size: 16),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    sound.shortTitle,
                    style: AppTypography.labelMedium(context).copyWith(
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

