import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../models/chat_model.dart';

class MessageInput extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onSendMessage;
  final Function(String, MessageType) onSendMedia;

  const MessageInput({
    super.key,
    required this.controller,
    required this.onSendMessage,
    required this.onSendMedia,
  });

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  final ImagePicker _picker = ImagePicker();
  bool _isTyping = false;

  void _handleSend() {
    if (widget.controller.text.trim().isEmpty) return;
    widget.onSendMessage(widget.controller.text.trim());
    setState(() {
      _isTyping = false;
    });
  }

  Future<void> _pickMedia(ImageSource source, {bool isVideo = false}) async {
    try {
      final XFile? media = isVideo
          ? await _picker.pickVideo(source: source)
          : await _picker.pickImage(source: source);

      if (media != null) {
        widget.onSendMedia(
          media.path,
          isVideo ? MessageType.video : MessageType.image,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick media: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showMediaOptions() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildMediaOption(
                      icon: Icons.photo_library,
                      label: 'Photo',
                      color: AppColors.primary,
                      onTap: () {
                        Navigator.pop(context);
                        _pickMedia(ImageSource.gallery);
                      },
                    ),
                    _buildMediaOption(
                      icon: Icons.video_library,
                      label: 'Video',
                      color: AppColors.secondary,
                      onTap: () {
                        Navigator.pop(context);
                        _pickMedia(ImageSource.gallery, isVideo: true);
                      },
                    ),
                    _buildMediaOption(
                      icon: Icons.camera_alt,
                      label: 'Camera',
                      color: AppColors.accent,
                      onTap: () {
                        Navigator.pop(context);
                        _pickMedia(ImageSource.camera);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMediaOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color, width: 2),
            ),
            child: Icon(
              icon,
              color: color,
              size: 32,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Media Button
            IconButton(
              onPressed: _showMediaOptions,
              icon: const Icon(Icons.add_circle_outline),
              color: AppColors.primary,
              iconSize: 28,
            ),

            // Text Input
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.black12,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: widget.controller,
                  onChanged: (value) {
                    setState(() {
                      _isTyping = value.trim().isNotEmpty;
                    });
                  },
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black,
                    fontSize: 15,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Message...',
                    hintStyle: TextStyle(
                      color: isDark ? Colors.white54 : Colors.black54,
                    ),
                    border: InputBorder.none,
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.emoji_emotions_outlined),
                      color: isDark ? Colors.white70 : Colors.black54,
                      onPressed: () {
                        // Show emoji picker
                      },
                    ),
                  ),
                  maxLines: 5,
                  minLines: 1,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _handleSend(),
                ),
              ),
            ),

            const SizedBox(width: 8),

            // Send Button
            Container(
              decoration: BoxDecoration(
                color: _isTyping ? AppColors.primary : Colors.transparent,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                onPressed: _isTyping ? _handleSend : null,
                icon: Icon(
                  _isTyping ? Icons.send : Icons.thumb_up_outlined,
                  color: _isTyping ? Colors.white : AppColors.primary,
                ),
                iconSize: 24,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
