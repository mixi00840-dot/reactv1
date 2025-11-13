import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../../../core/providers/core_providers.dart';
import '../models/post_model.dart';
import '../models/privacy_setting.dart';
import '../services/post_service.dart';
import '../services/caption_processor.dart';

/// Provider for PostService
final postServiceProvider = Provider<PostService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PostService(apiService);
});

/// Post state for creating and publishing content
class PostState {
  final String videoPath;
  final String? thumbnailPath;
  final String caption;
  final List<String> hashtags;
  final List<String> mentions;
  final PrivacySetting privacy;
  final bool allowComments;
  final bool allowDuet;
  final bool allowStitch;
  final String? soundId;
  final String? location;
  final DateTime? scheduledAt;
  final List<String> taggedUserIds;
  final bool isUploading;
  final double uploadProgress;
  final String? uploadError;
  final bool isPublished;

  const PostState({
    required this.videoPath,
    this.thumbnailPath,
    this.caption = '',
    this.hashtags = const [],
    this.mentions = const [],
    this.privacy = PrivacySetting.public,
    this.allowComments = true,
    this.allowDuet = true,
    this.allowStitch = true,
    this.soundId,
    this.location,
    this.scheduledAt,
    this.taggedUserIds = const [],
    this.isUploading = false,
    this.uploadProgress = 0.0,
    this.uploadError,
    this.isPublished = false,
  });

  bool get isValid => videoPath.isNotEmpty;
  
  bool get canPublish => !isUploading && isValid;

  int get captionLength => caption.length;

  bool get exceedsMaxLength => captionLength > 150;

  PostData toPostData() {
    return PostData(
      videoPath: videoPath,
      thumbnailPath: thumbnailPath,
      caption: caption,
      hashtags: hashtags,
      mentions: mentions,
      privacy: privacy,
      allowComments: allowComments,
      allowDuet: allowDuet,
      allowStitch: allowStitch,
      soundId: soundId,
      location: location,
      scheduledAt: scheduledAt,
      taggedUserIds: taggedUserIds,
    );
  }

  PostState copyWith({
    String? videoPath,
    String? thumbnailPath,
    String? caption,
    List<String>? hashtags,
    List<String>? mentions,
    PrivacySetting? privacy,
    bool? allowComments,
    bool? allowDuet,
    bool? allowStitch,
    String? soundId,
    String? location,
    DateTime? scheduledAt,
    List<String>? taggedUserIds,
    bool? isUploading,
    double? uploadProgress,
    String? uploadError,
    bool? isPublished,
  }) {
    return PostState(
      videoPath: videoPath ?? this.videoPath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      caption: caption ?? this.caption,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      privacy: privacy ?? this.privacy,
      allowComments: allowComments ?? this.allowComments,
      allowDuet: allowDuet ?? this.allowDuet,
      allowStitch: allowStitch ?? this.allowStitch,
      soundId: soundId ?? this.soundId,
      location: location ?? this.location,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      taggedUserIds: taggedUserIds ?? this.taggedUserIds,
      isUploading: isUploading ?? this.isUploading,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      uploadError: uploadError,
      isPublished: isPublished ?? this.isPublished,
    );
  }
}

/// Post provider for managing post creation and upload
final postProvider =
    StateNotifierProvider.family<PostNotifier, PostState, String>(
  (ref, videoPath) => PostNotifier(videoPath, ref),
);

class PostNotifier extends StateNotifier<PostState> {
  final Ref _ref;

  PostNotifier(String videoPath, this._ref)
      : super(PostState(videoPath: videoPath));

  PostService get _postService => _ref.read(postServiceProvider);

  /// Set caption and auto-extract hashtags/mentions
  void setCaption(String caption) {
    final hashtags = CaptionProcessor.extractHashtags(caption);
    final mentions = CaptionProcessor.extractMentions(caption);

    state = state.copyWith(
      caption: caption,
      hashtags: hashtags,
      mentions: mentions,
      uploadError: null,
    );
  }

  /// Set thumbnail path
  void setThumbnail(String? thumbnailPath) {
    state = state.copyWith(thumbnailPath: thumbnailPath);
  }

  /// Set privacy setting
  void setPrivacy(PrivacySetting privacy) {
    state = state.copyWith(privacy: privacy);
  }

  /// Toggle allow comments
  void toggleComments() {
    state = state.copyWith(allowComments: !state.allowComments);
  }

  /// Toggle allow duet
  void toggleDuet() {
    state = state.copyWith(allowDuet: !state.allowDuet);
  }

  /// Toggle allow stitch
  void toggleStitch() {
    state = state.copyWith(allowStitch: !state.allowStitch);
  }

  /// Set sound ID
  void setSound(String? soundId) {
    state = state.copyWith(soundId: soundId);
  }

  /// Set location
  void setLocation(String? location) {
    state = state.copyWith(location: location);
  }

  /// Set scheduled time
  void setScheduledAt(DateTime? scheduledAt) {
    state = state.copyWith(scheduledAt: scheduledAt);
  }

  /// Add tagged user
  void addTaggedUser(String userId) {
    if (!state.taggedUserIds.contains(userId)) {
      state = state.copyWith(
        taggedUserIds: [...state.taggedUserIds, userId],
      );
    }
  }

  /// Remove tagged user
  void removeTaggedUser(String userId) {
    state = state.copyWith(
      taggedUserIds: state.taggedUserIds.where((id) => id != userId).toList(),
    );
  }

  /// Upload and publish post
  Future<bool> publish() async {
    if (!state.canPublish) return false;

    state = state.copyWith(
      isUploading: true,
      uploadProgress: 0.0,
      uploadError: null,
    );

    try {
      await _postService.uploadAndPost(
        postData: state.toPostData(),
        onProgress: (progress) {
          if (mounted) {
            state = state.copyWith(uploadProgress: progress);
          }
        },
      );

      state = state.copyWith(
        isUploading: false,
        uploadProgress: 1.0,
        isPublished: true,
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isUploading: false,
        uploadError: e.toString(),
      );
      return false;
    }
  }

  /// Save as draft
  Future<bool> saveDraft() async {
    try {
      await _postService.saveDraft(state.toPostData());
      return true;
    } catch (e) {
      print('❌ Save draft error: $e');
      return false;
    }
  }

  /// Reset to initial state
  void reset() {
    state = PostState(videoPath: state.videoPath);
  }
}

/// Upload progress provider (for UI updates)
final uploadProgressProvider = StateProvider<double>((ref) => 0.0);

