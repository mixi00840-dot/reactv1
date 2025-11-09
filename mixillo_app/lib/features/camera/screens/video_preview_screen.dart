import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:dio/dio.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/services/video_upload_service.dart';
import '../models/video_clip.dart';

/// Video preview and editing screen
/// Allows users to review processed video, add caption, select cover, and post
class VideoPreviewScreen extends StatefulWidget {
  final ProcessedVideo processedVideo;
  final List<VideoClip> originalClips;

  const VideoPreviewScreen({
    Key? key,
    required this.processedVideo,
    required this.originalClips,
  }) : super(key: key);

  @override
  State<VideoPreviewScreen> createState() => _VideoPreviewScreenState();
}

class _VideoPreviewScreenState extends State<VideoPreviewScreen> {
  // ==================== VIDEO PLAYER ====================
  
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isPlaying = false;
  
  // ==================== CAPTION & METADATA ====================
  
  final TextEditingController _captionController = TextEditingController();
  final FocusNode _captionFocusNode = FocusNode();
  
  String _selectedPrivacy = 'Public';
  final List<String> _privacyOptions = ['Public', 'Friends', 'Private'];
  
  String? _selectedLocation;
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  
  // ==================== UPLOAD ====================
  
  final VideoUploadService _uploadService = VideoUploadService();
  CancelToken? _cancelToken;
  bool _isUploading = false;
  double _uploadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _initializeVideoPlayer();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _captionController.dispose();
    _captionFocusNode.dispose();
    super.dispose();
  }

  /// Initialize video player with processed video
  Future<void> _initializeVideoPlayer() async {
    _videoController = VideoPlayerController.file(
      File(widget.processedVideo.outputPath),
    );

    try {
      await _videoController!.initialize();
      await _videoController!.setLooping(true);
      setState(() {
        _isVideoInitialized = true;
      });
      
      // Auto-play
      _togglePlayPause();
    } catch (e) {
      debugPrint('❌ Failed to initialize video player: $e');
    }
  }

  /// Toggle play/pause
  void _togglePlayPause() {
    if (_videoController == null) return;

    setState(() {
      if (_isPlaying) {
        _videoController!.pause();
        _isPlaying = false;
      } else {
        _videoController!.play();
        _isPlaying = true;
      }
    });
  }

  /// Navigate to upload
  Future<void> _handlePost() async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    _cancelToken = CancelToken();

    try {
      // Extract hashtags and mentions from caption
      final caption = _captionController.text;
      final hashtags = _extractHashtags(caption);
      final mentions = _extractMentions(caption);

      // Create metadata
      final metadata = VideoMetadata(
        caption: caption,
        hashtags: hashtags,
        mentions: mentions,
        privacy: _selectedPrivacy,
        location: _selectedLocation,
        allowComments: _allowComments,
        allowDuet: _allowDuet,
        allowStitch: _allowStitch,
        duration: widget.processedVideo.duration,
        width: widget.processedVideo.width,
        height: widget.processedVideo.height,
      );

      // Upload video
      await _uploadService.uploadVideo(
        videoPath: widget.processedVideo.outputPath,
        thumbnailPath: widget.processedVideo.thumbnailPath,
        metadata: metadata,
        onProgress: (progress) {
          setState(() {
            _uploadProgress = progress;
          });
        },
        cancelToken: _cancelToken,
      );

      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Video posted successfully!'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Upload failed: $e'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  /// Extract hashtags from caption
  List<String> _extractHashtags(String text) {
    final regex = RegExp(r'#(\w+)');
    final matches = regex.allMatches(text);
    return matches.map((match) => match.group(1)!).toList();
  }

  /// Extract mentions from caption
  List<String> _extractMentions(String text) {
    final regex = RegExp(r'@(\w+)');
    final matches = regex.allMatches(text);
    return matches.map((match) => match.group(1)!).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: Stack(
        children: [
          // Video player
          _buildVideoPlayer(),
          
          // Top app bar
          _buildTopBar(),
          
          // Bottom editor panel
          _buildBottomPanel(),
          
          // Upload progress overlay
          if (_isUploading) _buildUploadOverlay(),
        ],
      ),
    );
  }

  /// Video player widget
  Widget _buildVideoPlayer() {
    if (!_isVideoInitialized) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
        ),
      );
    }

    return GestureDetector(
      onTap: _togglePlayPause,
      child: Center(
        child: AspectRatio(
          aspectRatio: _videoController!.value.aspectRatio,
          child: VideoPlayer(_videoController!),
        ),
      ),
    );
  }

  /// Top app bar
  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Container(
          height: 60,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.7),
                Colors.transparent,
              ],
            ),
          ),
          child: Row(
            children: [
              // Back button
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
              
              const Spacer(),
              
              // Sound button
              IconButton(
                icon: const Icon(Icons.music_note, color: Colors.white),
                onPressed: () {
                  // TODO: Change sound
                },
              ),
              
              // Volume button
              IconButton(
                icon: Icon(
                  _isPlaying ? Icons.volume_up : Icons.volume_off,
                  color: Colors.white,
                ),
                onPressed: _togglePlayPause,
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Bottom editing panel
  Widget _buildBottomPanel() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusXl),
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.darkTextSecondary,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                ),
              ),
              
              // Caption input
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                child: TextField(
                  controller: _captionController,
                  focusNode: _captionFocusNode,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.darkTextPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Add a caption...',
                    hintStyle: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.darkTextSecondary,
                    ),
                    border: InputBorder.none,
                    suffixIcon: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.alternate_email, size: 20),
                          color: AppColors.darkTextSecondary,
                          onPressed: () {
                            // TODO: Mention user
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.tag, size: 20),
                          color: AppColors.darkTextSecondary,
                          onPressed: () {
                            // TODO: Add hashtag
                          },
                        ),
                      ],
                    ),
                  ),
                  maxLines: 3,
                  maxLength: 300,
                ),
              ),
              
              const Divider(height: 1, color: AppColors.darkDivider),
              
              // Options
              _buildOption(
                icon: Icons.image_outlined,
                label: 'Cover',
                onTap: () {
                  // TODO: Select cover frame
                },
              ),
              
              _buildOption(
                icon: Icons.location_on_outlined,
                label: _selectedLocation ?? 'Add location',
                onTap: () {
                  // TODO: Select location
                },
              ),
              
              _buildOption(
                icon: Icons.public,
                label: _selectedPrivacy,
                trailing: const Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: AppColors.darkTextSecondary,
                ),
                onTap: _showPrivacyOptions,
              ),
              
              // Advanced settings
              ExpansionTile(
                title: Text(
                  'Advanced settings',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.darkTextPrimary,
                  ),
                ),
                iconColor: AppColors.darkTextSecondary,
                children: [
                  _buildSwitchOption(
                    'Allow comments',
                    _allowComments,
                    (value) => setState(() => _allowComments = value),
                  ),
                  _buildSwitchOption(
                    'Allow Duet',
                    _allowDuet,
                    (value) => setState(() => _allowDuet = value),
                  ),
                  _buildSwitchOption(
                    'Allow Stitch',
                    _allowStitch,
                    (value) => setState(() => _allowStitch = value),
                  ),
                ],
              ),
              
              // Post button
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isUploading ? null : _handlePost,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      disabledBackgroundColor: AppColors.darkTextDisabled,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                      ),
                    ),
                    child: Text(
                      'Post',
                      style: AppTextStyles.buttonLarge.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Build option row
  Widget _buildOption({
    required IconData icon,
    required String label,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.darkTextSecondary),
      title: Text(
        label,
        style: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.darkTextPrimary,
        ),
      ),
      trailing: trailing,
      onTap: onTap,
    );
  }

  /// Build switch option
  Widget _buildSwitchOption(
    String label,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      title: Text(
        label,
        style: AppTextStyles.bodyMedium.copyWith(
          color: AppColors.darkTextPrimary,
        ),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: AppColors.primary,
    );
  }

  /// Show privacy options modal
  void _showPrivacyOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXl),
        ),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Text(
                'Who can watch this video',
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.darkTextPrimary,
                ),
              ),
            ),
            ..._privacyOptions.map((option) {
              return RadioListTile<String>(
                title: Text(
                  option,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.darkTextPrimary,
                  ),
                ),
                value: option,
                groupValue: _selectedPrivacy,
                activeColor: AppColors.primary,
                onChanged: (value) {
                  setState(() {
                    _selectedPrivacy = value!;
                  });
                  Navigator.pop(context);
                },
              );
            }).toList(),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }

  /// Upload progress overlay
  Widget _buildUploadOverlay() {
    return Container(
      color: Colors.black.withOpacity(0.8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              color: AppColors.primary,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Uploading ${(_uploadProgress * 100).toInt()}%',
              style: AppTextStyles.h3.copyWith(
                color: Colors.white,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              child: LinearProgressIndicator(
                value: _uploadProgress,
                backgroundColor: AppColors.darkTextDisabled,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
