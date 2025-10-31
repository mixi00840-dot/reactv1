import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/post.dart';

/// Create Post Screen with multi-photo selector, caption, hashtags, mentions, location, and product tagging
class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  // Photo/Video selection
  final List<File> _selectedMedia = [];
  static const int _maxPhotos = 10;
  final ImagePicker _imagePicker = ImagePicker();
  
  // Caption
  final TextEditingController _captionController = TextEditingController();
  final FocusNode _captionFocusNode = FocusNode();
  static const int _maxCaptionLength = 2200;
  
  // Hashtags and mentions
  bool _showHashtagSuggestions = false;
  bool _showMentionSuggestions = false;
  String _currentHashtagSearch = '';
  // ignore: unused_field
  String _currentMentionSearch = '';
  int _hashtagCursorPosition = 0;
  int _mentionCursorPosition = 0;
  
  // Location
  String? _selectedLocation;
  
  // Product tagging (for sellers)
  final List<String> _taggedProducts = [];
  
  // UI State
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  
  // Mock data for suggestions
  final List<String> _popularHashtags = [
    'fashion', 'style', 'ootd', 'instagood', 'photooftheday',
    'beautiful', 'love', 'art', 'photography', 'nature'
  ];
  
  final List<User> _mockUsers = []; // TODO: Implement user search

  @override
  void initState() {
    super.initState();
    _captionController.addListener(_onCaptionChanged);
  }

  @override
  void dispose() {
    _captionController.removeListener(_onCaptionChanged);
    _captionController.dispose();
    _captionFocusNode.dispose();
    super.dispose();
  }

  void _onCaptionChanged() {
    final text = _captionController.text;
    final cursorPosition = _captionController.selection.baseOffset;
    
    if (cursorPosition < 0) return;
    
    // Check for hashtag
    final beforeCursor = text.substring(0, cursorPosition);
    final hashtagMatch = RegExp(r'#(\w*)$').firstMatch(beforeCursor);
    
    if (hashtagMatch != null) {
      setState(() {
        _showHashtagSuggestions = true;
        _currentHashtagSearch = hashtagMatch.group(1) ?? '';
        _hashtagCursorPosition = hashtagMatch.start;
        _showMentionSuggestions = false;
      });
      return;
    }
    
    // Check for mention
    final mentionMatch = RegExp(r'@(\w*)$').firstMatch(beforeCursor);
    
    if (mentionMatch != null) {
      setState(() {
        _showMentionSuggestions = true;
        _currentMentionSearch = mentionMatch.group(1) ?? '';
        _mentionCursorPosition = mentionMatch.start;
        _showHashtagSuggestions = false;
      });
      return;
    }
    
    // No triggers found
    if (_showHashtagSuggestions || _showMentionSuggestions) {
      setState(() {
        _showHashtagSuggestions = false;
        _showMentionSuggestions = false;
      });
    }
  }

  Future<void> _pickImages() async {
    if (_selectedMedia.length >= _maxPhotos) {
      _showError('You can only select up to $_maxPhotos photos');
      return;
    }
    
    try {
      final List<XFile> images = await _imagePicker.pickMultiImage();
      
      if (images.isEmpty) return;
      
      final availableSlots = _maxPhotos - _selectedMedia.length;
      final imagesToAdd = images.take(availableSlots);
      
      setState(() {
        _selectedMedia.addAll(imagesToAdd.map((xFile) => File(xFile.path)));
      });
      
      if (images.length > availableSlots) {
        _showError('Only $availableSlots more photos can be added');
      }
    } catch (e) {
      _showError('Failed to pick images: $e');
    }
  }

  // ignore: unused_element
  Future<void> _pickVideo() async {
    if (_selectedMedia.isNotEmpty) {
      _showError('Cannot add video when photos are already selected');
      return;
    }
    
    try {
      final XFile? video = await _imagePicker.pickVideo(source: ImageSource.gallery);
      
      if (video != null) {
        setState(() {
          _selectedMedia.add(File(video.path));
        });
      }
    } catch (e) {
      _showError('Failed to pick video: $e');
    }
  }

  void _removeMedia(int index) {
    setState(() {
      _selectedMedia.removeAt(index);
    });
  }

  void _reorderMedia(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) {
        newIndex -= 1;
      }
      final item = _selectedMedia.removeAt(oldIndex);
      _selectedMedia.insert(newIndex, item);
    });
  }

  void _insertHashtag(String hashtag) {
    final text = _captionController.text;
    final newText = text.substring(0, _hashtagCursorPosition) +
        '#$hashtag ' +
        text.substring(_captionController.selection.baseOffset);
    
    _captionController.text = newText;
    _captionController.selection = TextSelection.fromPosition(
      TextPosition(offset: _hashtagCursorPosition + hashtag.length + 2),
    );
    
    setState(() {
      _showHashtagSuggestions = false;
    });
  }

  void _insertMention(User user) {
    final text = _captionController.text;
    final newText = text.substring(0, _mentionCursorPosition) +
        '@${user.username} ' +
        text.substring(_captionController.selection.baseOffset);
    
    _captionController.text = newText;
    final newOffset = _mentionCursorPosition + user.username.length + 2;
    _captionController.selection = TextSelection.fromPosition(
      TextPosition(offset: newOffset),
    );
    
    setState(() {
      _showMentionSuggestions = false;
    });
  }

  void _showLocationPicker() {
    // TODO: Implement Google Places location picker
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Add Location',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.location_on),
              title: const Text('New York, USA'),
              onTap: () {
                setState(() {
                  _selectedLocation = 'New York, USA';
                });
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.location_on),
              title: const Text('Los Angeles, USA'),
              onTap: () {
                setState(() {
                  _selectedLocation = 'Los Angeles, USA';
                });
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showProductPicker() {
    // TODO: Implement product picker for sellers
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Tag Products',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),
            const Text('Product picker coming soon...'),
          ],
        ),
      ),
    );
  }

  Future<void> _createPost() async {
    if (_selectedMedia.isEmpty) {
      _showError('Please select at least one photo or video');
      return;
    }
    
    if (_captionController.text.trim().isEmpty) {
      _showError('Please add a caption');
      return;
    }
    
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });
    
    try {
      // TODO: Implement post creation API call
      // Simulate upload progress
      for (int i = 0; i <= 100; i += 10) {
        await Future.delayed(const Duration(milliseconds: 200));
        setState(() {
          _uploadProgress = i / 100;
        });
      }
      
      if (mounted) {
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      _showError('Failed to create post: $e');
      setState(() {
        _isUploading = false;
      });
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Post'),
        actions: [
          if (!_isUploading)
            TextButton(
              onPressed: _createPost,
              child: const Text(
                'Share',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: _isUploading ? _buildUploadingView() : _buildContentView(),
    );
  }

  Widget _buildUploadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 20),
          Text(
            'Uploading... ${(_uploadProgress * 100).toInt()}%',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: LinearProgressIndicator(
              value: _uploadProgress,
              backgroundColor: Colors.grey[300],
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentView() {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Media Grid
              _buildMediaGrid(),
              
              const SizedBox(height: 20),
              
              // Caption Input
              _buildCaptionInput(),
              
              const SizedBox(height: 20),
              
              // Location
              _buildLocationSection(),
              
              const SizedBox(height: 16),
              
              // Product Tagging (for sellers)
              _buildProductTagging(),
              
              const SizedBox(height: 100), // Space for keyboard
            ],
          ),
        ),
        
        // Hashtag Suggestions
        if (_showHashtagSuggestions) _buildHashtagSuggestions(),
        
        // Mention Suggestions
        if (_showMentionSuggestions) _buildMentionSuggestions(),
      ],
    );
  }

  Widget _buildMediaGrid() {
    if (_selectedMedia.isEmpty) {
      return GestureDetector(
        onTap: _pickImages,
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!, width: 2),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_photo_alternate, size: 64, color: Colors.grey),
                SizedBox(height: 12),
                Text(
                  'Tap to add photos',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      );
    }
    
    return Column(
      children: [
        SizedBox(
          height: 300,
          child: ReorderableListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _selectedMedia.length + 1,
            onReorder: _reorderMedia,
            itemBuilder: (context, index) {
              if (index == _selectedMedia.length) {
                // Add more button
                if (_selectedMedia.length < _maxPhotos) {
                  return _buildAddMoreButton(index);
                }
                return const SizedBox.shrink();
              }
              
              return _buildMediaItem(index);
            },
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${_selectedMedia.length}/$_maxPhotos photos selected',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildMediaItem(int index) {
    return Container(
      key: ValueKey(_selectedMedia[index].path),
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              _selectedMedia[index],
              width: 200,
              height: 300,
              fit: BoxFit.cover,
            ),
          ),
          
          // Order badge
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${index + 1}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          
          // Remove button
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: () => _removeMedia(index),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddMoreButton(int index) {
    return Container(
      key: const ValueKey('add_more'),
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: GestureDetector(
        onTap: _pickImages,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!, width: 2),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add, size: 48, color: Colors.grey),
                SizedBox(height: 8),
                Text(
                  'Add More',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCaptionInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Caption',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _captionController,
          focusNode: _captionFocusNode,
          maxLines: 5,
          maxLength: _maxCaptionLength,
          decoration: InputDecoration(
            hintText: 'Write a caption... Use # for hashtags and @ to mention',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            counterText: '${_captionController.text.length}/$_maxCaptionLength',
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Tip: Use # to add hashtags and @ to mention people',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildLocationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Location',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _showLocationPicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedLocation ?? 'Add location',
                    style: TextStyle(
                      fontSize: 14,
                      color: _selectedLocation != null ? Colors.black : Colors.grey,
                    ),
                  ),
                ),
                if (_selectedLocation != null)
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedLocation = null;
                      });
                    },
                    child: const Icon(Icons.close, size: 20, color: Colors.grey),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductTagging() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tag Products',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _showProductPicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                const Icon(Icons.shopping_bag, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _taggedProducts.isEmpty
                        ? 'Tag products from your shop'
                        : '${_taggedProducts.length} products tagged',
                    style: TextStyle(
                      fontSize: 14,
                      color: _taggedProducts.isEmpty ? Colors.grey : Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHashtagSuggestions() {
    final suggestions = _popularHashtags
        .where((tag) => tag.toLowerCase().startsWith(_currentHashtagSearch.toLowerCase()))
        .take(5)
        .toList();
    
    if (suggestions.isEmpty) return const SizedBox.shrink();
    
    return Positioned(
      bottom: MediaQuery.of(context).viewInsets.bottom,
      left: 0,
      right: 0,
      child: Container(
        color: Colors.white,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey[300]!)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tag, size: 20, color: Colors.grey),
                  const SizedBox(width: 8),
                  const Text(
                    'Suggested Hashtags',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
            ...suggestions.map((tag) => ListTile(
              dense: true,
              leading: const Icon(Icons.tag, size: 20),
              title: Text('#$tag'),
              onTap: () => _insertHashtag(tag),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildMentionSuggestions() {
    // TODO: Implement user search based on _currentMentionSearch
    final suggestions = _mockUsers.take(5).toList();
    
    if (suggestions.isEmpty) {
      return Positioned(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 0,
        right: 0,
        child: Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: const Text(
            'Start typing to search users...',
            style: TextStyle(fontSize: 14, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    
    return Positioned(
      bottom: MediaQuery.of(context).viewInsets.bottom,
      left: 0,
      right: 0,
      child: Container(
        color: Colors.white,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey[300]!)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person, size: 20, color: Colors.grey),
                  const SizedBox(width: 8),
                  const Text(
                    'Suggested Users',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
            ...suggestions.map((user) => ListTile(
              dense: true,
              leading: CircleAvatar(
                radius: 16,
                backgroundImage: user.avatar != null
                    ? NetworkImage(user.avatar!)
                    : null,
                child: user.avatar == null
                    ? Text(user.username[0].toUpperCase())
                    : null,
              ),
              title: Text('@${user.username}'),
              subtitle: Text(user.fullName ?? ''),
              onTap: () => _insertMention(user),
            )),
          ],
        ),
      ),
    );
  }
}
