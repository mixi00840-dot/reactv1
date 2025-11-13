import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../providers/post_provider.dart';
import '../../../sounds/providers/selected_sound_provider.dart';
import '../widgets/caption_input_widget.dart';
import '../widgets/privacy_dropdown.dart';
import '../widgets/post_toggle_row.dart';
import 'cover_selector_page.dart';

/// TikTok-style video post page
/// Where users add caption, hashtags, privacy settings, and publish
class VideoPostPage extends ConsumerStatefulWidget {
  final String videoPath;
  final String? thumbnailPath;
  final String? soundId;

  const VideoPostPage({
    super.key,
    required this.videoPath,
    this.thumbnailPath,
    this.soundId,
  });

  @override
  ConsumerState<VideoPostPage> createState() => _VideoPostPageState();
}

class _VideoPostPageState extends ConsumerState<VideoPostPage> {
  final TextEditingController _captionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    
    // Initialize post state with sound if available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.soundId != null) {
        ref.read(postProvider(widget.videoPath).notifier).setSound(widget.soundId);
      }
    });
  }

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _onPost() async {
    final postState = ref.read(postProvider(widget.videoPath));

    if (!postState.canPublish) {
      _showError('Cannot publish at this time');
      return;
    }

    if (postState.exceedsMaxLength) {
      _showError('Caption is too long (max 150 characters)');
      return;
    }

    // Show confirmation
    final confirmed = await _showPublishConfirmation();
    if (!confirmed) return;

    // Show progress dialog
    if (!mounted) return;
    _showUploadProgress();

    // Publish
    final success = await ref
        .read(postProvider(widget.videoPath).notifier)
        .publish();

    if (!mounted) return;
    Navigator.of(context).pop(); // Close progress dialog

    if (success) {
      _showSuccess('Video published successfully!');
      // Navigate back to home/feed
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      final error = postState.uploadError ?? 'Upload failed';
      _showError(error);
    }
  }

  Future<void> _onSaveDraft() async {
    final success = await ref
        .read(postProvider(widget.videoPath).notifier)
        .saveDraft();

    if (success) {
      _showSuccess('Saved to drafts');
      if (mounted) Navigator.of(context).pop();
    } else {
      _showError('Failed to save draft');
    }
  }

  Future<bool> _showPublishConfirmation() async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text(
              'Publish Video?',
              style: TextStyle(color: Colors.white),
            ),
            content: const Text(
              'Your video will be uploaded and published.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Publish'),
              ),
            ],
          ),
        ) ??
        false;
  }

  void _showUploadProgress() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Consumer(
        builder: (context, ref, child) {
          final postState = ref.watch(postProvider(widget.videoPath));
          
          return AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(
                  value: postState.uploadProgress,
                  color: AppColors.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  'Uploading... ${(postState.uploadProgress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.successGreen,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final postState = ref.watch(postProvider(widget.videoPath));
    final selectedSound = ref.watch(selectedSoundProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Post',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: postState.canPublish ? _onPost : null,
            child: Text(
              'Post',
              style: TextStyle(
                color: postState.canPublish
                    ? AppColors.primary
                    : AppColors.textDisabled,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: AppColors.border,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          // Video Preview + Caption Input
          _buildVideoAndCaptionSection(postState, selectedSound),

          const Divider(color: AppColors.border, height: 32),

          // Sound Row
          if (selectedSound.hasSound) _buildSoundRow(selectedSound.sound!.title),

          const Divider(color: AppColors.border, height: 32),

          // Cover Selection (placeholder for now)
          _buildCoverRow(),

          const Divider(color: AppColors.border, height: 32),

          // Tag People (placeholder)
          _buildTagPeopleRow(),

          const Divider(color: AppColors.border, height: 32),

          // Location (placeholder)
          _buildLocationRow(),

          const Divider(color: AppColors.border, height: 32),

          // Privacy Dropdown
          PrivacyDropdown(
            selectedPrivacy: postState.privacy,
            onPrivacyChanged: (privacy) {
              ref
                  .read(postProvider(widget.videoPath).notifier)
                  .setPrivacy(privacy);
            },
          ),

          const Divider(color: AppColors.border, height: 32),

          // Toggles Section
          PostToggleRow(
            label: 'Allow comments',
            value: postState.allowComments,
            onChanged: (_) {
              ref
                  .read(postProvider(widget.videoPath).notifier)
                  .toggleComments();
            },
          ),
          PostToggleRow(
            label: 'Allow Duet',
            value: postState.allowDuet,
            onChanged: (_) {
              ref.read(postProvider(widget.videoPath).notifier).toggleDuet();
            },
          ),
          PostToggleRow(
            label: 'Allow Stitch',
            value: postState.allowStitch,
            onChanged: (_) {
              ref.read(postProvider(widget.videoPath).notifier).toggleStitch();
            },
          ),

          const SizedBox(height: 32),

          // Save Draft Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton(
              onPressed: _onSaveDraft,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: AppColors.border),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Save as Draft'),
            ),
          ),

          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _buildVideoAndCaptionSection(postState, selectedSound) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video Thumbnail
          Container(
            width: 90,
            height: 120,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: AppColors.surface,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: widget.thumbnailPath != null
                  ? Image.file(
                      File(widget.thumbnailPath!),
                      fit: BoxFit.cover,
                    )
                  : const Center(
                      child: Icon(
                        Icons.videocam,
                        color: AppColors.textSecondary,
                        size: 32,
                      ),
                    ),
            ),
          ),

          const SizedBox(width: 12),

          // Caption Input
          Expanded(
            child: CaptionInputWidget(
              controller: _captionController,
              onChanged: (caption) {
                ref
                    .read(postProvider(widget.videoPath).notifier)
                    .setCaption(caption);
              },
              currentLength: postState.captionLength,
              maxLength: 150,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSoundRow(String soundName) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
        child: const Icon(
          Icons.music_note,
          color: AppColors.primary,
          size: 20,
        ),
      ),
      title: const Text(
        'Sound',
        style: TextStyle(
          color: AppColors.textSecondary,
          fontSize: 13,
        ),
      ),
      subtitle: Text(
        soundName,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.textSecondary,
      ),
      onTap: () {
        // TODO: Open sound library to change
      },
    );
  }

  Widget _buildCoverRow() {
    final postState = ref.watch(postProvider(widget.videoPath));

    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: AppColors.surface,
        ),
        child: postState.thumbnailPath != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(
                  File(postState.thumbnailPath!),
                  fit: BoxFit.cover,
                ),
              )
            : const Icon(
                Icons.image,
                color: AppColors.textSecondary,
                size: 20,
              ),
      ),
      title: const Text(
        'Select cover',
        style: TextStyle(
          color: Colors.white,
          fontSize: 15,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.textSecondary,
      ),
      onTap: () async {
        final coverPath = await Navigator.of(context).push<String>(
          MaterialPageRoute(
            builder: (context) => CoverSelectorPage(
              videoPath: widget.videoPath,
              currentCoverPath: postState.thumbnailPath,
            ),
          ),
        );

        if (coverPath != null && mounted) {
          ref
              .read(postProvider(widget.videoPath).notifier)
              .setThumbnail(coverPath);
        }
      },
    );
  }

  Widget _buildTagPeopleRow() {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.surface,
        ),
        child: const Icon(
          Icons.person_add,
          color: AppColors.textSecondary,
          size: 20,
        ),
      ),
      title: const Text(
        'Tag people',
        style: TextStyle(
          color: Colors.white,
          fontSize: 15,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.textSecondary,
      ),
      onTap: () {
        // TODO: Open user search
      },
    );
  }

  Widget _buildLocationRow() {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.surface,
        ),
        child: const Icon(
          Icons.location_on,
          color: AppColors.textSecondary,
          size: 20,
        ),
      ),
      title: const Text(
        'Add location',
        style: TextStyle(
          color: Colors.white,
          fontSize: 15,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.textSecondary,
      ),
      onTap: () {
        // TODO: Open location picker
      },
    );
  }
}

