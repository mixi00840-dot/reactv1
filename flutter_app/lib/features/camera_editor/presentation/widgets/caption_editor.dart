import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart' hide Caption;
import '../../../../core/services/caption_service.dart';

/// Caption editor widget for editing and previewing captions
class CaptionEditor extends StatefulWidget {
  final String videoPath;
  final double videoDuration;
  final List<Caption> initialCaptions;
  final Function(List<Caption>) onCaptionsChanged;

  const CaptionEditor({
    Key? key,
    required this.videoPath,
    required this.videoDuration,
    required this.initialCaptions,
    required this.onCaptionsChanged,
  }) : super(key: key);

  @override
  State<CaptionEditor> createState() => _CaptionEditorState();
}

class _CaptionEditorState extends State<CaptionEditor> {
  List<Caption> _captions = [];
  Caption? _selectedCaption;
  VideoPlayerController? _videoController;
  bool _isPlaying = false;
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _captions = List.from(widget.initialCaptions);
    _initVideoPlayer();
  }

  Future<void> _initVideoPlayer() async {
    _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.videoPath))
      ..addListener(() {
        if (mounted) {
          setState(() {
            _isPlaying = _videoController!.value.isPlaying;
          });
          
          // Highlight current caption during playback
          final currentTime = _videoController!.value.position.inMilliseconds / 1000.0;
          final currentCaption = _captions.firstWhere(
            (c) => c.startTime <= currentTime && c.endTime >= currentTime,
            orElse: () => _captions.first,
          );
          
          if (_selectedCaption?.id != currentCaption.id) {
            setState(() {
              _selectedCaption = currentCaption;
              _textController.text = currentCaption.text;
            });
          }
        }
      })
      ..initialize().then((_) {
        if (mounted) setState(() {});
      });
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _textController.dispose();
    super.dispose();
  }

  void _selectCaption(Caption caption) {
    setState(() {
      _selectedCaption = caption;
      _textController.text = caption.text;
    });
    
    // Seek video to caption start
    _videoController?.seekTo(Duration(milliseconds: (caption.startTime * 1000).toInt()));
  }

  void _updateCaptionText(String newText) {
    if (_selectedCaption == null) return;

    final index = _captions.indexWhere((c) => c.id == _selectedCaption!.id);
    if (index != -1) {
      setState(() {
        _captions[index] = _captions[index].copyWith(text: newText);
        _selectedCaption = _captions[index];
      });
      widget.onCaptionsChanged(_captions);
    }
  }

  void _updateCaptionTiming(double newStartTime, double newEndTime) {
    if (_selectedCaption == null) return;

    final index = _captions.indexWhere((c) => c.id == _selectedCaption!.id);
    if (index != -1) {
      setState(() {
        _captions[index] = _captions[index].copyWith(
          startTime: newStartTime,
          endTime: newEndTime,
          duration: newEndTime - newStartTime,
        );
        _selectedCaption = _captions[index];
      });
      widget.onCaptionsChanged(_captions);
    }
  }

  void _deleteCaption(Caption caption) {
    setState(() {
      _captions.removeWhere((c) => c.id == caption.id);
      if (_selectedCaption?.id == caption.id) {
        _selectedCaption = null;
        _textController.clear();
      }
    });
    widget.onCaptionsChanged(_captions);
  }

  void _addCaption() {
    final currentTime = _videoController?.value.position.inMilliseconds ?? 0;
    final startTime = currentTime / 1000.0;
    final endTime = startTime + 3.0; // Default 3 seconds

    final newCaption = Caption(
      id: (_captions.map((c) => c.id).reduce((a, b) => a > b ? a : b)) + 1,
      text: 'New caption',
      startTime: startTime,
      endTime: endTime,
      duration: 3.0,
    );

    setState(() {
      _captions.add(newCaption);
      _captions.sort((a, b) => a.startTime.compareTo(b.startTime)); // Keep sorted
      _selectedCaption = newCaption;
      _textController.text = newCaption.text;
    });
    widget.onCaptionsChanged(_captions);
  }

  void _togglePlayPause() {
    if (_videoController == null) return;

    if (_isPlaying) {
      _videoController!.pause();
    } else {
      _videoController!.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Edit Captions'),
        actions: [
          TextButton.icon(
            onPressed: () {
              // Export to SRT
              final srt = CaptionService.exportToSRT(_captions);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Exported ${_captions.length} captions')),
              );
              debugPrint(srt);
            },
            icon: const Icon(Icons.download, color: Colors.white),
            label: const Text('Export SRT', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Video preview with caption overlay
          if (_videoController?.value.isInitialized ?? false)
            AspectRatio(
              aspectRatio: _videoController!.value.aspectRatio,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  VideoPlayer(_videoController!),
                  
                  // Caption overlay
                  if (_selectedCaption != null)
                    Positioned(
                      bottom: 80,
                      left: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _selectedCaption!.text,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(
                                color: Colors.black,
                                blurRadius: 2,
                                offset: Offset(1, 1),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  
                  // Play/Pause button
                  Center(
                    child: IconButton(
                      onPressed: _togglePlayPause,
                      icon: Icon(
                        _isPlaying ? Icons.pause_circle : Icons.play_circle,
                        size: 64,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Video progress bar
          if (_videoController?.value.isInitialized ?? false)
            VideoProgressIndicator(
              _videoController!,
              allowScrubbing: true,
              colors: const VideoProgressColors(
                playedColor: Colors.purple,
                bufferedColor: Colors.grey,
                backgroundColor: Colors.black26,
              ),
            ),

          const SizedBox(height: 16),

          // Caption editor controls
          if (_selectedCaption != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Edit Caption',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => _deleteCaption(_selectedCaption!),
                        icon: const Icon(Icons.delete, color: Colors.red),
                        tooltip: 'Delete caption',
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _textController,
                    maxLines: 2,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Caption text...',
                      hintStyle: TextStyle(color: Colors.grey[600]),
                      filled: true,
                      fillColor: Colors.grey[800],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: _updateCaptionText,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Start: ${_selectedCaption!.startTime.toStringAsFixed(2)}s',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                            Slider(
                              value: _selectedCaption!.startTime,
                              min: 0,
                              max: widget.videoDuration,
                              activeColor: Colors.purple,
                              onChanged: (value) {
                                _updateCaptionTiming(value, _selectedCaption!.endTime);
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'End: ${_selectedCaption!.endTime.toStringAsFixed(2)}s',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                            Slider(
                              value: _selectedCaption!.endTime,
                              min: 0,
                              max: widget.videoDuration,
                              activeColor: Colors.purple,
                              onChanged: (value) {
                                _updateCaptionTiming(_selectedCaption!.startTime, value);
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Caption list
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: _captions.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.subtitles_off, size: 64, color: Colors.grey[700]),
                          const SizedBox(height: 16),
                          Text(
                            'No captions yet',
                            style: TextStyle(color: Colors.grey[600], fontSize: 16),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(8),
                      itemCount: _captions.length,
                      separatorBuilder: (_, __) => const Divider(color: Colors.grey),
                      itemBuilder: (context, index) {
                        final caption = _captions[index];
                        final isSelected = _selectedCaption?.id == caption.id;

                        return ListTile(
                          selected: isSelected,
                          selectedTileColor: Colors.purple.withOpacity(0.2),
                          leading: CircleAvatar(
                            backgroundColor: isSelected ? Colors.purple : Colors.grey[800],
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                            ),
                          ),
                          title: Text(
                            caption.text,
                            style: const TextStyle(color: Colors.white),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            '${caption.startTime.toStringAsFixed(1)}s - ${caption.endTime.toStringAsFixed(1)}s',
                            style: TextStyle(color: Colors.grey[500], fontSize: 12),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.play_arrow, color: Colors.white),
                                onPressed: () => _selectCaption(caption),
                                tooltip: 'Preview',
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _deleteCaption(caption),
                                tooltip: 'Delete',
                              ),
                            ],
                          ),
                          onTap: () => _selectCaption(caption),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addCaption,
        backgroundColor: Colors.purple,
        icon: const Icon(Icons.add),
        label: const Text('Add Caption'),
      ),
    );
  }
}
