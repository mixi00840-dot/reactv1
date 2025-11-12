import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../models/video_editing_models.dart';
import '../../../providers/video_editor_provider.dart';

/// Text overlay editor with draggable positioning
class TextOverlayEditor extends ConsumerStatefulWidget {
  final TextOverlay overlay;
  final VoidCallback? onDelete;

  const TextOverlayEditor({
    super.key,
    required this.overlay,
    this.onDelete,
  });

  @override
  ConsumerState<TextOverlayEditor> createState() => _TextOverlayEditorState();
}

class _TextOverlayEditorState extends ConsumerState<TextOverlayEditor> {
  late TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.overlay.text);
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Edit Text',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: widget.onDelete,
                    icon: const Icon(Icons.delete, color: Colors.red),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Text input
          TextField(
            controller: _textController,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: 'Enter text...',
              hintStyle: const TextStyle(color: Colors.white54),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: (value) => _updateText(value),
            maxLines: 3,
          ),

          const SizedBox(height: 20),

          // Font size slider
          _buildSlider(
            label: 'Font Size',
            icon: Icons.format_size,
            value: widget.overlay.fontSize,
            min: 16,
            max: 72,
            onChanged: (value) => _updateFontSize(value),
          ),

          const SizedBox(height: 16),

          // Color picker
          Row(
            children: [
              const Icon(Icons.palette, color: Colors.white70, size: 20),
              const SizedBox(width: 12),
              const Text(
                'Text Color',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _showColorPicker(),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: widget.overlay.color,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Font weight selector
          Row(
            children: [
              const Icon(Icons.format_bold, color: Colors.white70, size: 20),
              const SizedBox(width: 12),
              const Text(
                'Font Weight',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const Spacer(),
              _buildFontWeightButton(FontWeight.normal, 'Normal'),
              const SizedBox(width: 8),
              _buildFontWeightButton(FontWeight.bold, 'Bold'),
            ],
          ),

          const SizedBox(height: 20),

          // Time range
          const Text(
            'Display Time',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Start: ${_formatDuration(widget.overlay.startTime)}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'End: ${_formatDuration(widget.overlay.endTime)}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Done button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Done',
                style: TextStyle(
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

  Widget _buildSlider({
    required String label,
    required IconData icon,
    required double value,
    required double min,
    required double max,
    required ValueChanged<double> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white70, size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            const Spacer(),
            Text(
              value.toInt().toString(),
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        SliderTheme(
          data: SliderThemeData(
            activeTrackColor: AppColors.primary,
            inactiveTrackColor: Colors.white24,
            thumbColor: AppColors.primary,
            overlayColor: AppColors.primary.withValues(alpha: 0.2),
          ),
          child: Slider(
            value: value,
            min: min,
            max: max,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  Widget _buildFontWeightButton(FontWeight weight, String label) {
    final isSelected = widget.overlay.fontWeight == weight;
    return GestureDetector(
      onTap: () => _updateFontWeight(weight),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: weight,
          ),
        ),
      ),
    );
  }

  void _showColorPicker() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey.shade900,
        title: const Text('Pick a color', style: TextStyle(color: Colors.white)),
        content: SingleChildScrollView(
          child: ColorPicker(
            pickerColor: widget.overlay.color,
            onColorChanged: (color) => _updateColor(color),
            pickerAreaHeightPercent: 0.8,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Done', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  void _updateText(String text) {
    final updated = widget.overlay.copyWith(text: text);
    ref.read(videoEditorProvider.notifier).updateTextOverlay(
      widget.overlay.id,
      updated,
    );
  }

  void _updateFontSize(double fontSize) {
    final updated = widget.overlay.copyWith(fontSize: fontSize);
    ref.read(videoEditorProvider.notifier).updateTextOverlay(
      widget.overlay.id,
      updated,
    );
  }

  void _updateColor(Color color) {
    final updated = widget.overlay.copyWith(color: color);
    ref.read(videoEditorProvider.notifier).updateTextOverlay(
      widget.overlay.id,
      updated,
    );
  }

  void _updateFontWeight(FontWeight weight) {
    final updated = widget.overlay.copyWith(fontWeight: weight);
    ref.read(videoEditorProvider.notifier).updateTextOverlay(
      widget.overlay.id,
      updated,
    );
  }

  String _formatDuration(Duration duration) {
    final seconds = duration.inSeconds;
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}

/// Add text button
class AddTextButton extends ConsumerWidget {
  const AddTextButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      onPressed: () {
        ref.read(videoEditorProvider.notifier).addTextOverlay();
      },
      icon: const Icon(Icons.text_fields),
      label: const Text('Add Text'),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      ),
    );
  }
}
