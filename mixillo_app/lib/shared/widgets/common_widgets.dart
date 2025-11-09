import 'package:flutter/material.dart';
import '../../core/theme/design_tokens.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme/app_animations.dart';

/// Primary Button - Main action button matching TikTok/Instagram style
class PrimaryButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final double? width;
  final double? height;
  final IconData? icon;
  final Gradient? gradient;
  final Color? backgroundColor;
  final Color? textColor;
  final double borderRadius;

  const PrimaryButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.width,
    this.height,
    this.icon,
    this.gradient,
    this.backgroundColor,
    this.textColor,
    this.borderRadius = DesignTokens.radiusButton,
  }) : super(key: key);

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppAnimations.fast,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: AppAnimations.spring),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (!widget.isDisabled && !widget.isLoading) {
      _controller.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (!widget.isDisabled && !widget.isLoading) {
      _controller.reverse();
    }
  }

  void _handleTapCancel() {
    if (!widget.isDisabled && !widget.isLoading) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveBackgroundColor = widget.backgroundColor ?? DesignTokens.brandPrimary;
    final effectiveTextColor = widget.textColor ?? DesignTokens.darkTextPrimary;

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isDisabled || widget.isLoading ? null : widget.onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: widget.width,
              height: widget.height ?? DesignTokens.buttonHeightMd,
              decoration: BoxDecoration(
                gradient: widget.isDisabled
                    ? null
                    : (widget.gradient ?? LinearGradient(
                        colors: DesignTokens.brandGradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )),
                color: widget.isDisabled
                    ? (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder)
                    : (widget.gradient == null && widget.backgroundColor != null
                        ? effectiveBackgroundColor
                        : null),
                borderRadius: BorderRadius.circular(widget.borderRadius),
                boxShadow: widget.isDisabled
                    ? null
                    : [
                        BoxShadow(
                          color: DesignTokens.brandPrimary.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
              ),
              child: Center(
                child: widget.isLoading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(effectiveTextColor),
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (widget.icon != null) ...[
                            Icon(
                              widget.icon,
                              size: DesignTokens.iconMd,
                              color: effectiveTextColor,
                            ),
                            const SizedBox(width: DesignTokens.space2),
                          ],
                          Text(
                            widget.text,
                            style: AppTypography.button(context).copyWith(
                              color: effectiveTextColor,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Icon Button - Circular button with icon (like, share, comment)
class AppIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? iconColor;
  final double size;
  final String? label;
  final bool showBadge;
  final String? badgeText;

  const AppIconButton({
    Key? key,
    required this.icon,
    this.onPressed,
    this.backgroundColor,
    this.iconColor,
    this.size = 48.0,
    this.label,
    this.showBadge = false,
    this.badgeText,
  }) : super(key: key);

  @override
  State<AppIconButton> createState() => _AppIconButtonState();
}

class _AppIconButtonState extends State<AppIconButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppAnimations.fast,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: AppAnimations.spring),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveBgColor = widget.backgroundColor ??
        (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface).withOpacity(0.8);
    final effectiveIconColor = widget.iconColor ?? AppTypography.getTextColor(context);

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onPressed?.call();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: widget.size,
                      height: widget.size,
                      decoration: BoxDecoration(
                        color: effectiveBgColor,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder)
                              .withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Icon(
                        widget.icon,
                        size: widget.size * 0.5,
                        color: effectiveIconColor,
                      ),
                    ),
                    if (widget.showBadge)
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: DesignTokens.space1,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: DesignTokens.errorDefault,
                            borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                            border: Border.all(
                              color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                              width: 2,
                            ),
                          ),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          child: Center(
                            child: Text(
                              widget.badgeText ?? '',
                              style: AppTypography.labelSmall(context).copyWith(
                                color: DesignTokens.darkTextPrimary,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                if (widget.label != null) ...[
                  const SizedBox(height: DesignTokens.space1),
                  Text(
                    widget.label!,
                    style: AppTypography.labelSmall(context),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// User Avatar - Circular avatar with optional verified badge and live indicator
class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final bool isVerified;
  final bool isLive;
  final bool showBorder;
  final VoidCallback? onTap;
  final String? placeholderText;

  const UserAvatar({
    Key? key,
    this.imageUrl,
    this.size = DesignTokens.avatarMd,
    this.isVerified = false,
    this.isLive = false,
    this.showBorder = false,
    this.onTap,
    this.placeholderText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Live border gradient
          if (isLive)
            Container(
              width: size + 6,
              height: size + 6,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: DesignTokens.liveGradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
            ),
          
          // Border
          if (showBorder || isLive)
            Container(
              width: isLive ? size + 4 : size,
              height: isLive ? size + 4 : size,
              decoration: BoxDecoration(
                color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                shape: BoxShape.circle,
              ),
            ),
          
          // Avatar
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              image: imageUrl != null
                  ? DecorationImage(
                      image: NetworkImage(imageUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: imageUrl == null
                ? Center(
                    child: Text(
                      placeholderText?.substring(0, 1).toUpperCase() ?? '?',
                      style: AppTypography.h2(context).copyWith(
                        color: DesignTokens.brandPrimary,
                        fontWeight: DesignTokens.fontWeightBold,
                      ),
                    ),
                  )
                : null,
          ),
          
          // Verified badge
          if (isVerified)
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: size * 0.35,
                height: size * 0.35,
                decoration: BoxDecoration(
                  color: DesignTokens.verifiedBlue,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.check,
                  size: size * 0.2,
                  color: DesignTokens.darkTextPrimary,
                ),
              ),
            ),
          
          // Live indicator
          if (isLive)
            Positioned(
              top: -4,
              left: size * 0.5 - 18,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space1,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: DesignTokens.liveGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                ),
                child: Text(
                  'LIVE',
                  style: AppTypography.liveIndicator(),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
