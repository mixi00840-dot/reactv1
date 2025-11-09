# 🚀 MIXILLO FLUTTER APP - PRODUCTION IMPLEMENTATION PLAN

## 📊 CURRENT STATE ANALYSIS

### ✅ What We Have (Existing):
1. **Complete MongoDB Backend** (200+ endpoints):
   - Authentication (`/api/auth/mongodb`)
   - Users (`/api/users/mongodb`)
   - Content/Videos (`/api/content/mongodb`)
   - Live Streaming (`/api/streaming/mongodb`)
   - Products (`/api/products/mongodb`)
   - Orders & Cart (`/api/orders/mongodb`, `/api/cart/mongodb`)
   - Messaging (`/api/messaging/mongodb`)
   - Wallets & Gifts (`/api/wallets/mongodb`, `/api/gifts/mongodb`)
   - Stories, Comments, Notifications
   - PK Battles, Multi-host streaming

2. **Flutter App Foundation**:
   - Clean Architecture (data/domain/presentation layers)
   - Basic UI screens (Feed, Profile, Shop, Messages, Product Listing)
   - Design System (DesignTokens, Typography)
   - Dependencies: Riverpod, Dio, Video Player, Camera, Agora, Zego
   - **Missing**: Full backend integration, Camera UI/features, Video recording/upload

### ❌ What's Missing (Critical Gaps):

1. **TikTok-Style Camera** (CRITICAL PRIORITY #1):
   - Multi-clip recording with trim
   - Speed controls (0.3x, 0.5x, 1x, 2x, 3x)
   - Beauty filters & effects
   - Audio mixing & sounds library
   - Cover image selection
   - Flash, timer, flip camera
   - Grid overlay, aspect ratios

2. **Video Upload Pipeline**:
   - Chunked/resumable upload
   - Video compression & transcoding
   - Thumbnail generation
   - Progress tracking
   - Retry on failure
   - Background upload service

3. **Complete API Integration**:
   - API client with Dio + interceptors
   - Token refresh mechanism
   - Auto-generated models (json_serializable)
   - WebSocket for real-time (chat, notifications, live)
   - Error handling & retry logic

4. **Live Streaming** (Agora/Zego):
   - Host & viewer flows
   - Multi-host (2-4 people)
   - PK battles (1v1, 2v2)
   - Gifts with animations
   - Chat overlay

5. **Core Features**:
   - Authentication flows (login/register/OTP)
   - Feed with video playback & prefetch
   - Search (users, videos, hashtags, products)
   - Notifications (push + in-app)
   - Wallet & coin purchase
   - Seller onboarding & product management

---

## 🎯 IMPLEMENTATION PHASES (Production-Ready)

### **PHASE 1: FOUNDATION & CAMERA (WEEKS 1-2) - TOP PRIORITY**

#### Goal: Working TikTok camera + backend auth

#### 1.1 API Client Setup (Days 1-2)
**Files to Create:**
```
lib/
├── core/
│   ├── network/
│   │   ├── api_client.dart              # Dio client with interceptors
│   │   ├── api_interceptors.dart        # Auth, refresh, logging
│   │   ├── api_endpoints.dart           # All backend endpoints
│   │   └── network_exceptions.dart      # Custom exceptions
│   ├── storage/
│   │   ├── secure_storage.dart          # flutter_secure_storage wrapper
│   │   └── cache_manager.dart           # Hive for local cache
│   └── constants/
│       └── api_constants.dart           # Base URLs, timeouts
```

**Implementation:**
```dart
// api_client.dart
class ApiClient {
  late final Dio _dio;
  final SecureStorage _secureStorage;
  
  ApiClient(this._secureStorage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _dio.interceptors.addAll([
      AuthInterceptor(_secureStorage),
      RefreshTokenInterceptor(_secureStorage),
      PrettyDioLogger(requestHeader: true, requestBody: true),
    ]);
  }
  
  // HTTP methods
  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await _dio.get(path, queryParameters: query);
      return response.data;
    } on DioException catch (e) {
      throw NetworkExceptions.fromDioError(e);
    }
  }
  
  Future<T> post<T>(String path, {dynamic data}) async { /* ... */ }
  Future<T> put<T>(String path, {dynamic data}) async { /* ... */ }
  Future<T> delete<T>(String path) async { /* ... */ }
  
  // Multipart upload for video/images
  Future<T> uploadFile<T>(String path, File file, {
    String fieldName = 'file',
    Map<String, dynamic>? data,
    ProgressCallback? onProgress,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(file.path),
      if (data != null) ...data,
    });
    
    final response = await _dio.post(
      path,
      data: formData,
      onSendProgress: onProgress,
    );
    return response.data;
  }
}
```

**API Endpoints:**
```dart
class ApiEndpoints {
  // Auth
  static const login = '/api/auth/mongodb/login';
  static const register = '/api/auth/mongodb/register';
  static const refresh = '/api/auth/mongodb/refresh';
  static const logout = '/api/auth/mongodb/logout';
  static const me = '/api/auth/mongodb/me';
  
  // Content
  static const contentFeed = '/api/content/mongodb/feed';
  static const contentUpload = '/api/content/mongodb/upload';
  static const contentById = '/api/content/mongodb'; // + /:id
  
  // Live Streaming
  static const streamProviders = '/api/streaming/mongodb/providers';
  static const streamStart = '/api/streaming/mongodb/start';
  static const streamJoin = '/api/streaming/mongodb/join';
  
  // ... all 200+ endpoints mapped
}
```

**Token Refresh Interceptor:**
```dart
class RefreshTokenInterceptor extends Interceptor {
  final SecureStorage _storage;
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      try {
        // Get refresh token
        final refreshToken = await _storage.read('refresh_token');
        final dio = Dio();
        
        // Refresh access token
        final response = await dio.post(
          ApiEndpoints.refresh,
          data: {'refreshToken': refreshToken},
        );
        
        // Save new token
        final newToken = response.data['data']['accessToken'];
        await _storage.write('access_token', newToken);
        
        // Retry original request
        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        final retryResponse = await dio.fetch(err.requestOptions);
        return handler.resolve(retryResponse);
      } catch (e) {
        // Refresh failed, logout user
        await _storage.deleteAll();
        return handler.reject(err);
      }
    }
    return handler.next(err);
  }
}
```

#### 1.2 Authentication Module (Days 3-4)
**Files:**
```
lib/features/auth/
├── data/
│   ├── models/
│   │   ├── user_model.dart              # @JsonSerializable
│   │   ├── auth_response_model.dart
│   │   └── login_request.dart
│   ├── datasources/
│   │   └── auth_remote_datasource.dart  # API calls
│   └── repositories/
│       └── auth_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── user.dart
│   ├── repositories/
│   │   └── auth_repository.dart         # Interface
│   └── usecases/
│       ├── login_usecase.dart
│       ├── register_usecase.dart
│       └── logout_usecase.dart
└── presentation/
    ├── providers/
    │   └── auth_provider.dart           # Riverpod StateNotifier
    ├── screens/
    │   ├── splash_screen.dart
    │   ├── login_screen.dart
    │   ├── register_screen.dart
    │   └── otp_verification_screen.dart
    └── widgets/
        ├── auth_text_field.dart
        └── social_login_button.dart
```

**Auth Provider (Riverpod):**
```dart
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<AuthState> build() async {
    // Check if user is logged in
    final token = await ref.read(secureStorageProvider).read('access_token');
    if (token != null) {
      try {
        final user = await ref.read(authRepositoryProvider).getCurrentUser();
        return AuthState.authenticated(user);
      } catch (e) {
        return const AuthState.unauthenticated();
      }
    }
    return const AuthState.unauthenticated();
  }
  
  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final response = await ref.read(authRepositoryProvider).login(email, password);
      await ref.read(secureStorageProvider).write('access_token', response.accessToken);
      await ref.read(secureStorageProvider).write('refresh_token', response.refreshToken);
      return AuthState.authenticated(response.user);
    });
  }
  
  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    await ref.read(secureStorageProvider).deleteAll();
    state = const AsyncValue.data(AuthState.unauthenticated());
  }
}
```

#### 1.3 TikTok Camera Interface (Days 5-10) - **CRITICAL PRIORITY**

**Goal**: Pixel-perfect TikTok camera with full functionality

**Files:**
```
lib/features/camera/
├── data/
│   ├── models/
│   │   ├── recording_clip.dart
│   │   ├── filter_model.dart
│   │   └── sound_model.dart
│   └── repositories/
│       ├── camera_repository_impl.dart
│       └── sound_repository_impl.dart
├── domain/
│   ├── entities/
│   │   ├── video_clip.dart
│   │   └── camera_settings.dart
│   └── usecases/
│       ├── record_video_usecase.dart
│       ├── merge_clips_usecase.dart
│       └── compress_video_usecase.dart
└── presentation/
    ├── providers/
    │   ├── camera_provider.dart
    │   ├── recording_provider.dart
    │   └── effects_provider.dart
    ├── screens/
    │   ├── camera_screen.dart            # Main TikTok camera UI
    │   ├── video_preview_screen.dart     # Preview before upload
    │   ├── effects_selector_screen.dart
    │   └── sounds_library_screen.dart
    └── widgets/
        ├── camera_controls.dart          # Record button, flip, flash
        ├── speed_selector.dart           # 0.3x - 3x
        ├── timer_widget.dart             # 3s, 10s countdown
        ├── beauty_filter_panel.dart
        ├── effects_carousel.dart
        ├── recording_progress_bar.dart   # Multi-clip progress
        ├── clip_editor.dart              # Trim individual clips
        └── cover_image_selector.dart
```

**Camera Screen Implementation:**

```dart
class CameraScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends ConsumerState<CameraScreen> 
    with WidgetsBindingObserver, TickerProviderStateMixin {
  
  CameraController? _controller;
  List<RecordingClip> _clips = [];
  bool _isRecording = false;
  double _currentSpeed = 1.0;
  int _timerSeconds = 0;
  FlashMode _flashMode = FlashMode.off;
  
  // FFmpeg for video processing
  late final FFmpegKit _ffmpeg;
  
  @override
  void initState() {
    super.initState();
    _initializeCamera();
    WidgetsBinding.instance.addObserver(this);
  }
  
  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    final camera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );
    
    _controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.yuv420, // For better compression
    );
    
    await _controller!.initialize();
    await _controller!.prepareForVideoRecording();
    setState(() {});
  }
  
  Future<void> _startRecording() async {
    if (_isRecording || _controller == null) return;
    
    setState(() => _isRecording = true);
    
    // Countdown timer
    if (_timerSeconds > 0) {
      await _showCountdown(_timerSeconds);
    }
    
    final directory = await getTemporaryDirectory();
    final path = '${directory.path}/${DateTime.now().millisecondsSinceEpoch}.mp4';
    
    // Apply speed (record at different FPS)
    if (_currentSpeed != 1.0) {
      // Modify camera FPS based on speed
      // For 0.5x: record at 60fps, play at 30fps
      // For 2x: record at 15fps, play at 30fps
    }
    
    await _controller!.startVideoRecording();
    ref.read(recordingTimerProvider.notifier).start();
  }
  
  Future<void> _stopRecording() async {
    if (!_isRecording) return;
    
    final file = await _controller!.stopVideoRecording();
    ref.read(recordingTimerProvider.notifier).stop();
    
    // Apply speed correction with FFmpeg
    final processedPath = await _applySpeedEffect(
      file.path,
      _currentSpeed,
    );
    
    setState(() {
      _clips.add(RecordingClip(
        path: processedPath,
        duration: ref.read(recordingTimerProvider),
        speed: _currentSpeed,
      ));
      _isRecording = false;
    });
  }
  
  Future<String> _applySpeedEffect(String inputPath, double speed) async {
    final output = inputPath.replaceAll('.mp4', '_speed.mp4');
    
    // FFmpeg command for speed adjustment
    final command = '-i $inputPath -filter:v "setpts=${1/speed}*PTS" -filter:a "atempo=$speed" $output';
    
    await FFmpegKit.execute(command);
    return output;
  }
  
  Future<void> _deleteLastClip() async {
    if (_clips.isEmpty) return;
    final clip = _clips.removeLast();
    await File(clip.path).delete();
    setState(() {});
  }
  
  Future<void> _mergeClipsAndNavigate() async {
    if (_clips.isEmpty) return;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => ProcessingDialog(text: 'Merging clips...'),
    );
    
    try {
      // Merge all clips with FFmpeg
      final mergedPath = await _mergeVideos(_clips);
      
      // Generate thumbnail
      final thumbnail = await _generateThumbnail(mergedPath);
      
      Navigator.pop(context); // Close dialog
      
      // Navigate to preview
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => VideoPreviewScreen(
            videoPath: mergedPath,
            thumbnailPath: thumbnail,
            clips: _clips,
          ),
        ),
      );
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error merging clips: $e')),
      );
    }
  }
  
  Future<String> _mergeVideos(List<RecordingClip> clips) async {
    final output = '${(await getTemporaryDirectory()).path}/merged_${DateTime.now().millisecondsSinceEpoch}.mp4';
    
    // Create concat file for FFmpeg
    final concatFile = File('${(await getTemporaryDirectory()).path}/concat.txt');
    final content = clips.map((c) => "file '${c.path}'").join('\n');
    await concatFile.writeAsString(content);
    
    final command = '-f concat -safe 0 -i ${concatFile.path} -c copy $output';
    await FFmpegKit.execute(command);
    
    return output;
  }
  
  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Preview
          Positioned.fill(
            child: CameraPreview(_controller!),
          ),
          
          // Top Controls
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: CameraTopControls(
                onClose: () => Navigator.pop(context),
                flashMode: _flashMode,
                onFlashToggle: () {
                  setState(() {
                    _flashMode = _flashMode == FlashMode.off 
                      ? FlashMode.torch 
                      : FlashMode.off;
                  });
                  _controller!.setFlashMode(_flashMode);
                },
                onSettingsTap: () => _showSettings(),
              ),
            ),
          ),
          
          // Right Side Controls
          Positioned(
            right: 8,
            bottom: 120,
            child: CameraRightControls(
              onFlip: () => _flipCamera(),
              onSpeedTap: () => _showSpeedSelector(),
              currentSpeed: _currentSpeed,
              onBeautyTap: () => _showBeautyFilters(),
              onEffectsTap: () => _showEffects(),
              onTimerTap: () => _showTimerSelector(),
              timerSeconds: _timerSeconds,
            ),
          ),
          
          // Bottom Controls
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              child: CameraBottomControls(
                isRecording: _isRecording,
                clips: _clips,
                onRecordStart: _startRecording,
                onRecordStop: _stopRecording,
                onDeleteLastClip: _deleteLastClip,
                onNext: _mergeClipsAndNavigate,
                onSoundsTap: () => _showSoundsLibrary(),
              ),
            ),
          ),
          
          // Recording Progress
          if (_clips.isNotEmpty || _isRecording)
            Positioned(
              top: 100,
              left: 0,
              right: 0,
              child: RecordingProgressBar(
                clips: _clips,
                isRecording: _isRecording,
                maxDuration: Duration(seconds: 60),
              ),
            ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _controller?.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
```

**Camera Controls Widgets:**

```dart
// Recording Button (TikTok style)
class RecordButton extends StatelessWidget {
  final bool isRecording;
  final VoidCallback onTapDown;
  final VoidCallback onTapUp;
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => onTapDown(),
      onTapUp: (_) => onTapUp(),
      onTapCancel: onTapUp,
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 4),
        ),
        child: Padding(
          padding: EdgeInsets.all(4),
          child: AnimatedContainer(
            duration: Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: Colors.red,
              shape: isRecording ? BoxShape.rectangle : BoxShape.circle,
              borderRadius: isRecording ? BorderRadius.circular(8) : null,
            ),
          ),
        ),
      ),
    );
  }
}

// Speed Selector
class SpeedSelector extends StatelessWidget {
  final double currentSpeed;
  final ValueChanged<double> onSpeedSelected;
  
  static const speeds = [0.3, 0.5, 1.0, 2.0, 3.0];
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      child: ListView.builder(
        itemCount: speeds.length,
        itemBuilder: (context, index) {
          final speed = speeds[index];
          final isSelected = speed == currentSpeed;
          
          return GestureDetector(
            onTap: () => onSpeedSelected(speed),
            child: Container(
              margin: EdgeInsets.symmetric(vertical: 8),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${speed}x',
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white,
                  fontSize: 18,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// Multi-Clip Progress Bar
class RecordingProgressBar extends StatelessWidget {
  final List<RecordingClip> clips;
  final bool isRecording;
  final Duration maxDuration;
  
  @override
  Widget build(BuildContext context) {
    final totalDuration = clips.fold<Duration>(
      Duration.zero,
      (sum, clip) => sum + clip.duration,
    );
    
    return Container(
      height: 4,
      margin: EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          ...clips.map((clip) {
            final width = (clip.duration.inMilliseconds / maxDuration.inMilliseconds) * 
              (MediaQuery.of(context).size.width - 32);
            return Container(
              width: width,
              height: 4,
              color: Colors.white,
              margin: EdgeInsets.only(right: 2),
            );
          }),
          if (isRecording)
            Expanded(
              child: LinearProgressIndicator(
                valueColor: AlwaysStoppedAnimation(Colors.red),
                backgroundColor: Colors.white24,
              ),
            ),
        ],
      ),
    );
  }
}
```

**Beauty Filters & Effects:**
```dart
// Use GPU shaders for real-time filters
class BeautyFilterPanel extends StatelessWidget {
  final Function(FilterType, double) onFilterApplied;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FilterSlider(
          label: 'Smoothness',
          value: 0.5,
          onChanged: (v) => onFilterApplied(FilterType.smooth, v),
        ),
        FilterSlider(
          label: 'Whitening',
          value: 0.3,
          onChanged: (v) => onFilterApplied(FilterType.whiten, v),
        ),
        FilterSlider(
          label: 'Sharpness',
          value: 0.2,
          onChanged: (v) => onFilterApplied(FilterType.sharpen, v),
        ),
      ],
    );
  }
}
```

**Sound Library Integration:**
```dart
class SoundsLibraryScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final sounds = ref.watch(trendinSoundsProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Sound'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () => showSearch(context: context, delegate: SoundSearch()),
          ),
        ],
      ),
      body: sounds.when(
        data: (soundList) => ListView.builder(
          itemCount: soundList.length,
          itemBuilder: (context, index) {
            final sound = soundList[index];
            return SoundTile(
              sound: sound,
              onSelect: () {
                ref.read(selectedSoundProvider.notifier).state = sound;
                Navigator.pop(context);
              },
            );
          },
        ),
        loading: () => Center(child: CircularProgressIndicator()),
        error: (e, st) => ErrorWidget(e),
      ),
    );
  }
}
```

---

### **PHASE 2: VIDEO UPLOAD & FEED (WEEK 3)**

#### 2.1 Video Upload Pipeline (Days 1-4)

**Files:**
```
lib/features/upload/
├── data/
│   ├── models/
│   │   ├── upload_request.dart
│   │   └── upload_progress.dart
│   └── repositories/
│       └── upload_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── upload_status.dart
│   └── usecases/
│       ├── compress_video_usecase.dart
│       ├── upload_video_usecase.dart
│       └── generate_thumbnail_usecase.dart
└── presentation/
    ├── providers/
    │   └── upload_provider.dart
    ├── screens/
    │   └── upload_details_screen.dart
    └── widgets/
        ├── upload_progress_widget.dart
        ├── hashtag_input.dart
        └── privacy_selector.dart
```

**Chunked Upload Implementation:**
```dart
class UploadRepository {
  final ApiClient _apiClient;
  
  Future<String> uploadVideo({
    required File videoFile,
    required String description,
    required List<String> hashtags,
    File? thumbnail,
    Function(double)? onProgress,
  }) async {
    // 1. Compress video
    final compressedPath = await _compressVideo(videoFile.path);
    final compressedFile = File(compressedPath);
    
    // 2. Generate thumbnail if not provided
    thumbnail ??= await _generateThumbnail(compressedPath);
    
    // 3. Get upload URL
    final initiateResponse = await _apiClient.post(
      ApiEndpoints.initiateUpload,
      data: {
        'fileName': path.basename(compressedPath),
        'fileSize': await compressedFile.length(),
        'mimeType': 'video/mp4',
      },
    );
    
    final uploadId = initiateResponse['uploadId'];
    final chunkSize = 5 * 1024 * 1024; // 5MB chunks
    
    // 4. Upload in chunks with retry
    await _uploadInChunks(
      file: compressedFile,
      uploadId: uploadId,
      chunkSize: chunkSize,
      onProgress: onProgress,
    );
    
    // 5. Complete upload with metadata
    final completeResponse = await _apiClient.post(
      ApiEndpoints.completeUpload,
      data: {
        'uploadId': uploadId,
        'description': description,
        'hashtags': hashtags,
        'thumbnailFile': thumbnail,
        'privacy': 'public',
      },
    );
    
    return completeResponse['contentId'];
  }
  
  Future<void> _uploadInChunks({
    required File file,
    required String uploadId,
    required int chunkSize,
    Function(double)? onProgress,
  }) async {
    final fileSize = await file.length();
    final totalChunks = (fileSize / chunkSize).ceil();
    
    for (int i = 0; i < totalChunks; i++) {
      final start = i * chunkSize;
      final end = (start + chunkSize > fileSize) ? fileSize : start + chunkSize;
      
      final chunk = await file.openRead(start, end).toList();
      final chunkBytes = chunk.expand((x) => x).toList();
      
      // Retry logic for each chunk
      await _uploadChunkWithRetry(
        uploadId: uploadId,
        chunkIndex: i,
        chunkData: chunkBytes,
        totalChunks: totalChunks,
      );
      
      if (onProgress != null) {
        onProgress((i + 1) / totalChunks);
      }
    }
  }
  
  Future<void> _uploadChunkWithRetry({
    required String uploadId,
    required int chunkIndex,
    required List<int> chunkData,
    required int totalChunks,
    int maxRetries = 3,
  }) async {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await _apiClient.post(
          '${ApiEndpoints.uploadChunk}/$uploadId',
          data: {
            'chunkIndex': chunkIndex,
            'totalChunks': totalChunks,
            'data': base64Encode(chunkData),
          },
        );
        return; // Success
      } catch (e) {
        if (attempt == maxRetries - 1) rethrow;
        await Future.delayed(Duration(seconds: pow(2, attempt).toInt()));
      }
    }
  }
  
  Future<String> _compressVideo(String path) async {
    final output = path.replaceAll('.mp4', '_compressed.mp4');
    
    await FFmpegKit.execute(
      '-i $path -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k $output'
    );
    
    return output;
  }
  
  Future<File> _generateThumbnail(String videoPath) async {
    final thumbnailPath = videoPath.replaceAll('.mp4', '_thumb.jpg');
    
    await FFmpegKit.execute(
      '-i $videoPath -ss 00:00:01.000 -vframes 1 $thumbnailPath'
    );
    
    return File(thumbnailPath);
  }
}
```

**Upload Details Screen:**
```dart
class UploadDetailsScreen extends ConsumerStatefulWidget {
  final String videoPath;
  final String thumbnailPath;
  
  @override
  ConsumerState<UploadDetailsScreen> createState() => _UploadDetailsScreenState();
}

class _UploadDetailsScreenState extends ConsumerState<UploadDetailsScreen> {
  final _descriptionController = TextEditingController();
  final List<String> _hashtags = [];
  String _privacy = 'public';
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  
  @override
  Widget build(BuildContext context) {
    final uploadState = ref.watch(uploadProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Post Video'),
        actions: [
          uploadState.isLoading
            ? Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : TextButton(
                onPressed: _handlePost,
                child: Text('Post', style: TextStyle(fontSize: 16)),
              ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Video preview
                  AspectRatio(
                    aspectRatio: 9/16,
                    child: Image.file(File(widget.thumbnailPath), fit: BoxFit.cover),
                  ),
                  SizedBox(height: 24),
                  
                  // Description
                  TextField(
                    controller: _descriptionController,
                    decoration: InputDecoration(
                      hintText: 'Add a description...',
                      border: InputBorder.none,
                    ),
                    maxLines: 5,
                    maxLength: 2200,
                  ),
                  
                  // Hashtag suggestions
                  HashtagInput(
                    hashtags: _hashtags,
                    onHashtagAdded: (tag) => setState(() => _hashtags.add(tag)),
                    onHashtagRemoved: (tag) => setState(() => _hashtags.remove(tag)),
                  ),
                  
                  Divider(height: 32),
                  
                  // Privacy
                  ListTile(
                    title: Text('Who can watch this video'),
                    trailing: DropdownButton<String>(
                      value: _privacy,
                      items: [
                        DropdownMenuItem(value: 'public', child: Text('Everyone')),
                        DropdownMenuItem(value: 'friends', child: Text('Friends')),
                        DropdownMenuItem(value: 'private', child: Text('Only me')),
                      ],
                      onChanged: (v) => setState(() => _privacy = v!),
                    ),
                  ),
                  
                  // Interaction settings
                  SwitchListTile(
                    title: Text('Allow comments'),
                    value: _allowComments,
                    onChanged: (v) => setState(() => _allowComments = v),
                  ),
                  SwitchListTile(
                    title: Text('Allow Duet'),
                    value: _allowDuet,
                    onChanged: (v) => setState(() => _allowDuet = v),
                  ),
                  SwitchListTile(
                    title: Text('Allow Stitch'),
                    value: _allowStitch,
                    onChanged: (v) => setState(() => _allowStitch = v),
                  ),
                ],
              ),
            ),
          ),
          
          // Upload progress
          if (uploadState.isLoading)
            LinearProgressIndicator(value: uploadState.progress),
        ],
      ),
    );
  }
  
  Future<void> _handlePost() async {
    if (_descriptionController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please add a description')),
      );
      return;
    }
    
    final result = await ref.read(uploadProvider.notifier).uploadVideo(
      videoPath: widget.videoPath,
      thumbnailPath: widget.thumbnailPath,
      description: _descriptionController.text,
      hashtags: _hashtags,
      privacy: _privacy,
      allowComments: _allowComments,
      allowDuet: _allowDuet,
      allowStitch: _allowStitch,
    );
    
    if (result) {
      // Navigate to feed
      Navigator.of(context).popUntil((route) => route.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Video posted successfully!')),
      );
    }
  }
}
```

#### 2.2 Feed Implementation (Days 5-7)

**TikTok-style Vertical Feed:**
```dart
class FeedScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  
  @override
  void initState() {
    super.initState();
    // Prefetch next videos
    _pageController.addListener(_onPageChanged);
  }
  
  void _onPageChanged() {
    final page = _pageController.page?.round() ?? 0;
    if (page != _currentIndex) {
      setState(() => _currentIndex = page);
      
      // Prefetch videos ahead
      ref.read(feedProvider.notifier).prefetchVideos(page + 3);
      
      // Mark as viewed
      ref.read(feedProvider.notifier).markAsViewed(_currentIndex);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);
    
    return Scaffold(
      body: feedState.when(
        data: (videos) {
          if (videos.isEmpty) {
            return Center(child: Text('No videos yet'));
          }
          
          return PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: videos.length,
            onPageChanged: (index) {
              // Load more when near end
              if (index >= videos.length - 5) {
                ref.read(feedProvider.notifier).loadMore();
              }
            },
            itemBuilder: (context, index) {
              final video = videos[index];
              final isActive = index == _currentIndex;
              
              return VideoPlayerWidget(
                video: video,
                isActive: isActive,
              );
            },
          );
        },
        loading: () => Center(child: CircularProgressIndicator()),
        error: (e, st) => ErrorWidget(e),
      ),
    );
  }
}

// Video Player Widget with interactions
class VideoPlayerWidget extends ConsumerStatefulWidget {
  final VideoModel video;
  final bool isActive;
  
  @override
  ConsumerState<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends ConsumerState<VideoPlayerWidget> {
  late VideoPlayerController _controller;
  bool _isLiked = false;
  bool _isMuted = false;
  
  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }
  
  Future<void> _initializePlayer() async {
    _controller = VideoPlayerController.network(widget.video.videoUrl);
    await _controller.initialize();
    _controller.setLooping(true);
    
    if (widget.isActive) {
      _controller.play();
    }
    
    setState(() {});
  }
  
  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isActive && !oldWidget.isActive) {
      _controller.play();
    } else if (!widget.isActive && oldWidget.isActive) {
      _controller.pause();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (!_controller.value.isInitialized) {
      return Container(color: Colors.black);
    }
    
    return GestureDetector(
      onDoubleTapDown: (details) => _handleDoubleTap(details.localPosition),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video player
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller.value.size.width,
              height: _controller.value.size.height,
              child: VideoPlayer(_controller),
            ),
          ),
          
          // Gradient overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                ),
              ),
            ),
          ),
          
          // Right side actions
          Positioned(
            right: 12,
            bottom: 100,
            child: Column(
              children: [
                // Profile
                ActionButton(
                  child: CircleAvatar(
                    backgroundImage: CachedNetworkImageProvider(
                      widget.video.user.avatarUrl,
                    ),
                  ),
                  onTap: () => _navigateToProfile(widget.video.user.id),
                ),
                SizedBox(height: 24),
                
                // Like
                ActionButton(
                  icon: _isLiked ? Icons.favorite : Icons.favorite_border,
                  color: _isLiked ? Colors.red : Colors.white,
                  count: widget.video.likesCount + (_isLiked ? 1 : 0),
                  onTap: _toggleLike,
                ),
                SizedBox(height: 24),
                
                // Comment
                ActionButton(
                  icon: Icons.comment_outlined,
                  count: widget.video.commentsCount,
                  onTap: () => _showComments(),
                ),
                SizedBox(height: 24),
                
                // Share
                ActionButton(
                  icon: Icons.share_outlined,
                  count: widget.video.sharesCount,
                  onTap: () => _share(),
                ),
              ],
            ),
          ),
          
          // Bottom info
          Positioned(
            left: 12,
            right: 80,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '@${widget.video.user.username}',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  widget.video.description,
                  style: TextStyle(color: Colors.white),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 8),
                if (widget.video.soundName != null)
                  Row(
                    children: [
                      Icon(Icons.music_note, size: 16, color: Colors.white),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.video.soundName!,
                          style: TextStyle(color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          
          // Mute button
          Positioned(
            top: 50,
            right: 12,
            child: IconButton(
              icon: Icon(
                _isMuted ? Icons.volume_off : Icons.volume_up,
                color: Colors.white,
              ),
              onPressed: () {
                setState(() {
                  _isMuted = !_isMuted;
                  _controller.setVolume(_isMuted ? 0 : 1);
                });
              },
            ),
          ),
        ],
      ),
    );
  }
  
  Future<void> _toggleLike() async {
    setState(() => _isLiked = !_isLiked);
    
    if (_isLiked) {
      // Show heart animation
      _showHeartAnimation();
      await ref.read(videosRepositoryProvider).likeVideo(widget.video.id);
    } else {
      await ref.read(videosRepositoryProvider).unlikeVideo(widget.video.id);
    }
  }
  
  void _handleDoubleTap(Offset position) {
    if (!_isLiked) {
      _toggleLike();
      _showHeartAnimation(position: position);
    }
  }
  
  void _showHeartAnimation({Offset? position}) {
    // Show Lottie heart animation at tap position
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

---

**TO BE CONTINUED IN NEXT FILES...**

This is Part 1 of the comprehensive plan. The full implementation includes:
- Phase 3: Live Streaming (Agora/Zego)
- Phase 4: E-commerce & Wallet
- Phase 5: Search, Notifications & Settings
- Phase 6: Testing & Optimization
- Complete file structure
- API contracts
- Acceptance tests

Should I continue with the remaining phases?
