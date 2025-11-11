import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../models/face_effects_state.dart';
import '../services/beauty_effects_processor.dart';
import '../services/face_detection_service.dart';

/// Provider for face effects state
final faceEffectsProvider =
    StateNotifierProvider<FaceEffectsNotifier, FaceEffectsState>((ref) {
  return FaceEffectsNotifier();
});

/// Notifier for managing face effects
class FaceEffectsNotifier extends StateNotifier<FaceEffectsState> {
  FaceEffectsNotifier() : super(const FaceEffectsState());

  final _faceDetectionService = FaceDetectionService();
  bool _isInitialized = false;

  /// Initialize face detection service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await _faceDetectionService.initialize();
      _isInitialized = true;
      debugPrint('✅ Face effects initialized');
    } catch (e) {
      debugPrint('❌ Failed to initialize face effects: $e');
      rethrow;
    }
  }

  /// Process camera frame for face detection
  Future<void> processCameraFrame(CameraImage cameraImage) async {
    if (!state.isFaceTrackingEnabled || state.isProcessing) {
      return;
    }

    if (!_isInitialized) {
      await initialize();
    }

    state = state.copyWith(isProcessing: true);

    try {
      // Detect faces
      final faces = await _faceDetectionService.detectFaces(cameraImage);

      // Extract landmarks for each face
      final landmarksCache = <int, FaceLandmarks>{};
      for (final face in faces) {
        if (face.trackingId != null) {
          final landmarks = _faceDetectionService.extractLandmarks(face);
          if (landmarks != null) {
            landmarksCache[face.trackingId!] = landmarks;
          }
        }
      }

      state = state.copyWith(
        detectedFaces: faces,
        faceLandmarksCache: landmarksCache,
        isProcessing: false,
      );
    } catch (e) {
      debugPrint('❌ Face processing error: $e');
      state = state.copyWith(isProcessing: false);
    }
  }

  /// Enable/disable face tracking
  void setFaceTracking(bool enabled) {
    state = state.copyWith(isFaceTrackingEnabled: enabled);
    
    if (enabled && !_isInitialized) {
      initialize();
    }
  }

  /// Update beauty settings
  void setBeautySettings(BeautySettings settings) {
    state = state.copyWith(beautySettings: settings);
    debugPrint('🎨 Beauty settings updated: $settings');
  }

  /// Set beauty smoothness level
  void setSmoothness(double value) {
    final newSettings = state.beautySettings.copyWith(
      smoothness: value.clamp(0.0, 1.0),
    );
    setBeautySettings(newSettings);
  }

  /// Set brightness level
  void setBrightness(double value) {
    final newSettings = state.beautySettings.copyWith(
      brightness: value.clamp(0.0, 1.0),
    );
    setBeautySettings(newSettings);
  }

  /// Set face slim level
  void setFaceSlim(double value) {
    final newSettings = state.beautySettings.copyWith(
      faceSlim: value.clamp(0.0, 1.0),
    );
    setBeautySettings(newSettings);
  }

  /// Apply beauty preset
  void applyBeautyPreset(BeautySettings preset) {
    setBeautySettings(preset);
  }

  /// Select face mask
  void setFaceMask(String? maskType) {
    state = state.copyWith(selectedFaceMask: maskType);
    
    // Enable face tracking if mask is selected
    if (maskType != null && !state.isFaceTrackingEnabled) {
      setFaceTracking(true);
    }
    
    debugPrint('🎭 Face mask selected: $maskType');
  }

  /// Clear all effects
  void clearAllEffects() {
    state = state.copyWith(
      beautySettings: BeautySettings.none,
      selectedFaceMask: null,
      isFaceTrackingEnabled: false,
    );
    debugPrint('🧹 All face effects cleared');
  }

  /// Get landmarks for specific face
  FaceLandmarks? getLandmarks(Face face) {
    if (face.trackingId == null) return null;
    return state.faceLandmarksCache?[face.trackingId!];
  }

  /// Check if face is suitable for effects
  bool isFaceSuitable(Face face) {
    return _faceDetectionService.isFaceSuitableForEffects(face);
  }

  @override
  void dispose() {
    _faceDetectionService.dispose();
    _isInitialized = false;
    super.dispose();
  }
}
