import 'dart:io';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/custom_text_field.dart';

class PostDetailsScreen extends StatefulWidget {
  final String mediaPath;
  final bool isVideo;
  final String filter;

  const PostDetailsScreen({
    super.key,
    required this.mediaPath,
    required this.isVideo,
    required this.filter,
  });

  @override
  State<PostDetailsScreen> createState() => _PostDetailsScreenState();
}

class _PostDetailsScreenState extends State<PostDetailsScreen> {
  final TextEditingController _captionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  String _privacy = 'Public';
  bool _isUploading = false;

  final List<String> _privacyOptions = ['Public', 'Friends', 'Private'];

  @override
  void dispose() {
    _captionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    setState(() {
      _isUploading = true;
    });

    // Simulate upload
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() {
        _isUploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Posted successfully!'),
          backgroundColor: AppColors.success,
        ),
      );

      // Navigate back to home
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Post'),
        actions: [
          TextButton(
            onPressed: _isUploading ? null : _post,
            child: _isUploading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  )
                : const Text(
                    'Post',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Media Preview & Caption
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail
                Container(
                  width: 80,
                  height: 120,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    image: DecorationImage(
                      image: FileImage(File(widget.mediaPath)),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: widget.isVideo
                      ? const Center(
                          child: Icon(
                            Icons.play_circle_outline,
                            color: Colors.white,
                            size: 32,
                          ),
                        )
                      : null,
                ),

                const SizedBox(width: 12),

                // Caption Input
                Expanded(
                  child: CustomTextField(
                    label: 'Caption',
                    controller: _captionController,
                    hintText: 'Write a caption...',
                    maxLines: 5,
                    maxLength: 150,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Location
            CustomTextField(
              label: 'Location',
              controller: _locationController,
              hintText: 'Add location',
              prefixIcon: Icons.location_on,
            ),

            const SizedBox(height: 24),

            // Privacy Settings
            _buildSection(
              title: 'Privacy',
              child: Wrap(
                spacing: 8,
                children: _privacyOptions.map((option) {
                  final isSelected = _privacy == option;
                  return ChoiceChip(
                    label: Text(option),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _privacy = option;
                      });
                    },
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : null,
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 24),

            // Interaction Settings
            _buildSection(
              title: 'Who can interact',
              child: Column(
                children: [
                  _buildSwitchTile(
                    title: 'Allow comments',
                    subtitle: 'Let others comment on your post',
                    value: _allowComments,
                    onChanged: (value) {
                      setState(() {
                        _allowComments = value;
                      });
                    },
                  ),
                  if (widget.isVideo) ...[
                    _buildSwitchTile(
                      title: 'Allow Duet',
                      subtitle: 'Let others duet with your video',
                      value: _allowDuet,
                      onChanged: (value) {
                        setState(() {
                          _allowDuet = value;
                        });
                      },
                    ),
                    _buildSwitchTile(
                      title: 'Allow Stitch',
                      subtitle: 'Let others stitch your video',
                      value: _allowStitch,
                      onChanged: (value) {
                        setState(() {
                          _allowStitch = value;
                        });
                      },
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Post Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.lightCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black12,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        widget.isVideo ? Icons.videocam : Icons.image,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        widget.isVideo ? 'Video Post' : 'Photo Post',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  if (widget.filter != 'None') ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.filter_vintage,
                          color: isDark ? Colors.white70 : Colors.black54,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Filter: ${widget.filter}',
                          style: TextStyle(
                            color: isDark ? Colors.white70 : Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: isDark ? Colors.white60 : Colors.black45,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}
