import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../domain/entities/comment.dart';
import '../../core/theme/app_colors.dart';
import '../providers/comments_providers.dart';

/// Widget for displaying a single comment
class CommentItem extends ConsumerStatefulWidget {
  final Comment comment;
  final String contentId;
  final VoidCallback? onReply;
  final bool isReply;

  const CommentItem({
    Key? key,
    required this.comment,
    required this.contentId,
    this.onReply,
    this.isReply = false,
  }) : super(key: key);

  @override
  ConsumerState<CommentItem> createState() => _CommentItemState();
}

class _CommentItemState extends ConsumerState<CommentItem> {
  bool _showReplies = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: widget.isReply ? 48.0 : 0,
        bottom: 12.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: widget.isReply ? 16 : 20,
            backgroundColor: AppColors.lightBorder,
            backgroundImage: widget.comment.user.avatar != null
                ? NetworkImage(widget.comment.user.avatar!)
                : null,
            child: widget.comment.user.avatar == null
                ? Text(
                    widget.comment.user.username[0].toUpperCase(),
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: widget.isReply ? 14 : 16,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // Comment content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Username and verified badge
                Row(
                  children: [
                    Text(
                      widget.comment.user.username,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    if (widget.comment.user.isVerified) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.verified,
                        color: AppColors.primary,
                        size: 16,
                      ),
                    ],
                    const Spacer(),
                    // Like button
                    GestureDetector(
                      onTap: () => _handleLike(),
                      child: Icon(
                        widget.comment.isLiked
                            ? Icons.favorite
                            : Icons.favorite_border,
                        color: widget.comment.isLiked
                            ? Colors.red
                            : AppColors.lightTextSecondary,
                        size: 18,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),

                // Comment text
                Text(
                  widget.comment.text,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),

                // Action row (timestamp, likes, reply)
                Row(
                  children: [
                    Text(
                      timeago.format(widget.comment.createdAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.lightTextSecondary,
                      ),
                    ),
                    if (widget.comment.likesCount > 0) ...[
                      const SizedBox(width: 12),
                      Text(
                        '${widget.comment.likesCount} ${widget.comment.likesCount == 1 ? 'like' : 'likes'}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.lightTextSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    if (!widget.isReply && widget.onReply != null) ...[
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: widget.onReply,
                        child: Text(
                          'Reply',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.lightTextSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    // More options
                    GestureDetector(
                      onTap: () => _showOptions(context),
                      child: Icon(
                        Icons.more_horiz,
                        color: AppColors.lightTextSecondary,
                        size: 18,
                      ),
                    ),
                  ],
                ),

                // View replies button
                if (!widget.isReply &&
                    widget.comment.repliesCount > 0 &&
                    widget.comment.replies.isEmpty) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {
                      setState(() => _showReplies = !_showReplies);
                    },
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 1,
                          color: AppColors.lightTextSecondary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'View ${widget.comment.repliesCount} ${widget.comment.repliesCount == 1 ? 'reply' : 'replies'}',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.lightTextSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Nested replies
                if (widget.comment.replies.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...widget.comment.replies.map((reply) => CommentItem(
                        comment: reply,
                        contentId: widget.contentId,
                        isReply: true,
                      )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _handleLike() {
    ref.read(commentsNotifierProvider(widget.contentId).notifier).toggleLike(
          widget.comment.id,
          widget.comment.isLiked,
        );
  }

  void _showOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.report_outlined),
              title: const Text('Report'),
              onTap: () {
                Navigator.pop(context);
                _showReportDialog(context);
              },
            ),
            // TODO: Add Edit/Delete options if user owns the comment
          ],
        ),
      ),
    );
  }

  void _showReportDialog(BuildContext context) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Comment'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            hintText: 'Reason for reporting',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (reasonController.text.isNotEmpty) {
                final success = await ref
                    .read(commentsNotifierProvider(widget.contentId).notifier)
                    .reportAComment(
                      commentId: widget.comment.id,
                      reason: reasonController.text,
                    );

                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        success
                            ? 'Comment reported successfully'
                            : 'Failed to report comment',
                      ),
                    ),
                  );
                }
              }
            },
            child: const Text('Report'),
          ),
        ],
      ),
    );
  }
}
