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
  final bool isFrontCamera;
  final int sensorOrientation; // degrees: 0,90,180,270

  FaceOverlayPainter({
    required this.faces,
    required this.landmarksCache,
    required this.selectedMask,
    required this.imageSize,
    required this.isFrontCamera,
    required this.sensorOrientation,
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

  Offset _transformPoint(int x, int y, double scaleX, double scaleY) {
    // Start with unscaled
    double nx = x.toDouble();
    double ny = y.toDouble();

    // Apply rotation from sensorOrientation (clockwise degrees)
    switch (sensorOrientation) {
      case 90:
        // (x,y) -> (y, imageWidth - x)
        final tx = ny;
        final ty = imageSize.width - nx;
        nx = tx;
        ny = ty;
        break;
      case 180:
        // (x,y) -> (imageWidth - x, imageHeight - y)
        nx = imageSize.width - nx;
        ny = imageSize.height - ny;
        break;
      case 270:
        // (x,y) -> (imageHeight - y, x)
        final tx = imageSize.height - ny;
        final ty = nx;
        nx = tx;
        ny = ty;
        break;
      default:
        break; // 0deg no change
    }

    // Mirror horizontally for front camera after rotation normalization
    if (isFrontCamera) {
      nx = imageSize.width - nx;
    }

    return Offset(nx * scaleX, ny * scaleY);
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
    final leftEarCenter = _transformPoint(
      landmarks.leftEar!.x,
      landmarks.leftEar!.y,
      scaleX,
      scaleY,
    );
    final leftEarPos = leftEarCenter.translate(-earSize / 2, -earSize);
    canvas.drawOval(
      Rect.fromCenter(
        center: leftEarPos,
        width: earSize,
        height: earSize * 1.5,
      ),
      paint,
    );

    // Right ear
    final rightEarCenter = _transformPoint(
      landmarks.rightEar!.x,
      landmarks.rightEar!.y,
      scaleX,
      scaleY,
    );
    final rightEarPos = rightEarCenter.translate(-earSize / 2, -earSize);
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
    final leftEarPos = _transformPoint(
      landmarks.leftEar!.x,
      landmarks.leftEar!.y,
      scaleX,
      scaleY,
    ).translate(0, -earSize);
    final leftEarPath = Path()
      ..moveTo(leftEarPos.dx, leftEarPos.dy)
      ..lineTo(leftEarPos.dx - earSize / 2, leftEarPos.dy - earSize)
      ..lineTo(leftEarPos.dx + earSize / 2, leftEarPos.dy - earSize)
      ..close();
    canvas.drawPath(leftEarPath, paint);

    // Right ear (triangle)
    final rightEarPos = _transformPoint(
      landmarks.rightEar!.x,
      landmarks.rightEar!.y,
      scaleX,
      scaleY,
    ).translate(0, -earSize);
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
    final leftEarCenter = _transformPoint(
      landmarks.leftEar!.x,
      landmarks.leftEar!.y,
      scaleX,
      scaleY,
    );
    final leftEarPos = leftEarCenter.translate(-earWidth / 2, -earHeight);
    canvas.drawOval(
      Rect.fromCenter(
        center: leftEarPos,
        width: earWidth,
        height: earHeight,
      ),
      paint,
    );

    // Right ear
    final rightEarCenter = _transformPoint(
      landmarks.rightEar!.x,
      landmarks.rightEar!.y,
      scaleX,
      scaleY,
    );
    final rightEarPos = rightEarCenter.translate(-earWidth / 2, -earHeight);
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

    // Transform face bounding box corners
    final topLeft = _transformPoint(
      face.boundingBox.left.toInt(),
      face.boundingBox.top.toInt(),
      scaleX,
      scaleY,
    );
    final bottomRight = _transformPoint(
      face.boundingBox.right.toInt(),
      face.boundingBox.bottom.toInt(),
      scaleX,
      scaleY,
    );
    final crownWidth = (bottomRight.dx - topLeft.dx);
    final crownHeight = (bottomRight.dy - topLeft.dy) * 0.2;
    final topY = topLeft.dy - crownHeight;
    final centerX = (topLeft.dx + bottomRight.dx) / 2;

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
    final leftEyePos = _transformPoint(
      landmarks.leftEye!.x,
      landmarks.leftEye!.y,
      scaleX,
      scaleY,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: leftEyePos,
          width: glassWidth,
          height: glassHeight,
        ),
        const Radius.circular(8),
      ),
      paint,
    );

    // Right lens
    final rightEyePos = _transformPoint(
      landmarks.rightEye!.x,
      landmarks.rightEye!.y,
      scaleX,
      scaleY,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: rightEyePos,
          width: glassWidth,
          height: glassHeight,
        ),
        const Radius.circular(8),
      ),
      paint,
    );

    // Bridge
    canvas.drawLine(
      Offset(leftEyePos.dx + glassWidth / 2, leftEyePos.dy),
      Offset(rightEyePos.dx - glassWidth / 2, rightEyePos.dy),
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

    final leftEyePos = _transformPoint(
      landmarks.leftEye!.x,
      landmarks.leftEye!.y,
      scaleX,
      scaleY,
    );
    _drawHeart(canvas, leftEyePos, heartSize, paint);

    final rightEyePos = _transformPoint(
      landmarks.rightEye!.x,
      landmarks.rightEye!.y,
      scaleX,
      scaleY,
    );
    _drawHeart(canvas, rightEyePos, heartSize, paint);
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
    final nosePos = _transformPoint(
      landmarks.noseBase!.x,
      landmarks.noseBase!.y,
      scaleX,
      scaleY,
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
