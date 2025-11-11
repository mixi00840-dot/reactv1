import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Beauty effects processor for skin smoothing, brightening, and face slimming
class BeautyEffectsProcessor {
  /// Apply beauty effects to image based on detected face
  static Future<ui.Image?> applyBeautyEffects({
    required ui.Image originalImage,
    required Face face,
    required BeautySettings settings,
  }) async {
    if (!settings.hasAnyEffect) return originalImage;

    try {
      final recorder = ui.PictureRecorder();
      final canvas = ui.Canvas(recorder);
      final paint = ui.Paint();

      // Draw original image
      canvas.drawImage(originalImage, ui.Offset.zero, paint);

      // Apply effects based on settings
      if (settings.smoothness > 0) {
        await _applySkinSmoothing(
          canvas,
          originalImage,
          face,
          settings.smoothness,
        );
      }

      if (settings.brightness > 0) {
        _applyBrightening(canvas, face.boundingBox, settings.brightness);
      }

      if (settings.faceSlim > 0) {
        // Face slimming is complex and requires mesh deformation
        // For now, we'll implement a simple version
        _applyFaceSlimming(canvas, face.boundingBox, settings.faceSlim);
      }

      // Convert to image
      final picture = recorder.endRecording();
      final processedImage = await picture.toImage(
        originalImage.width,
        originalImage.height,
      );

      return processedImage;
    } catch (e) {
      debugPrint('❌ Beauty effects error: $e');
      return originalImage;
    }
  }

  /// Apply skin smoothing effect (blur + preserve edges)
  static Future<void> _applySkinSmoothing(
    ui.Canvas canvas,
    ui.Image image,
    Face face,
    double intensity,
  ) async {
    // Get face region
    final faceRect = face.boundingBox;
    
    // Create blur paint
    final blurPaint = ui.Paint()
      ..imageFilter = ui.ImageFilter.blur(
        sigmaX: intensity * 3,
        sigmaY: intensity * 3,
      )
      ..color = ui.Color.fromRGBO(255, 255, 255, intensity * 0.3);

    // Apply selective blur to face area
    canvas.saveLayer(faceRect, blurPaint);
    canvas.drawImage(image, ui.Offset.zero, ui.Paint());
    canvas.restore();
  }

  /// Apply face brightening effect
  static void _applyBrightening(
    ui.Canvas canvas,
    ui.Rect faceRect,
    double intensity,
  ) {
    final brightPaint = ui.Paint()
      ..color = ui.Color.fromRGBO(
        255,
        255,
        255,
        intensity * 0.15, // 15% max opacity
      )
      ..blendMode = ui.BlendMode.screen; // Screen blend for brightening

    // Expand rect slightly for natural falloff
    final expandedRect = faceRect.inflate(faceRect.width * 0.1);
    
    // Draw brightening layer with gradient
    final gradient = ui.Gradient.radial(
      expandedRect.center,
      expandedRect.width / 2,
      [
        brightPaint.color,
        brightPaint.color.withOpacity(0),
      ],
      [0.0, 1.0],
    );

    canvas.drawRect(
      expandedRect,
      ui.Paint()..shader = gradient,
    );
  }

  /// Apply face slimming effect (simplified version)
  static void _applyFaceSlimming(
    ui.Canvas canvas,
    ui.Rect faceRect,
    double intensity,
  ) {
    // This is a simplified visualization
    // Real face slimming requires mesh deformation with face contours
    
    // Create a slight horizontal squeeze illusion
    final slimPaint = ui.Paint()
      ..color = ui.Color.fromRGBO(0, 0, 0, intensity * 0.05)
      ..blendMode = ui.BlendMode.multiply;

    // Darken sides of face slightly
    final leftRect = ui.Rect.fromLTRB(
      faceRect.left,
      faceRect.top,
      faceRect.left + faceRect.width * 0.2,
      faceRect.bottom,
    );
    
    final rightRect = ui.Rect.fromLTRB(
      faceRect.right - faceRect.width * 0.2,
      faceRect.top,
      faceRect.right,
      faceRect.bottom,
    );

    canvas.drawRect(leftRect, slimPaint);
    canvas.drawRect(rightRect, slimPaint);
  }

  /// Apply beauty filter as ColorFilter (alternative to image processing)
  static ui.ColorFilter getBeautyColorFilter(BeautySettings settings) {
    if (!settings.hasAnyEffect) {
      return const ui.ColorFilter.matrix([
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
      ]);
    }

    // Create beauty matrix (brighten + soft pink tint)
    final brightnessAdd = settings.brightness * 20;
    final smoothnessReduction = settings.smoothness * 0.05;
    
    return ui.ColorFilter.matrix([
      1 - smoothnessReduction, 0, 0, 0, brightnessAdd,
      0, 1 - smoothnessReduction, 0, 0, brightnessAdd,
      0, 0, 1 - smoothnessReduction, 0, brightnessAdd * 0.8,
      0, 0, 0, 1, 0,
    ]);
  }

  /// Real-time beauty effect for camera preview (lightweight)
  static ui.Paint getBeautyPaint(BeautySettings settings) {
    return ui.Paint()
      ..colorFilter = getBeautyColorFilter(settings)
      ..imageFilter = settings.smoothness > 0
          ? ui.ImageFilter.blur(
              sigmaX: settings.smoothness * 1.5,
              sigmaY: settings.smoothness * 1.5,
            )
          : null;
  }
}

/// Beauty settings configuration
class BeautySettings {
  final double smoothness; // 0.0 to 1.0 (skin smoothing)
  final double brightness; // 0.0 to 1.0 (face brightening)
  final double faceSlim; // 0.0 to 1.0 (face slimming)

  const BeautySettings({
    this.smoothness = 0.0,
    this.brightness = 0.0,
    this.faceSlim = 0.0,
  });

  bool get hasAnyEffect =>
      smoothness > 0 || brightness > 0 || faceSlim > 0;

  BeautySettings copyWith({
    double? smoothness,
    double? brightness,
    double? faceSlim,
  }) {
    return BeautySettings(
      smoothness: smoothness ?? this.smoothness,
      brightness: brightness ?? this.brightness,
      faceSlim: faceSlim ?? this.faceSlim,
    );
  }

  /// Preset beauty levels
  static const BeautySettings none = BeautySettings();
  
  static const BeautySettings light = BeautySettings(
    smoothness: 0.3,
    brightness: 0.2,
    faceSlim: 0.1,
  );

  static const BeautySettings medium = BeautySettings(
    smoothness: 0.5,
    brightness: 0.4,
    faceSlim: 0.3,
  );

  static const BeautySettings strong = BeautySettings(
    smoothness: 0.7,
    brightness: 0.6,
    faceSlim: 0.5,
  );

  static const BeautySettings maximum = BeautySettings(
    smoothness: 1.0,
    brightness: 0.8,
    faceSlim: 0.7,
  );

  @override
  String toString() => 'BeautySettings(s: $smoothness, b: $brightness, fs: $faceSlim)';
}
