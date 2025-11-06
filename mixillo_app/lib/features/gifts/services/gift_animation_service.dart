import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:audioplayers/audioplayers.dart';
import '../models/gift_model.dart';

/// Service for playing gift animations and effects
class GiftAnimationService {
  static final GiftAnimationService _instance = GiftAnimationService._internal();
  factory GiftAnimationService() => _instance;
  GiftAnimationService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  final List<GiftAnimationWidget> _activeAnimations = [];

  List<GiftAnimationWidget> get activeAnimations => _activeAnimations;

  /// Play gift animation
  Future<void> playGiftAnimation({
    required GiftModel gift,
    required BuildContext context,
    String? senderName,
    int quantity = 1,
  }) async {
    // Create animation widget
    late final GiftAnimationWidget animation;
    animation = GiftAnimationWidget(
      gift: gift,
      senderName: senderName,
      quantity: quantity,
      onComplete: () {
        _activeAnimations.remove(animation);
      },
    );

    _activeAnimations.add(animation);

    // Play sound if available
    if (gift.media.sound != null) {
      try {
        await _audioPlayer.play(UrlSource(gift.media.sound!));
      } catch (e) {
        print('Error playing gift sound: $e');
      }
    }

    // Trigger screen effects
    if (gift.effects != null) {
      _triggerScreenEffect(gift.effects!, context);
    }

    // Auto-remove after duration
    if (gift.media.duration != null) {
      Future.delayed(Duration(milliseconds: gift.media.duration!), () {
        _activeAnimations.remove(animation);
      });
    }
  }

  /// Trigger screen effect
  void _triggerScreenEffect(GiftEffects effects, BuildContext context) {
    if (effects.vibrate) {
      // Haptic feedback
      // HapticFeedback.mediumImpact(); // Requires import
    }

    if (effects.flashScreen) {
      // Flash screen effect
      // Can be implemented with overlay
    }

    // Screen effects like confetti, fireworks, etc.
    // Can be implemented with overlay widgets
  }

  /// Clear all animations
  void clearAnimations() {
    _activeAnimations.clear();
  }
}

/// Widget for displaying gift animation
class GiftAnimationWidget extends StatefulWidget {
  final GiftModel gift;
  final String? senderName;
  final int quantity;
  final VoidCallback onComplete;

  const GiftAnimationWidget({
    super.key,
    required this.gift,
    this.senderName,
    this.quantity = 1,
    required this.onComplete,
  });

  @override
  State<GiftAnimationWidget> createState() => _GiftAnimationWidgetState();
}

class _GiftAnimationWidgetState extends State<GiftAnimationWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: Duration(
        milliseconds: widget.gift.media.duration ?? 3000,
      ),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.elasticOut),
      ),
    );

    _opacityAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.7, 1.0, curve: Curves.easeOut),
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0),
      end: const Offset(0, -0.3),
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 1.0, curve: Curves.easeOut),
      ),
    );

    _controller.forward().then((_) {
      widget.onComplete();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: Center(
          child: SlideTransition(
            position: _slideAnimation,
            child: FadeTransition(
              opacity: _opacityAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Gift icon/animation
                    if (widget.gift.media.animation != null)
                      SizedBox(
                        width: 150,
                        height: 150,
                        child: Lottie.network(
                          widget.gift.media.animation!,
                          fit: BoxFit.contain,
                          repeat: false,
                        ),
                      )
                    else
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          image: widget.gift.media.icon.isNotEmpty
                              ? DecorationImage(
                                  image: NetworkImage(widget.gift.media.icon),
                                  fit: BoxFit.contain,
                                )
                              : null,
                        ),
                        child: widget.gift.media.icon.isEmpty
                            ? const Icon(
                                Icons.card_giftcard,
                                size: 80,
                                color: Colors.white,
                              )
                            : null,
                      ),
                    
                    const SizedBox(height: 16),
                    
                    // Sender name and quantity
                    if (widget.senderName != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              widget.senderName!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (widget.quantity > 1) ...[
                              const Text(
                                ' sent ',
                                style: TextStyle(color: Colors.white70),
                              ),
                              Text(
                                '${widget.quantity}x ',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ] else
                              const Text(
                                ' sent ',
                                style: TextStyle(color: Colors.white70),
                              ),
                            Text(
                              widget.gift.displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

