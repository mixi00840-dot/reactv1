import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

class CameraService {
  CameraController? controller;
  List<CameraDescription>? cameras;
  int selectedCameraIndex = 0;
  FlashMode flashMode = FlashMode.off;

  bool get isInitialized => controller?.value.isInitialized ?? false;

  Future<void> initialize() async {
    try {
      cameras = await availableCameras();
      if (cameras == null || cameras!.isEmpty) {
        throw Exception('No cameras available');
      }

      // Start with back camera
      selectedCameraIndex = cameras!.indexWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
      );
      if (selectedCameraIndex == -1) {
        selectedCameraIndex = 0;
      }

      await _initializeController(cameras![selectedCameraIndex]);
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      rethrow;
    }
  }

  Future<void> _initializeController(CameraDescription camera) async {
    controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    await controller!.initialize();
    await controller!.setFlashMode(flashMode);
  }

  Future<void> switchCamera() async {
    if (cameras == null || cameras!.length < 2) {
      throw Exception('Cannot switch camera');
    }

    selectedCameraIndex = (selectedCameraIndex + 1) % cameras!.length;
    await dispose();
    await _initializeController(cameras![selectedCameraIndex]);
  }

  Future<void> toggleFlash() async {
    if (!isInitialized) return;

    switch (flashMode) {
      case FlashMode.off:
        flashMode = FlashMode.auto;
        break;
      case FlashMode.auto:
        flashMode = FlashMode.always;
        break;
      case FlashMode.always:
        flashMode = FlashMode.off;
        break;
      default:
        flashMode = FlashMode.off;
    }

    await controller!.setFlashMode(flashMode);
  }

  Future<String> takePicture() async {
    if (!isInitialized) {
      throw Exception('Camera not initialized');
    }

    try {
      final XFile image = await controller!.takePicture();
      return image.path;
    } catch (e) {
      debugPrint('Error taking picture: $e');
      rethrow;
    }
  }

  Future<void> startVideoRecording() async {
    if (!isInitialized) {
      throw Exception('Camera not initialized');
    }

    if (controller!.value.isRecordingVideo) {
      return;
    }

    try {
      await controller!.startVideoRecording();
    } catch (e) {
      debugPrint('Error starting video recording: $e');
      rethrow;
    }
  }

  Future<String?> stopVideoRecording() async {
    if (!isInitialized || !controller!.value.isRecordingVideo) {
      return null;
    }

    try {
      final XFile video = await controller!.stopVideoRecording();
      return video.path;
    } catch (e) {
      debugPrint('Error stopping video recording: $e');
      rethrow;
    }
  }

  Future<void> pauseVideoRecording() async {
    if (!isInitialized || !controller!.value.isRecordingVideo) {
      return;
    }

    try {
      await controller!.pauseVideoRecording();
    } catch (e) {
      debugPrint('Error pausing video recording: $e');
      rethrow;
    }
  }

  Future<void> resumeVideoRecording() async {
    if (!isInitialized) {
      return;
    }

    try {
      await controller!.resumeVideoRecording();
    } catch (e) {
      debugPrint('Error resuming video recording: $e');
      rethrow;
    }
  }

  Future<void> setZoom(double zoom) async {
    if (!isInitialized) return;

    try {
      await controller!.setZoomLevel(zoom);
    } catch (e) {
      debugPrint('Error setting zoom: $e');
    }
  }

  Future<void> setFocus(Offset point, Size size) async {
    if (!isInitialized) return;

    try {
      final double x = point.dx / size.width;
      final double y = point.dy / size.height;
      await controller!.setFocusPoint(Offset(x, y));
      await controller!.setExposurePoint(Offset(x, y));
    } catch (e) {
      debugPrint('Error setting focus: $e');
    }
  }

  Future<void> dispose() async {
    await controller?.dispose();
    controller = null;
  }
}
