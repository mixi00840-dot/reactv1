import 'package:flutter/material.dart';
import '../../../../core/services/hashtag_service.dart';

/// Hashtag input field with AI suggestions and autocomplete
class HashtagInputField extends StatefulWidget {
  final TextEditingController controller;
  final String? videoPath;
  final Function(List<String>)? onHashtagsChanged;

  const HashtagInputField({
    Key? key,
    required this.controller,
    this.videoPath,
    this.onHashtagsChanged,
  }) : super(key: key);

  @override
  State<HashtagInputField> createState() => _HashtagInputFieldState();
}

class _HashtagInputFieldState extends State<HashtagInputField> {
  List<HashtagSuggestion> _suggestions = [];
  List<HashtagSuggestion> _searchResults = [];
  bool _isLoadingSuggestions = false;
  bool _showSuggestions = false;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _loadTrendingSuggestions();
    widget.controller.addListener(_onTextChanged);
    _focusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    _focusNode.removeListener(_onFocusChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    if (_focusNode.hasFocus && _suggestions.isNotEmpty) {
      setState(() => _showSuggestions = true);
    }
  }

  void _onTextChanged() {
    final text = widget.controller.text;
    final words = text.split(' ');
    final lastWord = words.isNotEmpty ? words.last : '';

    if (lastWord.startsWith('#') && lastWord.length > 1) {
      _searchHashtags(lastWord);
    } else if (lastWord.isEmpty || !lastWord.startsWith('#')) {
      setState(() {
        _searchResults = [];
        _showSuggestions = _suggestions.isNotEmpty;
      });
    }

    // Notify parent of hashtag changes
    final hashtags = HashtagService.extractHashtags(text);
    widget.onHashtagsChanged?.call(hashtags);
  }

  Future<void> _loadTrendingSuggestions() async {
    setState(() => _isLoadingSuggestions = true);
    try {
      final trending = await HashtagService.getTrendingHashtags(limit: 20);
      if (mounted) {
        setState(() {
          _suggestions = trending;
          _isLoadingSuggestions = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading trending: $e');
      if (mounted) {
        setState(() => _isLoadingSuggestions = false);
      }
    }
  }

  Future<void> _searchHashtags(String query) async {
    try {
      final results = await HashtagService.searchHashtags(
        query: query.substring(1), // Remove #
        limit: 10,
      );
      if (mounted) {
        setState(() {
          _searchResults = results;
          _showSuggestions = true;
        });
      }
    } catch (e) {
      debugPrint('Error searching hashtags: $e');
    }
  }

  Future<void> _generateAISuggestions() async {
    if (widget.videoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No video available for AI analysis')),
      );
      return;
    }

    setState(() => _isLoadingSuggestions = true);

    try {
      final aiSuggestions = await HashtagService.generateHashtags(
        videoPath: widget.videoPath!,
        description: widget.controller.text,
        onProgress: (progress) {
          debugPrint('AI hashtag progress: ${(progress * 100).toInt()}%');
        },
      );

      if (mounted) {
        setState(() {
          // Merge AI suggestions with trending, prioritizing AI
          _suggestions = [
            ...aiSuggestions.where((s) => s.source == 'ai'),
            ..._suggestions.where((s) => !aiSuggestions.any((ai) => ai.hashtag == s.hashtag)),
          ].take(30).toList();
          _isLoadingSuggestions = false;
          _showSuggestions = true;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✨ Generated ${aiSuggestions.length} AI suggestions'),
            backgroundColor: Colors.purple,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingSuggestions = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate AI suggestions: $e')),
        );
      }
    }
  }

  void _addHashtag(String hashtag) {
    final text = widget.controller.text;
    final words = text.split(' ');
    
    // Replace last word if it's a partial hashtag
    if (words.isNotEmpty && words.last.startsWith('#')) {
      words[words.length - 1] = hashtag;
      widget.controller.text = '${words.join(' ')} ';
    } else {
      // Add to end
      final newText = text.isEmpty ? hashtag : '$text $hashtag ';
      widget.controller.text = newText;
    }
    
    widget.controller.selection = TextSelection.fromPosition(
      TextPosition(offset: widget.controller.text.length),
    );

    setState(() {
      _searchResults = [];
      _showSuggestions = _suggestions.isNotEmpty;
    });
  }

  @override
  Widget build(BuildContext context) {
    final displaySuggestions = _searchResults.isNotEmpty 
        ? _searchResults 
        : _suggestions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Input field with AI button
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: widget.controller,
                focusNode: _focusNode,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Add hashtags... #fyp #trending',
                  hintStyle: TextStyle(color: Colors.grey[600]),
                  filled: true,
                  fillColor: Colors.grey[900],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: const Icon(Icons.tag, color: Colors.purple),
                  suffixIcon: widget.videoPath != null
                      ? IconButton(
                          onPressed: _isLoadingSuggestions 
                              ? null 
                              : _generateAISuggestions,
                          icon: _isLoadingSuggestions
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.purple,
                                  ),
                                )
                              : const Icon(Icons.auto_awesome, color: Colors.purple),
                          tooltip: 'AI Suggestions',
                        )
                      : null,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Suggestions header
        if (_showSuggestions && displaySuggestions.isNotEmpty)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _searchResults.isNotEmpty 
                    ? 'Search Results' 
                    : 'Trending Hashtags',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _showSuggestions = false),
                child: const Text('Hide', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),

        // Suggestions grid
        if (_showSuggestions && displaySuggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: displaySuggestions.map((suggestion) {
                return _HashtagChip(
                  suggestion: suggestion,
                  onTap: () => _addHashtag(suggestion.hashtag),
                );
              }).toList(),
            ),
          ),

        // Show suggestions button when hidden
        if (!_showSuggestions && _suggestions.isNotEmpty)
          TextButton.icon(
            onPressed: () => setState(() => _showSuggestions = true),
            icon: const Icon(Icons.expand_more, size: 16),
            label: Text(
              'Show ${_suggestions.length} suggestions',
              style: const TextStyle(fontSize: 12),
            ),
          ),
      ],
    );
  }
}

/// Hashtag chip widget
class _HashtagChip extends StatelessWidget {
  final HashtagSuggestion suggestion;
  final VoidCallback onTap;

  const _HashtagChip({
    required this.suggestion,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color chipColor;
    IconData? icon;

    switch (suggestion.source) {
      case 'ai':
        chipColor = Colors.purple;
        icon = Icons.auto_awesome;
        break;
      case 'trending':
        chipColor = Colors.orange;
        icon = Icons.local_fire_department;
        break;
      case 'search':
        chipColor = Colors.blue;
        icon = Icons.search;
        break;
      default:
        chipColor = Colors.grey;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: chipColor.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: chipColor.withOpacity(0.5)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: chipColor),
              const SizedBox(width: 4),
            ],
            Text(
              suggestion.hashtag,
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (suggestion.count != null) ...[
              const SizedBox(width: 4),
              Text(
                _formatCount(suggestion.count!),
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
