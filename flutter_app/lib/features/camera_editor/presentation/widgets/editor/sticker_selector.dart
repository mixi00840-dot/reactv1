import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../models/video_editing_models.dart';
import '../../../providers/video_editor_provider.dart';

/// Sticker selector with categories
class StickerSelector extends ConsumerStatefulWidget {
  const StickerSelector({super.key});

  @override
  ConsumerState<StickerSelector> createState() => _StickerSelectorState();
}

class _StickerSelectorState extends ConsumerState<StickerSelector> {
  StickerCategory _selectedCategory = StickerCategory.emoji;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          const Text(
            'Add Sticker',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 16),

          // Category tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: StickerCategory.values.map((category) {
                final isSelected = _selectedCategory == category;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = category),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primary
                          : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Text(
                          category.icon,
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          category.label,
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white70,
                            fontSize: 12,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 16),

          // Sticker grid
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: StickerPresets.getStickers(_selectedCategory).length,
              itemBuilder: (context, index) {
                final sticker =
                    StickerPresets.getStickers(_selectedCategory)[index];
                return _buildStickerButton(sticker);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickerButton(String sticker) {
    return GestureDetector(
      onTap: () => _addSticker(sticker),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
            width: 1,
          ),
        ),
        child: Center(
          child: Text(
            sticker,
            style: const TextStyle(fontSize: 32),
          ),
        ),
      ),
    );
  }

  void _addSticker(String sticker) {
    ref.read(videoEditorProvider.notifier).addStickerOverlay(
          stickerType: 'emoji',
          content: sticker,
        );
    Navigator.pop(context);
  }
}

/// Add sticker button
class AddStickerButton extends ConsumerWidget {
  const AddStickerButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton.icon(
      onPressed: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          builder: (context) => const StickerSelector(),
        );
      },
      icon: const Icon(Icons.add_reaction),
      label: const Text('Add Sticker'),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      ),
    );
  }
}

/// Draggable sticker overlay on video
class DraggableStickerOverlay extends ConsumerStatefulWidget {
  final StickerOverlay overlay;
  final Size videoSize;
  final VoidCallback? onTap;

  const DraggableStickerOverlay({
    super.key,
    required this.overlay,
    required this.videoSize,
    this.onTap,
  });

  @override
  ConsumerState<DraggableStickerOverlay> createState() =>
      _DraggableStickerOverlayState();
}

class _DraggableStickerOverlayState
    extends ConsumerState<DraggableStickerOverlay> {
  late Offset _position;
  late double _scale;
  late double _rotation;

  @override
  void initState() {
    super.initState();
    _position = Offset(
      widget.overlay.position.dx * widget.videoSize.width,
      widget.overlay.position.dy * widget.videoSize.height,
    );
    _scale = widget.overlay.scale;
    _rotation = widget.overlay.rotation;
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _position.dx - 40,
      top: _position.dy - 40,
      child: GestureDetector(
        onTap: widget.onTap,
        onPanUpdate: (details) {
          setState(() {
            _position += details.delta;
            _updateOverlay();
          });
        },
        onScaleUpdate: (details) {
          setState(() {
            _scale *= details.scale;
            _rotation += details.rotation;
            _updateOverlay();
          });
        },
        child: Transform.rotate(
          angle: _rotation,
          child: Transform.scale(
            scale: _scale,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.5),
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  widget.overlay.content,
                  style: TextStyle(
                    fontSize: 48 * widget.overlay.size,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _updateOverlay() {
    final normalizedPosition = Offset(
      (_position.dx / widget.videoSize.width).clamp(0.0, 1.0),
      (_position.dy / widget.videoSize.height).clamp(0.0, 1.0),
    );

    final updated = widget.overlay.copyWith(
      position: normalizedPosition,
      scale: _scale.clamp(0.5, 3.0),
      rotation: _rotation,
    );

    ref.read(videoEditorProvider.notifier).updateStickerOverlay(
      widget.overlay.id,
      updated,
    );
  }
}
