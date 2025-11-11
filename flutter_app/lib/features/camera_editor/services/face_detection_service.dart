import 'dart:ui' as ui;
import 'dart:math' show Point;
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Service for ML Kit face detection and landmark extraction
class FaceDetectionService {
  late FaceDetector _faceDetector;
  bool _isInitialized = false;
  bool _isProcessing = false;

  /// Initialize ML Kit face detector with optimal settings
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableClassification: true, // Smile, eyes open probability
          enableLandmarks: true, // Eye, nose, mouth positions
          enableTracking: true, // Track faces across frames
          enableContours: true, // Full face mesh contours
          minFaceSize: 0.15, // Minimum face size (15% of image)
          performanceMode: FaceDetectorMode.fast, // Optimized for real-time
        ),
      );
      _isInitialized = true;
      debugPrint('✅ Face detection service initialized');
    } catch (e) {
      debugPrint('❌ Failed to initialize face detector: $e');
      rethrow;
    }
  }

  /// Detect faces in camera image
  Future<List<Face>> detectFaces(CameraImage cameraImage) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_isProcessing) {
      return []; // Skip frame if still processing
    }

    _isProcessing = true;

    try {
      // Convert CameraImage to InputImage for ML Kit
      final inputImage = _convertCameraImage(cameraImage);
      if (inputImage == null) {
        _isProcessing = false;
        return [];
      }

      // Process with ML Kit
      final faces = await _faceDetector.processImage(inputImage);
      _isProcessing = false;

      return faces;
    } catch (e) {
      debugPrint('❌ Face detection error: $e');
      _isProcessing = false;
      return [];
    }
  }

  /// Convert CameraImage to ML Kit InputImage
  InputImage? _convertCameraImage(CameraImage cameraImage) {
    try {
      // Get image rotation
      final sensorOrientation = 0; // TODO: Get from camera controller
      final rotationValue = _rotationIntToImageRotation(sensorOrientation);

      // Get image format
      final format = InputImageFormatValue.fromRawValue(cameraImage.format.raw);
      if (format == null) return null;

      // Get plane data
      if (cameraImage.planes.isEmpty) return null;
      final plane = cameraImage.planes.first;

      return InputImage.fromBytes(
        bytes: plane.bytes,
        metadata: InputImageMetadata(
          size: ui.Size(cameraImage.width.toDouble(), cameraImage.height.toDouble()),
          rotation: rotationValue,
          format: format,
          bytesPerRow: plane.bytesPerRow,
        ),
      );
    } catch (e) {
      debugPrint('❌ Failed to convert camera image: $e');
      return null;
    }
  }

  /// Convert rotation degrees to InputImageRotation
  InputImageRotation _rotationIntToImageRotation(int rotation) {
    switch (rotation) {
      case 90:
        return InputImageRotation.rotation90deg;
      case 180:
        return InputImageRotation.rotation180deg;
      case 270:
        return InputImageRotation.rotation270deg;
      default:
        return InputImageRotation.rotation0deg;
    }
  }

  /// Extract face landmarks for AR overlay positioning
  FaceLandmarks? extractLandmarks(Face face) {
    if (face.landmarks.isEmpty) return null;

    return FaceLandmarks(
      leftEye: face.landmarks[FaceLandmarkType.leftEye]?.position,
      rightEye: face.landmarks[FaceLandmarkType.rightEye]?.position,
      noseBase: face.landmarks[FaceLandmarkType.noseBase]?.position,
      bottomMouth: face.landmarks[FaceLandmarkType.bottomMouth]?.position,
      leftMouth: face.landmarks[FaceLandmarkType.leftMouth]?.position,
      rightMouth: face.landmarks[FaceLandmarkType.rightMouth]?.position,
      leftCheek: face.landmarks[FaceLandmarkType.leftCheek]?.position,
      rightCheek: face.landmarks[FaceLandmarkType.rightCheek]?.position,
      leftEar: face.landmarks[FaceLandmarkType.leftEar]?.position,
      rightEar: face.landmarks[FaceLandmarkType.rightEar]?.position,
    );
  }

  /// Extract face contours for advanced AR effects
  FaceContours? extractContours(Face face) {
    if (face.contours.isEmpty) return null;

    return FaceContours(
      faceOval: face.contours[FaceContourType.face]?.points ?? [],
      leftEyebrowTop: face.contours[FaceContourType.leftEyebrowTop]?.points ?? [],
      leftEyebrowBottom: face.contours[FaceContourType.leftEyebrowBottom]?.points ?? [],
      rightEyebrowTop: face.contours[FaceContourType.rightEyebrowTop]?.points ?? [],
      rightEyebrowBottom: face.contours[FaceContourType.rightEyebrowBottom]?.points ?? [],
      leftEye: face.contours[FaceContourType.leftEye]?.points ?? [],
      rightEye: face.contours[FaceContourType.rightEye]?.points ?? [],
      upperLipTop: face.contours[FaceContourType.upperLipTop]?.points ?? [],
      upperLipBottom: face.contours[FaceContourType.upperLipBottom]?.points ?? [],
      lowerLipTop: face.contours[FaceContourType.lowerLipTop]?.points ?? [],
      lowerLipBottom: face.contours[FaceContourType.lowerLipBottom]?.points ?? [],
      noseBridge: face.contours[FaceContourType.noseBridge]?.points ?? [],
      noseBottom: face.contours[FaceContourType.noseBottom]?.points ?? [],
      leftCheek: face.contours[FaceContourType.leftCheek]?.points ?? [],
      rightCheek: face.contours[FaceContourType.rightCheek]?.points ?? [],
    );
  }

  /// Get face analysis data (smile, eyes open, head rotation)
  FaceAnalysis getFaceAnalysis(Face face) {
    return FaceAnalysis(
      boundingBox: face.boundingBox,
      headEulerAngleY: face.headEulerAngleY ?? 0.0, // Left/right turn
      headEulerAngleZ: face.headEulerAngleZ ?? 0.0, // Tilt
      smilingProbability: face.smilingProbability ?? 0.0,
      leftEyeOpenProbability: face.leftEyeOpenProbability ?? 0.0,
      rightEyeOpenProbability: face.rightEyeOpenProbability ?? 0.0,
      trackingId: face.trackingId,
    );
  }

  /// Check if face is suitable for effects (centered, not too rotated)
  bool isFaceSuitableForEffects(Face face) {
    final headAngleY = (face.headEulerAngleY ?? 0.0).abs();
    final headAngleZ = (face.headEulerAngleZ ?? 0.0).abs();
    
    // Face should be roughly facing camera (within 30 degrees)
    return headAngleY < 30 && headAngleZ < 30;
  }

  /// Dispose resources
  Future<void> dispose() async {
    if (_isInitialized) {
      await _faceDetector.close();
      _isInitialized = false;
      debugPrint('🔄 Face detection service disposed');
    }
  }

  bool get isProcessing => _isProcessing;
  bool get isInitialized => _isInitialized;
}

/// Face landmarks data structure
class FaceLandmarks {
  final Point<int>? leftEye;
  final Point<int>? rightEye;
  final Point<int>? noseBase;
  final Point<int>? bottomMouth;
  final Point<int>? leftMouth;
  final Point<int>? rightMouth;
  final Point<int>? leftCheek;
  final Point<int>? rightCheek;
  final Point<int>? leftEar;
  final Point<int>? rightEar;

  FaceLandmarks({
    this.leftEye,
    this.rightEye,
    this.noseBase,
    this.bottomMouth,
    this.leftMouth,
    this.rightMouth,
    this.leftCheek,
    this.rightCheek,
    this.leftEar,
    this.rightEar,
  });

  /// Calculate face center point (between eyes)
  Point<double>? get faceCenter {
    if (leftEye == null || rightEye == null) return null;
    return Point(
      (leftEye!.x + rightEye!.x) / 2.0,
      (leftEye!.y + rightEye!.y) / 2.0,
    );
  }

  /// Calculate distance between eyes (for scaling)
  double? get eyeDistance {
    if (leftEye == null || rightEye == null) return null;
    final dx = (rightEye!.x - leftEye!.x).toDouble();
    final dy = (rightEye!.y - leftEye!.y).toDouble();
    return ui.Offset(dx, dy).distance;
  }

  /// Calculate face rotation angle (based on eye positions)
  double? get faceAngle {
    if (leftEye == null || rightEye == null) return null;
    final dx = (rightEye!.x - leftEye!.x).toDouble();
    final dy = (rightEye!.y - leftEye!.y).toDouble();
    return ui.Offset(dx, dy).direction;
  }
}

/// Face contours data structure (full mesh)
class FaceContours {
  final List<Point<int>> faceOval;
  final List<Point<int>> leftEyebrowTop;
  final List<Point<int>> leftEyebrowBottom;
  final List<Point<int>> rightEyebrowTop;
  final List<Point<int>> rightEyebrowBottom;
  final List<Point<int>> leftEye;
  final List<Point<int>> rightEye;
  final List<Point<int>> upperLipTop;
  final List<Point<int>> upperLipBottom;
  final List<Point<int>> lowerLipTop;
  final List<Point<int>> lowerLipBottom;
  final List<Point<int>> noseBridge;
  final List<Point<int>> noseBottom;
  final List<Point<int>> leftCheek;
  final List<Point<int>> rightCheek;

  FaceContours({
    required this.faceOval,
    required this.leftEyebrowTop,
    required this.leftEyebrowBottom,
    required this.rightEyebrowTop,
    required this.rightEyebrowBottom,
    required this.leftEye,
    required this.rightEye,
    required this.upperLipTop,
    required this.upperLipBottom,
    required this.lowerLipTop,
    required this.lowerLipBottom,
    required this.noseBridge,
    required this.noseBottom,
    required this.leftCheek,
    required this.rightCheek,
  });
}

/// Face analysis data (probabilities and angles)
class FaceAnalysis {
  final ui.Rect boundingBox;
  final double headEulerAngleY;
  final double headEulerAngleZ;
  final double smilingProbability;
  final double leftEyeOpenProbability;
  final double rightEyeOpenProbability;
  final int? trackingId;

  FaceAnalysis({
    required this.boundingBox,
    required this.headEulerAngleY,
    required this.headEulerAngleZ,
    required this.smilingProbability,
    required this.leftEyeOpenProbability,
    required this.rightEyeOpenProbability,
    this.trackingId,
  });

  bool get isSmiling => smilingProbability > 0.5;
  bool get areEyesOpen => 
      leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5;
}
