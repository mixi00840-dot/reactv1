import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../providers/face_effects_provider.dart';
import '../../../providers/camera_recording_provider.dart';
import '../face_effects/face_overlay_painter.dart';
import 'focus_ring_overlay.dart';

/// Camera preview widget with proper AspectRatio handling
/// Includes face detection overlay and focus ring
class CameraPreviewWidget extends ConsumerStatefulWidget {
  final CameraController? controller;
  final bool isInitialized;
  final VoidCallback? onTap;

  const CameraPreviewWidget({
    super.key,
    required this.controller,
    required this.isInitialized,
    this.onTap,
  });

  @override
  ConsumerState<CameraPreviewWidget> createState() =>
      _CameraPreviewWidgetState();
}

class _CameraPreviewWidgetState extends ConsumerState<CameraPreviewWidget> {
  Offset? _focusPoint;

  void _handleTapDown(TapDownDetails details) {
    if (!widget.isInitialized || widget.controller == null) return;

    final RenderBox box = context.findRenderObject() as RenderBox;
    final Offset localPoint = box.globalToLocal(details.globalPosition);

    setState(() {
      _focusPoint = localPoint;
    });

    // Set camera focus point
    final double x = localPoint.dx / box.size.width;
    final double y = localPoint.dy / box.size.height;

    widget.controller?.setFocusPoint(Offset(x, y));
    widget.controller?.setExposurePoint(Offset(x, y));

    widget.onTap?.call();

    // Clear focus ring after animation
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _focusPoint = null;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isInitialized || widget.controller == null) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
              SizedBox(height: 16),
              Text(
                'Initializing camera...',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

  final controller = widget.controller!;
  final size = MediaQuery.of(context).size;

    return GestureDetector(
      onTapDown: _handleTapDown,
      child: Container(
        color: Colors.black,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Full-screen camera preview (cover, crop if needed)
            Positioned.fill(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  // On Android, previewSize width/height can be swapped; use same approach as legacy page
                  width: controller.value.previewSize?.height ?? size.height,
                  height: controller.value.previewSize?.width ?? size.width,
                  child: CameraPreview(controller),
                ),
              ),
            ),

            // Face Detection Overlay
            Consumer(
              builder: (context, ref, child) {
                final faceEffects = ref.watch(faceEffectsProvider);
                
                if (!faceEffects.isFaceTrackingEnabled || 
                    faceEffects.detectedFaces.isEmpty) {
                  return const SizedBox.shrink();
                }

                return CustomPaint(
                  painter: FaceOverlayPainter(
                    faces: faceEffects.detectedFaces,
                    landmarksCache: faceEffects.faceLandmarksCache,
                    selectedMask: faceEffects.selectedFaceMask,
                    imageSize: Size(
                      controller.value.previewSize?.height ?? 1920,
                      controller.value.previewSize?.width ?? 1080,
                    ),
                    isFrontCamera: ref.watch(cameraRecordingProvider).isFrontCamera,
                    sensorOrientation: () {
                      int deg = 0;
                      final o = controller.value.deviceOrientation;
                      switch (o) {
                        case DeviceOrientation.portraitUp:
                          deg = 90;
                          break;
                        case DeviceOrientation.portraitDown:
                          deg = 270;
                          break;
                        case DeviceOrientation.landscapeLeft:
                          deg = 0;
                          break;
                        case DeviceOrientation.landscapeRight:
                          deg = 180;
                          break;
                      }
                      return deg;
                    }(),
                  ),
                  child: Container(),
                );
              },
            ),

            // Focus Ring Overlay
            FocusRingOverlay(
              focusPoint: _focusPoint,
              onFadeComplete: () {
                if (mounted) {
                  setState(() {
                    _focusPoint = null;
                  });
                }
              },
            ),

            // No black bars; preview fills entire screen (cropped if necessary)
          ],
        ),
      ),
    );
  }
}
