import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Bottom camera controls: Record button, Effects, Sounds, Delete, Next
class CameraControls extends StatefulWidget {
  final bool isRecording;
  final bool hasClips;
  final VoidCallback onRecordStart;
  final VoidCallback onRecordStop;
  final VoidCallback onDeleteLastClip;
  final VoidCallback onNext;
  final VoidCallback onEffectsTap;
  final VoidCallback onSoundsTap;

  const CameraControls({
    Key? key,
    required this.isRecording,
    required this.hasClips,
    required this.onRecordStart,
    required this.onRecordStop,
    required this.onDeleteLastClip,
    required this.onNext,
    required this.onEffectsTap,
    required this.onSoundsTap,
  }) : super(key: key);

  @override
  State<CameraControls> createState() => _CameraControlsState();
}

class _CameraControlsState extends State<CameraControls>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppSpacing.cameraBottomControlsHeight,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.7),
          ],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Effects button
              _buildSideButton(
                icon: Icons.auto_awesome,
                label: 'Effects',
                onTap: widget.onEffectsTap,
              ),

              // Record button & Delete
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Delete button (shows above record when clips exist)
                  if (widget.hasClips && !widget.isRecording)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.mediumImpact();
                          widget.onDeleteLastClip();
                        },
                        child: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.whiteOverlay20,
                            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),

                  // Main record button
                  _buildRecordButton(),
                ],
              ),

              // Sounds button & Next
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Next button (shows when clips exist)
                  if (widget.hasClips && !widget.isRecording)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.mediumImpact();
                          widget.onNext();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: AppSpacing.sm,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                          ),
                          child: const Row(
                            children: [
                              Text(
                                'Next',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward,
                                color: Colors.white,
                                size: 16,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // Sounds button
                  _buildSideButton(
                    icon: Icons.music_note,
                    label: 'Sounds',
                    onTap: widget.onSoundsTap,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecordButton() {
    return GestureDetector(
      onTapDown: (_) {
        if (!widget.isRecording) {
          HapticFeedback.heavyImpact();
          widget.onRecordStart();
        }
      },
      onTapUp: (_) {
        if (widget.isRecording) {
          HapticFeedback.heavyImpact();
          widget.onRecordStop();
        }
      },
      onTapCancel: () {
        if (widget.isRecording) {
          HapticFeedback.heavyImpact();
          widget.onRecordStop();
        }
      },
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            width: AppSpacing.cameraButtonSize,
            height: AppSpacing.cameraButtonSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: widget.isRecording ? AppColors.error : Colors.white,
                width: 4,
              ),
              boxShadow: widget.isRecording
                  ? [
                      BoxShadow(
                        color: AppColors.error.withOpacity(0.5),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: widget.isRecording
                    ? AppSpacing.cameraButtonInnerSize * 0.5
                    : AppSpacing.cameraButtonInnerSize,
                height: widget.isRecording
                    ? AppSpacing.cameraButtonInnerSize * 0.5
                    : AppSpacing.cameraButtonInnerSize,
                decoration: BoxDecoration(
                  color: widget.isRecording ? AppColors.error : AppColors.primary,
                  borderRadius: BorderRadius.circular(
                    widget.isRecording ? AppSpacing.radiusSm : AppSpacing.radiusFull,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSideButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.whiteOverlay20,
              borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
