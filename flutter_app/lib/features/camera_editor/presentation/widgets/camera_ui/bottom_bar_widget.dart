import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'dart:io';
import 'main_record_button.dart';

/// Bottom bar widget for TikTok-style camera interface
/// Contains gallery thumbnail, main record button, and upload button
class BottomBarWidget extends StatelessWidget {
  final VoidCallback? onGalleryTap;
  final VoidCallback? onRecordTap;
  final VoidCallback? onRecordLongPressStart;
  final VoidCallback? onRecordLongPressEnd;
  final VoidCallback? onUploadTap;
  final String? latestVideoPath;
  final bool isRecording;
  final bool isPaused;
  final bool isProcessing;
  final int segmentCount;

  const BottomBarWidget({
    super.key,
    this.onGalleryTap,
    this.onRecordTap,
    this.onRecordLongPressStart,
    this.onRecordLongPressEnd,
    this.onUploadTap,
    this.latestVideoPath,
    this.isRecording = false,
    this.isPaused = false,
    this.isProcessing = false,
    this.segmentCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      height: 120 + bottomPadding,
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: 20 + bottomPadding,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.6),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Gallery Thumbnail Button
          _GalleryThumbnailButton(
            latestVideoPath: latestVideoPath,
            onTap: isRecording ? null : onGalleryTap,
            segmentCount: segmentCount,
          ),

          const Spacer(),

          // Main Record Button
          MainRecordButton(
            onTap: onRecordTap,
            onLongPressStart: onRecordLongPressStart,
            onLongPressEnd: onRecordLongPressEnd,
            isRecording: isRecording,
            isPaused: isPaused,
            isProcessing: isProcessing,
          ),

          const Spacer(),

          // Upload Button
          _UploadButton(
            onTap: isRecording ? null : onUploadTap,
          ),
        ],
      ),
    );
  }
}

/// Gallery thumbnail button showing latest video
class _GalleryThumbnailButton extends StatefulWidget {
  final String? latestVideoPath;
  final VoidCallback? onTap;
  final int segmentCount;

  const _GalleryThumbnailButton({
    this.latestVideoPath,
    this.onTap,
    this.segmentCount = 0,
  });

  @override
  State<_GalleryThumbnailButton> createState() =>
      _GalleryThumbnailButtonState();
}

class _GalleryThumbnailButtonState extends State<_GalleryThumbnailButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onTap != null) _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.onTap != null) _controller.reverse();
  }

  void _handleTapCancel() {
    if (widget.onTap != null) _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.black.withValues(alpha: 0.3),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.5),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: widget.latestVideoPath != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.file(
                        File(widget.latestVideoPath!),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Icon(
                              Iconsax.gallery,
                              color: Colors.white,
                              size: 24,
                            ),
                          );
                        },
                      ),
                    )
                  : const Center(
                      child: Icon(
                        Iconsax.gallery,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
            ),
            // Segment count badge
            if (widget.segmentCount > 0)
              Positioned(
                top: -6,
                right: -6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: Colors.white,
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: Text(
                    '${widget.segmentCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Upload button for selecting existing videos
class _UploadButton extends StatefulWidget {
  final VoidCallback? onTap;

  const _UploadButton({this.onTap});

  @override
  State<_UploadButton> createState() => _UploadButtonState();
}

class _UploadButtonState extends State<_UploadButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onTap != null) _controller.forward();
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.onTap != null) _controller.reverse();
  }

  void _handleTapCancel() {
    if (widget.onTap != null) _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: Colors.black.withValues(alpha: 0.3),
            border: Border.all(
                      color: Colors.white.withValues(alpha: 0.5),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Center(
            child: Icon(
              Iconsax.document_upload,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}
