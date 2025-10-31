import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/comments_providers.dart';
import '../../widgets/comment_item.dart';

/// Bottom sheet for displaying and adding comments
class CommentsBottomSheet extends ConsumerStatefulWidget {
  final String contentId;
  final int initialCommentsCount;

  const CommentsBottomSheet({
    Key? key,
    required this.contentId,
    this.initialCommentsCount = 0,
  }) : super(key: key);

  @override
  ConsumerState<CommentsBottomSheet> createState() =>
      _CommentsBottomSheetState();

  /// Static method to show the bottom sheet
  static void show(
    BuildContext context, {
    required String contentId,
    int initialCommentsCount = 0,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsBottomSheet(
        contentId: contentId,
        initialCommentsCount: initialCommentsCount,
      ),
    );
  }
}

class _CommentsBottomSheetState extends ConsumerState<CommentsBottomSheet> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _replyingToId;
  String? _replyingToUsername;

  @override
  void initState() {
    super.initState();
    // Load comments when sheet opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(commentsNotifierProvider(widget.contentId).notifier)
          .loadComments(widget.contentId);
    });

    // Setup scroll listener for pagination
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      // Load more when 90% scrolled
      ref
          .read(commentsNotifierProvider(widget.contentId).notifier)
          .loadMoreComments(widget.contentId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final commentsState = ref.watch(commentsNotifierProvider(widget.contentId));

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.lightBorder.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Text(
                      'Comments',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(${commentsState.comments.length})',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppColors.lightTextSecondary,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Comments list
              Expanded(
                child: _buildCommentsList(commentsState, scrollController),
              ),

              const Divider(height: 1),

              // Input field
              _buildCommentInput(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCommentsList(commentsState, ScrollController scrollController) {
    if (commentsState.isLoading && commentsState.comments.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (commentsState.error != null && commentsState.comments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: AppColors.lightTextSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              commentsState.error!,
              style: TextStyle(
                color: AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                ref
                    .read(commentsNotifierProvider(widget.contentId).notifier)
                    .loadComments(widget.contentId);
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (commentsState.comments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: AppColors.lightBorder,
            ),
            const SizedBox(height: 16),
            Text(
              'No comments yet',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to comment!',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: commentsState.comments.length +
          (commentsState.isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= commentsState.comments.length) {
          // Loading indicator at bottom
          return const Padding(
            padding: EdgeInsets.all(16.0),
            child: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        final comment = commentsState.comments[index];
        return CommentItem(
          comment: comment,
          contentId: widget.contentId,
          onReply: () => _setReplyTo(comment.id, comment.user.username),
        );
      },
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 8,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom + 8,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Replying to indicator
          if (_replyingToUsername != null) ...[
            Row(
              children: [
                Text(
                  'Replying to @$_replyingToUsername',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _cancelReply(),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],

          // Input row
          Row(
            children: [
              // Input field
              Expanded(
                child: TextField(
                  controller: _commentController,
                  decoration: InputDecoration(
                    hintText: _replyingToUsername != null
                        ? 'Write a reply...'
                        : 'Add a comment...',
                    hintStyle: TextStyle(color: AppColors.lightTextSecondary),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: AppColors.lightBorder),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: AppColors.lightBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: AppColors.primary),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ),
              const SizedBox(width: 8),

              // Send button
              IconButton(
                onPressed: _submitComment,
                icon: Icon(
                  Icons.send,
                  color: _commentController.text.isNotEmpty
                      ? AppColors.primary
                      : AppColors.lightBorder,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _setReplyTo(String commentId, String username) {
    setState(() {
      _replyingToId = commentId;
      _replyingToUsername = username;
    });
    FocusScope.of(context).requestFocus(FocusNode());
  }

  void _cancelReply() {
    setState(() {
      _replyingToId = null;
      _replyingToUsername = null;
    });
  }

  Future<void> _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final success = await ref
        .read(commentsNotifierProvider(widget.contentId).notifier)
        .createNewComment(
          contentId: widget.contentId,
          text: text,
          parentId: _replyingToId,
        );

    if (success) {
      _commentController.clear();
      _cancelReply();
      
      // Scroll to top to show new comment
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to post comment'),
          ),
        );
      }
    }
  }
}
