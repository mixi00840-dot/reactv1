import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../../../models/face_effects_state.dart';
import '../../../services/face_detection_service.dart';

/// Custom painter for AR face overlays
class FaceOverlayPainter extends CustomPainter {
  final List<Face> faces;
  final Map<int, FaceLandmarks>? landmarksCache;
  final String? selectedMask;
  final Size imageSize;

  FaceOverlayPainter({
    required this.faces,
    required this.landmarksCache,
    required this.selectedMask,
    required this.imageSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (faces.isEmpty || selectedMask == null) return;

    final scaleX = size.width / imageSize.width;
    final scaleY = size.height / imageSize.height;

    for (final face in faces) {
      if (face.trackingId != null) {
        final landmarks = landmarksCache?[face.trackingId!];
        if (landmarks != null) {
          _drawFaceMask(
            canvas,
            face,
            landmarks,
            selectedMask!,
            scaleX,
            scaleY,
          );
        }
      }
    }
  }

  void _drawFaceMask(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    String maskType,
    double scaleX,
    double scaleY,
  ) {
    final maskTypeEnum = FaceMaskType.fromString(maskType);

    switch (maskTypeEnum) {
      case FaceMaskType.dogEars:
        _drawDogEars(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.catEars:
        _drawCatEars(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.bunnyEars:
        _drawBunnyEars(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.crown:
        _drawCrown(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.sunglasses:
        _drawSunglasses(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.heartEyes:
        _drawHeartEyes(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.flowers:
        _drawFlowers(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.butterfly:
        _drawButterfly(canvas, face, landmarks, scaleX, scaleY);
        break;
      case FaceMaskType.none:
        break;
    }
  }

  void _drawDogEars(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.leftEar == null || landmarks.rightEar == null) return;

    final paint = Paint()
      ..color = const Color(0xFFD2691E) // Brown
      ..style = PaintingStyle.fill;

    final earSize = face.boundingBox.width * 0.25 * scaleX;

    // Left ear
    final leftEarPos = Offset(
      landmarks.leftEar!.x * scaleX - earSize / 2,
      landmarks.leftEar!.y * scaleY - earSize,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: leftEarPos,
        width: earSize,
        height: earSize * 1.5,
      ),
      paint,
    );

    // Right ear
    final rightEarPos = Offset(
      landmarks.rightEar!.x * scaleX - earSize / 2,
      landmarks.rightEar!.y * scaleY - earSize,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: rightEarPos,
        width: earSize,
        height: earSize * 1.5,
      ),
      paint,
    );
  }

  void _drawCatEars(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.leftEar == null || landmarks.rightEar == null) return;

    final paint = Paint()
      ..color = Colors.pink
      ..style = PaintingStyle.fill;

    final earSize = face.boundingBox.width * 0.2 * scaleX;

    // Left ear (triangle)
    final leftEarPos = Offset(
      landmarks.leftEar!.x * scaleX,
      landmarks.leftEar!.y * scaleY - earSize,
    );
    final leftEarPath = Path()
      ..moveTo(leftEarPos.dx, leftEarPos.dy)
      ..lineTo(leftEarPos.dx - earSize / 2, leftEarPos.dy - earSize)
      ..lineTo(leftEarPos.dx + earSize / 2, leftEarPos.dy - earSize)
      ..close();
    canvas.drawPath(leftEarPath, paint);

    // Right ear (triangle)
    final rightEarPos = Offset(
      landmarks.rightEar!.x * scaleX,
      landmarks.rightEar!.y * scaleY - earSize,
    );
    final rightEarPath = Path()
      ..moveTo(rightEarPos.dx, rightEarPos.dy)
      ..lineTo(rightEarPos.dx - earSize / 2, rightEarPos.dy - earSize)
      ..lineTo(rightEarPos.dx + earSize / 2, rightEarPos.dy - earSize)
      ..close();
    canvas.drawPath(rightEarPath, paint);
  }

  void _drawBunnyEars(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.leftEar == null || landmarks.rightEar == null) return;

    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final earWidth = face.boundingBox.width * 0.15 * scaleX;
    final earHeight = face.boundingBox.width * 0.5 * scaleY;

    // Left ear
    final leftEarPos = Offset(
      landmarks.leftEar!.x * scaleX - earWidth / 2,
      landmarks.leftEar!.y * scaleY - earHeight,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: leftEarPos,
        width: earWidth,
        height: earHeight,
      ),
      paint,
    );

    // Right ear
    final rightEarPos = Offset(
      landmarks.rightEar!.x * scaleX - earWidth / 2,
      landmarks.rightEar!.y * scaleY - earHeight,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: rightEarPos,
        width: earWidth,
        height: earHeight,
      ),
      paint,
    );
  }

  void _drawCrown(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    final paint = Paint()
      ..color = const Color(0xFFFFD700) // Gold
      ..style = PaintingStyle.fill;

    final crownWidth = face.boundingBox.width * scaleX;
    final crownHeight = face.boundingBox.height * 0.2 * scaleY;
    final topY = face.boundingBox.top * scaleY - crownHeight;
    final centerX = face.boundingBox.center.dx * scaleX;

    final crownPath = Path()
      ..moveTo(centerX - crownWidth / 2, topY + crownHeight)
      ..lineTo(centerX - crownWidth / 3, topY)
      ..lineTo(centerX - crownWidth / 6, topY + crownHeight / 2)
      ..lineTo(centerX, topY)
      ..lineTo(centerX + crownWidth / 6, topY + crownHeight / 2)
      ..lineTo(centerX + crownWidth / 3, topY)
      ..lineTo(centerX + crownWidth / 2, topY + crownHeight)
      ..close();

    canvas.drawPath(crownPath, paint);
  }

  void _drawSunglasses(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.leftEye == null || landmarks.rightEye == null) return;

    final paint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    final glassWidth = face.boundingBox.width * 0.25 * scaleX;
    final glassHeight = face.boundingBox.height * 0.15 * scaleY;

    // Left lens
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(
            landmarks.leftEye!.x * scaleX,
            landmarks.leftEye!.y * scaleY,
          ),
          width: glassWidth,
          height: glassHeight,
        ),
        const Radius.circular(8),
      ),
      paint,
    );

    // Right lens
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(
            landmarks.rightEye!.x * scaleX,
            landmarks.rightEye!.y * scaleY,
          ),
          width: glassWidth,
          height: glassHeight,
        ),
        const Radius.circular(8),
      ),
      paint,
    );

    // Bridge
    canvas.drawLine(
      Offset(
        landmarks.leftEye!.x * scaleX + glassWidth / 2,
        landmarks.leftEye!.y * scaleY,
      ),
      Offset(
        landmarks.rightEye!.x * scaleX - glassWidth / 2,
        landmarks.rightEye!.y * scaleY,
      ),
      Paint()
        ..color = Colors.black
        ..strokeWidth = 3,
    );
  }

  void _drawHeartEyes(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.leftEye == null || landmarks.rightEye == null) return;

    final paint = Paint()
      ..color = Colors.red
      ..style = PaintingStyle.fill;

    final heartSize = face.boundingBox.width * 0.12 * scaleX;

    _drawHeart(
      canvas,
      Offset(
        landmarks.leftEye!.x * scaleX,
        landmarks.leftEye!.y * scaleY,
      ),
      heartSize,
      paint,
    );

    _drawHeart(
      canvas,
      Offset(
        landmarks.rightEye!.x * scaleX,
        landmarks.rightEye!.y * scaleY,
      ),
      heartSize,
      paint,
    );
  }

  void _drawHeart(Canvas canvas, Offset center, double size, Paint paint) {
    final path = Path();
    path.moveTo(center.dx, center.dy + size / 2);
    path.cubicTo(
      center.dx - size / 2,
      center.dy - size / 4,
      center.dx - size,
      center.dy,
      center.dx,
      center.dy - size / 2,
    );
    path.cubicTo(
      center.dx + size,
      center.dy,
      center.dx + size / 2,
      center.dy - size / 4,
      center.dx,
      center.dy + size / 2,
    );
    canvas.drawPath(path, paint);
  }

  void _drawFlowers(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    final paint = Paint()
      ..color = Colors.pink.shade300
      ..style = PaintingStyle.fill;

    final flowerSize = face.boundingBox.width * 0.15 * scaleX;
    final topY = face.boundingBox.top * scaleY - flowerSize;
    final centerX = face.boundingBox.center.dx * scaleX;

    // Draw 3 flowers on top of head
    for (int i = -1; i <= 1; i++) {
      final x = centerX + i * flowerSize * 1.2;
      _drawFlower(canvas, Offset(x, topY), flowerSize, paint);
    }
  }

  void _drawFlower(Canvas canvas, Offset center, double size, Paint paint) {
    // Petals
    for (int i = 0; i < 6; i++) {
      final angle = (i * 60) * (3.14159 / 180);
      final petalCenter = Offset(
        center.dx + size / 3 * cos(angle),
        center.dy + size / 3 * sin(angle),
      );
      canvas.drawCircle(petalCenter, size / 3, paint);
    }

    // Center
    canvas.drawCircle(
      center,
      size / 4,
      Paint()..color = Colors.yellow,
    );
  }

  void _drawButterfly(
    Canvas canvas,
    Face face,
    FaceLandmarks landmarks,
    double scaleX,
    double scaleY,
  ) {
    if (landmarks.noseBase == null) return;

    final paint = Paint()
      ..color = Colors.purple.shade300
      ..style = PaintingStyle.fill;

    final wingSize = face.boundingBox.width * 0.2 * scaleX;
    final nosePos = Offset(
      landmarks.noseBase!.x * scaleX,
      landmarks.noseBase!.y * scaleY,
    );

    // Left wing
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(nosePos.dx - wingSize / 2, nosePos.dy),
        width: wingSize,
        height: wingSize * 0.7,
      ),
      paint,
    );

    // Right wing
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(nosePos.dx + wingSize / 2, nosePos.dy),
        width: wingSize,
        height: wingSize * 0.7,
      ),
      paint,
    );

    // Body
    canvas.drawLine(
      Offset(nosePos.dx, nosePos.dy - wingSize / 2),
      Offset(nosePos.dx, nosePos.dy + wingSize / 2),
      Paint()
        ..color = Colors.black
        ..strokeWidth = 3,
    );
  }

  double cos(double radians) => math.cos(radians);
  double sin(double radians) => math.sin(radians);

  @override
  bool shouldRepaint(FaceOverlayPainter oldDelegate) {
    return faces != oldDelegate.faces ||
        selectedMask != oldDelegate.selectedMask;
  }
}
