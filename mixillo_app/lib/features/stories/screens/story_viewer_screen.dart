import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:story_view/story_view.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/story_model.dart';
import '../providers/stories_provider.dart';

class StoryViewerScreen extends StatefulWidget {
  final List<StoryGroup> storyGroups;
  final int initialIndex;

  const StoryViewerScreen({
    super.key,
    required this.storyGroups,
    this.initialIndex = 0,
  });

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen> {
  final StoryController _controller = StoryController();
  int _currentGroupIndex = 0;
  int _currentStoryIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentGroupIndex = widget.initialIndex;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<StoryItem> _buildStoryItems(StoryGroup group) {
    return group.stories.map((story) {
      if (story.isImage) {
        return StoryItem.pageImage(
          url: story.mediaUrl,
          controller: _controller,
          duration: Duration(seconds: story.duration),
          caption: story.caption != null && story.caption!.isNotEmpty
            ? Text(
                story.caption!,
                style: const TextStyle(color: Colors.white, fontSize: 17),
              )
            : null,
        );
      } else if (story.isVideo) {
        return StoryItem.pageVideo(
          story.mediaUrl,
          controller: _controller,
          duration: Duration(seconds: story.duration),
          caption: story.caption != null && story.caption!.isNotEmpty
            ? Text(
                story.caption!,
                style: const TextStyle(color: Colors.white, fontSize: 17),
              )
            : null,
        );
      } else {
        // Text story - use colored background (deprecated method, use pageImage)
        return StoryItem.pageImage(
          url: story.mediaUrl,
          controller: _controller,
          duration: Duration(seconds: story.duration),
          caption: story.caption != null && story.caption!.isNotEmpty
            ? Text(
                story.caption!,
                style: const TextStyle(color: Colors.white, fontSize: 17),
              )
            : null,
        );
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.storyGroups.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: Text(
            'No stories available',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    final currentGroup = widget.storyGroups[_currentGroupIndex];
    final storyItems = _buildStoryItems(currentGroup);

    return Scaffold(
      body: Stack(
        children: [
          StoryView(
            storyItems: storyItems,
            controller: _controller,
            onStoryShow: (storyItem, index) {
              _currentStoryIndex = index;
              // Track view
              final story = currentGroup.stories[index];
              context.read<StoriesProvider>().viewStory(story.id);
            },
            onComplete: () {
              // Move to next user's stories
              if (_currentGroupIndex < widget.storyGroups.length - 1) {
                setState(() {
                  _currentGroupIndex++;
                  _currentStoryIndex = 0;
                });
              } else {
                // All stories viewed, go back
                Navigator.pop(context);
              }
            },
            onVerticalSwipeComplete: (direction) {
              if (direction == Direction.down) {
                Navigator.pop(context);
              }
            },
            progressPosition: ProgressPosition.top,
            repeat: false,
            inline: false,
          ),
          
          // User info overlay
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // User avatar
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: currentGroup.userAvatar != null && currentGroup.userAvatar!.isNotEmpty
                        ? CachedNetworkImageProvider(currentGroup.userAvatar!)
                        : null,
                    child: currentGroup.userAvatar == null || currentGroup.userAvatar!.isEmpty
                        ? Text(
                            (currentGroup.username ?? 'U')[0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          )
                        : null,
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Username
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Text(
                              currentGroup.username ?? 'User',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (currentGroup.isVerified == true) ...[
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.verified,
                                color: Colors.blue,
                                size: 14,
                              ),
                            ],
                          ],
                        ),
                        Text(
                          '${_currentStoryIndex + 1} / ${currentGroup.storyCount}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Close button
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom actions
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildActionButton(
                      icon: Icons.favorite_border,
                      label: 'Like',
                      onTap: () {
                        final story = currentGroup.stories[_currentStoryIndex];
                        context.read<StoriesProvider>().addReaction(story.id, 'like');
                      },
                    ),
                    _buildActionButton(
                      icon: Icons.message_outlined,
                      label: 'Reply',
                      onTap: () {
                        _showReplyDialog(context, currentGroup.stories[_currentStoryIndex]);
                      },
                    ),
                    _buildActionButton(
                      icon: Icons.share_outlined,
                      label: 'Share',
                      onTap: () {
                        // Share story
                      },
                    ),
                    _buildActionButton(
                      icon: Icons.more_vert,
                      label: 'More',
                      onTap: () {
                        // More options
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  void _showReplyDialog(BuildContext context, StoryModel story) {
    final textController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text(
          'Reply to Story',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          controller: textController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Type your reply...',
            hintStyle: TextStyle(color: Colors.white54),
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (textController.text.isNotEmpty) {
                context.read<StoriesProvider>().replyToStory(
                  story.id,
                  textController.text,
                );
                Navigator.pop(dialogContext);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reply sent')),
                );
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}

