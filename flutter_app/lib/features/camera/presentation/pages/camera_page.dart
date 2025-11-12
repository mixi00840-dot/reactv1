import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:iconsax/iconsax.dart';
import 'dart:async';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_shadows.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/glass_widgets.dart';

/// Premium camera UI matching TikTok quality
class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isRecording = false;
  bool _isInitialized = false;
  int _selectedDuration = 60; // seconds
  double _beautyLevel = 0.5;
  FlashMode _flashMode = FlashMode.off;
  int _selectedCameraIndex = 0;
  Timer? _recordingTimer;
  int _recordedSeconds = 0;

  final List<int> _durations = [15, 60, 180];
  final List<String> _filters = [
    'Normal',
    'Vivid',
    'Warm',
    'Cool',
    'B&W',
    'Vintage',
  ];
  String _selectedFilter = 'Normal';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    _recordingTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        await _setupCamera(_cameras![_selectedCameraIndex]);
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  Future<void> _setupCamera(CameraDescription camera) async {
    _controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );

    try {
      await _controller!.initialize();
      if (mounted) {
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      debugPrint('Error setting up camera: $e');
    }
  }

  Future<void> _toggleRecording() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    if (_isRecording) {
      await _stopRecording();
    } else {
      await _startRecording();
    }
  }

  Future<void> _startRecording() async {
    try {
      await _controller!.startVideoRecording();
      setState(() {
        _isRecording = true;
        _recordedSeconds = 0;
      });

      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() => _recordedSeconds++);
        if (_recordedSeconds >= _selectedDuration) {
          _stopRecording();
        }
      });
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    try {
      _recordingTimer?.cancel();
      final video = await _controller!.stopVideoRecording();
      setState(() => _isRecording = false);
      
      // TODO: Navigate to video editing page
      debugPrint('Video saved: ${video.path}');
    } catch (e) {
      debugPrint('Error stopping recording: $e');
    }
  }

  Future<void> _flipCamera() async {
    if (_cameras == null || _cameras!.length < 2) return;

    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
    await _setupCamera(_cameras![_selectedCameraIndex]);
  }

  Future<void> _toggleFlash() async {
    if (_controller == null) return;

    final modes = [FlashMode.off, FlashMode.always, FlashMode.auto];
    final currentIndex = modes.indexOf(_flashMode);
    _flashMode = modes[(currentIndex + 1) % modes.length];
    await _controller!.setFlashMode(_flashMode);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _controller == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          Center(
            child: CameraPreview(_controller!),
          ),

          // Top Controls
          SafeArea(
            child: Column(
              children: [
                _buildTopControls(),
                const Spacer(),
                _buildBottomControls(),
              ],
            ),
          ),

          // Recording Progress
          if (_isRecording) _buildRecordingProgress(),
        ],
      ),
    );
  }

  Widget _buildTopControls() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Close Button
              GlassContainer(
                padding: const EdgeInsets.all(AppSpacing.sm),
                borderRadius: BorderRadius.circular(AppRadius.full),
                child: IconButton(
                  icon: const Icon(Icons.close),
                  color: AppColors.textPrimary,
                  onPressed: () => Navigator.pop(context),
                ),
              ),

              // Center Controls
              Row(
                children: [
                  _buildTopButton(
                    icon: _getFlashIcon(),
                    onTap: _toggleFlash,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _buildTopButton(
                    icon: Iconsax.timer_1,
                    onTap: () {
                      // TODO: Show timer options
                    },
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _buildTopButton(
                    icon: Iconsax.music,
                    onTap: () {
                      // TODO: Show music selector
                    },
                  ),
                ],
              ),

              // Flip Camera Button
              GlassContainer(
                padding: const EdgeInsets.all(AppSpacing.sm),
                borderRadius: BorderRadius.circular(AppRadius.full),
                child: IconButton(
                  icon: const Icon(Iconsax.camera),
                  color: AppColors.textPrimary,
                  onPressed: _flipCamera,
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.lg),

          // Duration Selector
          _buildDurationSelector(),

          const SizedBox(height: AppSpacing.lg),

          // Beauty Filter Slider
          _buildBeautySlider(),
        ],
      ),
    );
  }

  Widget _buildTopButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GlassContainer(
      padding: const EdgeInsets.all(AppSpacing.sm),
      borderRadius: BorderRadius.circular(AppRadius.full),
      child: IconButton(
        icon: Icon(icon),
        color: AppColors.textPrimary,
        onPressed: onTap,
        iconSize: 24,
      ),
    );
  }

  IconData _getFlashIcon() {
    switch (_flashMode) {
      case FlashMode.off:
        return Iconsax.flash_slash;
      case FlashMode.always:
        return Iconsax.flash_1;
      case FlashMode.auto:
        return Iconsax.flash;
      default:
        return Iconsax.flash_slash;
    }
  }

  Widget _buildDurationSelector() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: _durations.map((duration) {
        final isSelected = duration == _selectedDuration;
        return GestureDetector(
          onTap: () => setState(() => _selectedDuration = duration),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              gradient: isSelected ? AppGradients.primary : null,
              color: isSelected ? null : AppColors.glassLight,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              boxShadow: isSelected ? AppShadows.neonPink : null,
            ),
            child: Text(
              duration >= 60 ? '${duration ~/ 60}m' : '${duration}s',
              style: AppTypography.labelLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBeautySlider() {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          const Icon(
            Iconsax.magic_star,
            color: AppColors.textPrimary,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: SliderTheme(
              data: SliderThemeData(
                activeTrackColor: AppColors.primary,
                inactiveTrackColor: AppColors.borderLight,
                thumbColor: AppColors.primary,
                overlayColor: AppColors.primary.withValues(alpha: 0.2),
                thumbShape: const RoundSliderThumbShape(
                  enabledThumbRadius: 8,
                ),
              ),
              child: Slider(
                value: _beautyLevel,
                onChanged: (value) {
                  setState(() => _beautyLevel = value);
                  // TODO: Apply beauty filter
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          // Filter Selector
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final isSelected = filter == _selectedFilter;
                return GestureDetector(
                  onTap: () => setState(() => _selectedFilter = filter),
                  child: Container(
                    margin: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.xs,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      gradient: isSelected ? AppGradients.accent : null,
                      color: isSelected ? null : AppColors.glassLight,
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                    ),
                    child: Text(
                      filter,
                      style: AppTypography.labelMedium.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // Recording Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Gallery Button
              GlassContainer(
                padding: const EdgeInsets.all(AppSpacing.md),
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: const Icon(
                  Iconsax.gallery,
                  color: AppColors.textPrimary,
                  size: 28,
                ),
              ),

              // Record Button
              GestureDetector(
                onTap: _toggleRecording,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.textPrimary,
                      width: 4,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        gradient: _isRecording
                            ? null
                            : AppGradients.primary,
                        color: _isRecording ? AppColors.error : null,
                        shape: _isRecording
                            ? BoxShape.rectangle
                            : BoxShape.circle,
                        borderRadius: _isRecording
                            ? BorderRadius.circular(AppRadius.sm)
                            : null,
                        boxShadow: AppShadows.neonRainbow,
                      ),
                    ),
                  ),
                ),
              ),

              // Effects Button
              GlassContainer(
                padding: const EdgeInsets.all(AppSpacing.md),
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: const Icon(
                  Iconsax.magic_star,
                  color: AppColors.textPrimary,
                  size: 28,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecordingProgress() {
    final progress = _recordedSeconds / _selectedDuration;

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Container(
          height: 4,
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          decoration: BoxDecoration(
            gradient: AppGradients.primary,
            borderRadius: BorderRadius.circular(AppRadius.full),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: progress,
            child: Container(
              decoration: BoxDecoration(
                gradient: AppGradients.primary,
                borderRadius: BorderRadius.circular(AppRadius.full),
                boxShadow: AppShadows.neonPink,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
