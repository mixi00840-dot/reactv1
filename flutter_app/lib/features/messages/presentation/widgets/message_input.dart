import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// Message input widget with send button
class MessageInput extends StatefulWidget {
  final TextEditingController controller;
  final Function(String content, {String type}) onSend;
  final VoidCallback onTyping;
  final bool isSending;

  const MessageInput({
    super.key,
    required this.controller,
    required this.onSend,
    required this.onTyping,
    this.isSending = false,
  });

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    final hasText = widget.controller.text.trim().isNotEmpty;
    if (hasText != _hasText) {
      setState(() {
        _hasText = hasText;
      });
    }
    if (hasText) {
      widget.onTyping();
    }
  }

  void _sendMessage() {
    if (widget.controller.text.trim().isEmpty || widget.isSending) return;
    widget.onSend(widget.controller.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.surface,
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
            // Attachment button
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              color: AppColors.primary,
              onPressed: _showAttachmentOptions,
            ),
            // Text input
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: widget.controller,
                  decoration: InputDecoration(
                    hintText: 'Message...',
                    hintStyle: TextStyle(color: AppColors.textSecondary),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                  maxLines: 5,
                  minLines: 1,
                  textCapitalization: TextCapitalization.sentences,
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Send or voice button
            if (_hasText)
              IconButton(
                icon: widget.isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                color: AppColors.primary,
                onPressed: widget.isSending ? null : _sendMessage,
              )
            else
              IconButton(
                icon: const Icon(Icons.mic),
                color: AppColors.primary,
                onPressed: _recordVoiceMessage,
              ),
          ],
        ),
      ),
    );
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.purple),
              title: const Text('Photo & Video'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement photo picker
              },
            ),
            ListTile(
              leading: const Icon(Icons.insert_drive_file, color: Colors.blue),
              title: const Text('Document'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement file picker
              },
            ),
            ListTile(
              leading: const Icon(Icons.location_on, color: Colors.green),
              title: const Text('Location'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement location picker
              },
            ),
            ListTile(
              leading: const Icon(Icons.gif_box, color: Colors.orange),
              title: const Text('GIF'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement GIF picker
              },
            ),
          ],
        ),
      ),
    );
  }

  void _recordVoiceMessage() {
    // TODO: Implement voice recording
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Voice recording coming soon')),
    );
  }
}
