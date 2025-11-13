import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Medium banner with countdown timer for flash sales and limited-time offers
/// Includes dynamic countdown display with days, hours, minutes, seconds
class BannerMWithCounter extends StatefulWidget {
  final String imageUrl;
  final String title;
  final String? subtitle;
  final DateTime endTime;
  final VoidCallback? onTap;
  final Color? overlayColor;

  const BannerMWithCounter({
    Key? key,
    required this.imageUrl,
    required this.title,
    this.subtitle,
    required this.endTime,
    this.onTap,
    this.overlayColor,
  }) : super(key: key);

  @override
  State<BannerMWithCounter> createState() => _BannerMWithCounterState();
}

class _BannerMWithCounterState extends State<BannerMWithCounter> {
  late Timer _timer;
  Duration _remainingTime = Duration.zero;

  @override
  void initState() {
    super.initState();
    _updateRemainingTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _updateRemainingTime();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _updateRemainingTime() {
    final now = DateTime.now();
    if (widget.endTime.isAfter(now)) {
      setState(() {
        _remainingTime = widget.endTime.difference(now);
      });
    } else {
      setState(() {
        _remainingTime = Duration.zero;
      });
      _timer.cancel();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        height: ShopConstants.bannerHeightMedium,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          boxShadow: [ShopConstants.productCardShadowLight],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          child: Stack(
            children: [
              // Background Image
              Positioned.fill(
                child: Image.network(
                  widget.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: AppColors.backgroundLight,
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 40,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Dark Overlay
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        (widget.overlayColor ?? Colors.black).withOpacity(0.7),
                        (widget.overlayColor ?? Colors.black).withOpacity(0.3),
                      ],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                  ),
                ),
              ),
              
              // Content
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(ShopConstants.defaultPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Title
                      Text(
                        widget.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      
                      // Subtitle
                      if (widget.subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          widget.subtitle!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: ShopConstants.defaultPaddingSmall),
                      
                      // Countdown Timer
                      _buildCountdownTimer(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCountdownTimer() {
    if (_remainingTime == Duration.zero) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: ShopConstants.defaultPadding,
          vertical: ShopConstants.defaultPaddingSmall,
        ),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(
            ShopConstants.defaultBorderRadiusSmall,
          ),
        ),
        child: const Text(
          'SALE ENDED',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      );
    }

    final days = _remainingTime.inDays;
    final hours = _remainingTime.inHours % 24;
    final minutes = _remainingTime.inMinutes % 60;
    final seconds = _remainingTime.inSeconds % 60;

    return Row(
      children: [
        // Days
        if (days > 0) ...[
          _buildTimeUnit(days.toString().padLeft(2, '0'), 'Days'),
          const SizedBox(width: 8),
          _buildTimeSeparator(),
          const SizedBox(width: 8),
        ],
        
        // Hours
        _buildTimeUnit(hours.toString().padLeft(2, '0'), 'Hours'),
        const SizedBox(width: 8),
        _buildTimeSeparator(),
        const SizedBox(width: 8),
        
        // Minutes
        _buildTimeUnit(minutes.toString().padLeft(2, '0'), 'Min'),
        const SizedBox(width: 8),
        _buildTimeSeparator(),
        const SizedBox(width: 8),
        
        // Seconds
        _buildTimeUnit(seconds.toString().padLeft(2, '0'), 'Sec'),
      ],
    );
  }

  Widget _buildTimeUnit(String value, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(
              ShopConstants.defaultBorderRadiusSmall,
            ),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.accent,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 8,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  Widget _buildTimeSeparator() {
    return const Text(
      ':',
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: Colors.white,
      ),
    );
  }
}
