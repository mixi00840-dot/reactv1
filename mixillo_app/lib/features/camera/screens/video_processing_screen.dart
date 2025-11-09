import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/services/video_processing_service.dart';
import '../models/video_clip.dart';
import 'video_preview_screen.dart';

/// Video processing screen
/// Shows progress while FFmpeg processes and merges video clips
class VideoProcessingScreen extends StatefulWidget {
  final List<VideoClip> clips;
  final String? audioPath;
  final VideoQuality quality;

  const VideoProcessingScreen({
    Key? key,
    required this.clips,
    this.audioPath,
    this.quality = VideoQuality.high,
  }) : super(key: key);

  @override
  State<VideoProcessingScreen> createState() => _VideoProcessingScreenState();
}

class _VideoProcessingScreenState extends State<VideoProcessingScreen>
    with SingleTickerProviderStateMixin {
  final VideoProcessingService _processingService = VideoProcessingService();
  
  double _progress = 0.0;
  String _currentStep = 'Initializing...';
  bool _isProcessing = true;
  String? _errorMessage;
  
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _initAnimation();
    _startProcessing();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _initAnimation() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    
    _animation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
  }

  Future<void> _startProcessing() async {
    try {
      final settings = VideoProcessingSettings(
        clips: widget.clips,
        audioPath: widget.audioPath,
        quality: widget.quality,
      );

      final result = await _processingService.processVideo(
        settings,
        onProgress: (progress) {
          setState(() {
            _progress = progress;
            _updateStepMessage(progress);
          });
        },
      );

      setState(() {
        _isProcessing = false;
      });

      // Navigate to preview screen
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => VideoPreviewScreen(
              processedVideo: result,
              originalClips: widget.clips,
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
        _errorMessage = e.toString();
      });
    }
  }

  void _updateStepMessage(double progress) {
    if (progress < 0.4) {
      _currentStep = 'Processing clips...';
    } else if (progress < 0.5) {
      _currentStep = 'Applying effects...';
    } else if (progress < 0.7) {
      _currentStep = 'Merging videos...';
    } else if (progress < 0.8) {
      _currentStep = 'Adding audio...';
    } else if (progress < 0.9) {
      _currentStep = 'Compressing...';
    } else {
      _currentStep = 'Finalizing...';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              
              // Animated icon
              if (_isProcessing)
                ScaleTransition(
                  scale: _animation,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary,
                          AppColors.secondary,
                        ],
                      ),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      size: 60,
                      color: Colors.white,
                    ),
                  ),
                )
              else if (_errorMessage != null)
                const Icon(
                  Icons.error_outline,
                  size: 120,
                  color: AppColors.error,
                )
              else
                const Icon(
                  Icons.check_circle_outline,
                  size: 120,
                  color: AppColors.success,
                ),
              
              const SizedBox(height: AppSpacing.xl),
              
              // Title
              Text(
                _isProcessing
                    ? 'Creating your video'
                    : _errorMessage != null
                        ? 'Processing failed'
                        : 'Video ready!',
                style: AppTextStyles.h1.copyWith(
                  color: AppColors.darkTextPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.md),
              
              // Current step or error
              Text(
                _errorMessage ?? _currentStep,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.darkTextSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.xl),
              
              // Progress bar
              if (_isProcessing) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  child: LinearProgressIndicator(
                    value: _progress,
                    backgroundColor: AppColors.darkTextDisabled,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.primary,
                    ),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  '${(_progress * 100).toInt()}%',
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ],
              
              const Spacer(),
              
              // Action buttons
              if (_errorMessage != null) ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _errorMessage = null;
                        _isProcessing = true;
                        _progress = 0.0;
                      });
                      _startProcessing();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      ),
                    ),
                    child: Text(
                      'Retry',
                      style: AppTextStyles.buttonLarge.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.darkTextSecondary),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      ),
                    ),
                    child: Text(
                      'Cancel',
                      style: AppTextStyles.buttonLarge.copyWith(
                        color: AppColors.darkTextPrimary,
                      ),
                    ),
                  ),
                ),
              ],
              
              // Processing info
              if (_isProcessing)
                Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.lg),
                  child: Text(
                    'This may take a few moments...',
                    style: AppTextStyles.captionMedium.copyWith(
                      color: AppColors.darkTextSecondary,
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
