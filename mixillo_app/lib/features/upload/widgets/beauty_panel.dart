import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/camera_provider.dart';
import '../models/ar_filter_model.dart';

/// Beauty Panel - Beauty effects with intensity sliders
class BeautyPanel extends StatefulWidget {
  final VoidCallback onClose;

  const BeautyPanel({
    super.key,
    required this.onClose,
  });

  @override
  State<BeautyPanel> createState() => _BeautyPanelState();
}

class _BeautyPanelState extends State<BeautyPanel> {
  // ignore: unused_field
  final Map<BeautyType, double> _intensities = {}; // For future intensity tracking

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CameraProvider>();
    final beautyEffects = provider.beautyEffects;
    final isEnabled = provider.beautyModeEnabled;

    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusXl),
          topRight: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: EdgeInsets.all(AppSpacing.screenPadding),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      'Beauty',
                      style: AppTypography.headlineSmall(context).copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Switch(
                      value: isEnabled,
                      onChanged: (value) {
                        provider.toggleBeautyMode();
                      },
                      activeColor: AppColors.primary,
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),

          // Beauty Effects List
          Expanded(
            child: isEnabled
                ? ListView(
                    padding: EdgeInsets.all(AppSpacing.screenPadding),
                    children: [
                      _buildBeautySlider(
                        BeautyType.smoothSkin,
                        'Smooth Skin',
                        Icons.face,
                        beautyEffects[BeautyType.smoothSkin] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.brighten,
                        'Brighten',
                        Icons.wb_sunny,
                        beautyEffects[BeautyType.brighten] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.whiten,
                        'Whiten',
                        Icons.auto_fix_high,
                        beautyEffects[BeautyType.whiten] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.shrinkFace,
                        'Shrink Face',
                        Icons.face_retouching_natural,
                        beautyEffects[BeautyType.shrinkFace] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.enlargeEyes,
                        'Enlarge Eyes',
                        Icons.remove_red_eye,
                        beautyEffects[BeautyType.enlargeEyes] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.slimNose,
                        'Slim Nose',
                        Icons.face,
                        beautyEffects[BeautyType.slimNose] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.removeBlemishes,
                        'Remove Blemishes',
                        Icons.healing,
                        beautyEffects[BeautyType.removeBlemishes] ?? 0.0,
                        provider,
                      ),
                      const SizedBox(height: 16),
                      _buildBeautySlider(
                        BeautyType.antiAging,
                        'Anti-Aging',
                        Icons.spa,
                        beautyEffects[BeautyType.antiAging] ?? 0.0,
                        provider,
                      ),
                    ],
                  )
                : Center(
                    child: Text(
                      'Enable beauty mode to adjust effects',
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildBeautySlider(
    BeautyType type,
    String label,
    IconData icon,
    double value,
    CameraProvider provider,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.bodyMedium(context).copyWith(
                color: Colors.white,
              ),
            ),
            const Spacer(),
            Text(
              '${(value * 100).toInt()}%',
              style: AppTypography.bodySmall(context).copyWith(
                color: Colors.white70,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Slider(
          value: value,
          onChanged: (newValue) {
            provider.setBeautyEffect(type, newValue);
          },
          activeColor: AppColors.primary,
          inactiveColor: Colors.white.withOpacity(0.3),
        ),
      ],
    );
  }
}

