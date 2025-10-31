import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'dart:async';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';

/// Stories Camera Screen for capturing photos/videos with filters and text overlays
class StoriesCameraScreen extends ConsumerStatefulWidget {
  const StoriesCameraScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<StoriesCameraScreen> createState() => _StoriesCameraScreenState();
}

class _StoriesCameraScreenState extends ConsumerState<StoriesCameraScreen> {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isBackCamera = true;
  
  // Recording
  bool _isRecording = false;
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  static const int _maxRecordingSeconds = 15;
  
  // Captured content
  File? _capturedFile;
  bool _isVideo = false;
  
  // Filters
  int _selectedFilterIndex = 0;
  final List<ColorFilter> _filters = [
    const ColorFilter.mode(Colors.transparent, BlendMode.multiply), // None
    const ColorFilter.mode(Color(0x40FF6B6B), BlendMode.overlay), // Red
    const ColorFilter.mode(Color(0x406B66FF), BlendMode.overlay), // Blue
    const ColorFilter.mode(Color(0x40FFD93D), BlendMode.overlay), // Yellow
    const ColorFilter.mode(Color(0x406BCF7C), BlendMode.overlay), // Green
    const ColorFilter.mode(Color(0x40FF6BFF), BlendMode.overlay), // Pink
    const ColorFilter.mode(Color(0x40000000), BlendMode.overlay), // Dark
    const ColorFilter.mode(Color(0x40FFFFFF), BlendMode.overlay), // Light
  ];
  
  final List<String> _filterNames = [
    'None', 'Warm', 'Cool', 'Bright', 'Fresh', 'Pink', 'Dark', 'Light'
  ];
  
  // Text overlays
  final List<TextOverlay> _textOverlays = [];
  bool _isEditingText = false;
  TextOverlay? _currentTextOverlay;
  final TextEditingController _textController = TextEditingController();
  
  // UI State
  bool _showFilters = false;
  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _recordingTimer?.cancel();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        _showError('No cameras available');
        return;
      }
      
      await _setupCamera(_isBackCamera ? 0 : 1);
    } catch (e) {
      _showError('Failed to initialize camera: $e');
    }
  }

  Future<void> _setupCamera(int cameraIndex) async {
    if (_cameras == null || cameraIndex >= _cameras!.length) return;
    
    final camera = _cameras![cameraIndex];
    
    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      _showError('Failed to initialize camera: $e');
    }
  }

  Future<void> _toggleCamera() async {
    setState(() {
      _isBackCamera = !_isBackCamera;
      _isCameraInitialized = false;
    });
    
    await _cameraController?.dispose();
    await _setupCamera(_isBackCamera ? 0 : 1);
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      final XFile photo = await _cameraController!.takePicture();
      setState(() {
        _capturedFile = File(photo.path);
        _isVideo = false;
      });
    } catch (e) {
      _showError('Failed to capture photo: $e');
    }
  }

  Future<void> _startVideoRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      await _cameraController!.startVideoRecording();
      setState(() {
        _isRecording = true;
        _recordingSeconds = 0;
      });
      
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingSeconds++;
        });
        
        if (_recordingSeconds >= _maxRecordingSeconds) {
          _stopVideoRecording();
        }
      });
    } catch (e) {
      _showError('Failed to start recording: $e');
    }
  }

  Future<void> _stopVideoRecording() async {
    if (_cameraController == null || !_cameraController!.value.isRecordingVideo) {
      return;
    }

    try {
      final XFile video = await _cameraController!.stopVideoRecording();
      _recordingTimer?.cancel();
      
      setState(() {
        _isRecording = false;
        _capturedFile = File(video.path);
        _isVideo = true;
        _recordingSeconds = 0;
      });
    } catch (e) {
      _showError('Failed to stop recording: $e');
    }
  }

  Future<void> _pickFromGallery() async {
    try {
      final XFile? file = await _imagePicker.pickImage(source: ImageSource.gallery);
      if (file != null) {
        setState(() {
          _capturedFile = File(file.path);
          _isVideo = false;
        });
      }
    } catch (e) {
      _showError('Failed to pick image: $e');
    }
  }

  void _addTextOverlay() {
    setState(() {
      _isEditingText = true;
      _currentTextOverlay = TextOverlay(
        text: '',
        position: const Offset(0.5, 0.5), // Center
        color: Colors.white,
        fontSize: 24,
      );
      _textController.clear();
    });
  }

  void _saveTextOverlay() {
    if (_textController.text.isEmpty) {
      setState(() {
        _isEditingText = false;
        _currentTextOverlay = null;
      });
      return;
    }
    
    setState(() {
      _currentTextOverlay = _currentTextOverlay!.copyWith(
        text: _textController.text,
      );
      _textOverlays.add(_currentTextOverlay!);
      _isEditingText = false;
      _currentTextOverlay = null;
      _textController.clear();
    });
  }

  void _share() {
    if (_capturedFile == null) return;
    
    // TODO: Implement story creation API call
    // Navigate to story preview or directly upload
    Navigator.pop(context, {
      'file': _capturedFile,
      'isVideo': _isVideo,
      'filter': _selectedFilterIndex,
      'textOverlays': _textOverlays,
    });
  }

  void _discard() {
    setState(() {
      _capturedFile = null;
      _isVideo = false;
      _textOverlays.clear();
      _selectedFilterIndex = 0;
    });
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _capturedFile != null
          ? _buildPreviewMode()
          : _buildCameraMode(),
    );
  }

  Widget _buildCameraMode() {
    return Stack(
      children: [
        // Camera Preview
        if (_isCameraInitialized && _cameraController != null)
          Positioned.fill(
            child: ColorFiltered(
              colorFilter: _filters[_selectedFilterIndex],
              child: CameraPreview(_cameraController!),
            ),
          )
        else
          const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
        
        // Top Controls
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Close button
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                    onPressed: () => Navigator.pop(context),
                  ),
                  
                  // Flash toggle (placeholder - implement if needed)
                  IconButton(
                    icon: const Icon(Icons.flash_off, color: Colors.white, size: 28),
                    onPressed: () {
                      // TODO: Implement flash toggle
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
        
        // Recording Timer
        if (_isRecording)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 60),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.fiber_manual_record, color: Colors.white, size: 12),
                      const SizedBox(width: 8),
                      Text(
                        '${_recordingSeconds}s / ${_maxRecordingSeconds}s',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        
        // Recording Progress Bar
        if (_isRecording)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                margin: const EdgeInsets.only(top: 110),
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: LinearProgressIndicator(
                  value: _recordingSeconds / _maxRecordingSeconds,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.red),
                  minHeight: 4,
                ),
              ),
            ),
          ),
        
        // Filter Selector
        if (_showFilters)
          Positioned(
            right: 16,
            top: 120,
            bottom: 200,
            child: Container(
              width: 60,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(30),
              ),
              child: ListView.builder(
                itemCount: _filters.length,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedFilterIndex = index;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _selectedFilterIndex == index
                              ? AppColors.primary
                              : Colors.white.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: ClipOval(
                        child: ColorFiltered(
                          colorFilter: _filters[index],
                          child: Container(
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        
        // Bottom Controls
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Gallery Picker
                  IconButton(
                    icon: const Icon(Icons.photo_library, color: Colors.white, size: 32),
                    onPressed: _pickFromGallery,
                  ),
                  
                  // Capture Button
                  GestureDetector(
                    onTap: _isRecording ? null : _capturePhoto,
                    onLongPressStart: (_) => _startVideoRecording(),
                    onLongPressEnd: (_) => _stopVideoRecording(),
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isRecording ? Colors.red : Colors.white,
                          width: 4,
                        ),
                      ),
                      child: Center(
                        child: Container(
                          width: _isRecording ? 30 : 58,
                          height: _isRecording ? 30 : 58,
                          decoration: BoxDecoration(
                            color: _isRecording ? Colors.red : Colors.white,
                            borderRadius: BorderRadius.circular(_isRecording ? 6 : 29),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  // Camera Switch
                  IconButton(
                    icon: const Icon(Icons.flip_camera_ios, color: Colors.white, size: 32),
                    onPressed: _toggleCamera,
                  ),
                ],
              ),
            ),
          ),
        ),
        
        // Filter Toggle Button
        Positioned(
          right: 16,
          bottom: 120,
          child: SafeArea(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _showFilters = !_showFilters;
                });
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _showFilters
                      ? AppColors.primary
                      : Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.filter_vintage,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPreviewMode() {
    return Stack(
      children: [
        // Preview Image/Video
        Positioned.fill(
          child: ColorFiltered(
            colorFilter: _filters[_selectedFilterIndex],
            child: _isVideo
                ? const Center(
                    child: Text(
                      'Video Preview',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ) // TODO: Implement video preview with video_player
                : Image.file(
                    _capturedFile!,
                    fit: BoxFit.cover,
                  ),
          ),
        ),
        
        // Text Overlays
        ..._textOverlays.map((overlay) => _buildTextOverlay(overlay)),
        
        // Text Editor
        if (_isEditingText) _buildTextEditor(),
        
        // Top Controls
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                    onPressed: _discard,
                  ),
                  
                  // Add Text button
                  if (!_isEditingText)
                    IconButton(
                      icon: const Icon(Icons.text_fields, color: Colors.white, size: 28),
                      onPressed: _addTextOverlay,
                    ),
                ],
              ),
            ),
          ),
        ),
        
        // Filter Selector
        if (_showFilters)
          Positioned(
            right: 16,
            top: 120,
            bottom: 200,
            child: Container(
              width: 60,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(30),
              ),
              child: ListView.builder(
                itemCount: _filters.length,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedFilterIndex = index;
                      });
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _selectedFilterIndex == index
                              ? AppColors.primary
                              : Colors.white.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _filterNames[index].substring(0, 1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        
        // Bottom Controls
        if (!_isEditingText)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withOpacity(0.6),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Filter Toggle
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _showFilters = !_showFilters;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.filter_vintage, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              _filterNames[_selectedFilterIndex],
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Share Button
                    GestureDetector(
                      onTap: _share,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.send, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Share',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildTextOverlay(TextOverlay overlay) {
    return Positioned(
      left: overlay.position.dx * MediaQuery.of(context).size.width,
      top: overlay.position.dy * MediaQuery.of(context).size.height,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            final index = _textOverlays.indexOf(overlay);
            if (index != -1) {
              _textOverlays[index] = overlay.copyWith(
                position: Offset(
                  (overlay.position.dx * MediaQuery.of(context).size.width + details.delta.dx) /
                      MediaQuery.of(context).size.width,
                  (overlay.position.dy * MediaQuery.of(context).size.height + details.delta.dy) /
                      MediaQuery.of(context).size.height,
                ),
              );
            }
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            overlay.text,
            style: TextStyle(
              color: overlay.color,
              fontSize: overlay.fontSize,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextEditor() {
    return Container(
      color: Colors.black.withOpacity(0.8),
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isEditingText = false;
                        _currentTextOverlay = null;
                        _textController.clear();
                      });
                    },
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                  const Text(
                    'Add Text',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  TextButton(
                    onPressed: _saveTextOverlay,
                    child: const Text(
                      'Done',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const Spacer(),
            
            // Text Input
            Padding(
              padding: const EdgeInsets.all(24),
              child: TextField(
                controller: _textController,
                autofocus: true,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
                maxLines: null,
                decoration: const InputDecoration(
                  hintText: 'Type here...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
              ),
            ),
            
            const Spacer(),
          ],
        ),
      ),
    );
  }
}

/// Text Overlay Model
class TextOverlay {
  final String text;
  final Offset position; // 0-1 normalized coordinates
  final Color color;
  final double fontSize;

  const TextOverlay({
    required this.text,
    required this.position,
    required this.color,
    required this.fontSize,
  });

  TextOverlay copyWith({
    String? text,
    Offset? position,
    Color? color,
    double? fontSize,
  }) {
    return TextOverlay(
      text: text ?? this.text,
      position: position ?? this.position,
      color: color ?? this.color,
      fontSize: fontSize ?? this.fontSize,
    );
  }
}
