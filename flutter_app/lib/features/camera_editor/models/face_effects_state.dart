import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../services/beauty_effects_processor.dart';
import '../services/face_detection_service.dart';

/// State for face effects and AR overlays
class FaceEffectsState {
  final List<Face> detectedFaces;
  final BeautySettings beautySettings;
  final String? selectedFaceMask;
  final bool isFaceTrackingEnabled;
  final bool isProcessing;
  final Map<int, FaceLandmarks>? faceLandmarksCache;

  const FaceEffectsState({
    this.detectedFaces = const [],
    this.beautySettings = BeautySettings.none,
    this.selectedFaceMask,
    this.isFaceTrackingEnabled = false,
    this.isProcessing = false,
    this.faceLandmarksCache,
  });

  FaceEffectsState copyWith({
    List<Face>? detectedFaces,
    BeautySettings? beautySettings,
    String? selectedFaceMask,
    bool? isFaceTrackingEnabled,
    bool? isProcessing,
    Map<int, FaceLandmarks>? faceLandmarksCache,
  }) {
    return FaceEffectsState(
      detectedFaces: detectedFaces ?? this.detectedFaces,
      beautySettings: beautySettings ?? this.beautySettings,
      selectedFaceMask: selectedFaceMask ?? this.selectedFaceMask,
      isFaceTrackingEnabled: isFaceTrackingEnabled ?? this.isFaceTrackingEnabled,
      isProcessing: isProcessing ?? this.isProcessing,
      faceLandmarksCache: faceLandmarksCache ?? this.faceLandmarksCache,
    );
  }

  bool get hasFaces => detectedFaces.isNotEmpty;
  bool get hasBeautyEffects => beautySettings.hasAnyEffect;
  bool get hasFaceMask => selectedFaceMask != null;
  bool get hasAnyEffect => hasBeautyEffects || hasFaceMask;
}

/// Available face mask types
enum FaceMaskType {
  none('None', null),
  dogEars('Dog Ears', '🐶'),
  catEars('Cat Ears', '🐱'),
  bunnyEars('Bunny Ears', '🐰'),
  crown('Crown', '👑'),
  sunglasses('Sunglasses', '😎'),
  heartEyes('Heart Eyes', '😍'),
  flowers('Flowers', '🌸'),
  butterfly('Butterfly', '🦋');

  final String label;
  final String? emoji;

  const FaceMaskType(this.label, this.emoji);

  static FaceMaskType fromString(String? value) {
    if (value == null) return none;
    return FaceMaskType.values.firstWhere(
      (type) => type.name == value,
      orElse: () => none,
    );
  }
}
